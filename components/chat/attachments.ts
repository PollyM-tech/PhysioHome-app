import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Attachment } from "@/lib/marketplace/chat";
export async function pickAttachment(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/png", "image/jpeg"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a PDF, PNG or JPEG smaller than 5 MB.");
  const content = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { filename: file.name, content };
}
export async function downloadAttachment(file: Attachment & { mime: string }) {
  if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync()))
    throw new Error("Sharing files is unavailable on this device.");
  const uri =
    FileSystem.cacheDirectory +
    "physio-" +
    Date.now() +
    "-" +
    file.filename.replace(/[^A-Za-z0-9._-]/g, "_");
  try {
    await FileSystem.writeAsStringAsync(uri, file.content, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, { mimeType: file.mime });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
