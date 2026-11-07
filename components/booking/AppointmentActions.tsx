import PaymentControls from "./PaymentControls";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Booking } from "@/lib/marketplace/api";
import {
  progressBooking,
  requestReschedule,
  respondReschedule,
  reviewBooking,
} from "@/lib/marketplace/patient";
import {
  defaultAppointmentTime,
  formatAppointment,
  scheduledInstant,
} from "@/lib/marketplace/scheduling";
import AppointmentPicker from "./AppointmentPicker";
import { Button, ErrorMessage } from "@/components/marketplace/Primitives";
import Field from "@/components/forms/Field";
export const statusLabels: Record<string, string> = {
  searching: "Finding a physiotherapist",
  no_match: "No available match",
  expired: "Search expired",
  payment_pending: "Physiotherapist accepted · no payment collected",
  confirmed: "Payment confirmed",
  en_route: "Physiotherapist on the way",
  arrived: "Physiotherapist arrived",
  in_progress: "Session in progress",
  completed: "Session completed",
  cancelled: "Cancelled",
};
export default function AppointmentActions({
  booking,
  provider = false,
  onChanged,
}: {
  booking: Booking;
  provider?: boolean;
  onChanged: () => Promise<void>;
}) {
  const [changing, setChanging] = useState(false),
    [when, setWhen] = useState(defaultAppointmentTime),
    [rating, setRating] = useState(0),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await task();
      await onChanged();
      setChanging(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update appointment.",
      );
    } finally {
      setBusy(false);
    }
  };
  const next: Record<string, [string, string]> = {
    payment_pending: ["en_route", "Mark on the way"],
    confirmed: ["en_route", "Mark on the way"],
    en_route: ["arrived", "Mark arrived"],
    arrived: ["in_progress", "Start session"],
    in_progress: ["completed", "Complete session"],
  };
  const actionable =
    ["payment_pending", "confirmed"].includes(booking.status) &&
    new Date(booking.starts_at).getTime() > Date.now();
  const hasConversation = !!booking.provider_name;
  return (
    <View style={{ gap: 12 }}>
      <ErrorMessage message={error} />
      {!provider ? (
        <PaymentControls booking={booking} onChanged={onChanged} />
      ) : null}
      <Text style={{ fontSize: 17, fontWeight: "700", color: "#087F83" }}>
        {statusLabels[booking.status] || booking.status}
      </Text>
      {hasConversation ? (
        <Button
          title={provider ? "Message patient" : "Message physiotherapist"}
          secondary
          onPress={() =>
            router.push({
              pathname: provider
                ? "/physiotherapist/messages"
                : "/patient/messages",
              params: { booking: booking.id },
            })
          }
        />
      ) : null}
      {booking.reschedule ? (
        <>
          <Text>
            Requested new time:{" "}
            {formatAppointment(booking.reschedule.starts_at)}. The existing time
            stays reserved until accepted.
          </Text>
          {provider && actionable ? (
            <>
              <Button
                title="Accept new time"
                disabled={busy}
                onPress={() =>
                  void run(() => respondReschedule(booking.id, "accept"))
                }
              />
              <Button
                title="Decline new time"
                secondary
                disabled={busy}
                onPress={() =>
                  void run(() => respondReschedule(booking.id, "decline"))
                }
              />
            </>
          ) : null}
        </>
      ) : !provider && actionable ? (
        <Button
          title={changing ? "Close time change" : "Request a different time"}
          secondary
          disabled={busy}
          onPress={() => setChanging(!changing)}
        />
      ) : null}
      {changing && !provider ? (
        <>
          <Text>Select the proposed time in Nairobi time.</Text>
          <AppointmentPicker value={when} onChange={setWhen} />
          <Button
            title="Send time change request"
            disabled={busy}
            onPress={() =>
              void run(() =>
                requestReschedule(booking.id, scheduledInstant(when)),
              )
            }
          />
        </>
      ) : null}
      {provider && next[booking.status] ? (
        <>
          <Text>
            Progress updates become available within two hours of the visit.
            {booking.payment_enabled
              ? "Payment must be verified before departure."
              : "Payment collection is not enabled."}
          </Text>
          <Button
            title={next[booking.status][1]}
            disabled={busy}
            onPress={() =>
              void run(() =>
                progressBooking(booking.id, next[booking.status][0]),
              )
            }
          />
        </>
      ) : null}
      {booking.events?.length ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Appointment updates</Text>
          {booking.events.map((event, i) => (
            <Text key={i}>
              {event.action.replaceAll("_", " ")} ·{" "}
              {formatAppointment(event.created_at)}
            </Text>
          ))}
        </View>
      ) : null}
      {booking.review ? (
        <Text>
          Session review: {booking.review.rating}/5
          {booking.review.comment ? " · " + booking.review.comment : ""}
        </Text>
      ) : !provider && booking.status === "completed" ? (
        <>
          <Text style={{ fontWeight: "700" }}>Review this session</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                title={
                  value +
                  " star" +
                  (value === 1 ? "" : "s") +
                  (rating === value ? " selected" : "")
                }
                secondary={rating !== value}
                onPress={() => setRating(value)}
              />
            ))}
          </View>
          <Field
            label="Review comment (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
          />
          <Button
            title="Submit review"
            disabled={busy || !rating}
            onPress={() =>
              void run(() => reviewBooking(booking.id, rating, comment))
            }
          />
        </>
      ) : null}
    </View>
  );
}
