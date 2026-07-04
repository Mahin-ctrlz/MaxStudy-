"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How do I create a new planner?",
    a: 'From "Your planners", click "New planner", then pick a template from the gallery. You can rename it and move it into a folder afterward.',
  },
  {
    q: "Why don't I see an Export PDF button?",
    a: "PDF export is only built for the Productivity Dashboard template right now. Weekly and Minimal planners don't show the button — that's not a bug, it just hasn't been built for those yet.",
  },
  {
    q: "What shows up on the Calendar page?",
    a: "Meetings and timeline events from your Dashboard-template planners, pinned to whatever date they were created on. There's currently no way to add a dated event directly from the Calendar page itself.",
  },
  {
    q: "What's in Files?",
    a: "A log of the PDFs you've exported, with a link back to the planner so you can re-export. This app doesn't have general file uploads yet.",
  },
  {
    q: "Does guest mode save anything?",
    a: "No. Guest mode is for trying the app without an account — nothing you type is saved anywhere, and it resets if you refresh or close the tab.",
  },
  {
    q: "Can I move a planner into a folder?",
    a: 'Yes — open the "..." menu on any planner card and use the "Move to folder" dropdown.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm text-text">{q}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          color="#6D6D6D"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
        />
      </button>
      {open && <p className="text-sm text-text-secondary mt-3 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function HelpPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, [supabase]);

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[720px] mx-auto px-10 py-8">
        <h1 className="text-xl font-medium text-text mb-1">Help</h1>
        <p className="text-sm text-text-secondary mb-8">
          Common questions about how the app currently works.
        </p>

        <div className="rounded-card border border-border bg-card px-6">
          {FAQS.map((item) => (
            <FaqItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
