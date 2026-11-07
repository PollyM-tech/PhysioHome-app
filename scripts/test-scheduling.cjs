const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const output = {};
const source = ts.transpileModule(
  fs.readFileSync("lib/marketplace/scheduling.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
vm.runInNewContext(source, { exports: output, Date, Intl });
const { nairobiWallTime, defaultAppointmentTime, scheduledInstant } = output;
const now = Date.parse("2026-11-07T07:00:00Z");

test("Nairobi wall time is independent of the device timezone", () => {
  assert.equal(
    nairobiWallTime(new Date("2026-11-07T07:15:00Z")),
    "2026-11-07T10:15",
  );
  assert.equal(
    new Date(scheduledInstant("2026-11-07T10:15", now)).toISOString(),
    "2026-11-07T07:15:00.000Z",
  );
});
test("Nairobi midnight correctly crosses the UTC date boundary", () => {
  assert.equal(
    nairobiWallTime(new Date("2026-11-07T21:30:00Z")),
    "2026-11-08T00:30",
  );
});
test("Scheduling rejects impossible dates, past times and dates beyond 90 days", () => {
  for (const value of [
    "2026-02-30T10:00",
    "2026-11-07T09:59",
    "2027-04-01T10:00",
    "",
  ])
    assert.throws(() => scheduledInstant(value, now));
});
test("Default appointment time is a future quarter hour", () => {
  const value = defaultAppointmentTime(now);
  assert.equal(value, "2026-11-07T10:30");
  assert.doesNotThrow(() => scheduledInstant(value, now));
});
