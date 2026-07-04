"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";

const KIND_LABELS = {
  priority: "Priority",
  due_next: "Due Next",
  weekly: "Weekly",
  minimal: "Checklist",
  sheet: "Sheet",
};

export default function TasksPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDone, setShowDone] = useState(true);

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
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser);
      try {
        const data = await fetchJSON("/api/tasks/all");
        if (!cancelled) setTasks(data);
      } catch {
        if (!cancelled) setError("Couldn't load your tasks. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchJSON, supabase]);

  async function toggle(task) {
    const next = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    try {
      await fetchJSON(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)));
      setError("Couldn't save that — try again.");
    }
  }

  const visible = tasks.filter((t) => showDone || !t.done);
  const byPlanner = {};
  for (const t of visible) {
    const key = t.planners?.id || "unknown";
    if (!byPlanner[key]) byPlanner[key] = { planner: t.planners, tasks: [] };
    byPlanner[key].tasks.push(t);
  }

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-xl font-medium text-text">All tasks</h1>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="text-sm text-text-secondary hover:text-text transition-colors duration-150"
          >
            {showDone ? "Hide completed" : "Show completed"}
          </button>
        </div>

        {error && <p className="text-sm text-pink mb-6">{error}</p>}
        {loading && <p className="text-sm text-text-muted">Loading…</p>}

        {!loading && Object.keys(byPlanner).length === 0 && (
          <div className="rounded-card border border-border bg-card p-10 text-center">
            <p className="text-sm text-text-secondary mb-4">
              {tasks.length === 0 ? "No tasks yet across any planner." : "Nothing left to show."}
            </p>
            <Link href="/gallery" className="text-purple text-sm hover:underline">
              Create a planner
            </Link>
          </div>
        )}

        {!loading &&
          Object.values(byPlanner).map(({ planner, tasks: planTasks }) => (
            <div key={planner?.id || "unknown"} className="mb-8">
              <Link
                href={planner ? `/planner/${planner.id}` : "#"}
                className="text-sm font-medium text-text-secondary hover:text-purple transition-colors duration-150 mb-3 inline-block"
              >
                {planner?.name || "Unknown planner"}
              </Link>
              <div className="rounded-card border border-border bg-card divide-y divide-border">
                {planTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggle(task)}
                    className="flex items-center gap-3 text-left w-full px-5 py-3"
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-md"
                      style={{
                        width: "16px",
                        height: "16px",
                        border: `1.5px solid ${task.done ? "#B18BFF" : "#3A3A3A"}`,
                        background: task.done ? "#B18BFF" : "transparent",
                      }}
                    >
                      {task.done && <Check size={10} strokeWidth={3} color="#101010" />}
                    </span>
                    <span
                      className={`text-sm flex-1 ${task.done ? "line-through opacity-70" : ""}`}
                      style={{ color: task.done ? "#B18BFF" : "#E7E7E7" }}
                    >
                      {task.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">
                      {KIND_LABELS[task.kind] || task.kind}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
