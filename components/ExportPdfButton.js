"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function ExportPdfButton({ plannerId, isGuest, guestData, plannerName }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      if (isGuest) {
        // No server round-trip possible — there's no persisted planner row
        // for a guest. Build the PDF entirely client-side from whatever is
        // currently in memory, using the exact same document component the
        // server route uses for real planners.
        const [{ pdf }, { default: PlannerPDFDocument }, React] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/PlannerPDFDocument"),
          import("react"),
        ]);
        const doc = React.createElement(PlannerPDFDocument, {
          plannerName: plannerName || "Study Planner",
          ...guestData,
        });
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "study-planner.pdf";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const res = await fetch(`/api/planners/${plannerId}/pdf`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Export failed");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(plannerName || "study-planner").replace(/[^a-z0-9]/gi, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err.message || "Couldn't export this planner.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm text-text-secondary hover:text-text hover:bg-surface2 transition-colors duration-150 disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
        ) : (
          <Download size={14} strokeWidth={1.75} />
        )}
        <span>{exporting ? "Exporting…" : "Export PDF"}</span>
      </button>
      {error && <span className="text-xs text-pink">{error}</span>}
    </div>
  );
}
