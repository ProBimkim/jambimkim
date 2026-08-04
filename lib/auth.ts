import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  plugins: [
    dash(),
  ],
});
