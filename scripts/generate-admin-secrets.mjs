import { randomBytes, scryptSync } from "node:crypto";

const password = process.env.ADMIN_PASSWORD || process.argv[2];
if (!password || password.length < 14) {
  console.error('Provide a password of at least 14 characters: ADMIN_PASSWORD="..." npm run admin:secrets');
  process.exit(1);
}

const salt = randomBytes(16);
const passwordHash = scryptSync(password, salt, 64);

// Dot separators are safe in local dotenv files and hosted environment settings.
console.log(`ADMIN_PASSWORD_HASH=scrypt.${salt.toString("base64url")}.${passwordHash.toString("base64url")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
console.log(`ANALYTICS_HASH_SALT=${randomBytes(32).toString("base64url")}`);
console.log(`ANALYTICS_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`);
console.log("Copy these values into .env.local. The plaintext password is never stored by the application.");
