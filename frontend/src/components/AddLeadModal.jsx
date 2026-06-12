import React, { useState } from "react";

export default function AddLeadModal({ isOpen, onClose, onAddLead }) {
  if (!isOpen) return null;

  // Manual form states
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [businessType, setBusinessType] = useState("HVAC");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("New");

  // Local validation state
  const [submitted, setSubmitted] = useState(false);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !email) return;

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const newLead = {
      id: "lead-" + Date.now(),
      name,
      zip: zip || "90210",
      businessType,
      phone,
      email,
      status,
      dateAdded: dateStr
    };

    onAddLead(newLead);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setZip("");
    setBusinessType("HVAC");
    setPhone("");
    setEmail("");
    setStatus("New");
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClassName = `w-full bg-white border border-brand-400 rounded-lg px-4 py-3 text-md text-brand-900 outline-none transition-all duration-150 focus:border-brand-800 focus:ring-2 focus:ring-brand-100/50`;
  const labelClassName = `text-[11px] uppercase tracking-widest text-brand-600 font-medium mb-[6px] block`;

  return (
    <>
      <style>{`
        @keyframes customScaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-custom-scale-in {
          animation: customScaleIn 200ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes customSlideUpMobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-custom-slide-up-mobile {
          animation: customSlideUpMobile 250ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex justify-center items-start p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-[#000F22]/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Card */}
        <div className="fixed inset-x-0 bottom-0 rounded-t-2xl rounded-b-none max-w-full animate-custom-slide-up-mobile max-h-[90vh] md:relative md:inset-auto md:bottom-auto md:rounded-2xl md:max-w-[520px] md:animate-custom-scale-in md:mx-auto md:mt-16 md:max-h-[calc(100vh-100px)] flex flex-col bg-white border border-brand-100 shadow-lg p-6 sm:p-8 z-10 overflow-y-auto">
          
          {/* Mobile Drag Handle */}
          <div className="w-[32px] h-[4px] bg-[#C2E8FF] rounded-full mx-auto mt-1 mb-4 md:hidden shrink-0" />

          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 md:top-5 md:right-5 w-11 h-11 md:w-[28px] md:h-[28px] text-brand-400 hover:text-brand-900 hover:bg-brand-100/50 rounded-md transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <h2 className="text-[18px] font-bold text-brand-900 mb-6 select-none">Manual Lead Intake</h2>

          {/* Content */}
          <div className="flex-1">
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className={labelClassName}>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className={`${inputClassName} ${submitted && !name ? "border-[#EF4444]" : ""}`}
                />
                {submitted && !name && <span className="text-xs text-[#EF4444] mt-1">Full Name is required</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className={labelClassName}>ZIP Code</label>
                  <input 
                    type="text" 
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="90210"
                    maxLength={5}
                    className={inputClassName}
                  />
                </div>
                <div className="flex flex-col">
                  <label className={labelClassName}>Business Type</label>
                  <div className="relative">
                    <select 
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className={`appearance-none cursor-pointer pr-10 ${inputClassName}`}
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="Solar">Solar</option>
                      <option value="Retail">Retail</option>
                      <option value="Tech">Tech</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 text-[20px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className={labelClassName}>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 012-3456"
                  className={`${inputClassName} ${submitted && !phone ? "border-[#EF4444]" : ""}`}
                />
                {submitted && !phone && <span className="text-xs text-[#EF4444] mt-1">Phone Number is required</span>}
              </div>

              <div className="flex flex-col">
                <label className={labelClassName}>Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className={`${inputClassName} ${submitted && !email ? "border-[#EF4444]" : ""}`}
                />
                {submitted && !email && <span className="text-xs text-[#EF4444] mt-1">Email Address is required</span>}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 mt-[32px]">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="w-full md:w-auto px-[20px] py-[10px] min-h-[44px] md:min-h-0 border border-brand-400 text-brand-800 hover:bg-brand-100 rounded-lg text-md transition-colors font-medium cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  onClick={() => setSubmitted(true)}
                  className="w-full md:w-auto px-[20px] py-[10px] min-h-[44px] md:min-h-0 bg-brand-800 text-white hover:bg-brand-600 active:scale-95 rounded-lg text-md font-medium transition-all cursor-pointer flex items-center justify-center"
                >
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
