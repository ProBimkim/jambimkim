import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import Database from "better-sqlite3";

const db = new Database("sqlite.db");

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    dash()
  ]
});
