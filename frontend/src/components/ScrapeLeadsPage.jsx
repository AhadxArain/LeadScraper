import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Inbox } from "lucide-react";
import { useScraper } from "../hooks/useScraper";

export default function ScrapeLeadsPage({ onImportLeads }) {
  const [zipCode, setZipCode] = useState("");
  const [businessType, setBusinessType] = useState("HVAC");
  const [keyword, setKeyword] = useState("");
  const [requiredLeads, setRequiredLeads] = useState(25);
  const [lastRun, setLastRun] = useState("never");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  const {
    isRunning, isDone, statusMsg, validCount, rejectedCount,
    existingCount, currentPage, progress, leads, error,
    startScrape, stopScrape,
  } = useScraper();

  const webhookStatus = isRunning ? "running" : error ? "error" : isDone ? "complete" : "idle";
  const results = isDone ? leads : null;
  useEffect(() => { setPage(1); }, [isDone]);

  const handleRunScraper = async (e) => {
    e.preventDefault();
    if (!zipCode.trim()) { setFormSubmitted(true); return; }
    setSelectedIds(new Set());
    setLastRun(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
    const query = keyword.trim() ? `${businessType} ${keyword.trim()}` : businessType;
    await startScrape(query, zipCode.trim(), requiredLeads);
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!results) return;
    selectedIds.size === results.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(results.map((_, i) => i)));
  };

  const mapLead = (l) => ({
    id: `scraped-${Date.now()}-${Math.random()}`,
    name: l.business_name, businessType: l.business_type,
    phone: l.phone, email: l.email, zip: l.zip_code,
    website: l.website, address: l.address, rating: l.rating, reviews: l.reviews,
  });

  const handleImportSelected = () => {
    if (selectedIds.size === 0 || !results) return;
    onImportLeads(results.filter((_, i) => selectedIds.has(i)).map(mapLead));
    setSelectedIds(new Set());
  };

  const handleImportSingle = (lead) => onImportLeads([mapLead(lead)]);
  const handleImportAll = () => { if (results?.length) onImportLeads(results.map(mapLead)); };

  const exportCSV = () => {
    if (!results?.length) return;
    const csv = [Object.keys(results[0]).join(","), ...results.map(r => Object.values(r).map(v => `"${v ?? ""}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads.csv"; a.click();
  };

  const inputClass = "w-full bg-white border border-brand-400 rounded-lg px-4 py-3 text-sm text-brand-900 outline-none transition-all focus:border-brand-800 focus:ring-2 focus:ring-brand-100/50";
  const labelClass = "text-[11px] uppercase tracking-widest text-brand-600 font-medium mb-[6px] block";

  const StarRating = ({ rating }) => {
    const r = parseFloat(rating) || 0;
    const full = Math.floor(r);
    const half = r % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      <div className="flex text-yellow-400">
        {Array(full).fill(0).map((_, i) => <span key={`f${i}`} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
        {half === 1 && <span className="material-symbols-outlined text-[16px]">star_half</span>}
        {Array(empty).fill(0).map((_, i) => <span key={`e${i}`} className="material-symbols-outlined text-[16px]">star_outline</span>)}
      </div>
    );
  };

  const StatusBadge = () => {
    const configs = {
      running: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Running" },
      complete: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <CheckCircle className="w-3 h-3" />, label: "Complete" },
      error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <XCircle className="w-3 h-3" />, label: "Error" },
      idle: { bg: "bg-brand-100/60", text: "text-brand-600", border: "border-brand-100", icon: null, label: "Idle" },
    };
    const c = configs[webhookStatus];
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
        {c.icon}{c.label}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 p-6 lg:p-8 pb-10 max-w-[1400px]">



      {/* Zone 1: Settings + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Left: Settings */}
        <div className="bg-white border border-[#e0e3e6] rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-brand-800 text-[20px]">tune</span>
            <h2 className="text-[20px] font-semibold text-brand-900">Scraper Settings</h2>
          </div>

          <form id="scraper-form" onSubmit={handleRunScraper} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div className="flex flex-col">
                <label className={labelClass}>Target ZIP Code <span className="text-red-500">*</span></label>
                <input
                  type="text" value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g. 77002" maxLength={5} disabled={isRunning}
                  className={`${inputClass} ${formSubmitted && !zipCode ? "border-red-400" : ""}`}
                />
                {formSubmitted && !zipCode && <span className="text-xs text-red-500 mt-1">ZIP Code is required</span>}
              </div>

              <div className="flex flex-col">
                <label className={labelClass}>Business Type</label>
                <div className="relative">
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} disabled={isRunning} className={`appearance-none cursor-pointer pr-10 ${inputClass}`}>
                    <option value="HVAC">HVAC Services</option>
                    <option value="Solar">Solar Installers</option>
                    <option value="Electrical">Electrical Contractors</option>
                    <option value="Roofing">Roofing Companies</option>
                    <option value="All">All Business Types</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className={labelClass}>Keyword Filter</label>
                <input
                  type="text" value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Residential, Commercial" disabled={isRunning}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelClass}>Required Leads</label>
                <input
                  type="number" min={1} max={500} value={requiredLeads}
                  onChange={(e) => setRequiredLeads(Number(e.target.value))}
                  disabled={isRunning} className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#e0e3e6]">
              <button
                type="button"
                onClick={() => { setZipCode(""); setKeyword(""); setRequiredLeads(25); setBusinessType("HVAC"); }}
                disabled={isRunning}
                className="text-sm text-brand-400 hover:text-brand-600 font-medium transition-all disabled:opacity-40 cursor-pointer"
              >
                Reset to Defaults
              </button>
              {isRunning ? (
                <button type="button" onClick={stopScrape}
                  className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-all cursor-pointer">
                  <XCircle className="w-4 h-4" /> Stop Scraper
                </button>
              ) : (
                <button type="submit"
                  className="flex items-center gap-2 px-8 py-3 bg-brand-800 text-white rounded-lg font-semibold hover:bg-brand-600 active:scale-95 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  Run Scraper
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Live Stats */}
        <div className="bg-white border border-[#e0e3e6] rounded-lg shadow-sm p-5 flex flex-col gap-4 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-brand-400 font-semibold">Live Engine Status</span>
            <StatusBadge />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pages", value: currentPage, color: "text-brand-900" },
              { label: "Found", value: validCount, color: "text-[#10B981]" },
              { label: "Rejected", value: rejectedCount, color: "text-[#EF4444]" },
              { label: "Existing", value: existingCount, color: "text-[#94A3B8]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 bg-[#f7f9fc] rounded-lg border border-[#e0e3e6]">
                <p className="text-[10px] text-brand-400 font-medium mb-0.5">{label}</p>
                <p className={`text-[20px] font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex justify-between text-xs text-brand-400 font-medium">
              <span>Overall Progress</span>
              <span className="font-bold text-brand-900">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#e0e3e6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #34618d, #042558)" }}
              />
            </div>
            <p className="text-[10px] text-brand-400 italic mt-1 truncate">
              {isRunning ? statusMsg : isDone ? "Scrape complete." : "Currently scraping: Yelp, Google Maps API, & YellowPages..."}
            </p>
          </div>
        </div>
      </div>

      {/* Zone 2: Results Table */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${results !== null ? "opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
        {results !== null && (
          results.length > 0 ? (
            <div className="bg-[#000F22] rounded-lg shadow-xl border border-white/5 overflow-hidden">

              {/* Table Header Bar */}
              <div className="px-6 py-4 flex justify-between items-center bg-white/5 border-b border-white/10 select-none">
                <div className="flex items-center gap-4">
                  <h3 className="text-[20px] font-semibold text-white">Live Results</h3>
                  <span className="bg-[#002b3c] text-[#C2E8FF] text-[11px] px-3 py-1 rounded-full border border-[#C2E8FF]/20 font-semibold">
                    {results.length} leads found in current session
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportCSV}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    Export CSV
                  </button>
                  {selectedIds.size > 0 && (
                    <button onClick={handleImportSelected}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                      Import Selected ({selectedIds.size})
                    </button>
                  )}
                  <button onClick={handleImportAll}
                    className="flex items-center gap-2 bg-[#d0e4ff] text-[#001d35] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#a1cdfe] transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Bulk Import
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[#7E9FC8] font-semibold bg-[#042558]/40">
                      <th className="p-4 w-12 text-center">
                        <input type="checkbox"
                          checked={results.length > 0 && selectedIds.size === results.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 accent-[#C2E8FF] rounded cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Business Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">ZIP</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#507CA9]/15">
                    {results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((lead, index) => {
                      const index2 = (page - 1) * PAGE_SIZE + index;
                      const isSelected = selectedIds.has(index2);
                      return (
                        <tr key={index2}
                          className={`transition-colors cursor-default ${isSelected ? "bg-[#042558]" : "hover:bg-[#042558]"}`}>
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={isSelected}
                              onChange={() => handleSelectRow(index2)}
                              className="w-4 h-4 accent-[#C2E8FF] rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-semibold text-white">{lead.business_name}</p>
                            {lead.website && (
                              <p className="text-[11px] text-[#7E9FC8] truncate max-w-[180px]">
                                {lead.website.replace(/^https?:\/\//, "")}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="bg-[#002b3c]/60 text-[#C2E8FF] text-[10px] px-2 py-0.5 rounded border border-[#C2E8FF]/20 uppercase font-bold">
                              {lead.business_type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 text-[12px] text-white/80">
                                <span className="material-symbols-outlined text-[14px]">call</span>
                                {lead.phone || "—"}
                              </div>
                              <div className="flex items-center gap-2 text-[12px] text-white/80">
                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                {lead.email || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-white/80">{lead.zip_code}</td>
                          <td className="p-4"><StarRating rating={lead.rating} /></td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleImportSingle(lead)}
                              className="px-4 py-1.5 rounded bg-[#d0e4ff]/10 text-[#d0e4ff] hover:bg-[#d0e4ff] hover:text-[#042558] transition-all text-[11px] font-bold cursor-pointer">
                              Import
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {results.length > PAGE_SIZE && (
                <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-[#507CA9]">
                    Displaying {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, results.length)} of {results.length} leads
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 rounded bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.ceil(results.length / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer
                          ${page === p ? "bg-white/20 text-white" : "bg-white/5 text-[#7E9FC8] hover:bg-white/10"}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(results.length / PAGE_SIZE), p + 1))}
                      disabled={page === Math.ceil(results.length / PAGE_SIZE)}
                      className="w-8 h-8 rounded bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-brand-100 rounded-lg shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <Inbox className="w-12 h-12 text-brand-400 mb-4" />
              <h3 className="text-md font-semibold text-brand-900 mb-1">No leads found for these criteria</h3>
              <p className="text-xs text-brand-400">Try adjusting your filters</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}