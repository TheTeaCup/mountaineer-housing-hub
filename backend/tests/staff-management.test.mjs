import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";

// Isolate route tests from local infrastructure and credentials.
Object.assign(process.env, {
  MYSQL_HOST: "localhost",
  MYSQL_PORT: "3306",
  MYSQL_USERNAME: "test",
  MYSQL_PASSWORD: "test",
  MYSQL_DBNAME: "test",
  REDIS_URL: "redis://localhost",
  PORT: "3001",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
  CLOUDFLARE_R2_ACCESS_KEY_ID: "test",
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: "test",
  CLOUDFLARE_R2_BUCKET_NAME: "test",
  CLOUDFLARE_R2_CONNECTION_STRING: "https://example.invalid",
  FRONTEND_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
  BETTER_AUTH_URL: "http://localhost:3001",
});
const { createStaffRouter } = await import("../src/routes/staff.ts");

async function harness(t, overrides = {}) {
  const writes = [];
  const reads = [];
  let transactions = 0;
  const db = {
    query: async (sql, params = []) => {
      reads.push({ sql, params });
      if (sql === "SELECT role FROM users WHERE id = ?")
        return [{ role: overrides.role ?? "staff" }];
      if (sql.includes("agency_editors")) return [{ allowed: 1 }];
      if (sql.includes("FROM agencies WHERE id IN"))
        return overrides.missingTarget ? [{ id: 1 }] : [{ id: 1 }, { id: 2 }];
      if (sql.includes("FROM agencies WHERE id =")) return [{ id: 1 }];
      if (sql.includes("FROM properties WHERE agency_id"))
        return overrides.linked ? [{ id: 10 }] : [];
      if (sql.includes("FROM apartment_submissions WHERE agency_id"))
        return overrides.suggestions ? [{ id: 20 }] : [];
      if (sql.includes("COUNT(*) AS total FROM reviews"))
        return [{ total: 26 }];
      if (sql.includes("FROM reviews r JOIN properties"))
        return [
          {
            id: 5,
            status: params[0] ?? "published",
            name: "Test apartment",
            slug: "test-apartment",
          },
        ];
      if (sql.includes("FROM review_photos")) return [];
      throw new Error(`Unexpected query: ${sql}`);
    },
    execute: async (sql, params = []) => {
      writes.push({ sql, params });
      if (
        overrides.failSuggestions &&
        sql.startsWith("UPDATE apartment_submissions")
      )
        throw new Error("Simulated failure");
      return { affectedRows: overrides.missingReview ? 0 : 1 };
    },
  };
  const deps = {
    ...db,
    frontendOrigin: "http://localhost:3000",
    backendOrigin: "http://localhost:3001",
    getUser: async () => (overrides.anonymous ? undefined : "1"),
    transaction: async (work) => {
      transactions++;
      const before = writes.length;
      try {
        return await work(db);
      } catch (error) {
        writes.splice(before);
        throw error;
      }
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/staff", createStaffRouter(deps));
  app.use((err, _req, res, _next) =>
    res.status(500).json({ message: err.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return {
    writes,
    reads,
    transactions: () => transactions,
    request: async (path, method = "GET", body) => {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/staff${path}`,
        {
          method,
          headers: {
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
      );
      return { status: response.status, body: await response.json() };
    },
  };
}

test("merge moves properties and suggestions in one transaction without granting destination access", async (t) => {
  const h = await harness(t);
  const result = await h.request("/agencies/1/transfer", "POST", {
    targetAgencyId: 2,
    mode: "merge",
  });
  assert.equal(result.status, 200);
  assert.equal(h.transactions(), 1);
  assert.deepEqual(
    h.writes.map((item) => item.params),
    [[2, 1], [2, 1], [1]],
  );
  assert.match(h.writes[2].sql, /DELETE FROM agencies/);
  assert.ok(
    h.writes.every(
      (item) =>
        !item.sql.includes("agency_editors") && !item.sql.includes("reviews"),
    ),
  );
});
test("reassignment preserves source agency", async (t) => {
  const h = await harness(t);
  assert.equal(
    (
      await h.request("/agencies/1/transfer", "POST", {
        targetAgencyId: 2,
        mode: "reassign",
      })
    ).status,
    200,
  );
  assert.equal(h.writes.length, 2);
});
test("self merges and invalid targets cannot mutate data", async (t) => {
  const h = await harness(t);
  for (const targetAgencyId of [1, 0, "oops", 2.5])
    assert.equal(
      (
        await h.request("/agencies/1/transfer", "POST", {
          targetAgencyId,
          mode: "merge",
        })
      ).status,
      400,
    );
  assert.equal(h.writes.length, 0);
});
test("missing destination cannot partially transfer", async (t) => {
  const h = await harness(t, { missingTarget: true });
  assert.equal(
    (
      await h.request("/agencies/1/transfer", "POST", {
        targetAgencyId: 2,
        mode: "merge",
      })
    ).status,
    404,
  );
  assert.equal(h.writes.length, 0);
});
test("transfer failure propagates through transaction rollback", async (t) => {
  const h = await harness(t, { failSuggestions: true });
  assert.equal(
    (
      await h.request("/agencies/1/transfer", "POST", {
        targetAgencyId: 2,
        mode: "merge",
      })
    ).status,
    500,
  );
  assert.equal(h.writes.length, 0);
});
for (const linkage of ["linked", "suggestions"])
  test(`cannot delete agency with ${linkage}`, async (t) => {
    const h = await harness(t, { [linkage]: true });
    assert.equal((await h.request("/agencies/1", "DELETE")).status, 409);
    assert.equal(h.writes.length, 0);
  });
test("empty agency can be deleted", async (t) => {
  const h = await harness(t);
  assert.equal((await h.request("/agencies/1", "DELETE")).status, 200);
  assert.equal(h.writes.length, 1);
});
test("assigned managers cannot transfer or delete their agencies", async (t) => {
  const h = await harness(t, { role: "property_manager" });
  assert.equal(
    (
      await h.request("/agencies/1/transfer", "POST", {
        targetAgencyId: 2,
        mode: "merge",
      })
    ).status,
    403,
  );
  assert.equal((await h.request("/agencies/1", "DELETE")).status, 403);
  assert.equal(h.writes.length, 0);
});
test("published reviews can be browsed with pagination and photos", async (t) => {
  const h = await harness(t);
  const result = await h.request("/reviews?status=published&page=2");
  assert.equal(result.status, 200);
  assert.equal(result.body.total, 26);
  assert.equal(result.body.reviews[0].status, "published");
  assert.deepEqual(result.body.reviews[0].photos, []);
  assert.deepEqual(
    h.reads.find((item) => item.sql.includes("FROM reviews r JOIN properties"))
      .params,
    ["published", 25],
  );
  assert.equal((await h.request("/reviews?status=invalid")).status, 400);
});
test("previously moderated reviews can be unpublished, restored, or deleted", async (t) => {
  const h = await harness(t);
  for (const status of ["rejected", "published"])
    assert.equal(
      (await h.request("/reviews/5", "PATCH", { status })).status,
      200,
    );
  assert.ok(h.writes.every((item) => !item.sql.includes("status = 'pending'")));
  assert.equal((await h.request("/reviews/5", "DELETE")).status, 200);
  assert.match(h.writes.at(-1).sql, /DELETE FROM reviews/);
});
test("missing review returns 404", async (t) => {
  const h = await harness(t, { missingReview: true });
  assert.equal((await h.request("/reviews/5", "DELETE")).status, 404);
});
test("review management requires staff sign-in", async (t) => {
  const h = await harness(t, { role: "property_manager" });
  assert.equal((await h.request("/reviews")).status, 403);
  assert.equal((await h.request("/reviews/5", "DELETE")).status, 403);
  assert.equal(h.writes.length, 0);
});
