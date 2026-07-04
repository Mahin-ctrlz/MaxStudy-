"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function CalendarPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const first = startOfMonth(cursor);
      const last = new Date(cursor.getFullYear(), cursor.getMonth(), daysInMonth(cursor));
      try {
        const res = await fetch(`/api/calendar?start=${toISODate(first)}&end=${toISODate(last)}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!cancelled) {
          setMeetings(data.meetings);
          setEvents(data.events);
        }
      } catch {
        if (!cancelled) setError("Couldn't load your calendar. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cursor]);

  const first = startOfMonth(cursor);
  const totalDays = daysInMonth(cursor);
  const leadingBlanks = first.getDay(); // 0=Sun
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayISO = toISODate(new Date());

  function itemsForDay(day) {
    const iso = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    const dayMeetings = meetings.filter((m) => m.event_date === iso);
    const dayEvents = events.filter((e) => e.event_date === iso);
    return { iso, dayMeetings, dayEvents };
  }

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-medium text-text">Calendar</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-1.5 rounded-full border border-border text-text-secondary hover:text-text hover:bg-surface2 transition-colors duration-150"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
            <span className="text-sm text-text w-36 text-center">{monthLabel}</span>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-1.5 rounded-full border border-border text-text-secondary hover:text-text hover:bg-surface2 transition-colors duration-150"
            >
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-pink mb-6">{error}</p>}

        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs text-text-muted text-center py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const { iso, dayMeetings, dayEvents } = itemsForDay(day);
            const isToday = iso === todayISO;
            return (
              <div
                key={day}
                className="rounded-xl border border-border bg-card p-2 min-h-[90px]"
                style={isToday ? { borderColor: "#B18BFF" } : undefined}
              >
                <span
                  className="text-xs"
                  style={{ color: isToday ? "#B18BFF" : "#9B9B9B" }}
                >
                  {day}
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  {dayMeetings.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{ background: "rgba(43,132,216,0.15)", color: "#2B84D8" }}
                      title={`${m.time} — ${m.name}`}
                    >
                      {m.name}
                    </div>
                  ))}
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{ background: "rgba(177,139,255,0.15)", color: "#B18BFF" }}
                      title={e.label}
                    >
                      {e.label}
                    </div>
                  ))}
                  {dayMeetings.length + dayEvents.length > 4 && (
                    <span className="text-[10px] text-text-muted">
                      +{dayMeetings.length + dayEvents.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!loading && meetings.length === 0 && events.length === 0 && (
          <p className="text-xs text-text-muted mt-6">
            No dated meetings or timeline events this month — these come from the Dashboard template's Meetings and Timeline cards.
          </p>
        )}
      </div>
    </div>
  );
}
