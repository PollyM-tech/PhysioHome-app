import { apiRequest } from "@/lib/auth/client";
export type Conversation = {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  last_message: string;
  last_at: string;
  unread: number;
};
export type ChatMessage = {
  id: string;
  text: string;
  mine: boolean;
  sender_name: string;
  created_at: string;
  read_at: string | null;
  attachment: { name: string; mime: string } | null;
};
export type ChatPage = {
  messages: ChatMessage[];
  next_before: string | null;
  can_send: boolean;
};
export type Attachment = { filename: string; content: string };
export const listConversations = () =>
  apiRequest<{ conversations: Conversation[] }>("conversations/");
export const getMessages = (id: string, before?: string) =>
  apiRequest<ChatPage>(
    `bookings/${id}/messages/${before ? "?before=" + encodeURIComponent(before) : ""}`,
  );
export const searchMessages = (id: string, query: string) =>
  apiRequest<ChatPage>(`bookings/${id}/messages/search/`, { query });
export const sendMessage = (
  id: string,
  client_id: string,
  text: string,
  file?: Attachment,
) =>
  apiRequest<ChatMessage>(`bookings/${id}/messages/`, {
    client_id,
    text,
    ...file,
  });
export const getAttachment = (id: string, message: string) =>
  apiRequest<Attachment & { mime: string }>(
    `bookings/${id}/messages/${message}/attachment/`,
  );
