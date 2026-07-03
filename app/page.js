"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Folder, FolderPlus, Trash2, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import TopNav from "@/components/TopNav";
import { getTemplate } from "@/components/templateCatalog";

function PlannerCard({ planner, folders, onMoveToFolder, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const template = getTemplate(planner.template_id);

  return (
    <div className="rounded-card border border-border bg-card w-[280px] p-5 relative">
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ color: template.accentColor, background: `${template.accentColor}15` }}
        >
          {template.name}
        </span>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-text-muted hover:text-text-secondary transition-colors duration-150"
        >
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </button>
      </div>

      <Link href={`/planner/${planner.id}`} className="block mb-4">
        <h3 className="text-base font-medium text-text hover:text-purple transition-colors duration-150">
          {planner.name}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Updated {new Date(planner.updated_at).toLocaleDateString()}
        </p>
      </Link>

      {menuOpen && (
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-wide text-text-muted">
            Move to folder
          </label>
          <select
            value={planner.folder_id || ""}
            onChange={(e) => onMoveToFolder(planner.id, e.target.value || null)}
            className="bg-transparent border border-border rounded-lg px-2 py-1 text-xs text-text outline-none focus:border-purple"
          >
            <option value="" className="bg-card">Unfiled</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id} className="bg-card">{f.name}</option>
            ))}
          </select>
          <button
            onClick={() => onDelete(planner.id)}
            className="flex items-center gap-1.5 text-xs text-pink hover:underline mt-1"
          >
            <Trash2 size={12} strokeWidth={1.75} />
            Delete planner
          </button>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [planners, setPlanners] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");

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
        const [plannersData, foldersData] = await Promise.all([
          fetchJSON("/api/planners"),
          fetchJSON("/api/folders"),
        ]);
        if (cancelled) return;
        setPlanners(plannersData);
        setFolders(foldersData);
      } catch {
        if (!cancelled) setError("Couldn't load your planners. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchJSON, supabase]);

  async function moveToFolder(plannerId, folderId) {
    setPlanners((prev) =>
      prev.map((p) => (p.id === plannerId ? { ...p, folder_id: folderId } : p))
    );
    try {
      await fetchJSON(`/api/planners/${plannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
    } catch {
      setError("Couldn't move that planner — try again.");
    }
  }

  async function deletePlanner(plannerId) {
    if (!confirm("Delete this planner? This can't be undone.")) return;
    const prev = planners;
    setPlanners((p) => p.filter((pl) => pl.id !== plannerId));
    try {
      await fetchJSON(`/api/planners/${plannerId}`, { method: "DELETE" });
    } catch {
      setPlanners(prev);
      setError("Couldn't delete that planner — try again.");
    }
  }

  async function createFolder(e) {
    e.preventDefault();
    if (!folderDraft.trim()) return;
    try {
      const created = await fetchJSON("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderDraft.trim() }),
      });
      setFolders((prev) => [...prev, created]);
      setFolderDraft("");
      setAddingFolder(false);
    } catch {
      setError("Couldn't create that folder — try again.");
    }
  }

  const unfiled = planners.filter((p) => !p.folder_id);
  const byFolder = (folderId) => planners.filter((p) => p.folder_id === folderId);

  return (
    <div className="min-h-screen w-full bg-bg text-text">
      <TopNav userEmail={user?.email} isGuest={false} />

      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-medium text-text">Your planners</h1>
            {user?.email && <p className="text-sm text-text-muted mt-1">{user.email}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddingFolder(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm text-text-secondary hover:text-text hover:bg-surface2 transition-colors duration-150"
            >
              <FolderPlus size={14} strokeWidth={1.75} />
              New folder
            </button>
            <Link
              href="/gallery"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple text-bg text-sm font-medium hover:opacity-90 transition-opacity duration-150"
            >
              <Plus size={14} strokeWidth={2} />
              New planner
            </Link>
          </div>
        </div>

        {addingFolder && (
          <form onSubmit={createFolder} className="flex items-center gap-2 mb-6">
            <input
              autoFocus
              value={folderDraft}
              onChange={(e) => setFolderDraft(e.target.value)}
              onBlur={() => !folderDraft && setAddingFolder(false)}
              placeholder="Folder name…"
              className="bg-transparent border border-border rounded-xl px-3 py-1.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-purple transition-colors"
            />
          </form>
        )}

        {error && <p className="text-sm text-pink mb-6">{error}</p>}

        {loading && <p className="text-sm text-text-muted">Loading…</p>}

        {!loading && planners.length === 0 && (
          <div className="rounded-card border border-border bg-card p-10 text-center">
            <p className="text-sm text-text-secondary mb-4">
              You don't have any planners yet.
            </p>
            <Link href="/gallery" className="text-purple text-sm hover:underline">
              Create your first one
            </Link>
          </div>
        )}

        {!loading && folders.map((folder) => {
          const items = byFolder(folder.id);
          if (items.length === 0) return null;
          return (
            <div key={folder.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Folder size={16} strokeWidth={1.75} color="#9B9B9B" />
                <h2 className="text-sm font-medium text-text-secondary">{folder.name}</h2>
              </div>
              <div className="flex flex-wrap gap-5">
                {items.map((p) => (
                  <PlannerCard key={p.id} planner={p} folders={folders} onMoveToFolder={moveToFolder} onDelete={deletePlanner} />
                ))}
              </div>
            </div>
          );
        })}

        {!loading && unfiled.length > 0 && (
          <div>
            {folders.length > 0 && (
              <h2 className="text-sm font-medium text-text-secondary mb-4">Unfiled</h2>
            )}
            <div className="flex flex-wrap gap-5">
              {unfiled.map((p) => (
                <PlannerCard key={p.id} planner={p} folders={folders} onMoveToFolder={moveToFolder} onDelete={deletePlanner} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
