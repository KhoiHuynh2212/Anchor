import * as FileSystem from "expo-file-system";

export function inferExtFromDataUri(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/i);
  const mime = match?.[1]?.toLowerCase();
  if (!mime) return "mp3";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "mp3";
}

export async function ensurePlayableUri(source: string, prefix = "audio"): Promise<string> {
  const trimmed = source.trim();

  // If it's already a URL/file path, let expo-audio handle it.
  if (/^(https?:|file:|content:)/i.test(trimmed)) return trimmed;

  // If it's a data: URI, extract the base64 payload.
  let base64 = trimmed;
  let ext = "mp3";
  if (/^data:/i.test(trimmed)) {
    ext = inferExtFromDataUri(trimmed);
    const comma = trimmed.indexOf(",");
    base64 = comma >= 0 ? trimmed.slice(comma + 1) : "";
  }

  // If we can't cache to disk (e.g. web), fall back to original string.
  if (!FileSystem.cacheDirectory || !base64) return trimmed;

  const key = `${base64.length}-${base64.slice(0, 24)}`;
  const safeKey = key.replace(/[^a-z0-9_-]/gi, "");
  const uri = `${FileSystem.cacheDirectory}${prefix}-${safeKey}.${ext}`;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}
