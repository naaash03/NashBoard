"use client";

import { useState } from "react";

type UserInfo = {
  id: string;
  email: string;
  name?: string | null;
};

export default function TopBarAuth() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Login failed");
      }
      const data = (await res.json()) as UserInfo;
      setUser(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error(err);
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-xs text-neutral-200">
        <span>
          Signed in as{" "}
          <span className="font-semibold">
            {user.name || user.email}
          </span>
        </span>
        <button
          onClick={handleLogout}
          className="rounded-full border border-neutral-600 px-3 py-1 hover:bg-neutral-800"
          disabled={loading}
        >
          {loading ? "..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="w-32 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />
      <button
        onClick={handleLogin}
        className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-900 hover:bg-white disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "..." : "Sign in"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
