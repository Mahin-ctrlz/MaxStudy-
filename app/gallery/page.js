"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";
import { TEMPLATE_CATALOG } from "@/components/templateCatalog";
import { Loader2 } from "lucide-react";

export default function GalleryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [creatingId, setCreatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, [supabase]);

  async function useTemplate(template) {
    setCreatingId(template.id);
    setError(null);
    try {
      const res = await fetch("/api/planners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          template_id: template.id,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't create planner");
      }
      const planner = await res.json();
      router.push(`/planner/${planner.id}`);
    } catch (err) {
      setError(err.message);
      setCreatingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <h1 className="text-xl font-medium text-text mb-1">Choose a template</h1>
        <p className="text-sm text-text-secondary mb-8">
          Pick a starting point — you can rename and customize it after.
        </p>

        {error && <p className="text-sm text-pink mb-6">{error}</p>}

        <div className="flex flex-wrap gap-6">
          {TEMPLATE_CATALOG.map((template) => (
            <div
              key={template.id}
              className="rounded-card border border-border bg-card w-[320px] p-6 flex flex-col"
            >
              <div
                className="w-full h-32 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: `${template.accentColor}15`, border: `1px solid ${template.accentColor}40` }}
              >
                <span className="text-xs uppercase tracking-wide" style={{ color: template.accentColor }}>
                  {template.category}
                </span>
              </div>
              <h3 className="text-base font-medium text-text mb-2">{template.name}</h3>
              <p className="text-sm text-text-secondary mb-5 flex-1">{template.description}</p>
              <button
                onClick={() => useTemplate(template)}
                disabled={creatingId !== null}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-border text-sm text-text hover:bg-surface2 transition-colors duration-150 disabled:opacity-50"
              >
                {creatingId === template.id ? (
                  <>
                    <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Use this template"
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted mt-8">
          More templates are on the way — this is a working start, not the full set.
        </p>
      </div>
    </div>
  );
}
