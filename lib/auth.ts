import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword(data, request) {
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: data.user.email,
        subject: "Reset your password",
        html: `Click <a href="${data.url}">here</a> to reset your password.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail(data, request) {
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: data.user.email,
        subject: "Verify your email address",
        html: `Click <a href="${data.url}">here</a> to verify your email address.`,
      });
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  plugins: [
    dash(),
  ],
});
