const encoder = new TextEncoder();

/**
 * @param {string} password
 * @param {string} saltHex
 * @param {number} iterations
 */
async function derivePbkdf2(password, saltHex, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

/**
 * @param {string} password
 */
export async function hashPassword(password) {
  const iterations = 100000;
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derivePbkdf2(password, salt, iterations);
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * @param {string} password
 * @param {string} stored
 */
export async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const actual = await derivePbkdf2(password, parts[2], iterations);
  return timingSafeEqual(actual, parts[3]);
}

/**
 * @param {Uint8Array} bytes
 */
function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * @param {string} hex
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/**
 * @param {string} left
 * @param {string} right
 */
function timingSafeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}
