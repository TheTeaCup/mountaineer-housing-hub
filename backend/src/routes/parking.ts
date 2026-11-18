export function parkingInput(body: Record<string, unknown>) {
  const type = body.parking_type;
  if (
    type !== undefined &&
    type !== null &&
    type !== "" &&
    !["free", "monthly", "yearly", "semester", "one_time"].includes(
      String(type),
    )
  )
    throw new Error("Choose a valid parking type.");
  const raw = body.parking_fee;
  let fee =
    raw === undefined || raw === null || raw === "" ? null : Number(raw);
  if (
    fee !== null &&
    (!Number.isFinite(fee) ||
      fee < 0 ||
      fee > 999999.99 ||
      !/^\d+(?:\.\d{1,2})?$/.test(String(raw)))
  )
    throw new Error(
      "Enter a parking price from 0 to 999999.99 with up to two decimal places.",
    );
  if (type === "free") fee = 0;
  if ((type === "" || type === null) && fee !== null)
    throw new Error(
      "Choose a billing frequency before adding a parking price.",
    );
  const notes = body.parking_notes;
  if (
    notes !== undefined &&
    notes !== null &&
    (typeof notes !== "string" || notes.length > 2000)
  )
    throw new Error("Parking notes must be 2,000 characters or fewer.");
  return {
    type: type || null,
    fee,
    notes: typeof notes === "string" ? notes.trim() || null : null,
  };
}
