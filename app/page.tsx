"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoggingOut(false);
    }
  };

  // DOM refs for audio and glitch
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // --- KURSOR CYBERPUNK ---
    const cursorDot = document.querySelector('.cursor-dot') as HTMLElement;
    const cursorOutline = document.querySelector('.cursor-outline') as HTMLElement;

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

    const onMouseDown = () => cursorOutline?.classList.add('active');
    const onMouseUp = () => cursorOutline?.classList.remove('active');

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    const animateCursor = () => {
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;
      if (cursorOutline) {
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
      }
      animFrame = requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // --- AUDIO SYSTEM ---
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      startAmbientSound();
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('load', initAudio);

    const playTickSound = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    };

    const playGlitchSound = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const whiteNoise = ctx.createBufferSource(); whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime); filter.Q.setValueAtTime(3, ctx.currentTime);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      whiteNoise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      whiteNoise.start(); whiteNoise.stop(ctx.currentTime + 0.12);
    };

    const startAmbientSound = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || ambientGainRef.current) return;
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
      ambientGainRef.current = ctx.createGain();
      osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(55, ctx.currentTime);
      osc2.type = 'sine'; osc2.frequency.setValueAtTime(110, ctx.currentTime);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(350, ctx.currentTime);
      ambientGainRef.current.gain.setValueAtTime(0.03, ctx.currentTime);
      osc1.connect(filter); osc2.connect(filter); filter.connect(ambientGainRef.current); ambientGainRef.current.connect(ctx.destination);
      osc1.start(); osc2.start();
    };

    // --- CLOCK LOGIC ---
    const setTimezone = () => {
      const date = new Date();
      let offset = -date.getTimezoneOffset() / 60;
      let sign = offset >= 0 ? '+' : '';
      const tzBadge = document.getElementById('timezone-badge');
      if (tzBadge) tzBadge.innerText = `TZ: // GMT${sign}${offset}`;
    };

    let lastSecond = -1;
    const updateTime = () => {
      const now = new Date();
      let currentSec = now.getSeconds();
      const hrs = document.getElementById('hours');
      const mins = document.getElementById('minutes');
      const secs = document.getElementById('seconds');
      const dateEl = document.getElementById('date');

      if (hrs) hrs.innerText = now.getHours().toString().padStart(2, '0');
      if (mins) mins.innerText = now.getMinutes().toString().padStart(2, '0');
      if (secs) secs.innerText = currentSec.toString().padStart(2, '0');

      if (currentSec !== lastSecond) {
        playTickSound();
        lastSecond = currentSec;
      }

      if (dateEl) dateEl.innerText = `SYS.DATE: // ${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
    };

    setTimezone();
    const clockInt = setInterval(updateTime, 200);
    updateTime();

    // Glitch logic
    const glitchElement = document.getElementById('glitch-target');
    const glitchInt = setInterval(() => {
      if (Math.random() > 0.6 && glitchElement) {
        glitchElement.classList.remove('glitch-effect');
        void glitchElement.offsetWidth;
        setTimeout(() => {
          glitchElement.classList.add('glitch-effect');
          playGlitchSound();
        }, 40);
      }
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animFrame);
      clearInterval(clockInt);
      clearInterval(glitchInt);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap');
        
        :root { --neon-base: #0ff; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #000;
            color: #fff;
            font-family: 'Share Tech Mono', monospace;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            user-select: none;
        }
        #cyber-scene {
            position: relative;
            width: 100%; height: 100%;
            animation: masterRGB 16s infinite linear;
            cursor: none;
        }
        @keyframes masterRGB {
            0% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(180deg); }
            100% { filter: hue-rotate(360deg); }
        }
        @media (pointer: fine) {
            .cursor-dot {
                position: fixed; top: 0; left: 0; width: 6px; height: 6px;
                background: var(--neon-base); border-radius: 50%;
                transform: translate(-50%, -50%); z-index: 10000;
                pointer-events: none; box-shadow: 0 0 10px var(--neon-base), 0 0 20px #fff;
            }
            .cursor-outline {
                position: fixed; top: 0; left: 0; width: 35px; height: 35px;
                border: 1px solid var(--neon-base); transform: translate(-50%, -50%) rotate(45deg);
                z-index: 9999; pointer-events: none;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2);
                transition: transform 0.15s ease, width 0.15s, height 0.15s, border-color 0.15s;
            }
            .cursor-outline.active {
                transform: translate(-50%, -50%) rotate(90deg) scale(0.7);
                border-width: 2px; border-color: #fff; box-shadow: 0 0 20px var(--neon-base);
            }
        }
        @media (pointer: coarse) {
            .cursor-dot, .cursor-outline { display: none !important; }
            #cyber-scene { cursor: auto; }
        }
        .brick-texture {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: url('https://images.unsplash.com/photo-1511253819057-dfdc96825c34?q=80&w=2000&auto=format&fit=crop');
            background-size: cover; background-position: center;
            filter: grayscale(80%) brightness(0.7) contrast(1.8); z-index: 1;
        }
        .brick-illumination {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 50% 40%, rgba(0, 255, 255, 0.85) 0%, rgba(0, 255, 255, 0.25) 40%, rgba(0,0,0,0.6) 80%);
            mix-blend-mode: overlay; z-index: 2;
        }
        .brick-glow-core {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 50% 40%, rgba(0, 255, 255, 0.5) 0%, transparent 50%);
            mix-blend-mode: color-dodge; z-index: 3;
        }
        .floor-area {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 35vh;
            background: linear-gradient(to bottom, #010204 0%, #050b14 100%);
            border-top: 3px solid var(--neon-base); box-shadow: 0 -10px 30px var(--neon-base); z-index: 4;
        }
        .clock-wrapper {
            position: absolute; bottom: 35vh; left: 50%; transform: translate(-50%, 35px);
            z-index: 5; width: 90vw; max-width: 680px;
            -webkit-box-reflect: below 5px linear-gradient(transparent 30%, rgba(255, 255, 255, 0.65));
        }
        .cyber-frame {
            background: rgba(3, 8, 15, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            padding: 45px 60px; border: 2px solid var(--neon-base); border-radius: 4px;
            clip-path: polygon(0 0, calc(100% - 35px) 0, 100% 35px, 100% 100%, 35px 100%, 0 calc(100% - 35px));
            box-shadow: 0 0 30px var(--neon-base), inset 0 0 25px rgba(0, 255, 255, 0.25); position: relative;
        }
        .cyber-frame::before {
            content: ''; position: absolute; top: 0; left: 0; width: 50px; height: 4px;
            background: var(--neon-base); box-shadow: 0 0 15px var(--neon-base);
        }
        .cyber-frame::after {
            content: ''; position: absolute; bottom: 0; right: 0; width: 60px; height: 4px;
            background: var(--neon-base); box-shadow: 0 0 15px var(--neon-base);
        }
        .clock-display {
            font-family: 'Orbitron', sans-serif; font-size: 6rem; font-weight: 900; color: #fff;
            letter-spacing: 6px; display: flex; align-items: center; justify-content: center;
            text-shadow: 0 0 5px #fff, 0 0 12px #fff, 0 0 25px var(--neon-base), 0 0 50px var(--neon-base), 0 0 90px var(--neon-base);
        }
        .colon { animation: blink 1s step-end infinite; margin: 0 12px; transform: translateY(-6px); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .system-info {
            display: flex; justify-content: space-between; margin-top: 18px; font-size: 1.3rem;
            font-weight: bold; color: var(--neon-base); text-shadow: 0 0 10px var(--neon-base);
            text-transform: uppercase; letter-spacing: 2.5px;
        }
        .sys-badge {
            background: var(--neon-base); color: #000; padding: 5px 14px; font-size: 0.95rem;
            clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
            font-weight: 900; box-shadow: 0 0 18px var(--neon-base); display: flex; align-items: center; text-shadow: none;
        }
        .water-ripples {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 35vh;
            backdrop-filter: blur(5px) contrast(1.2); -webkit-backdrop-filter: blur(5px) contrast(1.2);
            background: repeating-linear-gradient(180deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.35) 5px);
            z-index: 10; pointer-events: none; animation: rippleMove 5s infinite alternate ease-in-out;
        }
        @keyframes rippleMove { 0% { background-position: 0 0; } 100% { background-position: 0 18px; } }
        .glitch-effect { animation: cyberGlitch 4.5s infinite; }
        @keyframes cyberGlitch {
            0%, 2%, 4%, 100% { transform: translate(0); opacity: 1; filter: contrast(1); }
            1% { transform: translate(-5px, 2px); opacity: 0.85; filter: contrast(1.6) hue-rotate(-25deg); }
            3% { transform: translate(5px, -2px); opacity: 0.9; filter: contrast(1.6) hue-rotate(25deg); text-shadow: -5px 0 red, 5px 0 blue; }
        }
        .scan-bar {
            position: absolute; top: 0; left: 0; width: 100%; height: 6px;
            background: rgba(255, 255, 255, 0.7); opacity: 0.35; animation: scan 3.5s linear infinite; box-shadow: 0 0 18px rgba(255,255,255,0.9);
        }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .crt-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
            z-index: 20; background-size: 100% 3px; pointer-events: none; opacity: 0.45;
        }
        @media (max-width: 768px) {
            .clock-display { font-size: 3.4rem; letter-spacing: 2px; }
            .cyber-frame { padding: 25px 20px; }
            .system-info { font-size: 0.85rem; flex-direction: column; align-items: center; gap: 12px; }
            .floor-area, .water-ripples { height: 40vh; }
            .clock-wrapper { bottom: 40vh; }
        }
      `}} />

      <div id="cyber-scene">
        <div className="cursor-dot"></div>
        <div className="cursor-outline"></div>

        <div className="brick-texture"></div>
        <div className="brick-illumination"></div>
        <div className="brick-glow-core"></div>

        <div className="floor-area"></div>

        <div className="clock-wrapper">
          <div className="cyber-frame glitch-effect" id="glitch-target">
            <div className="scan-bar"></div>

            <div className="clock-display">
              <span id="hours">00</span>
              <span className="colon">:</span>
              <span id="minutes">00</span>
              <span className="colon">:</span>
              <span id="seconds">00</span>
            </div>

            <div className="system-info">
              <div className="date-display" id="date">SYS.DATE: // 2077.01.01</div>
              <div className="sys-badge" id="timezone-badge">TZ: // CALC...</div>
            </div>
          </div>
        </div>

        <div className="water-ripples"></div>
        <div className="crt-overlay"></div>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 100,
            background: 'transparent',
            border: '1px solid var(--neon-base)',
            color: 'var(--neon-base)',
            padding: '8px 16px',
            fontFamily: '"Share Tech Mono", monospace',
            cursor: 'none'
          }}
        >
          {isLoggingOut ? 'DISCONNECTING...' : 'LOG OUT'}
        </button>
      </div>
    </>
  );
}
