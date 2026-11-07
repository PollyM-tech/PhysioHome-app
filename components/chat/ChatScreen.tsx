import React, { useCallback, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { useAuth } from "@/lib/auth/context";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import Field from "@/components/forms/Field";
import {
  Attachment,
  ChatMessage,
  Conversation,
  getAttachment,
  getMessages,
  listConversations,
  searchMessages,
  sendMessage,
} from "@/lib/marketplace/chat";
import { downloadAttachment, pickAttachment } from "./attachments";
import { formatAppointment } from "@/lib/marketplace/scheduling";

export default function ChatScreen() {
  const { user } = useAuth(),
    params = useLocalSearchParams<{ booking?: string }>();
  const [selected, setSelected] = useState<string | null>(
      params.booking || null,
    ),
    [conversations, setConversations] = useState<Conversation[]>([]),
    [messages, setMessages] = useState<ChatMessage[]>([]),
    [query, setQuery] = useState(""),
    [term, setTerm] = useState(""),
    [filter, setFilter] = useState(""),
    [text, setText] = useState(""),
    [file, setFile] = useState<Attachment | null>(null),
    [next, setNext] = useState<string | null>(null),
    [canSend, setCanSend] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const paged = useRef(false);
  const sendId = useRef<string | null>(null),
    view = useRef(0);
  const select = (id: string | null) => {
    view.current++;
    paged.current = false;
    setNext(null);
    setSelected(id);
    setMessages([]);
    setText("");
    setFile(null);
    setQuery("");
    setTerm("");
    setError("");
    sendId.current = null;
    setCanSend(false);
    setLoading(true);
  };
  const merge = (previous: ChatMessage[], incoming: ChatMessage[]) =>
    Array.from(
      new Map([...previous, ...incoming].map((x) => [x.id, x])).values(),
    ).sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
  useFocusEffect(
    useCallback(() => {
      let active = true,
        running = false;
      const refresh = async () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          const list = await listConversations();
          if (!active) return;
          setConversations(list.conversations);
          if (selected) {
            const data = term
              ? await searchMessages(selected, term)
              : await getMessages(selected);
            if (!active) return;
            setMessages((old) =>
              term ? data.messages : merge(old, data.messages),
            );
            if (!paged.current) setNext(data.next_before);
            setCanSend(data.can_send);
          }
          setError("");
        } catch (e) {
          if (active)
            setError(
              e instanceof Error ? e.message : "Unable to load messages.",
            );
        } finally {
          running = false;
          if (active) setLoading(false);
        }
      };
      void refresh();
      const timer = setInterval(() => void refresh(), 8000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [selected, term]),
  );
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (params.booking) {
        view.current++;
        paged.current = false;
        setSelected(params.booking);
        setMessages([]);
        setTerm("");
        setNext(null);
        setLoading(true);
      }
    }, [params.booking]),
  );
  const current = conversations.find((c) => c.id === selected);
  return (
    <Page title={selected ? "Appointment conversation" : "Messages"}>
      <ErrorMessage message={error} />
      {selected ? (
        <>
          <Button
            secondary
            title="All conversations"
            disabled={busy}
            onPress={() => select(null)}
          />
          <Card>
            <Text style={{ fontSize: 21, fontWeight: "700" }}>
              {current?.name || "Your appointment"}
            </Text>
            {current ? (
              <Text>
                {formatAppointment(current.starts_at)} ·{" "}
                {current.status.replaceAll("_", " ")}
              </Text>
            ) : null}
            <Text>
              {user?.role === "patient"
                ? "Only you and your assigned physiotherapist can read this conversation."
                : "Only you and this patient can read this conversation."}
            </Text>
          </Card>
          <Field
            label="Search this conversation"
            value={query}
            maxLength={120}
            onChangeText={setQuery}
          />
          <Button
            secondary
            title="Search messages"
            disabled={busy || query.trim().length < 2}
            onPress={() => {
              setMessages([]);
              setNext(null);
              setTerm(query.trim());
            }}
          />
          {term ? (
            <Button
              title="Clear message search"
              secondary
              onPress={() => {
                setTerm("");
                setQuery("");
                setMessages([]);
                setNext(null);
              }}
            />
          ) : null}
          {loading ? (
            <Text>Loading messages…</Text>
          ) : !messages.length ? (
            <Text>
              {term
                ? "No matching messages."
                : "No messages yet. Start your appointment conversation below."}
            </Text>
          ) : null}
          {next && !term ? (
            <Button
              title="Load older messages"
              secondary
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  if (!selected) return;
                  paged.current = true;
                  const data = await getMessages(selected, next);
                  setMessages((old) => merge(old, data.messages));
                  setNext(data.next_before);
                })
              }
            />
          ) : null}
          {messages.map((m) => (
            <View
              key={m.id}
              style={{
                padding: 16,
                gap: 8,
                borderRadius: 16,
                backgroundColor: m.mine ? "#E6F4F4" : "white",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {m.mine ? "You" : m.sender_name}
              </Text>
              {m.text ? <Text style={{ fontSize: 16 }}>{m.text}</Text> : null}
              {m.attachment ? (
                <Button
                  secondary
                  title={"Download " + m.attachment.name}
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      const data = await getAttachment(selected, m.id);
                      await downloadAttachment(data);
                    })
                  }
                />
              ) : null}
              <Text style={{ color: "#707588", fontSize: 12 }}>
                {new Date(m.created_at).toLocaleString()}
                {m.mine ? (m.read_at ? " · Read" : " · Sent") : ""}
              </Text>
            </View>
          ))}
          {!loading && canSend ? (
            <Card>
              <Field
                label="Write a message"
                value={text}
                maxLength={2000}
                multiline
                editable={!busy}
                onChangeText={(value) => {
                  setText(value);
                  sendId.current = null;
                }}
              />
              {file ? (
                <>
                  <Text>Attached: {file.filename}</Text>
                  <Button
                    title="Remove attachment"
                    secondary
                    disabled={busy}
                    onPress={() => {
                      setFile(null);
                      sendId.current = null;
                    }}
                  />
                </>
              ) : null}
              <Button
                title="Attach PDF or image (up to 5 MB)"
                secondary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    const picked = await pickAttachment();
                    if (picked) {
                      setFile(picked);
                      sendId.current = null;
                    }
                  })
                }
              />
              <Button
                title={busy ? "Please wait…" : "Send message"}
                disabled={busy || (!text.trim() && !file)}
                onPress={() =>
                  void run(async () => {
                    if (!selected) return;
                    const version = view.current;
                    sendId.current ||= Crypto.randomUUID();
                    const item = await sendMessage(
                      selected,
                      sendId.current,
                      text.trim(),
                      file || undefined,
                    );
                    if (version !== view.current) return;
                    setMessages((old) => merge(old, [item]));
                    setText("");
                    setFile(null);
                    sendId.current = null;
                    setTerm("");
                    setQuery("");
                  })
                }
              />
            </Card>
          ) : !loading ? (
            <Text>
              This conversation is read-only because the appointment is closed.
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Button
            secondary
            title="Open menu"
            onPress={() =>
              router.push(
                user?.role === "patient"
                  ? "/patient/settings"
                  : "/physiotherapist/requests",
              )
            }
          />
          <Field
            label="Search conversations by name or message"
            value={filter}
            onChangeText={setFilter}
            maxLength={120}
          />
          {loading ? (
            <Text>Loading conversations…</Text>
          ) : !conversations.length ? (
            <Card>
              <Text>
                No conversations yet. A conversation becomes available when a
                physiotherapist accepts your booking.
              </Text>
            </Card>
          ) : null}
          {conversations
            .filter((c) =>
              (c.name + " " + c.last_message)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((c) => (
              <Card key={c.id}>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  {c.name}
                </Text>
                <Text>{c.last_message || "Start a conversation"}</Text>
                <Text>
                  {c.unread
                    ? c.unread + " unread messages"
                    : "No unread messages"}
                </Text>
                <Button
                  title={"Open conversation with " + c.name}
                  secondary
                  onPress={() => select(c.id)}
                />
              </Card>
            ))}
        </>
      )}
    </Page>
  );
}
