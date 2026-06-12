import { useState, useCallback } from "react";

const API_BASE = "http://localhost:8000";

export function useLeads() {
  const [allLeads, setAllLeads] = useState([]);
  const [validLeads, setValidLeads] = useState([]);
  const [rejectedLeads, setRejectedLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, validRes, rejectedRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/leads`),
        fetch(`${API_BASE}/leads/valid`),
        fetch(`${API_BASE}/leads/rejected`),
        fetch(`${API_BASE}/leads/logs`),
      ]);

      const [all, valid, rejected, runLogs] = await Promise.all([
        allRes.json(),
        validRes.json(),
        rejectedRes.json(),
        logsRes.json(),
      ]);

      setAllLeads(all);
      setValidLeads(valid);
      setRejectedLeads(rejected);
      setLogs(runLogs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const clearAll = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/leads`, { method: "DELETE" });
      setAllLeads([]);
      setValidLeads([]);
      setRejectedLeads([]);
      setLogs([]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    allLeads,
    validLeads,
    rejectedLeads,
    logs,
    loading,
    error,
    refresh,
    clearAll,
    exportCSV,
  };
}
