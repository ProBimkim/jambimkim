import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const database = new Database("auth.db");

export const auth = betterAuth({
  database: database,
  baseURL: "http://localhost:3000/",
  emailAndPassword: { enabled: true },
});
