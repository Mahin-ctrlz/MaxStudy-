"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Plus } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const GUEST_SAMPLE = [
  { id: "w1", day_of_week: 0, name: "Read Chapter 4", done: true },
  { id: "w2", day_of_week: 0, name: "Practice problems 1-10", done: false },
  { id: "w3", day_of_week: 2, name: "Study group", done: false },
  { id: "w4", day_of_week: 4, name: "Submit lab report", done: false },
];

function DayColumn({ dayIndex, dayLabel, tasks, loading, onToggle, onAdd }) {
  const [draft, setDraft] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(dayIndex, draft.trim());
    setDraft("");
  }

  return (
    <div className="rounded-card border border-border bg-card p-4 w-full min-w-[150px] flex-1">
      <h3 className="text-sm font-medium mb-3 text-text">{dayLabel}</h3>
      <div className="flex flex-col gap-2 mb-3 min-h-[60px]">
        {loading && <p className="text-[11px] text-text-muted">Loading…</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-[11px] text-text-muted">Nothing yet.</p>
        )}
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggle(task)}
            className="flex items-start gap-2 text-left"
          >
            <span
              className="flex-shrink-0 flex items-center justify-center rounded mt-0.5"
              style={{
                width: "14px",
                height: "14px",
                border: `1.5px solid ${task.done ? "#B18BFF" : "#3A3A3A"}`,
                background: task.done ? "#B18BFF" : "transparent",
              }}
            >
              {task.done && <Check size={9} strokeWidth={3} color="#101010" />}
            </span>
            <span
              className={`text-xs leading-snug ${task.done ? "line-through opacity-70" : ""}`}
              style={{ color: task.done ? "#B18BFF" : "#E7E7E7" }}
            >
              {task.name}
            </span>
          </button>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex items-center gap-1">
        <Plus size={12} strokeWidth={2} color="#6D6D6D" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add…"
          className="flex-1 bg-transparent text-[11px] text-text placeholder:text-text-muted outline-none min-w-0"
        />
      </form>
    </div>
  );
}

export default function WeeklyTemplate({ plannerId, isGuest }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState(null);

  const fetchJSON = useCallback(async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request to ${url} failed`);
    }
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isGuest) {
        setTasks(GUEST_SAMPLE);
        setLoading(false);
        return;
      }
      try {
        const data = await fetchJSON(`/api/tasks?kind=weekly&planner_id=${plannerId}`);
        if (!cancelled) setTasks(data);
      } catch {
        if (!cancelled) setErrorBanner("Couldn't load this planner. Check your connection and refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchJSON, plannerId, isGuest]);

  async function toggle(task) {
    const next = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    if (isGuest) return;
    try {
      await fetchJSON(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)));
    }
  }

  async function add(dayIndex, name) {
    const optimisticId = `temp-${Date.now()}`;
    setTasks((prev) => [...prev, { id: optimisticId, day_of_week: dayIndex, name, done: false }]);
    if (isGuest) return;
    try {
      const created = await fetchJSON("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, kind: "weekly", day_of_week: dayIndex, name }),
      });
      setTasks((prev) => prev.map((t) => (t.id === optimisticId ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
    }
  }

  return (
    <div>
      {errorBanner && (
        <div className="bg-[#2a1a1a] border-b border-pink/40 px-10 py-2 text-xs text-pink -mx-10 mb-6">
          {errorBanner}
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {DAYS.map((label, i) => (
          <DayColumn
            key={label}
            dayIndex={i}
            dayLabel={label}
            tasks={tasks.filter((t) => t.day_of_week === i)}
            loading={loading}
            onToggle={toggle}
            onAdd={add}
          />
        ))}
      </div>
    </div>
  );
}

export { GUEST_SAMPLE as WEEKLY_GUEST_SAMPLE };
