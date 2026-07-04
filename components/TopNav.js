"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  ListTodo,
  FolderOpen,
  HelpCircle,
  LogOut,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function TopNav({ userEmail, isGuest }) {
  const supabase = createClient();
  const pathname = usePathname();
  const items = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
    { label: "Tasks", icon: ListTodo, href: "/tasks" },
    { label: "Files", icon: FolderOpen, href: "/files" },
    { label: "Help", icon: HelpCircle, href: "/help" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center justify-between px-10 h-16 border-b border-border">
      <div className="flex items-center gap-10">
        <Link href={isGuest ? "/planner/guest" : "/"} className="w-6 h-6 rounded-md bg-purple flex items-center justify-center text-bg text-xs font-semibold">
          S
        </Link>
        <nav className="flex items-center gap-7">
          {items.map(({ label, icon: Icon, href }) => {
            // Guests only ever have one route (/planner/guest) — none of
            // these secondary pages have any meaning without a real
            // account (Calendar/Tasks/Files all read data scoped to a
            // signed-in user), so they render as inert for guests rather
            // than linking somewhere that will just 401 or redirect away.
            const requiresAccount = href !== "/" && href !== "/help";
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const className = `flex items-center gap-2 text-sm transition-colors duration-150 ${
              active ? "text-text" : "text-text-secondary hover:text-text"
            } ${isGuest && requiresAccount ? "opacity-40 cursor-not-allowed" : ""}`;
            const content = (
              <>
                <Icon size={20} strokeWidth={1.75} />
                <span className="hidden lg:inline">{label}</span>
              </>
            );
            if (isGuest && requiresAccount) {
              return (
                <span key={label} className={className} title="Sign in to use this">
                  {content}
                </span>
              );
            }
            return (
              <Link key={label} href={href} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isGuest ? (
          <a
            href="/login"
            className="flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full border border-purple transition-colors duration-150 hover:bg-purple/10 text-purple"
          >
            <LogIn size={14} strokeWidth={1.75} />
            <span className="text-sm">Sign in to save</span>
          </a>
        ) : (
          <>
            <span className="text-xs text-text-muted hidden md:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full border border-border transition-colors duration-150 hover:bg-surface2 text-text-secondary hover:text-text"
              title="Sign out"
            >
              <LogOut size={14} strokeWidth={1.75} />
              <span className="text-sm">Sign out</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
