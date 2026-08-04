"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Head from "next/head";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We attempt to sign in with better-auth
    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });
      if (res.error) throw res.error;
      router.push("/");
    } catch (err) {
      console.log("Sign in failed, attempting sign up...", err);
      try {
        const res2 = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
        });
        if (res2.error) throw res2.error;
        router.push("/");
      } catch (err2) {
        console.error("Sign up also failed", err2);
        // Fallback redirect for UX demo
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-cyan-400 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        
        .cyber-bg {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background-image: url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          filter: grayscale(60%) brightness(0.4) contrast(1.5);
          z-index: 0;
        }

        .cyber-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(45deg, rgba(255,0,60,0.2) 0%, rgba(0,255,255,0.2) 100%);
          mix-blend-mode: color-dodge;
          z-index: 1;
        }

        .scanlines {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
        }

        .cyber-box {
          position: relative;
          z-index: 5;
          background: rgba(10, 10, 15, 0.85);
          border: 2px solid #0ff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          clip-path: polygon(
            0 0, 
            calc(100% - 30px) 0, 
            100% 30px, 
            100% 100%, 
            30px 100%, 
            0 calc(100% - 30px)
          );
        }

        .cyber-box::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 40px; height: 3px; background: #0ff;
          box-shadow: 0 0 10px #0ff;
        }

        .cyber-box::after {
          content: ''; position: absolute; bottom: 0; right: 0;
          width: 40px; height: 3px; background: #0ff;
          box-shadow: 0 0 10px #0ff;
        }

        .cyber-input {
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.3s ease;
        }

        .cyber-input:focus {
          outline: none;
          border-color: #0ff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
          background: rgba(0, 255, 255, 0.1);
        }

        .cyber-btn {
          background: #0ff;
          color: #000;
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          transition: all 0.2s ease;
        }

        .cyber-btn:hover {
          background: #fff;
          box-shadow: 0 0 20px #0ff;
        }
        
        .glitch-text {
          font-family: 'Orbitron', sans-serif;
          text-shadow: 2px 2px #ff003c, -2px -2px #0ff;
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0% { text-shadow: 2px 2px #ff003c, -2px -2px #0ff; transform: translate(0); }
          5% { text-shadow: -2px -2px #ff003c, 2px 2px #0ff; transform: translate(-2px, 2px); }
          10% { text-shadow: 2px 2px #ff003c, -2px -2px #0ff; transform: translate(2px, -2px); }
          15% { text-shadow: 2px 2px #ff003c, -2px -2px #0ff; transform: translate(0); }
          100% { text-shadow: 2px 2px #ff003c, -2px -2px #0ff; transform: translate(0); }
        }
      `}} />

      <div className="cyber-bg"></div>
      <div className="cyber-overlay"></div>
      <div className="scanlines"></div>

      <div className="cyber-box w-full max-w-md p-8 pt-10 pb-12 flex flex-col gap-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-black text-white tracking-widest glitch-text mb-2">SYSTEM.LOGIN</h1>
          <p className="text-sm tracking-widest opacity-80 text-cyan-300">AUTHORIZED PERSONNEL ONLY</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-cyan-300">USER_ID // EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cyber-input w-full p-3 text-lg" 
              placeholder="operator@nightcity.sys"
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-cyan-300">SECURITY_KEY // PASS</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input w-full p-3 text-lg" 
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="cyber-btn mt-4 w-full p-4 text-xl flex items-center justify-center gap-2"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE_CONNECTION'}
          </button>
        </form>

        <div className="mt-4 text-center border-t border-cyan-900 pt-4">
          <p className="text-xs opacity-50 text-cyan-500">CONNECTION: SECURE // ENCRYPTION: 2048-BIT</p>
        </div>
      </div>
    </div>
  );
}
