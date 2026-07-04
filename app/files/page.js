"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";

export default function FilesPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser);
      try {
        const res = await fetch("/api/pdf-exports");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!cancelled) setExports(data);
      } catch {
        if (!cancelled) setError("Couldn't load your export history. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <h1 className="text-xl font-medium text-text mb-1">Files</h1>
        <p className="text-sm text-text-secondary mb-8">
          A log of the PDFs you've exported. This app doesn't have general file
          uploads or storage yet — this is what actually exists right now.
        </p>

        {error && <p className="text-sm text-pink mb-6">{error}</p>}
        {loading && <p className="text-sm text-text-muted">Loading…</p>}

        {!loading && exports.length === 0 && (
          <div className="rounded-card border border-border bg-card p-10 text-center">
            <p className="text-sm text-text-secondary mb-4">
              You haven't exported a PDF yet.
            </p>
            <Link href="/" className="text-purple text-sm hover:underline">
              Go to your planners
            </Link>
          </div>
        )}

        {!loading && exports.length > 0 && (
          <div className="rounded-card border border-border bg-card divide-y divide-border">
            {exports.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileDown size={16} strokeWidth={1.75} color="#9B9B9B" />
                  <div>
                    <p className="text-sm text-text">{e.planner_name}.pdf</p>
                    <p className="text-xs text-text-muted">
                      Exported {new Date(e.exported_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/planner/${e.planner_id}`}
                  className="text-xs text-purple hover:underline"
                >
                  Open planner to re-export
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
