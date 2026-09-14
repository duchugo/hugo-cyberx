// Minimal AWS SigV4 presigner for R2 GET downloads. Avoids the AWS SDK on
// purpose: the Worker bundle stays small and no dependency can drift.
// Credentials come from Pages environment variables and never reach the client.

const encoder = new TextEncoder();

function hmac(key: BufferSource, data: string) {
  return crypto.subtle
    .importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, encoder.encode(data)));
}

function sha256Hex(data: string) {
  return crypto.subtle.digest("SHA-256", encoder.encode(data)).then((hash) =>
    [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

// RFC 3986 strict encoding (encodeURIComponent leaves !'()* unescaped).
function awsUriEncode(value: string, encodeSlash = true) {
  return value.replace(/[^A-Za-z0-9_.~/-]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\//g, encodeSlash ? "%2F" : "/");
}

export type PresignCredentials = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

export function readPresignCredentials(env: Record<string, string | undefined>): PresignCredentials | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;
  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function sanitizeFilename(name: string) {
  // Strips control chars, quotes and line breaks so the value is safe inside
  // a Content-Disposition header.
  const clean = name.replace(/[\r\n\"\\]/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim();
  return clean || "download";
}

export async function presignR2GetDownload(
  credentials: PresignCredentials,
  objectKey: string,
  filename: string,
  expiresIn = 600,
  nowMs = Date.now(),
) {
  const host = `${credentials.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${awsUriEncode(credentials.bucketName, false)}/${objectKey.split("/").map((segment) => awsUriEncode(segment)).join("/")}`;

  const now = new Date(nowMs);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/auto/s3/aws4_request`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${credentials.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
    "response-content-disposition": `attachment; filename="${sanitizeFilename(filename)}"`,
  });
  // URLSearchParams encodes with + for spaces; SigV4 requires %20.
  const canonicalQuery = [...query.entries()]
    .map(([k, v]) => [awsUriEncode(k), awsUriEncode(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    `host:${host}`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmac(encoder.encode(`AWS4${credentials.secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, "auto");
  const kService = await hmac(kRegion, "s3");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = [...new Uint8Array(await hmac(kSigning, stringToSign))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
