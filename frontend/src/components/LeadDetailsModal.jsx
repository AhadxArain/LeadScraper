import React, { useState } from "react";

export default function LeadDetailsModal({ lead, isOpen, onClose, onUpdateStatus, onStartCall }) {
  if (!isOpen || !lead) return null;

  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState(lead.notes || [
    { text: "Initial contact attempt successful. Left VM.", date: "Oct 24, 2023 10:15 AM", user: "You" },
    { text: "Assigned lead to general marketing queue.", date: "Oct 24, 2023 09:00 AM", user: "System" }
  ]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const dateStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    setNotes([{ text: newNote, date: dateStr, user: "You" }, ...notes]);
    setNewNote("");
  };

  // Status Dot & Text Colors
  const getStatusStyle = (status) => {
    const s = status.toLowerCase();
    if (s === "new") return { dot: "#507CA9", text: "#042558" };
    if (s === "contacted") return { dot: "#D97706", text: "#B45309" };
    if (s === "qualified") return { dot: "#16A34A", text: "#15803D" };
    if (s === "closed") return { dot: "#7E9FC8", text: "#7E9FC8" };
    return { dot: "#7E9FC8", text: "#7E9FC8" };
  };

  // Type Badge Colors
  const getTypeColor = (type) => {
    return "border-brand-600 text-brand-800 bg-brand-100/30";
  };

  const STATUSES = ["New", "Contacted", "Qualified", "Closed"];

  const sectionLabelClass = "text-[11px] uppercase tracking-widest text-brand-600 font-semibold mb-[12px] block";

  return (
    <>
      <style>{`
        @keyframes customSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-custom-slide-in-right {
          animation: customSlideInRight 220ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes customSlideUpMobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-custom-slide-up-mobile {
          animation: customSlideUpMobile 250ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>
      
      <div className="fixed inset-0 z-[60] flex justify-end">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-[#000F22]/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Drawer Shell */}
        <div 
          className="fixed inset-x-0 bottom-0 h-[90vh] rounded-t-2xl w-full bg-white flex flex-col z-10 animate-custom-slide-up-mobile md:inset-y-0 md:right-0 md:top-0 md:h-full md:w-[360px] md:rounded-none md:animate-custom-slide-in-right md:bottom-auto md:inset-x-auto lg:w-[420px] border-l border-brand-100 shadow-lg"
          style={{ boxShadow: '-4px 0 40px rgba(0,0,0,0.12)' }}
        >
          
          {/* Mobile Drag Handle */}
          <div className="w-[32px] h-[4px] bg-[#C2E8FF] rounded-full mx-auto mt-3 md:hidden shrink-0" />
          
          {/* Header */}
          <div className="p-[24px] border-b border-brand-100 bg-white shrink-0 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-5 md:right-5 w-11 h-11 md:w-[28px] md:h-[28px] text-brand-400 hover:text-brand-900 hover:bg-brand-100/50 rounded-md transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex items-center justify-between pr-[36px]">
              <h2 className="text-[18px] font-bold text-brand-900 leading-tight truncate mr-2">{lead.name}</h2>
              <div className="flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: getStatusStyle(lead.status).dot }}></span>
                <span className="text-sm capitalize font-semibold" style={{ color: getStatusStyle(lead.status).text }}>{lead.status}</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Contact Info */}
            <div className="p-[24px] border-b border-brand-100">
              <span className={sectionLabelClass}>Contact Info</span>
              <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[12px]">
                  <span className="material-symbols-outlined text-[16px] text-brand-600">call</span>
                  <span className="text-md text-brand-900">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-[12px] break-all">
                  <span className="material-symbols-outlined text-[16px] text-brand-600">mail</span>
                  <span className="text-md text-brand-900">{lead.email}</span>
                </div>
                <div className="flex items-center gap-[12px]">
                  <span className="material-symbols-outlined text-[16px] text-brand-600">location_on</span>
                  <span className="text-md text-brand-900">{lead.zip || "No ZIP provided"}</span>
                </div>
              </div>
            </div>
            
            {/* Lead Details */}
            <div className="p-[24px] border-b border-brand-100">
              <span className={sectionLabelClass}>Lead Details</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-brand-400 block mb-2 font-medium">Business Type</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border-[1px] text-[12px] font-medium ${getTypeColor(lead.businessType)}`}>
                    {lead.businessType}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-brand-400 block mb-2 font-medium">Date Added</span>
                  <span className="text-md font-semibold text-brand-900 block mt-1.5">{lead.dateAdded}</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Updater */}
            <div className="p-[24px] border-b border-brand-100">
              <span className={sectionLabelClass}>Pipeline Stage</span>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map(s => {
                  const isActive = lead.status.toLowerCase() === s.toLowerCase();
                  return (
                    <button 
                      key={s} 
                      onClick={() => onUpdateStatus(lead.id, s)}
                      className={`flex-1 min-w-[80px] md:flex-initial md:min-w-0 rounded-lg px-4 py-2 text-[13px] transition-all duration-[120ms] border-[1.5px] cursor-pointer ${
                        isActive 
                          ? "bg-brand-800 text-white border-transparent font-semibold" 
                          : "bg-white border-brand-400 text-brand-800 hover:border-brand-800 hover:text-brand-900"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-[24px]">
              <span className={sectionLabelClass}>Notes Log</span>
              
              <form onSubmit={handleAddNote} className="flex flex-col">
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full border-[1.5px] border-brand-400 rounded-lg px-4 py-3 text-md text-brand-900 resize-none h-[80px] outline-none focus:ring-2 focus:ring-brand-100/50 focus:border-brand-800 transition-all placeholder-brand-400"
                />
                <div className="flex justify-end mt-2">
                  <button 
                    type="submit"
                    disabled={!newNote.trim()}
                    className="text-brand-800 text-[13px] font-medium bg-transparent hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed px-1 cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {notes.length > 0 && (
                <div className="flex flex-col gap-3 mt-4">
                  {notes.map((note, index) => (
                    <div key={index} className="bg-brand-100/30 rounded-[10px] p-3 relative">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-brand-900">{note.user}</span>
                        <span className="text-[11px] text-brand-400 absolute top-3 right-3">{note.date}</span>
                      </div>
                      <p className="text-sm text-brand-800 leading-relaxed pr-[80px] sm:pr-[120px] md:pr-0">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-[16px_24px] border-t border-brand-100 bg-white shrink-0">
            <button 
              onClick={() => {
                onStartCall(lead);
                onClose();
              }}
              className="w-full bg-brand-800 text-white hover:bg-brand-600 active:scale-95 rounded-lg py-[12px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              Call Now
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}
