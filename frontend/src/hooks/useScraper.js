import { useState, useRef, useCallback } from "react";

const API_BASE = "http://localhost:8000";

export function useScraper() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [validCount, setValidCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [existingCount, setExistingCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const readerRef = useRef(null);

  const stopScrape = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startScrape = useCallback(async (businessType, zipCode, requiredLeads) => {
    setIsRunning(true);
    setIsDone(false);
    setError(null);
    setLeads([]);
    setValidCount(0);
    setRejectedCount(0);
    setExistingCount(0);
    setCurrentPage(0);
    setProgress(0);
    setStatusMsg("Starting scraper...");

    try {
      const response = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_type: businessType,
          zip_code: zipCode,
          required_leads: requiredLeads,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.replace(/^data: /, "").trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed);

            setCurrentPage(event.page ?? 0);
            setValidCount(event.valid_count ?? 0);
            setRejectedCount(event.rejected_count ?? 0);
            setExistingCount(event.existing_count ?? 0);
            setStatusMsg(event.status_msg ?? "");

            if (event.valid_count && requiredLeads > 0) {
              setProgress(Math.min(100, Math.round((event.valid_count / requiredLeads) * 100)));
            }

            if (event.done) {
              setLeads(event.valid_batch ?? []);
              setIsDone(true);
              setIsRunning(false);
              setProgress(100);
            }

            if (event.error) {
              setError(event.error);
              setIsRunning(false);
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    } finally {
      readerRef.current = null;
    }
  }, []);

  return {
    isRunning,
    progress,
    statusMsg,
    validCount,
    rejectedCount,
    existingCount,
    currentPage,
    leads,
    error,
    isDone,
    startScrape,
    stopScrape,
  };
}
