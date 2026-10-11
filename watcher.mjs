import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Run in a dedicated server checkout, under a supervisor that restarts on exit.
const watcherFile = fileURLToPath(import.meta.url);
const repoDir = path.dirname(watcherFile);
const appDir = path.join(repoDir, "backend");
const watcherPath = "watcher.mjs";
const stagingDir = path.join(appDir, ".watcher-build");
const previousDir = path.join(appDir, ".watcher-previous");
const distDir = path.join(appDir, "dist");
const remote = process.env.WATCHER_REMOTE || "origin";
const branch = process.env.WATCHER_BRANCH || "main";
const interval = Number(process.env.WATCHER_INTERVAL_MS || 60_000);
const log = (message) => console.log(`[watcher] ${message}`);

let api;
let command;
let timer;
let restartTimer;
let shuttingDown = false;
let deploying = false;
let appliedCommit;

function run(program, args, cwd = repoDir, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {
      cwd,
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    command = child;
    let output = "";
    if (capture)
      child.stdout.setEncoding("utf8").on("data", (data) => {
        output += data;
      });
    child.once("error", reject);
    child.once("close", (code) => {
      if (command === child) command = undefined;
      if (code === 0) resolve(output.trim());
      else
        reject(new Error(`${program} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function git(...args) {
  return run("git", args, repoDir, true);
}

function npm(...args) {
  // npm supplies its CLI path when started through `npm run watch:deploy`.
  if (process.env.npm_execpath)
    return run(process.execPath, [process.env.npm_execpath, ...args], appDir);
  // Only fixed, internal npm arguments reach this Windows shell fallback.
  if (process.platform === "win32")
    return run("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], appDir);
  return run("npm", args, appDir);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function stopApi() {
  clearTimeout(restartTimer);
  const child = api;
  if (!child) return;
  api = undefined;
  log("Stopping API...");
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

function startApi() {
  if (shuttingDown || api) return;
  log("Starting Mountaineer Housing Hub API...");
  // Launch Node directly so signals reach Express, MySQL, and Redis cleanup.
  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: appDir,
    stdio: "inherit",
  });
  api = child;
  child.once("error", (error) => log(`API launch failed: ${error.message}`));
  child.once("close", (code, signal) => {
    if (api !== child) return;
    api = undefined;
    log(`API exited (${signal || code}). Restarting in 5 seconds.`);
    if (!shuttingDown && !deploying) restartTimer = setTimeout(startApi, 5_000);
  });
}

async function deploy(install) {
  deploying = true;
  clearTimeout(restartTimer);
  try {
    if (install) {
      // Dependencies change in place, so stop the API before installing them.
      await stopApi();
      log("Installing backend dependencies (including build tools)...");
      await npm(
        (await exists(path.join(appDir, "package-lock.json")))
          ? "ci"
          : "install",
        "--include=dev",
      );
    }
    await rm(stagingDir, { recursive: true, force: true });
    log("Building backend...");
    await npm("run", "build", "--", "--outDir", ".watcher-build");
    if (shuttingDown) return;
    await access(path.join(stagingDir, "index.js"));
    await stopApi();
    await rm(previousDir, { recursive: true, force: true });
    const hadDist = await exists(distDir);
    if (hadDist) await rename(distDir, previousDir);
    try {
      await rename(stagingDir, distDir);
    } catch (error) {
      if (hadDist) await rename(previousDir, distDir);
      throw error;
    }
    startApi();
    await rm(previousDir, { recursive: true, force: true });
  } finally {
    deploying = false;
  }
}

async function checkForUpdates() {
  if (shuttingDown) return;
  try {
    const currentBranch = await git("branch", "--show-current");
    if (currentBranch !== branch)
      throw new Error(
        `Expected branch ${branch}; checkout is on ${currentBranch || "detached HEAD"}.`,
      );
    if (await git("status", "--porcelain"))
      throw new Error(
        "Checkout has local changes. Commit or remove them before automatic updates.",
      );
    await git("pull", "--ff-only", remote, branch);
    const commit = await git("rev-parse", "HEAD");
    if (commit === appliedCommit) return;
    const files = appliedCommit
      ? (await git("diff", "--name-only", appliedCommit, commit)).split("\n")
      : [];
    if (files.includes(watcherPath)) {
      log("Watcher updated; exiting so the process supervisor can restart it.");
      await shutdown();
      return;
    }
    const backendChanged =
      !appliedCommit || files.some((file) => file.startsWith("backend/"));
    if (backendChanged) {
      const dependenciesChanged =
        !appliedCommit ||
        files.some((file) =>
          ["backend/package.json", "backend/package-lock.json"].includes(file),
        );
      await deploy(dependenciesChanged);
    }
    // Record only successful deployments; a failed build is retried next check.
    appliedCommit = commit;
    log(`Up to date: ${commit.slice(0, 12)}`);
  } catch (error) {
    log(`Update failed: ${error.message}. Retrying at the next check.`);
  } finally {
    if (!shuttingDown) timer = setTimeout(checkForUpdates, interval);
  }
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(timer);
  clearTimeout(restartTimer);
  if (command) command.kill("SIGTERM");
  await stopApi();
  process.exit(0);
}

if (!Number.isSafeInteger(interval) || interval < 1_000) {
  console.error("WATCHER_INTERVAL_MS must be an integer of at least 1000.");
  process.exit(1);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
log(`Mountaineer Housing Hub watcher: ${repoDir}`);
log(`Watching ${remote}/${branch} every ${interval / 1000} seconds.`);
await checkForUpdates();
