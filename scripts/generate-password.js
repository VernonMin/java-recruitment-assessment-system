import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("用法: node scripts/generate-password.js <密码>");
  process.exit(1);
}

const iterations = 120000;
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");

console.log(`pbkdf2$${iterations}$${salt}$${hash}`);

