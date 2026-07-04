"use client";

import { useState, useEffect, useCallback } from "react";
import { getSheetLayout } from "@/components/sheetLayouts";

const GUEST_SAMPLE_ROWS = [
  { row_index: 0, name: "Read Chapter 4", notes: "focus on diagrams", done: true },
  { row_index: 2, name: "Practice problems", notes: "", done: false },
];

const GUEST_SAMPLE_DAILY = {
  owner_name: "",
  goal_text: "Finish the reading",
  goal_text_2: "Review flashcards",
  quote_text: "Small steps every day beat big pushes once a month.",
};

// A borderless input that visually blends into the illustrated background —
// no box, no outline until focused, so it reads as "writing on the page"
// rather than a form control sitting on top of it.
function OverlayInput({ value, onChange, onBlur, placeholder, textColor, multiline }) {
  const commonStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: textColor,
    fontSize: "clamp(10px, 1.4vw, 15px)",
    fontFamily: "var(--font-inter), sans-serif",
    padding: 0,
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ ...commonStyle, resize: "none" }}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      style={commonStyle}
    />
  );
}

function FieldBox({ field, children }) {
  if (!field) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.w * 100}%`,
        height: `${field.h * 100}%`,
      }}
    >
      {children}
    </div>
  );
}

export default function ImageBackedSheetTemplate({ plannerId, isGuest, templateId }) {
  const layout = getSheetLayout(templateId);

  const [rows, setRows] = useState([]);
  const [daily, setDaily] = useState({});
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
        setRows(GUEST_SAMPLE_ROWS.map((r, i) => ({ id: `sample-${i}`, ...r })));
        setDaily(GUEST_SAMPLE_DAILY);
        setLoading(false);
        return;
      }
      try {
        const [taskData, dailyData] = await Promise.all([
          fetchJSON(`/api/tasks?kind=sheet&planner_id=${plannerId}`),
          fetchJSON(`/api/trackers?planner_id=${plannerId}`),
        ]);
        if (cancelled) return;
        setRows(taskData);
        setDaily(dailyData);
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

  function rowAt(index) {
    return rows.find((r) => r.row_index === index) || { row_index: index, name: "", notes: "", done: false };
  }

  async function updateRow(index, patch) {
    const existing = rowAt(index);
    const updated = { ...existing, ...patch };
    setRows((prev) => {
      const others = prev.filter((r) => r.row_index !== index);
      return [...others, updated].sort((a, b) => a.row_index - b.row_index);
    });
    if (isGuest) return;

    try {
      if (existing.id) {
        await fetchJSON(`/api/tasks/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } else {
        const created = await fetchJSON("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planner_id: plannerId,
            kind: "sheet",
            row_index: index,
            name: updated.name,
            notes: updated.notes,
            done: updated.done,
          }),
        });
        setRows((prev) => {
          const others = prev.filter((r) => r.row_index !== index);
          return [...others, created].sort((a, b) => a.row_index - b.row_index);
        });
      }
    } catch {
      setErrorBanner("Couldn't save that row — try again.");
    }
  }

  async function saveDaily(patch) {
    setDaily((prev) => ({ ...prev, ...patch }));
    if (isGuest) return;
    try {
      await fetchJSON("/api/trackers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planner_id: plannerId, ...patch }),
      });
    } catch {
      setErrorBanner("Couldn't save that change — try again.");
    }
  }

  if (!layout) {
    return (
      <p className="text-sm text-pink">
        This template isn't fully set up yet — its layout hasn't been verified.
      </p>
    );
  }

  const { table, fields, textColor, imageSize } = layout;
  const rowHeightFrac = (table.bottom - table.top) / (table.rows + 1); // +1 for header row
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      {errorBanner && (
        <div className="bg-[#2a1a1a] border-b border-pink/40 px-4 py-2 text-xs text-pink mb-4 rounded-lg">
          {errorBanner}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : (
        <div
          className="relative mx-auto"
          style={{ maxWidth: `${imageSize.width}px`, aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={layout.image}
            alt=""
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />

          <FieldBox field={fields.name}>
            <OverlayInput
              value={daily.owner_name || ""}
              onChange={(v) => setDaily((p) => ({ ...p, owner_name: v }))}
              onBlur={() => saveDaily({ owner_name: daily.owner_name || "" })}
              textColor={textColor}
            />
          </FieldBox>

          <FieldBox field={fields.date}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                color: textColor,
                fontSize: "clamp(10px, 1.4vw, 15px)",
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              {today}
            </div>
          </FieldBox>

          <FieldBox field={fields.goal1}>
            <OverlayInput
              value={daily.goal_text || ""}
              onChange={(v) => setDaily((p) => ({ ...p, goal_text: v }))}
              onBlur={() => saveDaily({ goal_text: daily.goal_text || "" })}
              textColor={textColor}
            />
          </FieldBox>

          <FieldBox field={fields.goal2}>
            <OverlayInput
              value={daily.goal_text_2 || ""}
              onChange={(v) => setDaily((p) => ({ ...p, goal_text_2: v }))}
              onBlur={() => saveDaily({ goal_text_2: daily.goal_text_2 || "" })}
              textColor={textColor}
            />
          </FieldBox>

          <FieldBox field={fields.quote}>
            <OverlayInput
              value={daily.quote_text || ""}
              onChange={(v) => setDaily((p) => ({ ...p, quote_text: v }))}
              onBlur={() => saveDaily({ quote_text: daily.quote_text || "" })}
              textColor={textColor}
            />
          </FieldBox>

          {/* Table rows: skip index 0 of the row band (that's the header,
              not editable), map data rows 0-12 to table.top + (i+1) row bands */}
          {Array.from({ length: table.rows }, (_, i) => {
            const row = rowAt(i);
            const rowTop = table.top + (i + 1) * rowHeightFrac;
            const tableWidth = table.right - table.left;
            const subjectX = table.left + table.colFracs[1] * tableWidth;
            const subjectW = (table.colFracs[2] - table.colFracs[1]) * tableWidth;
            const notesX = table.left + table.colFracs[2] * tableWidth;
            const notesW = (table.colFracs[3] - table.colFracs[2]) * tableWidth;
            const doneX = table.left + table.colFracs[3] * tableWidth;
            const doneW = (table.colFracs[4] - table.colFracs[3]) * tableWidth;

            return (
              <div key={i}>
                <FieldBox field={{ x: subjectX, y: rowTop, w: subjectW, h: rowHeightFrac }}>
                  <OverlayInput
                    value={row.name}
                    onChange={(v) => updateRow(i, { name: v })}
                    onBlur={() => updateRow(i, { name: row.name })}
                    textColor={textColor}
                  />
                </FieldBox>
                <FieldBox field={{ x: notesX, y: rowTop, w: notesW, h: rowHeightFrac }}>
                  <OverlayInput
                    value={row.notes || ""}
                    onChange={(v) => updateRow(i, { notes: v })}
                    onBlur={() => updateRow(i, { notes: row.notes || "" })}
                    textColor={textColor}
                  />
                </FieldBox>
                <FieldBox field={{ x: doneX, y: rowTop, w: doneW, h: rowHeightFrac }}>
                  <button
                    onClick={() => updateRow(i, { done: !row.done })}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {row.done && (
                      <span style={{ color: textColor, fontSize: "clamp(12px, 1.6vw, 18px)" }}>✓</span>
                    )}
                  </button>
                </FieldBox>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
