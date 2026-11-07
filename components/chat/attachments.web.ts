import * as DocumentPicker from "expo-document-picker";
import { Attachment } from "@/lib/marketplace/chat";
export async function pickAttachment(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/png", "image/jpeg"],
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0],
    file = asset.file;
  if (!file || !file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a PDF, PNG or JPEG smaller than 5 MB.");
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.readAsDataURL(file);
  });
  return { filename: asset.name, content };
}
export async function downloadAttachment(file: Attachment & { mime: string }) {
  const bytes = Uint8Array.from(atob(file.content), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: file.mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
