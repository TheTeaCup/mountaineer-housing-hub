import assert from "node:assert/strict";
import test from "node:test";
import { authPolicy } from "../src/auth/policy.ts";

const validUser = { email: "student@appstate.edu", emailVerified: true };

for (const action of ["create-user", "link-account", "sign-in"]) {
  test(`${action}: accepts verified App State Google identities`, () => {
    for (const email of ["student@appstate.edu", "Student@APPSTATE.EDU"]) {
      assert.equal(authPolicy.user.validateUserInfo({
        user: { ...validUser, email },
        source: { action, method: "oauth", oauth: { providerId: "google" } },
      }), undefined);
    }
  });

  test(`${action}: rejects other domains, malformed addresses and unverified identities`, () => {
    const users = [
      ...["student@gmail.com", "student@appstate.edu.evil.com", "student@sub.appstate.edu",
        "student@fakeappstate.edu", "a@b@appstate.edu", "@appstate.edu", " student@appstate.edu"]
        .map(email => ({ ...validUser, email })),
      { ...validUser, emailVerified: false },
      { email: validUser.email },
      {},
    ];
    for (const user of users) {
      assert.equal(authPolicy.user.validateUserInfo({
        user,
        source: { action, method: "oauth", oauth: { providerId: "google" } },
      })?.error, "appstate_google_required");
    }
  });
}

test("rejects other sign-in methods even with an App State email", () => {
  for (const source of [
    { method: "email-password" },
    { method: "oauth", oauth: { providerId: "github" } },
    { method: "oauth" },
  ]) {
    assert.equal(authPolicy.user.validateUserInfo({
      user: validUser, source: { ...source, action: "create-user" },
    })?.error, "appstate_google_required");
  }
  assert.equal(authPolicy.emailAndPassword.enabled, false);
});

test("session creation rejects ineligible or inactive stored users", async () => {
  const before = authPolicy.databaseHooks.session.create.before;
  const session = { userId: "1" };
  for (const user of [null, { ...validUser, status: "suspended" },
    { ...validUser, status: "active", email: "former@gmail.com" },
    { ...validUser, status: "active", emailVerified: false }]) {
    await assert.rejects(before(session, {
      context: { internalAdapter: { findUserById: async () => user } },
    }));
  }
  assert.deepEqual(await before(session, {
    context: { internalAdapter: { findUserById: async () => ({ ...validUser, status: "active" }) } },
  }), { data: session });
});
