import React, { useEffect, useRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export default function ToastContainer({ toasts, onDismiss, onTriggerCall }) {
  const prevToastsLength = useRef(0);

  useEffect(() => {
    if (toasts.length > prevToastsLength.current) {
      // Play a unique and attractive notification chime using Web Audio API
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const masterGain = ctx.createGain();
          masterGain.gain.value = 0.2; // subtle volume
          masterGain.connect(ctx.destination);

          const playNote = (freq, startTime, duration) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            // Blend sine and triangle for a warm, marimba/bell-like tone
            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.value = freq;
            osc2.frequency.value = freq;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(masterGain);

            // Percussive envelope
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(1, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + duration);
            osc2.stop(startTime + duration);
          };

          const now = ctx.currentTime;
          // Play a quick, attractive upward chord (G5, C6, E6)
          playNote(783.99, now, 0.3);        // G5
          playNote(1046.50, now + 0.1, 0.4); // C6
          playNote(1318.51, now + 0.2, 0.6); // E6
        }
      } catch (e) {
        console.log("Audio play blocked or not supported:", e);
      }
    }
    prevToastsLength.current = toasts.length;
  }, [toasts]);

  if (toasts.length === 0) return null;

  // Helper to map action type to colors and icons
  const getToastStyle = (action = "") => {
    const act = action.toLowerCase();
    if (act.includes("urgent") || act.includes("error")) {
      return { bg: "#FEF2F2", border: "#DC2626", text: "#B91C1C", Icon: XCircle };
    }
    if (act.includes("success") || act.includes("scheduled") || act.includes("consultation") || act.includes("ingested")) {
      return { bg: "#F0FDF4", border: "#16A34A", text: "#15803D", Icon: CheckCircle };
    }
    if (act.includes("warning") || act.includes("clicked") || act.includes("quote")) {
      return { bg: "#FFFBEB", border: "#D97706", text: "#B45309", Icon: AlertTriangle };
    }
    return { bg: "#EFF6FF", border: "#507CA9", text: "#042558", Icon: Info };
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-toast-slide-in {
          animation: toastSlideIn 200ms ease forwards;
        }
      `}</style>
      <div className="fixed top-4 left-4 right-4 md:left-auto md:top-5 md:right-5 z-50 flex flex-col gap-1 w-auto md:w-full max-w-none md:max-w-[320px] pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyle(toast.action);
          const IconComponent = styles.Icon;
          
          return (
            <div 
              key={toast.id}
              style={{ backgroundColor: styles.bg, borderLeftColor: styles.border }}
              className="pointer-events-auto bg-white rounded-lg shadow-sm border border-brand-100 px-4 py-3 border-l-[4px] flex items-center justify-between gap-3 animate-toast-slide-in"
            >
              {/* Colored Status Icon */}
              <IconComponent size={18} className="shrink-0" style={{ color: styles.border }} />

              {/* Message Details */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <span className="text-[14px] font-medium leading-tight truncate" style={{ color: styles.text }}>
                  {toast.leadName}
                </span>
                <span className="text-[12px] leading-tight mt-0.5 truncate opacity-90" style={{ color: styles.text }}>
                  {toast.action}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {onTriggerCall && (
                  <button 
                    onClick={() => {
                      onTriggerCall(toast);
                      onDismiss(toast.id);
                    }}
                    className="p-1 hover:bg-black/5 rounded-md transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                    style={{ color: styles.text }}
                    title="Call"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                  </button>
                )}
                <button 
                  onClick={() => onDismiss(toast.id)}
                  className="p-1 hover:bg-black/5 rounded-md transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                  style={{ color: styles.text }}
                  title="Dismiss"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
