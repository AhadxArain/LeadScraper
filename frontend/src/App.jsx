import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import BottomNavBar from "./components/BottomNavBar";
import AllLeadsTab from "./components/AllLeadsTab";
import LiveFeedTab from "./components/LiveFeedTab";
import LeadDetailsModal from "./components/LeadDetailsModal";
import AddLeadModal from "./components/AddLeadModal";
import CallOverlay from "./components/CallOverlay";
import ToastContainer from "./components/ToastContainer";
import ScrapeLeadsPage from "./components/ScrapeLeadsPage";
import Header from "./components/Header";

export default function App() {
  const [activeTab, setActiveTab] = useState("leads"); // "leads" or "feed"

  // App primary CRM collections
  const [leads, setLeads] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);

  // Active details / drawers
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  // Alerts state
  const [toasts, setToasts] = useState([]);
  const [unreadFeedCount, setUnreadFeedCount] = useState(2);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [readEvents, setReadEvents] = useState(new Set(["feed-1", "feed-2", "feed-3"]));

  const handleMarkEventRead = (eventId) => {
    setReadEvents(prev => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
  };

  // Background Live CRM Event Simulator Ticker
  useEffect(() => {
    const liveSimulation = setInterval(() => {
      const names = ["Diana Prince", "Bruce Wayne", "Clark Kent", "Barry Allen", "Hal Jordan"];
      const zips = ["90210", "10021", "33139", "77002", "30303"];
      const actions = [
        { action: "Submitted Solar Form", icon: "assignment", urgent: true },
        { action: "Clicked Price Quote", icon: "calculate", urgent: false },
        { action: "Opened Outreach Email", icon: "mail", urgent: true },
        { action: "Scheduled Consultation", icon: "calendar_month", urgent: true }
      ];

      const rName = names[Math.floor(Math.random() * names.length)];
      const rZip = zips[Math.floor(Math.random() * zips.length)];
      const rAct = actions[Math.floor(Math.random() * actions.length)];
      const cleanName = rName.toLowerCase().replace(" ", ".");

      const newEvent = {
        id: "feed-sim-" + Date.now(),
        leadName: rName,
        action: rAct.action,
        icon: rAct.icon,
        timestamp: Date.now(),
        phone: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        zip: rZip,
        email: `${cleanName}@galaxyprospect.com`,
        isUrgent: rAct.urgent
      };

      // Add to feed list & increase navbar unread badges
      setFeedEvents(prev => [newEvent, ...prev]);
      setUnreadFeedCount(prev => prev + 1);

      // Trigger toaster alert slider
      const newToast = {
        id: "toast-" + Date.now(),
        leadName: newEvent.leadName,
        phone: newEvent.phone,
        action: newEvent.action
      };
      setToasts(prev => [newToast, ...prev]);

      // Automatically clear toast after 8 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 8000);

    }, 22000); // Trigger every 22 seconds

    return () => clearInterval(liveSimulation);
  }, []);

  // Sync feed view click and mark notifications read
  useEffect(() => {
    if (activeTab === "feed") {
      setUnreadFeedCount(0);
    }
  }, [activeTab]);

  // Lead insertion handling
  const handleAddLead = (newLead) => {
    setLeads(prev => [newLead, ...prev]);

    // Create a matching feed alert that a new lead was scraped/added
    const newFeedItem = {
      id: "feed-add-" + Date.now(),
      leadName: newLead.name,
      action: "Lead Ingested",
      icon: "person_add",
      timestamp: Date.now(),
      phone: newLead.phone,
      zip: newLead.zip,
      email: newLead.email,
      isUrgent: false
    };
    setFeedEvents(prev => [newFeedItem, ...prev]);
  };

  const handleImportLeads = (leadsToImport) => {
    const newCRMLeads = leadsToImport.map(l => ({
      id: "lead-scraped-" + l.id + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      name: l.name,
      zip: l.zip,
      businessType: l.businessType,
      phone: l.phone,
      email: l.email,
      status: "New",
      dateAdded: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    }));

    setLeads(prev => [...newCRMLeads, ...prev]);

    newCRMLeads.forEach(lead => {
      const newFeedItem = {
        id: "feed-import-" + lead.id,
        leadName: lead.name,
        action: "Lead Imported",
        icon: "person_add",
        timestamp: Date.now(),
        phone: lead.phone,
        zip: lead.zip,
        email: lead.email,
        isUrgent: false
      };
      setFeedEvents(prev => [newFeedItem, ...prev]);
    });

    setUnreadFeedCount(prev => prev + newCRMLeads.length);

    const newToast = {
      id: "toast-import-" + Date.now(),
      leadName: `${newCRMLeads.length} Lead(s)`,
      phone: "Scraper Ingest",
      action: "Imported successfully"
    };
    setToasts(prev => [newToast, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 8000);
  };

  // Status updates mapping
  const handleUpdateStatus = (leadId, nextStatus) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: nextStatus } : lead));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: nextStatus }));
    }
  };

  // Dialing simulation controllers
  const handleStartCall = (caller) => {
    setActiveCall(caller);
  };

  const handleHangUp = () => {
    if (!activeCall) return;

    // Add call log trace into CRM live activity feed
    const callLogItem = {
      id: "feed-call-" + Date.now(),
      leadName: activeCall.leadName || activeCall.name,
      action: "Completed Call Simulation",
      icon: "phone_callback",
      timestamp: Date.now(),
      phone: activeCall.phone,
      zip: activeCall.zip || "N/A",
      email: activeCall.email,
      isUrgent: false
    };

    setFeedEvents(prev => [callLogItem, ...prev]);
    setActiveCall(null);
  };

  // Load More paging trigger
  const handleLoadMore = () => {
    // Create random leads if exhausted
    const randomId = Date.now();
    const rLead = {
      id: "lead-rnd-" + randomId,
      name: "Peter Parker",
      zip: "11375",
      businessType: "Solar",
      phone: "(555) 929-8800",
      email: "spidey@dailybugle.net",
      status: "New",
      dateAdded: "Oct 17, 2023"
    };
    setLeads(prev => [...prev, rLead]);
  };

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="bg-[#f7f9fc] text-brand-900 h-screen flex flex-col font-sans antialiased overflow-hidden">

      <div className="flex flex-1 relative w-full h-full overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCount={unreadFeedCount}
          onTriggerScrape={() => setIsAddModalOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
        />

        {/* Top Header Bar */}
        <div
          style={{ left: sidebarWidth }}
          className="fixed top-0 right-0 z-30 transition-all duration-300">
          <Header
            onOpenSidebar={() => {
              if (window.innerWidth >= 1024) {
                setCollapsed(!collapsed);
              } else {
                setMobileOpen(true);
              }
            }}
            onProfileClick={() => setProfileOpen(true)}
            isSidebarOpen={mobileOpen}
            collapsed={collapsed}
            activeTab={activeTab}
            unreadCount={unreadFeedCount}
          />
        </div>

        {/* Main Viewport Content canvas */}
        <main
          style={{ marginLeft: sidebarWidth }}
          className="flex-1 flex flex-col min-h-screen bg-[#f7f9fc] transition-all duration-300 pt-14 pb-8 overflow-y-auto">
          {activeTab === "leads" ? (
            <AllLeadsTab
              leads={leads}
              onLoadMore={handleLoadMore}
              onViewLead={(lead) => setSelectedLead(lead)}
              onTriggerScrape={() => setIsAddModalOpen(true)}
            />
          ) : activeTab === "scrape" ? (
            <ScrapeLeadsPage
              onImportLeads={handleImportLeads}
            />
          ) : (
            <LiveFeedTab
              feedEvents={feedEvents}
              onStartCall={handleStartCall}
              readEvents={readEvents}
              onMarkRead={handleMarkEventRead}
            />
          )}
        </main>
      </div>

      {/* Sleek, Full-Width Colored Footer - Fixed at bottom */}
      <footer
        style={{ left: sidebarWidth }}
        className="fixed bottom-[56px] lg:bottom-0 right-0 h-[32px] flex items-center justify-center bg-white z-20 border-t border-gray-200 select-none transition-all duration-300">
        <p className="text-[9px] tracking-widest uppercase text-gray-400 font-medium">
          powered by{" "}
          <a href="http://scalecarepros.com" target="_blank" rel="noopener noreferrer"
            className="text-[#507CA9] font-bold hover:text-[#042558] transition-colors">
            SCALECAREPROS
          </a>
        </p>
      </footer>

      {/* Sticky Mobile Bottom Navigation Panel */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadFeedCount}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* Overlay & Drawers Layer */}

      {/* 1. Lead details side-slide drawer panel */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
        onStartCall={handleStartCall}
      />

      {/* 2. Automated scraper/manual add lead input modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLead={handleAddLead}
      />

      {/* 3. Outbound dialer phone overlay dialog */}
      <CallOverlay
        activeCall={activeCall}
        onClose={handleHangUp}
      />

      {/* 4. Real-time toaster alerts slider queue */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        onTriggerCall={handleStartCall}
      />

      {/* 5. Sleek account profile popup modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-darkest/60 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-brand-lightest shadow-lg z-10 text-center flex flex-col items-center gap-4 animate-fade-in relative">
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-brand-lightest/30 rounded-full text-brand-light hover:text-brand-darkest"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-mid shadow-md">
              <img
                alt="Account profile avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0x93zSg5Rcht4NoHtVmu-7Rz49wbhClR3cxqv7WC-7CO8ZeDyI7-1QDYF3okB2pORlP-iRyIlJVDBx1BewrWIBLjFmrFjYxgQJY8jpXq7sOPtvlna9msnvyvPcR7kvPoxDln-fG2w5sdLtK2rxd2fkfPbwimTrbOCvRuB9_Etg6Mc3f6AuRaP1001lqBI-6BMAdqO7fELy8FLgjgkn56EMtbVmu_EadzLch5za0f55Qd4WxWs-lq79doRCB7uTD6DeJaHVDq86hmk"
              />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-brand-darkest">Alex Mercer</h3>
              <p className="text-[12px] text-brand-mid tracking-wide uppercase mt-0.5 font-medium">Senior Sales Director</p>
              <p className="text-[12px] text-brand-light mt-1 select-all font-mono">alex.mercer@energycenterusa.com</p>
            </div>

            {/* Account statistics */}
            <div className="grid grid-cols-2 gap-4 w-full bg-brand-lightest/20 p-4 rounded-xl border border-brand-lightest my-1 text-brand-dark text-[12px]">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-light">Leads Closed</span>
                <span className="text-[24px] font-extrabold text-brand-dark">142</span>
              </div>
              <div className="flex flex-col border-l border-brand-lightest pl-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-light">Conversion</span>
                <span className="text-[24px] font-extrabold text-brand-dark">38.4%</span>
              </div>
            </div>

            <button
              onClick={() => setProfileOpen(false)}
              className="w-full py-2 bg-brand-dark text-white rounded-lg text-[14px] font-bold hover:bg-brand-mid active:scale-95 transition-all shadow-sm mt-2"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
