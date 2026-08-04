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

    // CURSOR LOGIC
    const cursorDot = document.querySelector(".cyber-cursor-dot") as HTMLElement;
    const cursorOutline = document.querySelector(".cyber-cursor-outline") as HTMLElement;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let animFrame: number;

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
      outlineX += (mouseX - outlineX) * 0.2; // Lerp
      outlineY += (mouseY - outlineY) * 0.2;
      if (cursorOutline) {
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
      }
      animFrame = requestAnimationFrame(animateCursor);
    };
    animateCursor();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
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
      // Random freq square wave 1200-1600Hz
      osc.type = "square";
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === "hover") {
      // Sine wave sweeping up 600-800Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === "click") {
      // Sawtooth down 400-100Hz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } else if (type === "error") {
      // Square low tone 150-100Hz
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
    // Reset recovery state when switching tabs
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
      // Handle paste: distribute characters across inputs
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
    
    // Simulate 1s loading delay
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
          // Step 1: Send OTP to email
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
          // Step 2: Verify OTP and reset password
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
          // Reset state and switch to login
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
    <div className="min-h-screen bg-[#050914] text-white flex items-center justify-center relative overflow-hidden font-mono select-none" style={{ cursor: 'none' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        
        :root {
          --c-primary: #00ffff;
          --c-secondary: #ff00ff;
          --c-bg: #050914;
          --c-panel: rgba(5, 9, 20, 0.7);
        }

        /* CURSOR SYSTEM LAYER */
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

        /* ENVIRONMENT LAYER */
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

        /* INTERFACE LAYER */
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

        /* TEXT EFFECTS */
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

        /* FORM ELEMENTS */
        .cyber-tab {
          font-family: 'Orbitron', sans-serif;
          transition: all 0.3s;
          border-bottom: 2px solid transparent;
        }
        .cyber-tab.active {
          color: var(--c-primary);
          border-bottom-color: var(--c-primary);
          text-shadow: 0 0 10px var(--c-primary);
        }
        .cyber-tab:hover:not(.active) { color: #fff; text-shadow: 0 0 8px #fff; }

        .cyber-input {
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          color: var(--c-primary);
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.2s;
        }
        .cyber-input:focus {
          outline: none; border-color: var(--c-primary);
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
        }

        .cyber-btn {
          background: transparent;
          border: 1px solid var(--c-primary);
          color: var(--c-primary);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
        .cyber-btn::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: var(--c-primary); transition: all 0.3s ease; z-index: -1;
        }
        .cyber-btn:hover { color: #000; box-shadow: 0 0 20px var(--c-primary); }
        .cyber-btn:hover::before { left: 0; }

        .cyber-btn-secondary {
          background: transparent;
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: rgba(0, 255, 255, 0.6);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
        .cyber-btn-secondary:hover {
          border-color: var(--c-primary);
          color: var(--c-primary);
        }

        /* OTP INPUT */
        .otp-input {
          width: 48px; height: 56px;
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: var(--c-secondary);
          font-family: 'Orbitron', sans-serif;
          font-size: 24px; font-weight: 900;
          text-align: center;
          transition: all 0.2s;
          caret-color: var(--c-primary);
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

        /* STEP INDICATOR */
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

        /* ALERTS */
        .sys-alert {
          border-left: 4px solid;
          background: rgba(0,0,0,0.5);
          animation: fadeAlert 0.3s ease forwards;
        }
        .alert-error { border-color: var(--c-secondary); color: var(--c-secondary); text-shadow: 0 0 8px var(--c-secondary); box-shadow: inset 10px 0 20px -10px var(--c-secondary); }
        .alert-warning { border-color: var(--c-primary); color: var(--c-primary); text-shadow: 0 0 8px var(--c-primary); box-shadow: inset 10px 0 20px -10px var(--c-primary); }
        
        @keyframes fadeAlert { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}} />

      {/* CURSOR */}
      <div className="cyber-cursor-dot"></div>
      <div className="cyber-cursor-outline"></div>

      {/* ENVIRONMENT */}
      <div className="cyber-grid"></div>
      <div className="radial-glow"></div>
      <div className="crt-lines"></div>

      {/* INTERFACE */}
      <div className="auth-widget w-full max-w-md p-8 flex flex-col gap-6">
        
        <div className="text-center">
          <h1 className="txt-orbitron text-3xl font-black tracking-widest text-glitch mb-2">SYS.AUTH</h1>
          <p className="txt-sharetech text-sm text-cyan-500 opacity-80 tracking-widest">&gt; IDENTIFICATION_REQUIRED_</p>
        </div>

        {/* TABS */}
        <div className="flex justify-center gap-8 border-b border-cyan-900/50 pb-2">
          <button 
            type="button"
            className={`cyber-tab px-4 py-2 text-sm tracking-widest ${activeTab === "login" ? "active" : "text-gray-500"}`}
            onClick={() => handleTabSwitch("login")}
            onMouseEnter={() => playSound("hover")}
          >
            LOGIN
          </button>
          <button 
            type="button"
            className={`cyber-tab px-4 py-2 text-sm tracking-widest ${activeTab === "register" ? "active" : "text-gray-500"}`}
            onClick={() => handleTabSwitch("register")}
            onMouseEnter={() => playSound("hover")}
          >
            DAFTAR
          </button>
          <button 
            type="button"
            className={`cyber-tab px-4 py-2 text-sm tracking-widest ${activeTab === "forgot-password" ? "active" : "text-gray-500"}`}
            onClick={() => handleTabSwitch("forgot-password")}
            onMouseEnter={() => playSound("hover")}
          >
            RECOVERY
          </button>
        </div>

        {/* STEP INDICATOR for recovery */}
        {activeTab === "forgot-password" && (
          <div className="flex justify-center">
            <div className="step-indicator">
              <div className={`step-dot ${recoveryStep === "email" ? "active" : (recoveryStep === "otp" ? "active" : "")}`}></div>
              <span className={recoveryStep === "email" ? "text-cyan-400" : "text-cyan-600"}>EMAIL</span>
              <div className={`step-line ${recoveryStep === "otp" ? "active" : ""}`}></div>
              <div className={`step-dot ${recoveryStep === "otp" ? "active" : ""}`}></div>
              <span className={recoveryStep === "otp" ? "text-cyan-400" : ""}>OTP+KEY</span>
            </div>
          </div>
        )}

        {/* ALERT */}
        {alertMsg && (
          <div className={`sys-alert p-3 text-xs tracking-widest txt-sharetech uppercase ${alertType === "error" ? "alert-error" : "alert-warning"}`}>
            [!] {alertMsg}
          </div>
        )}

        {/* FORMS */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 txt-sharetech">
          
          {activeTab === "register" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-cyan-400 tracking-widest">&gt; NEW_USER_ID</label>
              <input 
                type="text" 
                required 
                value={newUserId}
                onChange={handleInputChange(setNewUserId)}
                className="cyber-input p-3 text-lg w-full" 
                placeholder="operator_01"
              />
            </div>
          )}

          {/* EMAIL field - shown for login, register, and forgot-password step 1 */}
          {(activeTab !== "forgot-password" || recoveryStep === "email") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-cyan-400 tracking-widest">
                &gt; {activeTab === "login" ? "USER_ID // EMAIL" : "EMAIL_ADDRESS"}
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={handleInputChange(setEmail)}
                className="cyber-input p-3 text-lg w-full" 
                placeholder="operator@nightcity.sys"
              />
            </div>
          )}

          {/* PASSWORD field - shown for login and register only */}
          {activeTab !== "forgot-password" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-cyan-400 tracking-widest">
                &gt; {activeTab === "login" ? "PASSWORD // KEY" : "SET_PASSWORD"}
              </label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={handleInputChange(setPassword)}
                className="cyber-input p-3 text-lg w-full" 
                placeholder="••••••••"
              />
            </div>
          )}

          {/* OTP + NEW PASSWORD - shown for forgot-password step 2 */}
          {activeTab === "forgot-password" && recoveryStep === "otp" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-cyan-400 tracking-widest">&gt; VERIFICATION_CODE // 6_DIGIT</label>
                <p className="text-xs text-gray-500 tracking-wider mb-1">OTP dikirim ke: {email}</p>
                <div className="flex justify-center gap-2">
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
                      style={{ cursor: 'none' }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-cyan-400 tracking-widest">&gt; NEW_PASSWORD</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={handleInputChange(setNewPassword)}
                  className="cyber-input p-3 text-lg w-full" 
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            onMouseEnter={() => playSound("hover")}
            className="cyber-btn txt-orbitron w-full p-4 mt-2 text-lg font-bold tracking-widest"
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
              className="cyber-btn-secondary txt-orbitron w-full p-3 text-sm tracking-widest"
            >
              &lt; KEMBALI
            </button>
          )}

        </form>

      </div>
    </div>
  );
}
