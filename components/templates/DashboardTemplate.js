"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Droplet,
  Coffee,
  Smile,
  Meh,
  Frown,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------------------------------------------------------------------------
// Guest mode sample data — matches exactly what the API routes return, so
// every card below works identically whether fed real or sample data.
// ---------------------------------------------------------------------------
const GUEST_SAMPLE = {
  priorityTasks: [
    { id: "sample-1", name: "Finish DSA sheet — Trees module", done: false },
    { id: "sample-2", name: "Revise Chapter 6 — Thermodynamics", done: true },
    { id: "sample-3", name: "Submit assignment draft", done: false },
  ],
  dueNextTasks: [
    { id: "sample-4", name: "Lab report — due tomorrow", done: false },
    { id: "sample-5", name: "Reading response", done: false },
    { id: "sample-6", name: "Flashcard review", done: true },
  ],
  meetings: [
    { id: "sample-7", time: "9:00 AM", name: "Study group — Calculus", cancelled: false },
    { id: "sample-8", time: "1:30 PM", name: "Project sync", cancelled: false },
    { id: "sample-9", time: "4:00 PM", name: "Mentor check-in", cancelled: true },
  ],
  timelineEvents: [
    { id: "sample-10", label: "Physics revision", start_hour: 9, duration: 1.5, color: "purple" },
    { id: "sample-11", label: "Break", start_hour: 11.5, duration: 1, color: "green" },
    { id: "sample-12", label: "Assignment work", start_hour: 14, duration: 2, color: "purple" },
  ],
  notes: [
    { id: "sample-13", content: "Ask Priya for her thermo notes before Friday." },
    { id: "sample-14", content: "Reschedule dentist to next week." },
  ],
  daily: {
    goal_text: "Finish 3 chapters and get through the practice set before dinner.",
    quote_text: "Small steps every day beat big pushes once a month.",
    water_filled: 3,
    break_filled: 2,
    mood: "happy",
  },
};

const DEFAULT_LAYOUT = {
  leftColumn: ["priority", "goal"],
  rightColumn: ["duenext", "meetings"],
  bottomRow: ["notes", "trackers"],
};

// ---------------------------------------------------------------------------
// Drag handle wrapper — adds a small grip icon that's the ONLY draggable
// surface on a card. The card's own clicks (checkboxes, inputs) are never
// intercepted by drag listeners, since those only attach to this handle.
// ---------------------------------------------------------------------------
function SortableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="absolute top-3 right-3 p-1 rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-secondary transition-opacity duration-150 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} strokeWidth={1.75} />
      </button>
      {children}
    </div>
  );
}

function SortableZone({ ids, order, onReorder, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    onReorder(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Date Widget — local time, no backend needed
// ---------------------------------------------------------------------------
function DateWidget() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="rounded-card border border-border bg-card w-[470px] h-[74px] max-w-full" />;

  const day = now.toLocaleDateString("en-US", { weekday: "short" });
  const date = now.getDate();
  const month = now.toLocaleDateString("en-US", { month: "short" });
  const year = now.getFullYear();
  const hours = now.getHours() % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = now.getHours() >= 12 ? "PM" : "AM";

  const Segment = ({ label, value, last }) => (
    <div className={`flex-1 flex flex-col items-center justify-center ${last ? "" : "border-r border-border"}`}>
      <span className="text-lg font-medium text-text">{value}</span>
      <span className="text-[10px] uppercase tracking-wide mt-0.5 text-text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex rounded-card border border-border bg-card w-[470px] h-[74px] max-w-full">
      <Segment label={day} value={date} />
      <Segment label="Month" value={month} />
      <Segment label="Year" value={year} />
      <Segment label="Started" value={`${hours}:${minutes}`} />
      <Segment label="Now" value={ampm} last />
    </div>
  );
}

function QuoteWidget({ daily, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(daily?.quote_text ?? "");

  useEffect(() => setDraft(daily?.quote_text ?? ""), [daily?.quote_text]);

  async function save() {
    setEditing(false);
    if (draft !== daily?.quote_text) onSave({ quote_text: draft });
  }

  return (
    <div className="flex flex-col justify-center px-5 rounded-2xl border border-border bg-card w-[470px] h-[60px] max-w-full">
      <span className="text-[10px] uppercase tracking-wide text-text-muted">Today's note</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="bg-transparent text-sm text-text-secondary outline-none w-full"
          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "16px" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-left text-sm text-text-secondary truncate"
          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "16px" }}
        >
          {daily?.quote_text || "Click to add a note…"}
        </button>
      )}
    </div>
  );
}

