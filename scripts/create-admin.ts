import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "otplib";
import { hashPassword } from "../server/lib/adminAuth";

async function main() {
  const [, , email, password, flag] = process.argv;
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> "<password>" [--totp]');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);
    const totpSecret = flag === "--totp" ? authenticator.generateSecret() : undefined;

    const user = await prisma.adminUser.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash, ...(totpSecret ? { totpSecret } : {}) },
      create: { email: email.toLowerCase(), passwordHash, totpSecret },
    });
    console.log(`Admin account ready: ${user.email}`);
    console.log("You can now log in at /admin with this email and password.");

    if (totpSecret) {
      const uri = authenticator.keyuri(user.email, "Almark Tech Admin", totpSecret);
      console.log("\n2FA enabled for this account. Scan this into your authenticator app:");
      console.log(uri);
      console.log(`(raw secret, if you'd rather enter it manually: ${totpSecret})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
