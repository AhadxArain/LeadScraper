import React, { useState, useEffect } from "react";

// Utility: compute a human-friendly relative time string from a timestamp
function getRelativeTime(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffHr === 1) return "1 hour ago";
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return "1 day ago";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay === 7) return "7 days ago";

  const weeks = Math.floor(diffDay / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

// Utility: format a timestamp as a readable date-time string
function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveFeedTab({ feedEvents, onStartCall, readEvents, onMarkRead }) {
  const [filterMode, setFilterMode] = useState("all"); // "all" or "urgent"
  const [, setTick] = useState(0); // force re-render for relative time updates

  // Re-render every 30 seconds so relative times stay fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Events logic
  const filteredEvents = feedEvents ? feedEvents.filter(e => {
    if (filterMode === "urgent") {
      return e.isUrgent;
    }
    return true;
  }) : [];

  const isLoading = !feedEvents; // Trigger skeleton state if data is missing

  const getEventColors = (event) => {
    if (event.isUrgent) {
      return { border: "#DC2626", bg: "rgba(220, 38, 38, 0.12)", text: "#DC2626" };
    }
    const action = event.action.toLowerCase();
    if (action.includes("scheduled") || action.includes("consultation")) {
      return { border: "#16A34A", bg: "rgba(22, 163, 74, 0.12)", text: "#16A34A" };
    }
    if (action.includes("opened") || action.includes("email")) {
      return { border: "#507CA9", bg: "rgba(80, 124, 169, 0.12)", text: "#507CA9" };
    }
    if (action.includes("clicked") || action.includes("quote")) {
      return { border: "#D97706", bg: "rgba(217, 119, 6, 0.12)", text: "#D97706" };
    }
    return { border: "#507CA9", bg: "rgba(80, 124, 169, 0.12)", text: "#507CA9" };
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-6 lg:p-8 pb-28 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-400 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-brand-900">Live Feed</h1>
          <div className="w-[8px] h-[8px] rounded-full bg-brand-600 relative">
            <div className="absolute -inset-[3px] rounded-full border-[3px] border-brand-600/40 animate-pulse"></div>
          </div>
        </div>
        
        {/* Toggle Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilterMode("all")}
            className={`flex-1 sm:flex-initial text-center transition-all cursor-pointer ${
              filterMode === "all" 
                ? "bg-brand-800 text-white rounded-lg px-4 py-2.5 text-md font-medium shadow-sm active:scale-95" 
                : "border border-brand-400 text-brand-800 hover:bg-brand-100 rounded-lg px-4 py-2.5 text-md font-medium"
            }`}
          >
            All Alerts
          </button>
          <button 
            onClick={() => setFilterMode("urgent")}
            className={`flex-1 sm:flex-initial text-center transition-all cursor-pointer ${
              filterMode === "urgent" 
                ? "bg-brand-800 text-white rounded-lg px-4 py-2.5 text-md font-medium shadow-sm active:scale-95" 
                : "border border-brand-400 text-brand-800 hover:bg-brand-100 rounded-lg px-4 py-2.5 text-md font-medium"
            }`}
          >
            Urgent
          </button>
        </div>
      </div>

      {/* Feed Container Stream */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          /* Skeleton Loading State */
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-brand-100 p-4 sm:py-[20px] sm:px-[24px] flex flex-col gap-4 relative overflow-hidden shadow-sm">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-[4px] bg-brand-100"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-32 h-5 bg-brand-100 rounded"></div>
                  <div className="w-24 h-5 bg-brand-100 rounded-full"></div>
                </div>
                <div className="w-16 h-4 bg-brand-100 rounded"></div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mt-2">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="w-28 h-4 bg-brand-100 rounded"></div>
                  <div className="w-20 h-4 bg-brand-100 rounded"></div>
                  <div className="w-40 h-4 bg-brand-100 rounded"></div>
                </div>
                <div className="w-28 h-9 bg-brand-100 rounded-[8px]"></div>
              </div>
            </div>
          ))
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const colors = getEventColors(event);
            return (
              <div 
                key={event.id}
                onClick={() => onMarkRead && onMarkRead(event.id)}
                className="bg-white rounded-xl border border-brand-100 p-4 sm:py-[20px] sm:px-[24px] cursor-pointer flex flex-col gap-4 relative transition-all duration-150 ease-out hover:-translate-y-[1px] shadow-sm hover:shadow-md hover:border-brand-400"
              >
                {/* Left Accent Bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-[4px]"
                  style={{ backgroundColor: colors.border }}
                ></div>

                {/* Top Row */}
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                    <h3 className="text-md font-semibold text-brand-900 leading-tight">{event.leadName}</h3>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 self-start sm:self-auto"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {event.icon || "mail"}
                      </span>
                      {event.action}
                    </span>
                  </div>
                  <span 
                    className="text-xs text-brand-400 whitespace-nowrap cursor-help text-right"
                    title={formatDateTime(event.timestamp)}
                  >
                    {getRelativeTime(event.timestamp)}
                  </span>
                </div>

                {/* Bottom Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-md text-brand-800">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      <span className="truncate max-w-[180px] md:max-w-none">{event.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="truncate max-w-[180px] md:max-w-none">{event.zip}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                      <span className="truncate max-w-[180px] md:max-w-none">{event.email}</span>
                    </div>
                  </div>
                  
                  {/* Call Now Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStartCall(event); }}
                    className={`bg-brand-800 hover:bg-brand-600 text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-md font-medium shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer w-full sm:w-auto min-h-[44px] sm:min-h-0 ${
                      event.isUrgent ? "call-pulse" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    Call Now
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-brand-400 mb-4">notifications_off</span>
            <h3 className="text-[16px] font-medium text-brand-900 mb-1">No alerts right now</h3>
            <p className="text-[14px] text-brand-800">Check back soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
