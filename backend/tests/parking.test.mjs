import { test } from "node:test";
import assert from "node:assert/strict";
import { parkingInput } from "../src/routes/parking.ts";
test("parking billing supports monthly, yearly, semester, and one-time prices", () => {
  for (const parking_type of ["monthly", "yearly", "semester", "one_time"])
    assert.deepEqual(
      parkingInput({
        parking_type,
        parking_fee: "150.50",
        parking_notes: " per car ",
      }),
      { type: parking_type, fee: 150.5, notes: "per car" },
    );
});
test("unverified parking remains unknown and free parking has a zero fee", () => {
  assert.deepEqual(parkingInput({ parking_type: "", parking_fee: "" }), {
    type: null,
    fee: null,
    notes: null,
  });
  assert.equal(
    parkingInput({ parking_type: "free", parking_fee: "100" }).fee,
    0,
  );
  assert.equal(
    parkingInput({ parking_type: "monthly", parking_fee: "" }).fee,
    null,
  );
});
test("parking rejects invalid prices and billing periods", () => {
  for (const parking_fee of [
    "-1",
    "NaN",
    "Infinity",
    "1.234",
    "1000000",
    "abc",
  ])
    assert.throws(
      () => parkingInput({ parking_type: "monthly", parking_fee }),
      /price/,
    );
  assert.throws(() => parkingInput({ parking_type: "unknown" }), /type/);
  assert.throws(
    () => parkingInput({ parking_type: "", parking_fee: 50 }),
    /frequency/,
  );
  assert.throws(
    () => parkingInput({ parking_notes: "a".repeat(2001) }),
    /notes/,
  );
});
