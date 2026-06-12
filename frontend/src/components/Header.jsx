import React from "react";

export default function Header({ onOpenSidebar, onProfileClick, isSidebarOpen, collapsed, activeTab, unreadCount }) {
  const tabLabels = {
    feed: "Live Feed",
    leads: "Prospects",
    scrape: "Lead Scraper",
  };

  return (
    <header className="sticky top-0 z-40 bg-white h-14 flex justify-between items-center
      px-6 lg:px-8 border-b border-gray-200 select-none shadow-sm">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-100 hover:text-[#042558] transition-all duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? "left_panel_open" : "left_panel_close"}
          </span>
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <h2 className="font-semibold text-[15px] text-[#000F22] tracking-tight">
          {tabLabels[activeTab] || "Dashboard"}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg
          text-[#7E9FC8] hover:bg-gray-100 hover:text-[#042558] transition-colors">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <button onClick={onProfileClick}
          className="w-8 h-8 rounded-full bg-[#042558] text-white flex items-center justify-center text-xs font-bold hover:bg-[#507CA9] transition-colors">
          AM
        </button>
      </div>
    </header>
  );
}