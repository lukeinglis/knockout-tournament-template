"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { tournament } from "../../../tournament.config";

export default function JoinPage() {
  const { user, join } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-2xl font-bold mb-2">Welcome, {user.name}!</p>
        <p className="text-gray-400 mb-6">You are registered for {tournament.name}.</p>
        <a href="/my-picks" className="inline-block px-6 py-3 bg-pitch text-white font-bold rounded-lg hover:bg-pitch/80">
          Make Your Picks
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await join(name.trim(), email.trim());
    if (!result.ok) setError(result.error ?? "Failed to join");
    setSubmitting(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-center">Join {tournament.name}</h1>
      <p className="text-gray-400 text-center mb-8">Enter your name and email to get started.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600"
            placeholder="your@email.com"
          />
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !name.trim() || !email.trim()}
          className="w-full px-6 py-3 bg-pitch text-white font-bold rounded-lg hover:bg-pitch/80 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Joining..." : "Join"}
        </button>
      </form>
    </div>
  );
}
