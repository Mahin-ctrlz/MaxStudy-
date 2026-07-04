"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";
import GuestBanner from "@/components/GuestBanner";
import ExportPdfButton from "@/components/ExportPdfButton";
import DashboardTemplate, { GUEST_SAMPLE } from "@/components/templates/DashboardTemplate";
import WeeklyTemplate from "@/components/templates/WeeklyTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ImageBackedSheetTemplate from "@/components/templates/ImageBackedSheetTemplate";

const TEMPLATE_COMPONENTS = {
  dashboard: DashboardTemplate,
  weekly: WeeklyTemplate,
  minimal: MinimalTemplate,
  botanical: (props) => <ImageBackedSheetTemplate {...props} templateId="botanical" />,
};

// Only the Dashboard template has a PDF layout built (see
// components/PlannerPDFDocument.js) — the button is hidden rather than
// shown-and-broken for the other two.
const PDF_CAPABLE_TEMPLATES = new Set(["dashboard", "weekly", "minimal"]);

export default function PlannerPage() {
  const params = useParams();
  const plannerId = params.id;
  const isGuest = plannerId === "guest";
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser);

      if (isGuest) {
        setPlanner({ name: "Guest Planner", template_id: "dashboard" });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/planners/${plannerId}`);
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
        } else {
          const data = await res.json();
          if (!cancelled) setPlanner(data);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [plannerId, isGuest, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-bg text-text">
        <TopNav userEmail={user?.email} isGuest={isGuest} />
        <div className="max-w-[1280px] mx-auto px-10 py-8">
          <p className="text-sm text-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen w-full bg-bg text-text">
        <TopNav userEmail={user?.email} isGuest={isGuest} />
        <div className="max-w-[1280px] mx-auto px-10 py-8">
          <p className="text-sm text-text-secondary mb-4">
            This planner doesn't exist, or you don't have access to it.
          </p>
          <Link href="/" className="text-purple text-sm hover:underline">
            Back to your planners
          </Link>
        </div>
      </div>
    );
  }

  const TemplateComponent = TEMPLATE_COMPONENTS[planner.template_id] || DashboardTemplate;
  const canExportPdf = PDF_CAPABLE_TEMPLATES.has(planner.template_id);

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={isGuest} />
      {isGuest && <GuestBanner />}

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {!isGuest && (
              <Link href="/" className="text-text-muted hover:text-text transition-colors duration-150" title="Back to your planners">
                <ArrowLeft size={18} strokeWidth={1.75} />
              </Link>
            )}
            <h1 className="text-xl font-medium text-text">{planner.name}</h1>
          </div>
          {canExportPdf && (
            <ExportPdfButton
              plannerId={plannerId}
              isGuest={isGuest}
              plannerName={planner.name}
              guestData={isGuest ? GUEST_SAMPLE : null}
            />
          )}
        </div>

        <TemplateComponent plannerId={plannerId} isGuest={isGuest} />
      </div>
    </div>
  );
}
