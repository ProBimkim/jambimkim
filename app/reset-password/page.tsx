"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState<"error" | "warning">("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg("");

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
      });
      if (res.error) throw new Error(res.error.message || "NETWORK_ERR // PASSWORD_RESET_FAILED");
      
      setAlertType("warning");
      setAlertMsg("PASSWORD_UPDATED // REDIRECTING...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setAlertType("error");
      setAlertMsg(err.message || "UNKNOWN_SYSTEM_FAILURE");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-white flex items-center justify-center relative overflow-hidden font-mono select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        
        :root {
          --c-primary: #00ffff;
          --c-secondary: #ff00ff;
          --c-bg: #050914;
          --c-panel: rgba(5, 9, 20, 0.7);
        }

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
        }

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

        .sys-alert {
          border-left: 4px solid;
          background: rgba(0,0,0,0.5);
        }
        .alert-error { border-color: var(--c-secondary); color: var(--c-secondary); }
        .alert-warning { border-color: var(--c-primary); color: var(--c-primary); }
      `}} />

      <div className="auth-widget w-full max-w-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-[Orbitron] text-3xl font-black tracking-widest mb-2" style={{ textShadow: '2px 0 var(--c-secondary), -2px 0 var(--c-primary)' }}>SYS.RESET</h1>
          <p className="font-[Share_Tech_Mono] text-sm text-cyan-500 opacity-80 tracking-widest">&gt; NEW_KEY_REQUIRED_</p>
        </div>

        {alertMsg && (
          <div className={`sys-alert p-3 text-xs tracking-widest font-[Share_Tech_Mono] uppercase ${alertType === "error" ? "alert-error" : "alert-warning"}`}>
            [!] {alertMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-[Share_Tech_Mono]">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-cyan-400 tracking-widest">
              &gt; NEW_PASSWORD
            </label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input p-3 text-lg w-full" 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="cyber-btn font-[Orbitron] w-full p-4 mt-2 text-lg font-bold tracking-widest"
          >
            {loading ? "PROCESSING..." : "UBAH PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}
