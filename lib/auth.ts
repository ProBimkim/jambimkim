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
          const { error } = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Kode OTP Reset Password",
            html: `
              <div style="font-family: monospace; background: #050914; color: #00ffff; padding: 32px; border-radius: 8px;">
                <h2 style="color: #00ffff; margin-bottom: 16px;">SYS.RECOVERY</h2>
                <p style="color: #ccc;">Kode OTP untuk reset password Anda:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff00ff; margin: 24px 0; padding: 16px; border: 1px solid #00ffff; text-align: center;">
                  ${otp}
                </div>
                <p style="color: #888; font-size: 12px;">Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.</p>
              </div>
            `,
          });
          if (error) {
            console.error("Resend Error:", error);
            throw new Error(error.message);
          }
        }
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
