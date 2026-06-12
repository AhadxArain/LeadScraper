import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar({
  mobileOpen, setMobileOpen, collapsed, setCollapsed,
  activeTab, setActiveTab, unreadCount, onProfileClick
}) {
  const navItems = [
    { tab: "feed", icon: "sensors", label: "Live Feed" },
    { tab: "leads", icon: "groups", label: "Prospects" },
    { tab: "scrape", icon: "troubleshoot", label: "Scrape Leads" },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 h-full z-50 flex flex-col bg-[#000F22] transition-all duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}
        w-[240px]`}
      >
        {/* Brand Header */}
        <div className={`h-14 px-5 flex items-center gap-3 border-b border-gray-100/10 shrink-0
          ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <div className="w-10 h-10 bg-[#042558] rounded-lg flex items-center justify-center shrink-0 border border-[#507CA9]/20">
            <span className="material-symbols-outlined text-[#C2E8FF] text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <div className={`overflow-hidden ${collapsed ? "lg:hidden" : ""}`}>
            <h1 className="font-bold text-[15px] text-white leading-tight tracking-tight whitespace-nowrap">EnergyCenterUSA</h1>
            <p className="text-[9px] text-[#507CA9]/60 tracking-widest uppercase mt-0.5">Expert Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMobileOpen(false); }}
                title={collapsed ? label : ""}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-150 group
                  ${collapsed ? "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:mx-auto" : ""}
                  ${isActive
                    ? "bg-[#042558]/20 text-white active-tab-accent"
                    : "text-[#7E9FC8] hover:bg-[#042558]/10 hover:text-white"
                  }`}
                style={isActive ? { boxShadow: "inset 4px 0 0 0 #C2E8FF" } : {}}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0"
                  style={isActive ? { fontVariationSettings: "'FILL' 1", color: "#C2E8FF" } : {}}>
                  {icon}
                </span>
                <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
                {tab === "feed" && unreadCount > 0 && (
                  <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full
                    ${collapsed ? "lg:hidden" : ""}`}>
                    {unreadCount}
                  </span>
                )}
                {tab === "feed" && unreadCount > 0 && collapsed && (
                  <span className="hidden lg:block absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#000F22]" />
                )}
                {/* Tooltip */}
                {collapsed && (
                  <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-[#042558] text-white text-xs font-medium rounded-lg
                    whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none border border-[#507CA9]/30 z-50 transition-opacity">
                    {label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Nav */}
        <div className="px-3 border-t border-white/5 pt-3 space-y-1">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium text-[#7E9FC8] hover:bg-red-500/10 hover:text-red-400 transition-all
              ${collapsed ? "lg:justify-center lg:px-0 lg:w-10 lg:h-10 lg:mx-auto" : ""}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>Log Out</span>
          </button>
        </div>



        {/* Profile Block */}
        <div onClick={onProfileClick}
          className={`mx-3 mb-3 p-4 rounded-xl bg-[#042558]/10 flex items-center gap-3 cursor-pointer hover:bg-[#042558]/20 transition-colors border border-white/5
            ${collapsed ? "lg:mx-0 lg:rounded-none lg:border-0 lg:justify-center" : ""}`}>
          <div className="relative shrink-0">
            <img alt="Alex Mercer"
              className="w-10 h-10 rounded-full border border-white/10 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0x93zSg5Rcht4NoHtVmu-7Rz49wbhClR3cxqv7WC-7CO8ZeDyI7-1QDYF3okB2pORlP-iRyIlJVDBx1BewrWIBLjFmrFjYxgQJY8jpXq7sOPtvlna9msnvyvPcR7kvPoxDln-fG2w5sdLtK2rxd2fkfPbwimTrbOCvRuB9_Etg6Mc3f6AuRaP1001lqBI-6BMAdqO7fELy8FLgjgkn56EMtbVmu_EadzLch5za0f55Qd4WxWs-lq79doRCB7uTD6DeJaHVDq86hmk"
            />
          </div>
          <div className={`flex-1 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-white font-semibold text-[13px] truncate leading-tight">Alex Mercer</p>
            <p className="text-[#7E9FC8] text-[10px] truncate mt-0.5">Senior Director</p>
          </div>

        </div>
      </aside>
    </>
  );
}