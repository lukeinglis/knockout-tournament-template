"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import BracketPicker from "@/components/bracket/BracketPicker";
import { tournament } from "../../../tournament.config";
import type { GroupPrediction, KnockoutPick, BonusPicks } from "@/lib/types";

export default function MyPicksPage() {
  const { user, loading } = useAuth();
  const [picks, setPicks] = useState<{
    groupPredictions: GroupPrediction[];
    bonusPicks: BonusPicks;
    knockoutPicks: KnockoutPick[];
    tiebreaker: { homeScore: number; awayScore: number };
    tier2Submitted: boolean;
  } | null>(null);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPicks = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/picks?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data) setPicks(data);
    }
    setLoadingPicks(false);
  }, [user]);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  if (loading || loadingPicks) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">You need to join first.</p>
        <a href="/join" className="text-accent hover:underline">Join the contest</a>
      </div>
    );
  }

  const groups = tournament.groups.labels;
  const teamsByGroup = new Map<string, typeof tournament.teams>();
  for (const team of tournament.teams) {
    if (!teamsByGroup.has(team.group)) teamsByGroup.set(team.group, []);
    teamsByGroup.get(team.group)!.push(team);
  }

  const groupPredictions: GroupPrediction[] = picks?.groupPredictions?.length
    ? picks.groupPredictions
    : groups.map((g) => ({
        group: g,
        order: (teamsByGroup.get(g) ?? []).map((t) => t.code),
      }));

  const bonusPicks: BonusPicks = picks?.bonusPicks ?? {};
  const tiebreaker = picks?.tiebreaker ?? { homeScore: 0, awayScore: 0 };

  async function saveTier1(gp: GroupPrediction[], bp: BonusPicks, tb: typeof tiebreaker) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user!.id,
        tier: 1,
        groupPredictions: gp,
        bonusPicks: bp,
        tiebreaker: tb,
      }),
    });
    if (res.ok) {
      setMessage("Tier 1 picks saved!");
      setTimeout(() => setMessage(""), 3000);
      await fetchPicks();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My Picks</h1>
      <p className="text-sm text-gray-400 mb-6">Welcome, {user.name}. Make your predictions below.</p>

      {message && (
        <div className={`mb-4 rounded px-4 py-2 text-sm ${message.includes("Failed") || message.includes("locked") ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-accent/10 text-accent border border-accent/30"}`}>
          {message}
        </div>
      )}

      <Tier1Form
        groups={groups}
        teamsByGroup={teamsByGroup}
        initialPredictions={groupPredictions}
        initialBonusPicks={bonusPicks}
        initialTiebreaker={tiebreaker}
        onSave={saveTier1}
        saving={saving}
      />

      {tournament.dates.tier2Opens && (
        <Tier2Section
          userId={user.id}
          initialPicks={picks?.knockoutPicks ?? []}
          initialBonusPicks={picks?.bonusPicks ?? {}}
          tier2Submitted={picks?.tier2Submitted ?? false}
          saving={saving}
          setSaving={setSaving}
          setMessage={setMessage}
          onRefresh={fetchPicks}
        />
      )}
    </div>
  );
}

