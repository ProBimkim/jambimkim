import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  plugins: [
    dash(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "forget-password") {
          await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: email,
            subject: "Kode OTP Reset Password Anda",
            html: `<p>Kode OTP untuk reset password Anda adalah: <strong>${otp}</strong>. Kode ini berlaku selama 5 menit.</p>`,
          });
        }
      },
      expiresIn: 300, // 5 menit
    }),
  ],
});
