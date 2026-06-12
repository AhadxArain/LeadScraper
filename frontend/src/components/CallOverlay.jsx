import React, { useState, useEffect } from "react";

export default function CallOverlay({ activeCall, onClose }) {
  if (!activeCall) return null;

  const [callStatus, setCallStatus] = useState("connecting"); // "connecting" or "active"
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hold, setHold] = useState(false);

  // Connection timer simulation
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus("active");
    }, 1800);

    return () => clearTimeout(connectTimer);
  }, []);

  // Connected seconds ticking timer
  useEffect(() => {
    if (callStatus !== "active") return;

    const tick = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [callStatus]);

  // Helper to format seconds to MM:SS
  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const nameString = activeCall.leadName || activeCall.name || "Unknown";
  const initials = nameString[0]?.toUpperCase() || "?";

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 200ms ease forwards;
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>
      
      <div className="fixed bottom-[80px] right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-[300px] z-[80] bg-white rounded-xl shadow-modal flex flex-col p-6 items-center border border-brand-100 animate-slide-up-fade relative">
        
        {/* Active Call Indicator */}
        <div className="absolute top-5 left-5 w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" title="Active Call"></div>
        
        {/* Top: Avatar & Name */}
        <div className="flex flex-col items-center mt-1">
          <div className="w-[48px] h-[48px] bg-brand-800 text-white rounded-full flex items-center justify-center font-bold text-[20px] shadow-sm select-none">
            {initials}
          </div>
          <h3 className="text-[16px] font-semibold text-brand-900 mt-3 text-center truncate w-full px-2">
            {nameString}
          </h3>
          <p className="text-[12px] text-brand-400 mt-0.5">
            Outbound Call
          </p>
        </div>

        {/* Middle: Timer */}
        <div className="my-5">
          <span className="font-mono text-[24px] text-brand-800 font-medium tracking-tight">
            {callStatus === "connecting" ? "..." : formatTime(seconds)}
          </span>
        </div>

        {/* Bottom: Actions */}
        <div className="flex items-center justify-center gap-5 w-full mt-1">
          {/* Mute Button */}
          <button 
            onClick={() => setMuted(!muted)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              muted 
                ? "bg-brand-100 border-brand-800 text-brand-800 shadow-sm" 
                : "bg-white border-brand-100 text-brand-600 hover:bg-brand-100/30"
            }`}
            title="Mute"
          >
            <span className="material-symbols-outlined text-[20px]">
              {muted ? "mic_off" : "mic"}
            </span>
          </button>

          {/* End Call Button */}
          <div className="relative flex items-center justify-center mx-1">
            <div className="absolute inset-0 rounded-full border-2 border-[#DC2626] animate-pulse-ring pointer-events-none"></div>
            <button 
              onClick={onClose}
              className="relative w-[48px] h-[48px] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all z-10 cursor-pointer"
              title="End Call"
            >
              <span className="material-symbols-outlined text-[24px]">
                call_end
              </span>
            </button>
          </div>

          {/* Hold Button */}
          <button 
            onClick={() => setHold(!hold)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              hold 
                ? "bg-brand-100 border-brand-800 text-brand-800 shadow-sm" 
                : "bg-white border-brand-100 text-brand-600 hover:bg-brand-100/30"
            }`}
            title={hold ? "Resume Call" : "Hold"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {hold ? "play_arrow" : "pause"}
            </span>
          </button>
        </div>
        
      </div>
    </>
  );
}
