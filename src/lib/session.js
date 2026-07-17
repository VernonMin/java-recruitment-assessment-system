const encoder = new TextEncoder();

/**
 * @param {Record<string, unknown>} payload
 * @param {string} secret
 */
export async function signSession(payload, secret) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

/**
 * @param {string} token
 * @param {string} secret
 */
export async function verifySession(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expected = await sign(`${header}.${body}`, secret);
  if (signature !== expected) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(body));
  if (typeof payload.exp === "number" && Date.now() > payload.exp) {
    return null;
  }

  return payload;
}

/**
 * @param {string} value
 * @param {string} secret
 */
async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

/**
 * @param {string} input
 */
function base64UrlEncode(input) {
  const bytes = encoder.encode(input);
  return bytesToBase64Url(bytes);
}

/**
 * @param {string} value
 */
function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

/**
 * @param {Uint8Array} bytes
 */
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

