// Appointment wall times are explicitly Nairobi (UTC+03:00), regardless of device timezone.
export function nairobiWallTime(date: Date): string {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}
export function defaultAppointmentTime(now = Date.now()): string {
  const quarter = 15 * 60 * 1000;
  return nairobiWallTime(
    new Date(Math.ceil((now + 30 * 60 * 1000) / quarter) * quarter),
  );
}
export function scheduledInstant(value: string, now = Date.now()): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Choose an appointment date and time.");
  const iso = value + ":00+03:00";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()) || nairobiWallTime(date) !== value)
    throw new Error("Choose a valid appointment date and time.");
  if (date.getTime() < now + 5 * 60 * 1000)
    throw new Error("Choose a time at least five minutes from now.");
  if (date.getTime() > now + 90 * 24 * 60 * 60 * 1000)
    throw new Error("Choose a time within the next 90 days.");
  return iso;
}
export function formatAppointment(value: string): string {
  return (
    new Intl.DateTimeFormat("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }).format(new Date(value)) + " · Nairobi time"
  );
}
