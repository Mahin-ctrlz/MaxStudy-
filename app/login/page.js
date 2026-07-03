"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState("sign_in"); // 'sign_in' | 'sign_up'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "sign_up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Check your email to confirm your account before signing in.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        document.cookie = "sp_guest=; path=/; max-age=0"; // clear, now a real user
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple flex items-center justify-center text-bg text-xs font-semibold">
            S
          </div>
          <span className="text-text text-sm font-medium">Study Planner</span>
        </div>

        <h1 className="text-text text-xl font-medium mb-1">
          {mode === "sign_in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          {mode === "sign_in"
            ? "Sign in to pick up where you left off."
            : "Your planner data stays private to your account."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-text-muted block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <p
              className={`text-xs ${
                message.type === "error" ? "text-pink" : "text-green"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-surface2 border border-border rounded-xl py-2 text-sm text-text hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            {loading
              ? "Please wait…"
              : mode === "sign_in"
              ? "Sign in"
              : "Sign up"}
          </button>
        </form>

        <button
          onClick={() =>
            setMode(mode === "sign_in" ? "sign_up" : "sign_in")
          }
          className="w-full text-center text-xs text-text-muted mt-5 hover:text-text-secondary transition-colors"
        >
          {mode === "sign_in"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wide text-text-muted">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={() => {
            // Session cookie (no max-age) — clears when the browser closes,
            // matching the fact that guest data itself isn't saved either.
            document.cookie = "sp_guest=1; path=/; samesite=lax";
            window.location.href = "/planner/guest";
          }}
          className="w-full text-center text-sm text-text-secondary border border-border rounded-xl py-2 hover:text-text hover:bg-surface2 transition-colors"
        >
          Continue as guest
        </button>
        <p className="text-center text-[11px] text-text-muted mt-2">
          Try the dashboard without an account — nothing you add will be saved.
        </p>
      </div>
    </div>
  );
}
