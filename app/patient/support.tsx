import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";
import Field from "@/components/forms/Field";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { createTicket, getTickets, Ticket } from "@/lib/marketplace/patient";
export default function SupportScreen() {
  const [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTickets()
        .then((d) => {
          if (active) setTickets(d.tickets);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      setTickets((await createTicket(subject, body)).tickets);
      setSubject("");
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit request.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page backTo="/patient/settings" title="Help & Support">
      <ErrorMessage message={error} />
      <Card>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>Booking help</Text>
        <Text>
          Confirm your map pin and choose up to three care services. An accepted
          request appears in Bookings, where you can message your
          physiotherapist, request a new time or cancel before the session
          begins.
        </Text>
        <Text>
          Support email and phone are not configured yet. Requests below are
          saved for the platform administrator to review; response times are not
          yet defined.
        </Text>
      </Card>
      <Card>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>
          Submit a support request
        </Text>
        <Field
          label="Subject"
          value={subject}
          maxLength={160}
          onChangeText={setSubject}
        />
        <Field
          label="How can we help?"
          value={body}
          maxLength={3000}
          multiline
          onChangeText={setBody}
        />
        <Button
          title={busy ? "Submitting…" : "Submit request"}
          disabled={busy || !subject.trim() || !body.trim()}
          onPress={() => void send()}
        />
      </Card>
      {tickets.map((t) => (
        <Card key={t.id}>
          <Text>
            Request #{t.id} · {t.status}
          </Text>
          <Text style={{ fontWeight: "700" }}>{t.subject}</Text>
          <Text>{t.body}</Text>
        </Card>
      ))}
    </Page>
  );
}