function MotivationCard() {
  return (
    <div className="flex items-center justify-end text-right px-6 rounded-card border border-border bg-card w-[320px] h-[120px] max-w-full">
      <p className="text-sm leading-relaxed text-text">Keep going — every session adds up.</p>
    </div>
  );
}

function PriorityCard({ tasks, loading, onToggle, onAdd }) {
  const [draft, setDraft] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="rounded-card border border-border bg-card w-[360px] p-6 max-w-full">
      <h3 className="text-lg font-medium mb-5 text-text">Today's priorities</h3>
      <div className="flex flex-col gap-4 mb-4">
        {loading && <p className="text-xs text-text-muted">Loading…</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-xs text-text-muted">Nothing here yet — add your first priority below.</p>
        )}
        {tasks.map((task) => (
          <button key={task.id} onClick={() => onToggle(task)} className="flex items-center gap-3 text-left">
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-md transition-transform duration-150"
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
              className={`text-sm ${task.done ? "line-through opacity-75" : ""}`}
              style={{ color: task.done ? "#B18BFF" : "#E7E7E7" }}
            >
              {task.name}
            </span>
          </button>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a priority…"
          className="flex-1 bg-transparent border border-border rounded-xl px-3 py-1.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-purple transition-colors"
        />
      </form>
    </div>
  );
}

function DailyGoalCard({ daily, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(daily?.goal_text ?? "");

  useEffect(() => setDraft(daily?.goal_text ?? ""), [daily?.goal_text]);

  async function save() {
    setEditing(false);
    if (draft !== daily?.goal_text) onSave({ goal_text: draft });
  }

  return (
    <div className="flex flex-col justify-center rounded-card border border-border bg-card w-[320px] h-[180px] p-6 max-w-full">
      <span className="text-[10px] uppercase tracking-wide mb-3 text-text-muted">Daily goal</span>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          className="bg-transparent text-xl leading-snug text-text outline-none resize-none w-full h-24"
          style={{ fontFamily: "var(--font-caveat), cursive" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-left text-2xl leading-snug text-text"
          style={{ fontFamily: "var(--font-caveat), cursive" }}
        >
          {daily?.goal_text || "Tap to set today's goal…"}
        </button>
      )}
    </div>
  );
}

function MeetingsCard({ meetings, loading }) {
  return (
    <div className="rounded-card border border-border bg-card w-[320px] p-6 max-w-full">
      <h3 className="text-lg font-medium mb-5 text-text">Meetings</h3>
      <div className="flex flex-col gap-4">
        {loading && <p className="text-xs text-text-muted">Loading…</p>}
        {!loading && meetings.length === 0 && <p className="text-xs text-text-muted">No meetings scheduled.</p>}
        {meetings.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-sm">
            <span className={m.cancelled ? "text-text-muted line-through" : "text-text-secondary"}>{m.time}</span>
            <span className={m.cancelled ? "text-text-muted line-through" : "text-text"}>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePlanner({ events, loading }) {
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i);
  const cardHeight = 420;
  const cardPadding = 20;
  const titleBlock = 40;
  const gridHeight = cardHeight - cardPadding * 2 - titleBlock;
  const rowHeight = gridHeight / hours.length;
  const topOffset = 4;
  const colorMap = { purple: "#B18BFF", green: "#B7D64B" };

  return (
    <div
      className="rounded-card border border-border bg-card w-[320px] max-w-full"
      style={{ height: `${cardHeight}px`, padding: `${cardPadding}px` }}
    >
      <h3 className="text-lg font-medium mb-4 text-text">Timeline</h3>
      {loading ? (
        <p className="text-xs text-text-muted">Loading…</p>
      ) : (
        <div className="relative" style={{ height: `${hours.length * rowHeight}px` }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start border-t border-border"
              style={{ top: `${i * rowHeight}px`, height: `${rowHeight}px` }}
            >
              <span className="text-[11px] pt-1 text-text-muted" style={{ width: "36px" }}>
                {h > 12 ? h - 12 : h}
                {h >= 12 ? "pm" : "am"}
              </span>
            </div>
          ))}
          {events.map((ev) => {
            const top = (ev.start_hour - hours[0]) * rowHeight + topOffset;
            const height = ev.duration * rowHeight - topOffset;
            const color = colorMap[ev.color] ?? colorMap.purple;
            return (
              <div
                key={ev.id}
                className="absolute rounded-lg px-2 py-1 flex items-center"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: "40px",
                  right: "4px",
                  background: color,
                  opacity: 0.35,
                  border: `1px solid ${color}`,
                }}
              >
                <span className="text-[11px] font-medium truncate text-text" style={{ opacity: 1 / 0.35 }}>
                  {ev.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DueNextCard({ tasks, loading, onToggle }) {
  return (
    <div className="rounded-card border border-border bg-card p-6">
      <h3 className="text-lg font-medium mb-4 text-text">Due next</h3>
      <div className="flex flex-col gap-3">
        {loading && <p className="text-xs text-text-muted">Loading…</p>}
        {!loading && tasks.length === 0 && <p className="text-xs text-text-muted">Nothing due — nice.</p>}
        {tasks.map((item) => (
          <button key={item.id} onClick={() => onToggle(item)} className="flex items-center gap-3 text-left">
            <span
              className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                width: "16px",
                height: "16px",
                border: `1.5px solid ${item.done ? "#B7D64B" : "#3A3A3A"}`,
                background: item.done ? "#B7D64B" : "transparent",
              }}
            >
              {item.done && <Check size={10} strokeWidth={3} color="#101010" />}
            </span>
            <span
              className={`text-sm ${item.done ? "line-through" : ""}`}
              style={{ color: item.done ? "#6D6D6D" : "#9B9B9B" }}
            >
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesCard({ notes, loading, onAdd }) {
  const [draft, setDraft] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="rounded-card border border-border bg-card w-[300px] p-5 max-w-full">
      <h3 className="text-lg font-medium mb-3 text-text">Notes</h3>
      <div className="text-base leading-relaxed text-text-secondary mb-3" style={{ fontFamily: "var(--font-caveat), cursive" }}>
        {loading && <p className="text-xs text-text-muted" style={{ fontFamily: "var(--font-inter)" }}>Loading…</p>}
        {!loading && notes.length === 0 && (
          <p className="text-xs text-text-muted" style={{ fontFamily: "var(--font-inter)" }}>No notes yet.</p>
        )}
        {notes.map((n) => (
          <p key={n.id} className="mb-2">{n.content}</p>
        ))}
      </div>
      <form onSubmit={handleAdd}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="w-full bg-transparent border border-border rounded-xl px-3 py-1.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-purple transition-colors"
        />
      </form>
    </div>
  );
}

function DotTracker({ icon: Icon, label, color, filled, onChange }) {
  return (
    <div className="rounded-card border border-border bg-card w-[140px] h-[80px] p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} strokeWidth={1.75} color={color} />
        <span className="text-[11px] text-text-muted">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1 === filled ? i : i + 1)}
            className="rounded-full transition-transform duration-150"
            style={{
              width: "14px",
              height: "14px",
              border: `1.5px solid ${color}`,
              background: i < filled ? color : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MoodTracker({ mood, onChange }) {
  const moods = [
    { key: "happy", Icon: Smile },
    { key: "neutral", Icon: Meh },
    { key: "sad", Icon: Frown },
  ];
  return (
    <div className="rounded-card border border-border bg-card w-[140px] h-[80px] p-3.5">
      <span className="text-[11px] text-text-muted">Mood</span>
      <div className="flex gap-2 mt-2">
        {moods.map(({ key, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ width: "28px", height: "28px", background: mood === key ? "rgba(177,139,255,0.15)" : "transparent" }}
          >
            <Icon size={18} strokeWidth={1.75} color={mood === key ? "#B18BFF" : "#6D6D6D"} />
          </button>
        ))}
      </div>
    </div>
  );
}

const CARD_REGISTRY = {
  priority: (props) => <PriorityCard {...props.priorityProps} />,
  goal: (props) => <DailyGoalCard {...props.goalProps} />,
  duenext: (props) => <DueNextCard {...props.dueNextProps} />,
  meetings: (props) => <MeetingsCard {...props.meetingsProps} />,
  notes: (props) => <NotesCard {...props.notesProps} />,
  trackers: (props) => (
    <div className="flex flex-wrap gap-4">
      <DotTracker icon={Droplet} label="Water" color="#2B84D8" filled={props.daily?.water_filled ?? 0} onChange={(v) => props.onSaveDaily({ water_filled: v })} />
      <DotTracker icon={Coffee} label="Breaks" color="#B7D64B" filled={props.daily?.break_filled ?? 0} onChange={(v) => props.onSaveDaily({ break_filled: v })} />
      <MoodTracker mood={props.daily?.mood} onChange={(m) => props.onSaveDaily({ mood: m })} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Main template — fetches everything scoped to `plannerId`, or uses local
// sample data when `isGuest` is true.
// ---------------------------------------------------------------------------
export default function DashboardTemplate({ plannerId, isGuest, onExportPdf }) {
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [dueNextTasks, setDueNextTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [daily, setDaily] = useState(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
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

    async function loadAll() {
      if (isGuest) {
        setPriorityTasks(GUEST_SAMPLE.priorityTasks);
        setDueNextTasks(GUEST_SAMPLE.dueNextTasks);
        setMeetings(GUEST_SAMPLE.meetings);
        setTimelineEvents(GUEST_SAMPLE.timelineEvents);
        setNotes(GUEST_SAMPLE.notes);
        setDaily(GUEST_SAMPLE.daily);
        setLayout(DEFAULT_LAYOUT);
        setLoading(false);
        return;
      }

      try {
        const q = `planner_id=${plannerId}`;
        const [priorities, dueNext, meetingsData, timelineData, notesData, dailyData, plannerData] =
          await Promise.all([
            fetchJSON(`/api/tasks?kind=priority&${q}`),
            fetchJSON(`/api/tasks?kind=due_next&${q}`),
            fetchJSON(`/api/meetings?${q}`),
            fetchJSON(`/api/timeline?${q}`),
            fetchJSON(`/api/notes?${q}`),
            fetchJSON(`/api/trackers?${q}`),
            fetchJSON(`/api/planners/${plannerId}`),
          ]);

        if (cancelled) return;
        setPriorityTasks(priorities);
        setDueNextTasks(dueNext);
        setMeetings(meetingsData);
        setTimelineEvents(timelineData);
        setNotes(notesData);
        setDaily(dailyData);
        setLayout(plannerData.layout || DEFAULT_LAYOUT);
      } catch (err) {
        if (!cancelled) {
          setErrorBanner("Couldn't load this planner. Check your connection and refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [fetchJSON, plannerId, isGuest]);

  async function persistLayout(nextLayout) {
    setLayout(nextLayout);
    if (isGuest) return;
    try {
      await fetchJSON(`/api/planners/${plannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: nextLayout }),
      });
    } catch {
      // Non-critical — layout just won't persist this time. Not worth an
      // error banner over a card-order change.
    }
  }

  async function togglePriorityTask(task) {
    const next = !task.done;
    setPriorityTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    if (isGuest) return;
    try {
      await fetchJSON(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
    } catch {
      setPriorityTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)));
    }
  }

  async function addPriorityTask(name) {
    const optimisticId = `temp-${Date.now()}`;
    setPriorityTasks((prev) => [...prev, { id: optimisticId, name, done: false }]);
    if (isGuest) return;
    try {
      const created = await fetchJSON("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, kind: "priority", name, sort_order: priorityTasks.length }),
      });
      setPriorityTasks((prev) => prev.map((t) => (t.id === optimisticId ? created : t)));
    } catch {
      setPriorityTasks((prev) => prev.filter((t) => t.id !== optimisticId));
    }
  }

  async function toggleDueNextTask(task) {
    const next = !task.done;
    setDueNextTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    if (isGuest) return;
    try {
      await fetchJSON(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
    } catch {
      setDueNextTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)));
    }
  }

  async function addNote(content) {
    const optimisticId = `temp-${Date.now()}`;
    setNotes((prev) => [...prev, { id: optimisticId, content }]);
    if (isGuest) return;
    try {
      const created = await fetchJSON("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, content, sort_order: notes.length }),
      });
      setNotes((prev) => prev.map((n) => (n.id === optimisticId ? created : n)));
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticId));
    }
  }

  async function saveDaily(patch) {
    setDaily((prev) => ({ ...prev, ...patch }));
    if (isGuest) return;
    try {
      const updated = await fetchJSON("/api/trackers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, ...patch }),
      });
      setDaily(updated);
    } catch {
      setErrorBanner("Couldn't save that change — try again.");
    }
  }

  const sharedProps = {
    priorityProps: { tasks: priorityTasks, loading, onToggle: togglePriorityTask, onAdd: addPriorityTask },
    goalProps: { daily, onSave: saveDaily },
    dueNextProps: { tasks: dueNextTasks, loading, onToggle: toggleDueNextTask },
    meetingsProps: { meetings, loading },
    notesProps: { notes, loading, onAdd: addNote },
    daily,
    onSaveDaily: saveDaily,
  };

  return (
    <div>
      {errorBanner && (
        <div className="bg-[#2a1a1a] border-b border-pink/40 px-10 py-2 text-xs text-pink -mx-10 mb-6">
          {errorBanner}
        </div>
      )}

      <div className="flex flex-wrap gap-6 mb-6">
        <div className="flex flex-col gap-4">
          <DateWidget />
          <QuoteWidget daily={daily} onSave={saveDaily} />
        </div>
        <MotivationCard />
      </div>

      <div className="flex flex-wrap gap-6 mb-6 items-start">
        <SortableZone
          ids={layout.leftColumn}
          order={layout.leftColumn}
          onReorder={(next) => persistLayout({ ...layout, leftColumn: next })}
        >
          <div className="flex flex-col gap-6">
            {layout.leftColumn.map((key) => (
              <SortableCard key={key} id={key}>
                {CARD_REGISTRY[key](sharedProps)}
              </SortableCard>
            ))}
          </div>
        </SortableZone>

        <TimelinePlanner events={timelineEvents} loading={loading} />

        <SortableZone
          ids={layout.rightColumn}
          order={layout.rightColumn}
          onReorder={(next) => persistLayout({ ...layout, rightColumn: next })}
        >
          <div className="flex flex-col gap-6">
            {layout.rightColumn.map((key) => (
              <SortableCard key={key} id={key}>
                {CARD_REGISTRY[key](sharedProps)}
              </SortableCard>
            ))}
          </div>
        </SortableZone>
      </div>

      <SortableZone
        ids={layout.bottomRow}
        order={layout.bottomRow}
        onReorder={(next) => persistLayout({ ...layout, bottomRow: next })}
      >
        <div className="flex flex-wrap gap-6">
          {layout.bottomRow.map((key) => (
            <SortableCard key={key} id={key}>
              {CARD_REGISTRY[key](sharedProps)}
            </SortableCard>
          ))}
        </div>
      </SortableZone>
    </div>
  );
}

export { GUEST_SAMPLE };
