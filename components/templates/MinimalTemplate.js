"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";

const GUEST_SAMPLE = [
  { id: "m1", name: "Morning review", done: true },
  { id: "m2", name: "Finish reading assignment", done: false },
  { id: "m3", name: "Practice problem set", done: false },
];

export default function MinimalTemplate({ plannerId, isGuest }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState(null);
  const [draft, setDraft] = useState("");

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
        const data = await fetchJSON(`/api/tasks?kind=minimal&planner_id=${plannerId}`);
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

  async function add(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const name = draft.trim();
    setDraft("");
    const optimisticId = `temp-${Date.now()}`;
    setTasks((prev) => [...prev, { id: optimisticId, name, done: false }]);
    if (isGuest) return;
    try {
      const created = await fetchJSON("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, kind: "minimal", name }),
      });
      setTasks((prev) => prev.map((t) => (t.id === optimisticId ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {errorBanner && (
        <div className="bg-[#2a1a1a] border-b border-pink/40 px-4 py-2 text-xs text-pink mb-6 rounded-lg">
          {errorBanner}
        </div>
      )}
      <div className="flex flex-col gap-3 mb-6">
        {loading && <p className="text-xs text-text-muted">Loading…</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-xs text-text-muted">Your list is empty — add something below.</p>
        )}
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task)}
            className="flex items-center gap-3 text-left py-2 border-b border-border"
          >
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-md"
              style={{
                width: "18px",
                height: "18px",
                border: `1.5px solid ${task.done ? "#B18BFF" : "#3A3A3A"}`,
                background: task.done ? "#B18BFF" : "transparent",
              }}
            >
              {task.done && <Check size={12} strokeWidth={3} color="#101010" />}
            </span>
            <span
              className={`text-sm ${task.done ? "line-through opacity-70" : ""}`}
              style={{ color: task.done ? "#B18BFF" : "#E7E7E7" }}
            >
              {task.name}
            </span>
          </button>
        ))}
      </div>
      <form onSubmit={add}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
          className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-purple transition-colors"
        />
      </form>
    </div>
  );
}
