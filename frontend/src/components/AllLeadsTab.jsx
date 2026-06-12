import React, { useState } from "react";

export default function AllLeadsTab({ leads, onLoadMore, onViewLead, onTriggerScrape }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Filtered Leads logic
  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.zip.includes(searchTerm);

    const matchStatus = statusFilter === "" || lead.status.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = String(a[sortField]).toLowerCase();
    const bValue = String(b[sortField]).toLowerCase();
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Type Badge Colors
  const getTypeColor = (type) => {
    return "border-brand-600 text-brand-800 bg-brand-100/30";
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

    const renderSortableHeader = (label, field, className = "") => (
      <th 
        className={`px-4 py-3 font-medium text-xs uppercase tracking-widest text-brand-600 whitespace-nowrap cursor-pointer hover:bg-brand-100/80 transition-colors select-none group ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {sortField === field ? (
            <span className="material-symbols-outlined text-[14px]">
              {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          ) : (
            <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
              sort
            </span>
          )}
        </div>
      </th>
    );

    return (
      <div className="w-full flex flex-col max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 pb-28 animate-fade-in">
        {/* Search and Filters Toolbar */}
        <div className="bg-white rounded-xl shadow-sm py-[16px] px-[20px] mb-[12px] flex flex-col md:flex-row md:items-center justify-between gap-4 border border-brand-100">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prospects..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-brand-400 rounded-lg outline-none focus:ring-2 focus:ring-brand-100/50 focus:border-brand-800 text-md text-brand-900 placeholder-brand-400 transition-shadow"
            />
          </div>

          {/* Filters Dropdown & Reset */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {(searchTerm !== "" || statusFilter !== "") && (
              <button
                onClick={() => { setStatusFilter(""); setSearchTerm(""); }}
                className="flex items-center gap-1.5 text-brand-400 hover:text-brand-800 px-3 py-2 rounded-md transition-colors text-md font-medium whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset
              </button>
            )}

            <div className="relative w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-brand-400 rounded-lg pl-3 pr-8 py-2 text-md text-brand-800 outline-none focus:ring-2 focus:ring-brand-100/50 focus:border-brand-800 transition-shadow cursor-pointer w-full md:w-auto min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-brand-400 text-[18px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Leads Table Container */}
        <div className="bg-white rounded-none md:rounded-xl shadow-sm border-y md:border border-brand-100 overflow-hidden hover:shadow-md hover:border-brand-400 transition-all duration-150 relative -mx-4 md:mx-0">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-brand-100 border-b border-brand-100 sticky top-0 z-30 shadow-sm">
                <tr className="h-[48px]">
                  <th className="px-3 py-3 font-medium text-xs uppercase tracking-widest text-brand-600 whitespace-nowrap w-[48px] text-center sticky left-0 bg-brand-100 z-40 md:relative md:left-auto">#</th>
                  {renderSortableHeader("Name", "name", "sticky left-[48px] bg-brand-100 z-40 shadow-[2px_0_8px_rgba(0,0,0,0.06)] md:relative md:left-auto md:shadow-none")}
                  {renderSortableHeader("Zipcode", "zip")}
                  {renderSortableHeader("Type", "businessType")}
                  {renderSortableHeader("Phone", "phone")}
                  {renderSortableHeader("Email", "email")}
                  {renderSortableHeader("Status", "status")}
                  {renderSortableHeader("Date", "dateAdded")}
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-widest text-brand-600 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedLeads.length > 0 ? (
                  sortedLeads.map((lead, index) => {
                    const statusStyle = getStatusStyle(lead.status);
                    return (
                      <tr key={lead.id} className="h-[52px] border-b border-brand-100 hover:bg-brand-100 transition-colors duration-150 group">
                        {/* Numbering */}
                        <td className="px-3 text-md text-brand-800 text-center sticky left-0 bg-white group-hover:bg-brand-100 md:group-hover:bg-transparent transition-colors z-10 w-[48px] md:relative md:left-auto md:bg-transparent">
                          {index + 1}
                        </td>

                        {/* Name */}
                        <td className="px-4 text-md font-semibold text-brand-900 sticky left-[48px] bg-white group-hover:bg-brand-100 md:bg-transparent transition-colors z-10 shadow-[2px_0_8px_rgba(0,0,0,0.06)] md:relative md:left-auto md:shadow-none whitespace-nowrap truncate max-w-[140px] md:max-w-none">
                          {lead.name}
                        </td>

                        {/* Zip */}
                        <td className="px-4 text-md text-brand-800 whitespace-nowrap">
                          {lead.zip}
                        </td>

                        {/* Business type */}
                        <td className="px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-[10px] py-[2px] rounded-full border-[1px] text-xs font-medium whitespace-nowrap ${getTypeColor(lead.businessType)}`}>
                            {lead.businessType}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-4 text-md text-brand-800 whitespace-nowrap">
                          {lead.phone}
                        </td>

                        {/* Email */}
                        <td className="px-4 text-md text-brand-800 whitespace-nowrap truncate max-w-[180px]" title={lead.email}>
                          {lead.email}
                        </td>

                        {/* Status */}
                        <td className="px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: statusStyle.dot }}></span>
                            <span className="text-md capitalize font-medium" style={{ color: statusStyle.text }}>{lead.status}</span>
                          </div>
                        </td>

                        {/* Date added */}
                        <td className="px-4 text-md text-brand-800 whitespace-nowrap">
                          {lead.dateAdded}
                        </td>

                        {/* View Action Link */}
                        <td className="px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end">
                            <button
                              onClick={() => onViewLead(lead)}
                              className="w-[44px] h-[44px] md:w-[32px] md:h-[32px] rounded-md text-brand-600 hover:bg-brand-100 hover:text-brand-800 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
                              title="View Prospect"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center px-4">
                        <span className="material-symbols-outlined text-[48px] text-brand-400 mb-4">search_off</span>
                        <h3 className="text-md font-medium text-brand-900 mb-1">No prospects found</h3>
                        <p className="text-md text-brand-800">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button In Panel */}
          {sortedLeads.length > 0 && (
            <div className="p-4 border-t border-brand-100 flex justify-center bg-white sticky bottom-0 z-10 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]">
              <button
                onClick={onLoadMore}
                className="border border-brand-400 text-brand-800 hover:bg-brand-100 rounded-lg px-4 py-2.5 text-md font-medium transition-all active:scale-95 cursor-pointer w-full md:w-auto min-h-[44px] md:min-h-0 flex items-center justify-center"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    );
}
