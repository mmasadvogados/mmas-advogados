import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users } from "./schema";

async function seed() {
  const client = postgres(process.env.DIRECT_URL!, { prepare: false });
  const db = drizzle(client);

  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name: "Admin MMAS",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });

  console.log(`Admin user seeded: ${email}`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
