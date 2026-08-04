import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";
import { emailOTP } from "better-auth/plugins";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

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
          try {
            await transporter.sendMail({
              from: `"Jam Digital Bimkim" <${process.env.GMAIL_USER}>`,
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
          } catch (error: any) {
            console.error("Nodemailer Error:", error);
            throw new Error(error.message || "Failed to send OTP email");
          }
        }
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
