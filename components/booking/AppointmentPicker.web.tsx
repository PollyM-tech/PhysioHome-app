import React from "react";
import {
  defaultAppointmentTime,
  nairobiWallTime,
} from "@/lib/marketplace/scheduling";

export default function AppointmentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value || defaultAppointmentTime();
  const minimum = nairobiWallTime(new Date(Date.now() + 5 * 60000)).slice(
    0,
    10,
  );
  const maximum = nairobiWallTime(new Date(Date.now() + 90 * 86400000)).slice(
    0,
    10,
  );
  const style = {
    padding: 14,
    border: "1px solid #D9DDE3",
    borderRadius: 12,
    fontSize: 16,
    color: "#0B2545",
    width: "100%",
    boxSizing: "border-box" as const,
    backgroundColor: "white",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label>
        Date
        <input
          aria-label="Appointment date"
          type="date"
          value={selected.slice(0, 10)}
          min={minimum}
          max={maximum}
          onChange={(event) =>
            event.target.value &&
            onChange(event.target.value + "T" + selected.slice(11, 16))
          }
          style={style}
        />
      </label>
      <label>
        Time
        <input
          aria-label="Appointment time"
          type="time"
          value={selected.slice(11, 16)}
          step={900}
          onChange={(event) =>
            event.target.value &&
            onChange(selected.slice(0, 10) + "T" + event.target.value)
          }
          style={style}
        />
      </label>
    </div>
  );
}