function Tier1Form({
  groups,
  teamsByGroup,
  initialPredictions,
  initialBonusPicks,
  initialTiebreaker,
  onSave,
  saving,
}: {
  groups: string[];
  teamsByGroup: Map<string, typeof tournament.teams>;
  initialPredictions: GroupPrediction[];
  initialBonusPicks: BonusPicks;
  initialTiebreaker: { homeScore: number; awayScore: number };
  onSave: (gp: GroupPrediction[], bp: BonusPicks, tb: { homeScore: number; awayScore: number }) => Promise<void>;
  saving: boolean;
}) {
  const [predictions, setPredictions] = useState(initialPredictions);
  const [bonusPicks, setBonusPicks] = useState(initialBonusPicks);
  const [tiebreaker, setTiebreaker] = useState(initialTiebreaker);

  function moveTeam(groupIdx: number, teamIdx: number, direction: -1 | 1) {
    const next = [...predictions];
    const order = [...next[groupIdx].order];
    const targetIdx = teamIdx + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    [order[teamIdx], order[targetIdx]] = [order[targetIdx], order[teamIdx]];
    next[groupIdx] = { ...next[groupIdx], order };
    setPredictions(next);
  }

  const tier1Bonuses = tournament.scoring.bonusPicks.filter((b) => b.tier === 1);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-accent">Tier 1: Group Predictions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {groups.map((group, gIdx) => {
          const pred = predictions[gIdx];
          const teams = teamsByGroup.get(group) ?? [];
          return (
            <div key={group} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="font-bold text-sm mb-2">Group {group}</h3>
              <div className="space-y-1">
                {pred.order.map((code, tIdx) => {
                  const team = teams.find((t) => t.code === code);
                  return (
                    <div key={code} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-gray-500 text-right">{tIdx + 1}</span>
                      <span className="flex-1">{team?.flag} {team?.name ?? code}</span>
                      <button onClick={() => moveTeam(gIdx, tIdx, -1)} disabled={tIdx === 0} className="text-xs text-gray-500 hover:text-white disabled:opacity-20">↑</button>
                      <button onClick={() => moveTeam(gIdx, tIdx, 1)} disabled={tIdx >= pred.order.length - 1} className="text-xs text-gray-500 hover:text-white disabled:opacity-20">↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {tier1Bonuses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 text-accent">Bonus Picks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tier1Bonuses.map((bonus) => (
              <div key={bonus.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <label className="block text-sm font-bold mb-2">{bonus.icon} {bonus.label} ({bonus.points} pts)</label>
                {bonus.type === "team" ? (
                  <select
                    value={bonusPicks[bonus.key] ?? ""}
                    onChange={(e) => setBonusPicks({ ...bonusPicks, [bonus.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
                  >
                    <option value="">Select team...</option>
                    {tournament.teams.map((t) => (
                      <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={bonusPicks[bonus.key] ?? ""}
                    onChange={(e) => setBonusPicks({ ...bonusPicks, [bonus.key]: e.target.value })}
                    placeholder={`Enter ${bonus.type} name`}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gray-600"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 text-accent">Tiebreaker: {tournament.scoring.tiebreaker.label}</h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Home Score</label>
            <input
              type="number"
              min={0}
              value={tiebreaker.homeScore}
              onChange={(e) => setTiebreaker({ ...tiebreaker, homeScore: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded text-center text-white"
            />
          </div>
          <span className="text-gray-500 text-lg mt-5">:</span>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Away Score</label>
            <input
              type="number"
              min={0}
              value={tiebreaker.awayScore}
              onChange={(e) => setTiebreaker({ ...tiebreaker, awayScore: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded text-center text-white"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave(predictions, bonusPicks, tiebreaker)}
        disabled={saving}
        className="px-8 py-3 bg-pitch text-white font-bold rounded-lg hover:bg-pitch/80 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Tier 1 Picks"}
      </button>
    </div>
  );
}

function Tier2Section({
  userId,
  initialPicks,
  initialBonusPicks,
  tier2Submitted,
  saving,
  setSaving,
  setMessage,
  onRefresh,
}: {
  userId: string;
  initialPicks: KnockoutPick[];
  initialBonusPicks: BonusPicks;
  tier2Submitted: boolean;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setMessage: (v: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [bonusPicks, setBonusPicks] = useState(initialBonusPicks);
  const tier2Bonuses = tournament.scoring.bonusPicks.filter((b) => b.tier === 2);

  const now = new Date();
  const tier2Opens = tournament.dates.tier2Opens ? new Date(tournament.dates.tier2Opens) : null;
  const tier2Deadline = new Date(tournament.dates.tier2Deadline);
  const isOpen = tier2Opens ? now >= tier2Opens && now < tier2Deadline : now < tier2Deadline;

  if (tier2Opens && now < tier2Opens) {
    return (
      <div className="mt-12 rounded-lg border border-gold/20 bg-gold/5 p-6 text-center">
        <p className="text-gold font-bold">Tier 2: Knockout Bracket</p>
        <p className="text-sm text-gray-400 mt-2">
          Opens {tier2Opens.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
    );
  }

  async function handleSaveBracket(knockoutPicks: KnockoutPick[]) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        tier: 2,
        knockoutPicks,
        bonusPicks,
      }),
    });
    if (res.ok) {
      setMessage("Tier 2 bracket submitted!");
      setTimeout(() => setMessage(""), 3000);
      await onRefresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="mt-12">
      <h2 className="text-lg font-bold mb-4 text-gold">Tier 2: Knockout Bracket</h2>

      {tier2Submitted && (
        <div className="mb-4 rounded bg-gold/10 border border-gold/30 px-4 py-2 text-sm text-gold">
          Your bracket has been submitted. No further edits allowed.
        </div>
      )}

      {!tier2Submitted && !isOpen && (
        <div className="mb-4 rounded bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">
          Tier 2 submissions are closed.
        </div>
      )}

      {tier2Bonuses.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tier2Bonuses.map((bonus) => (
            <div key={bonus.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <label className="block text-sm font-bold mb-2">{bonus.icon} {bonus.label} ({bonus.points} pts)</label>
              {bonus.type === "team" ? (
                <select
                  value={bonusPicks[bonus.key] ?? ""}
                  onChange={(e) => setBonusPicks({ ...bonusPicks, [bonus.key]: e.target.value })}
                  disabled={tier2Submitted}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white disabled:opacity-50"
                >
                  <option value="">Select team...</option>
                  {tournament.teams.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={bonusPicks[bonus.key] ?? ""}
                  onChange={(e) => setBonusPicks({ ...bonusPicks, [bonus.key]: e.target.value })}
                  disabled={tier2Submitted}
                  placeholder={`Enter ${bonus.type} name`}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gray-600 disabled:opacity-50"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <BracketPicker
        initialPicks={initialPicks}
        onSave={handleSaveBracket}
        saving={saving}
        disabled={tier2Submitted || !isOpen}
      />
    </div>
  );
}
