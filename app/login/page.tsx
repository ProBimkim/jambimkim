"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">("login");
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState<"error" | "warning">("error");
  const [isDesktop, setIsDesktop] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUserId, setNewUserId] = useState("");
  
  // OTP Recovery states
  const [recoveryStep, setRecoveryStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Detect desktop (pointer: fine = mouse/trackpad)
    const mql = window.matchMedia("(pointer: fine)");
    setIsDesktop(mql.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);

    // INIT AUDIO
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });

    // CURSOR LOGIC — Desktop only
    let animFrame: number;
    if (mql.matches) {
      const cursorDot = document.querySelector(".cyber-cursor-dot") as HTMLElement;
      const cursorOutline = document.querySelector(".cyber-cursor-outline") as HTMLElement;
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let outlineX = mouseX;
      let outlineY = mouseY;

      const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (cursorDot) {
          cursorDot.style.left = `${mouseX}px`;
          cursorDot.style.top = `${mouseY}px`;
        }
      };

      const onMouseDown = () => cursorOutline?.classList.add("clicking");
      const onMouseUp = () => cursorOutline?.classList.remove("clicking");

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);

      const animateCursor = () => {
        outlineX += (mouseX - outlineX) * 0.2;
        outlineY += (mouseY - outlineY) * 0.2;
        if (cursorOutline) {
          cursorOutline.style.left = `${outlineX}px`;
          cursorOutline.style.top = `${outlineY}px`;
        }
        animFrame = requestAnimationFrame(animateCursor);
      };
      animateCursor();

      return () => {
        mql.removeEventListener("change", handleChange);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        cancelAnimationFrame(animFrame);
      };
    }

    return () => {
      mql.removeEventListener("change", handleChange);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  // Audio Play Functions
  const playSound = (type: "type" | "hover" | "click" | "error") => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "type") {
      osc.type = "square";
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === "hover") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === "click") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } else if (type === "error") {
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  };

  const handleTabSwitch = (tab: "login" | "register" | "forgot-password") => {
    playSound("click");
    setActiveTab(tab);
    setAlertMsg("");
    if (tab !== "forgot-password") {
      setRecoveryStep("email");
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
    }
  };

  const handleInputChange = (setter: any) => (e: any) => {
    playSound("type");
    setter(e.target.value);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.replace(/[^0-9]/g, "").split("");
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
      playSound("type");
      return;
    }
    
    const cleaned = value.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    playSound("type");
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");
    setLoading(true);
    setAlertMsg("");
    
    await new Promise(r => setTimeout(r, 1000));

    try {
      if (activeTab === "login") {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          throw new Error(res.error.message || "NETWORK_ERR // INVALID_CREDENTIALS");
        }
        router.push("/");
      } else if (activeTab === "register") {
        const res = await authClient.signUp.email({ 
          email, 
          password, 
          name: newUserId || email.split("@")[0] 
        });
        if (res.error) throw new Error(res.error.message || "DB_ERR // REGISTRATION_FAILED");
        router.push("/");
      } else if (activeTab === "forgot-password") {
        if (recoveryStep === "email") {
          const res = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "forget-password",
          });
          if (res.error) throw new Error(res.error.message || "DB_ERR // REQUEST_FAILED");
          setAlertType("warning");
          setAlertMsg("OTP_TRANSMITTED // CHECK_INBOX");
          setRecoveryStep("otp");
          setLoading(false);
          return;
        } else {
          const otpCode = otp.join("");
          if (otpCode.length !== 6) throw new Error("INVALID_INPUT // OTP_REQUIRED_6_DIGITS");
          if (!newPassword) throw new Error("INVALID_INPUT // PASSWORD_REQUIRED");

          const res = await authClient.emailOtp.resetPassword({
            email,
            otp: otpCode,
            password: newPassword,
          });
          if (res.error) throw new Error(res.error.message || "VERIFICATION_FAILED // INVALID_OTP");
          setAlertType("warning");
          setAlertMsg("PASSWORD_UPDATED // REDIRECTING_TO_LOGIN...");
          setLoading(false);
          setTimeout(() => {
            setRecoveryStep("email");
            setOtp(["", "", "", "", "", ""]);
            setNewPassword("");
            setActiveTab("login");
            setAlertMsg("");
          }, 2000);
          return;
        }
      }
    } catch (err: any) {
      playSound("error");
      setAlertType("error");
      setAlertMsg(err.message || "UNKNOWN_SYSTEM_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ cursor: isDesktop ? 'none' : 'auto' }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        
        :root {
          --c-primary: #00ffff;
          --c-secondary: #ff00ff;
          --c-bg: #050914;
          --c-panel: rgba(5, 9, 20, 0.7);
        }

        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--c-bg);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: monospace;
          user-select: none;
          padding: 16px;
        }

        /* ═══════════════════════════════════════════ */
        /* CURSOR — Desktop only (pointer: fine)      */
        /* ═══════════════════════════════════════════ */
        @media (pointer: coarse) {
          .cyber-cursor-dot,
          .cyber-cursor-outline { display: none !important; }
        }
        @media (pointer: fine) {
          .cyber-cursor-dot {
            position: fixed; top: 0; left: 0; width: 4px; height: 4px;
            background: var(--c-primary); border-radius: 50%;
            transform: translate(-50%, -50%); z-index: 10000;
            pointer-events: none; box-shadow: 0 0 10px var(--c-primary);
          }
          .cyber-cursor-outline {
            position: fixed; top: 0; left: 0; width: 30px; height: 30px;
            border: 1px solid var(--c-primary); transform: translate(-50%, -50%) rotate(45deg);
            z-index: 9999; pointer-events: none;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.2);
            transition: transform 0.1s ease, width 0.1s, height 0.1s, border-color 0.1s, box-shadow 0.1s;
          }
          .cyber-cursor-outline.clicking {
            transform: translate(-50%, -50%) rotate(90deg) scale(0.6);
            border-color: var(--c-secondary);
            box-shadow: 0 0 20px var(--c-secondary), inset 0 0 10px var(--c-secondary);
          }
        }

        /* ═══════════════════════════════════════════ */
        /* ENVIRONMENT LAYER                          */
        /* ═══════════════════════════════════════════ */
        .cyber-grid {
          position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(60deg) translateY(0);
          animation: gridMove 20s linear infinite;
          z-index: 1;
        }
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
        }
        .radial-glow {
          position: absolute; top: 50%; left: 50%; width: 100vw; height: 100vh;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at center, rgba(0,255,255,0.15) 0%, transparent 60%);
          z-index: 2; pointer-events: none;
        }
        .crt-lines {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 4px; z-index: 20; pointer-events: none;
        }

        /* Mobile: subtle the CRT effect */
        @media (max-width: 640px) {
          .crt-lines { opacity: 0.4; }
          .cyber-grid { opacity: 0.5; }
        }

        /* ═══════════════════════════════════════════ */
        /* AUTH WIDGET                                */
        /* ═══════════════════════════════════════════ */
        .auth-widget {
          position: relative; z-index: 10;
          background: var(--c-panel);
          backdrop-filter: blur(12px);
          border: 1px solid var(--c-primary);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.15), inset 0 0 20px rgba(0, 255, 255, 0.05);
          clip-path: polygon(
            0 20px, 20px 0, 
            100% 0, 100% calc(100% - 20px), 
            calc(100% - 20px) 100%, 0 100%
          );
          animation: bootUp 1.2s cubic-bezier(0.1, 0.8, 0.1, 1);
          width: 100%;
          max-width: 440px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @keyframes bootUp {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px) hue-rotate(-45deg); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) hue-rotate(0); }
        }
        
        .auth-widget::before {
          content: ''; position: absolute; top: 0; left: 20px; width: 60px; height: 2px;
          background: var(--c-primary); box-shadow: 0 0 10px var(--c-primary);
        }
        .auth-widget::after {
          content: ''; position: absolute; bottom: 0; right: 20px; width: 60px; height: 2px;
          background: var(--c-primary); box-shadow: 0 0 10px var(--c-primary);
        }

        /* Mobile widget adjustments */
        @media (max-width: 480px) {
          .auth-widget {
            padding: 24px 20px;
            gap: 18px;
            clip-path: polygon(
              0 14px, 14px 0, 
              100% 0, 100% calc(100% - 14px), 
              calc(100% - 14px) 100%, 0 100%
            );
          }
        }

        /* ═══════════════════════════════════════════ */
        /* TEXT EFFECTS                               */
        /* ═══════════════════════════════════════════ */
        .txt-orbitron { font-family: 'Orbitron', sans-serif; }
        .txt-sharetech { font-family: 'Share Tech Mono', monospace; }
        
        .text-glitch {
          text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary);
          animation: glitchText 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitchText {
          0%, 100% { text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary); transform: translate(0); }
          5% { text-shadow: -2px 0 var(--c-secondary), 2px 0 var(--c-primary); transform: translate(-1px, 1px); }
          10% { text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary); transform: translate(1px, -1px); }
          15% { text-shadow: 0 0 var(--c-secondary), 0 0 var(--c-primary); transform: translate(0); }
        }

        .page-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.875rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          margin-bottom: 6px;
        }
        .page-subtitle {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          color: rgba(0, 255, 255, 0.7);
          letter-spacing: 0.15em;
        }

        @media (max-width: 480px) {
          .page-title { font-size: 1.5rem; letter-spacing: 0.1em; }
          .page-subtitle { font-size: 0.7rem; }
        }

        /* ═══════════════════════════════════════════ */
        /* TABS                                       */
        /* ═══════════════════════════════════════════ */
        .tab-bar {
          display: flex;
          justify-content: center;
          gap: 4px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.15);
          padding-bottom: 8px;
        }
        .cyber-tab {
          font-family: 'Orbitron', sans-serif;
          transition: all 0.3s;
          border-bottom: 2px solid transparent;
          padding: 8px 16px;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.35);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .cyber-tab.active {
          color: var(--c-primary);
          border-bottom-color: var(--c-primary);
          text-shadow: 0 0 10px var(--c-primary);
        }
        @media (pointer: fine) {
          .cyber-tab:hover:not(.active) { color: #fff; text-shadow: 0 0 8px #fff; }
        }
        .cyber-tab:active:not(.active) { color: #fff; text-shadow: 0 0 8px #fff; }

        @media (max-width: 480px) {
          .tab-bar { gap: 0; }
          .cyber-tab {
            font-size: 0.65rem;
            padding: 8px 10px;
            letter-spacing: 0.08em;
          }
        }

        /* ═══════════════════════════════════════════ */
        /* FORM ELEMENTS                              */
        /* ═══════════════════════════════════════════ */
        .cyber-input {
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          color: var(--c-primary);
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.2s;
          padding: 14px;
          font-size: 1rem;
          width: 100%;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .cyber-input:focus {
          outline: none; border-color: var(--c-primary);
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
        }
        .cyber-input::placeholder {
          color: rgba(0, 255, 255, 0.25);
        }

        /* Prevent iOS zoom on input focus */
        @media (max-width: 480px) {
          .cyber-input {
            font-size: 16px;
            padding: 12px;
          }
        }

        .input-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          color: rgba(0, 255, 255, 0.7);
          letter-spacing: 0.15em;
        }

        .cyber-btn {
          background: transparent;
          border: 1px solid var(--c-primary);
          color: var(--c-primary);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          font-family: 'Orbitron', sans-serif;
          width: 100%;
          padding: 16px;
          margin-top: 8px;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          cursor: pointer;
          min-height: 56px;
        }
        .cyber-btn::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: var(--c-primary); transition: all 0.3s ease; z-index: -1;
        }
        @media (pointer: fine) {
          .cyber-btn:hover { color: #000; box-shadow: 0 0 20px var(--c-primary); }
          .cyber-btn:hover::before { left: 0; }
        }
        .cyber-btn:active { 
          color: #000; 
          box-shadow: 0 0 20px var(--c-primary);
          background: var(--c-primary);
        }
        .cyber-btn:disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .cyber-btn {
            font-size: 0.85rem;
            padding: 14px;
            min-height: 50px;
            letter-spacing: 0.1em;
          }
        }

        .cyber-btn-secondary {
          background: transparent;
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: rgba(0, 255, 255, 0.6);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          font-family: 'Orbitron', sans-serif;
          width: 100%;
          padding: 12px;
          font-size: 0.8rem;
          letter-spacing: 0.15em;
          cursor: pointer;
        }
        @media (pointer: fine) {
          .cyber-btn-secondary:hover {
            border-color: var(--c-primary);
            color: var(--c-primary);
          }
        }
        .cyber-btn-secondary:active {
          border-color: var(--c-primary);
          color: var(--c-primary);
        }

        /* ═══════════════════════════════════════════ */
        /* OTP INPUT                                  */
        /* ═══════════════════════════════════════════ */
        .otp-container {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        .otp-input {
          width: 48px; height: 56px;
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: var(--c-secondary);
          font-family: 'Orbitron', sans-serif;
          font-size: 22px; font-weight: 900;
          text-align: center;
          transition: all 0.2s;
          caret-color: var(--c-primary);
          border-radius: 0;
          -webkit-appearance: none;
        }
        .otp-input:focus {
          outline: none;
          border-color: var(--c-secondary);
          background: rgba(255, 0, 255, 0.08);
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 10px rgba(255, 0, 255, 0.1);
          animation: otpPulse 1s ease infinite;
        }
        .otp-input.filled {
          border-color: var(--c-secondary);
          background: rgba(255, 0, 255, 0.1);
          box-shadow: 0 0 10px rgba(255, 0, 255, 0.2);
        }
        @keyframes otpPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 10px rgba(255, 0, 255, 0.1); }
          50% { box-shadow: 0 0 30px rgba(255, 0, 255, 0.5), inset 0 0 15px rgba(255, 0, 255, 0.2); }
        }

        @media (max-width: 480px) {
          .otp-container { gap: 6px; }
          .otp-input {
            width: 42px; height: 50px;
            font-size: 20px;
          }
        }
        @media (max-width: 360px) {
          .otp-container { gap: 4px; }
          .otp-input {
            width: 38px; height: 46px;
            font-size: 18px;
          }
        }

        /* ═══════════════════════════════════════════ */
        /* STEP INDICATOR                             */
        /* ═══════════════════════════════════════════ */
        .step-indicator {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px; color: rgba(0, 255, 255, 0.5);
          letter-spacing: 2px;
        }
        .step-dot {
          width: 8px; height: 8px; border: 1px solid rgba(0, 255, 255, 0.3);
          transform: rotate(45deg); transition: all 0.3s;
        }
        .step-dot.active {
          background: var(--c-primary);
          border-color: var(--c-primary);
          box-shadow: 0 0 8px var(--c-primary);
        }
        .step-line {
          width: 24px; height: 1px;
          background: rgba(0, 255, 255, 0.2);
          transition: background 0.3s;
        }
        .step-line.active { background: var(--c-primary); box-shadow: 0 0 4px var(--c-primary); }

        /* ═══════════════════════════════════════════ */
        /* ALERTS                                     */
        /* ═══════════════════════════════════════════ */
        .sys-alert {
          border-left: 4px solid;
          background: rgba(0,0,0,0.5);
          animation: fadeAlert 0.3s ease forwards;
          padding: 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          word-break: break-word;
        }
        .alert-error { border-color: var(--c-secondary); color: var(--c-secondary); text-shadow: 0 0 8px var(--c-secondary); box-shadow: inset 10px 0 20px -10px var(--c-secondary); }
        .alert-warning { border-color: var(--c-primary); color: var(--c-primary); text-shadow: 0 0 8px var(--c-primary); box-shadow: inset 10px 0 20px -10px var(--c-primary); }
        
        @keyframes fadeAlert { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 480px) {
          .sys-alert {
            font-size: 0.65rem;
            padding: 10px;
            letter-spacing: 0.08em;
          }
        }

        /* ═══════════════════════════════════════════ */
        /* MOBILE DECORATIVE ELEMENTS                 */
        /* ═══════════════════════════════════════════ */
        .mobile-corner-tl,
        .mobile-corner-br {
          display: none;
        }
        @media (max-width: 640px) {
          .mobile-corner-tl,
          .mobile-corner-br {
            display: block;
            position: fixed;
            width: 60px;
            height: 60px;
            border-color: rgba(0, 255, 255, 0.15);
            z-index: 5;
            pointer-events: none;
          }
          .mobile-corner-tl {
            top: 12px; left: 12px;
            border-top: 1px solid;
            border-left: 1px solid;
          }
          .mobile-corner-br {
            bottom: 12px; right: 12px;
            border-bottom: 1px solid;
            border-right: 1px solid;
          }
        }
      `}} />

      {/* CURSOR — rendered always, hidden via CSS on touch devices */}
      <div className="cyber-cursor-dot"></div>
      <div className="cyber-cursor-outline"></div>

      {/* ENVIRONMENT */}
      <div className="cyber-grid"></div>
      <div className="radial-glow"></div>
      <div className="crt-lines"></div>

      {/* Mobile decorative corners */}
      <div className="mobile-corner-tl"></div>
      <div className="mobile-corner-br"></div>

      {/* INTERFACE */}
      <div className="auth-widget">
        
        <div style={{ textAlign: 'center' }}>
          <h1 className="page-title text-glitch">SYS.AUTH</h1>
          <p className="page-subtitle">&gt; IDENTIFICATION_REQUIRED_</p>
        </div>

        {/* TABS */}
        <div className="tab-bar">
          <button 
            type="button"
            className={`cyber-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => handleTabSwitch("login")}
            onMouseEnter={() => playSound("hover")}
          >
            LOGIN
          </button>
          <button 
            type="button"
            className={`cyber-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => handleTabSwitch("register")}
            onMouseEnter={() => playSound("hover")}
          >
            DAFTAR
          </button>
          <button 
            type="button"
            className={`cyber-tab ${activeTab === "forgot-password" ? "active" : ""}`}
            onClick={() => handleTabSwitch("forgot-password")}
            onMouseEnter={() => playSound("hover")}
          >
            RECOVERY
          </button>
        </div>

        {/* STEP INDICATOR for recovery */}
        {activeTab === "forgot-password" && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="step-indicator">
              <div className={`step-dot ${recoveryStep === "email" ? "active" : (recoveryStep === "otp" ? "active" : "")}`}></div>
              <span style={{ color: recoveryStep === "email" ? 'rgba(0,255,255,0.8)' : 'rgba(0,255,255,0.4)' }}>EMAIL</span>
              <div className={`step-line ${recoveryStep === "otp" ? "active" : ""}`}></div>
              <div className={`step-dot ${recoveryStep === "otp" ? "active" : ""}`}></div>
              <span style={{ color: recoveryStep === "otp" ? 'rgba(0,255,255,0.8)' : 'rgba(0,255,255,0.4)' }}>OTP+KEY</span>
            </div>
          </div>
        )}

        {/* ALERT */}
        {alertMsg && (
          <div className={`sys-alert ${alertType === "error" ? "alert-error" : "alert-warning"}`}>
            [!] {alertMsg}
          </div>
        )}

        {/* FORMS */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: "'Share Tech Mono', monospace" }}>
          
          {activeTab === "register" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="input-label">&gt; NEW_USER_ID</label>
              <input 
                type="text" 
                required 
                value={newUserId}
                onChange={handleInputChange(setNewUserId)}
                className="cyber-input" 
                placeholder="operator_01"
              />
            </div>
          )}

          {/* EMAIL field */}
          {(activeTab !== "forgot-password" || recoveryStep === "email") && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="input-label">
                &gt; {activeTab === "login" ? "USER_ID // EMAIL" : "EMAIL_ADDRESS"}
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={handleInputChange(setEmail)}
                className="cyber-input" 
                placeholder="operator@nightcity.sys"
                autoComplete="email"
              />
            </div>
          )}

          {/* PASSWORD field */}
          {activeTab !== "forgot-password" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="input-label">
                &gt; {activeTab === "login" ? "PASSWORD // KEY" : "SET_PASSWORD"}
              </label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={handleInputChange(setPassword)}
                className="cyber-input" 
                placeholder="••••••••"
                autoComplete={activeTab === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          {/* OTP + NEW PASSWORD */}
          {activeTab === "forgot-password" && recoveryStep === "otp" && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="input-label">&gt; VERIFICATION_CODE // 6_DIGIT</label>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  OTP dikirim ke: {email}
                </p>
                <div className="otp-container">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`otp-input ${digit ? "filled" : ""}`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="input-label">&gt; NEW_PASSWORD</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={handleInputChange(setNewPassword)}
                  className="cyber-input" 
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            onMouseEnter={() => playSound("hover")}
            className="cyber-btn"
          >
            {loading 
              ? "PROCESSING..." 
              : activeTab === "login" 
                ? "INISIASI LINK" 
                : activeTab === "register" 
                  ? "DAFTAR SISTEM" 
                  : recoveryStep === "email"
                    ? "KIRIM KODE OTP"
                    : "RESET PASSWORD"
            }
          </button>

          {/* Back button for OTP step */}
          {activeTab === "forgot-password" && recoveryStep === "otp" && (
            <button
              type="button"
              onClick={() => {
                playSound("click");
                setRecoveryStep("email");
                setOtp(["", "", "", "", "", ""]);
                setNewPassword("");
                setAlertMsg("");
              }}
              onMouseEnter={() => playSound("hover")}
              className="cyber-btn-secondary"
            >
              &lt; KEMBALI
            </button>
          )}

        </form>

      </div>
    </div>
  );
}
