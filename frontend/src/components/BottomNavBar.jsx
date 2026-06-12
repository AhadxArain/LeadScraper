import React from "react";

export default function BottomNavBar({ activeTab, setActiveTab, unreadCount, onProfileClick }) {
  const navItems = [
    { tab: "feed", icon: "sensors", label: "Feed" },
    { tab: "leads", icon: "groups", label: "Prospects" },
    { tab: "scrape", icon: "troubleshoot", label: "Scrape" },
    { tab: "settings", icon: "settings", label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-[#000F22] border-t border-[#507CA9]/20 shadow-lg px-4 py-2 flex justify-around items-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {navItems.map(({ tab, icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => tab !== "settings" ? setActiveTab(tab) : onProfileClick?.()}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 active:scale-95 min-w-[56px]
              ${isActive
                ? "bg-[#042558] text-white scale-95"
                : "text-[#7E9FC8] hover:text-white"
              }`}
          >
            <div className="relative">
              <span className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
              </span>
              {tab === "feed" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full border border-[#000F22]" />
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}