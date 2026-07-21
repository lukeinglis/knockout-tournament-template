"use client";

import { useState, useEffect, useCallback } from "react";
import { tournament } from "../../../../tournament.config";
import type { TournamentResults, TournamentPhase } from "@/lib/types";

type Tab = "groups" | "knockout" | "bonus" | "phase";

const PHASE_OPTIONS: { value: TournamentPhase; label: string }[] = [
  { value: "pre_tournament", label: "Pre-Tournament" },
  { value: "group_stage", label: "Group Stage" },
  { value: "knockout", label: "Knockout" },
  { value: "complete", label: "Complete" },
];

export default function AdminResultsPage() {
  const [results, setResults] = useState<TournamentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("groups");
  const [message, setMessage] = useState("");

  const fetchResults = useCallback(async () => {
    const res = await fetch("/api/admin/results");
    if (res.ok) setResults(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  async function patchResult(body: { type: string; key?: string; value?: string | string[] }) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/results", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setResults(updated);
      setMessage("Saved");
      setTimeout(() => setMessage(""), 2000);
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "groups", label: "Groups" },
    { id: "knockout", label: "Knockout" },
    { id: "bonus", label: "Bonus Picks" },
    { id: "phase", label: "Phase" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Admin: Manage Results</h1>
      <p className="text-sm text-gray-400 mb-6">
        Set match results, group standings, and bonus pick winners.
        {results?.updatedAt && (
          <span className="ml-2 text-gray-600">
            Last updated: {new Date(results.updatedAt).toLocaleString()}
          </span>
        )}
      </p>

      {message && (
        <div className="mb-4 rounded bg-accent/10 border border-accent/30 px-4 py-2 text-sm text-accent">
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id
                ? "bg-pitch text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "groups" && (
        <GroupResultsEditor results={results} onSave={patchResult} saving={saving} />
      )}
      {tab === "knockout" && (
        <KnockoutResultsEditor results={results} onSave={patchResult} saving={saving} />
      )}
      {tab === "bonus" && (
        <BonusResultsEditor results={results} onSave={patchResult} saving={saving} />
      )}
      {tab === "phase" && (
        <PhaseEditor results={results} onSave={patchResult} saving={saving} />
      )}
    </div>
  );
}

function GroupResultsEditor({
  results,
  onSave,
  saving,
}: {
  results: TournamentResults | null;
  onSave: (body: { type: string; key: string; value: string[] }) => Promise<void>;
  saving: boolean;
}) {
  const groups = tournament.groups.labels;
  const teamsByGroup = new Map<string, typeof tournament.teams>();
  for (const team of tournament.teams) {
    if (!teamsByGroup.has(team.group)) teamsByGroup.set(team.group, []);
    teamsByGroup.get(team.group)!.push(team);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Set the final standings for each group. Order teams from 1st to last.
      </p>
      {groups.map((group) => {
        const teams = teamsByGroup.get(group) ?? [];
        const currentOrder = results?.groups?.[group] ?? [];

        return (
          <GroupEditor
            key={group}
            group={group}
            teams={teams}
            currentOrder={currentOrder}
            onSave={(order) => onSave({ type: "group", key: group, value: order })}
            saving={saving}
          />
        );
      })}
    </div>
  );
}

function GroupEditor({
  group,
  teams,
  currentOrder,
  onSave,
  saving,
}: {
  group: string;
  teams: typeof tournament.teams;
  currentOrder: string[];
  onSave: (order: string[]) => Promise<void>;
  saving: boolean;
}) {
  const [order, setOrder] = useState<string[]>(
    currentOrder.length > 0
      ? currentOrder
      : teams.map((t) => t.code)
  );

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setOrder(next);
  }

  function moveDown(idx: number) {
    if (idx >= order.length - 1) return;
    const next = [...order];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setOrder(next);
  }

  const isSet = currentOrder.length > 0;

  return (
    <div className={`rounded-lg border p-4 ${isSet ? "border-accent/30 bg-accent/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">
          Group {group}
          {isSet && <span className="ml-2 text-xs text-accent">Set</span>}
        </h3>
        <button
          onClick={() => onSave(order)}
          disabled={saving}
          className="px-3 py-1 text-sm bg-pitch text-white rounded hover:bg-pitch/80 disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
      <div className="space-y-1">
        {order.map((code, idx) => {
          const team = teams.find((t) => t.code === code);
          return (
            <div key={code} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-gray-500 text-right">{idx + 1}.</span>
              <span className="flex-1">
                {team?.flag} {team?.name ?? code}
              </span>
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="text-xs px-1 text-gray-500 hover:text-white disabled:opacity-20"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx >= order.length - 1}
                className="text-xs px-1 text-gray-500 hover:text-white disabled:opacity-20"
              >
                ↓
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KnockoutResultsEditor({
  results,
  onSave,
  saving,
}: {
  results: TournamentResults | null;
  onSave: (body: { type: string; key: string; value: string }) => Promise<void>;
  saving: boolean;
}) {
  const rounds = tournament.bracket.rounds;
  const firstRoundKey = rounds[0]?.key ?? "";

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Click a team to mark them as the winner of each match.
      </p>
      {rounds.map((round) => {
        const isFirstRound = round.key === firstRoundKey;
        return (
          <div key={round.key}>
            <h3 className="font-bold mb-3">{round.label} ({round.matches} matches, {round.points} pts each)</h3>
            <div className="grid gap-2">
              {Array.from({ length: round.matches }, (_, i) => {
                const matchNumber = i + 1;
                const matchKey = `${round.key}_${matchNumber}`;
                const winner = results?.knockout?.[matchKey];

                let homeTeam: string | null = null;
                let awayTeam: string | null = null;

                if (isFirstRound) {
                  const matchup = tournament.bracket.firstRoundMatchups.find(
                    (m) => m.matchNumber === matchNumber
                  );
                  homeTeam = matchup?.home ?? null;
                  awayTeam = matchup?.away ?? null;
                } else {
                  const path = tournament.bracket.paths.find((p) => p.to === matchKey);
                  if (path) {
                    homeTeam = results?.knockout?.[path.from[0]] ?? null;
                    awayTeam = results?.knockout?.[path.from[1]] ?? null;
                  }
                }

                const homeInfo = homeTeam ? tournament.teams.find((t) => t.code === homeTeam) : null;
                const awayInfo = awayTeam ? tournament.teams.find((t) => t.code === awayTeam) : null;

                return (
                  <div key={matchKey} className="flex items-center gap-2 rounded border border-white/10 p-3 bg-white/[0.02]">
                    <span className="text-xs text-gray-500 w-8">{matchKey}</span>
                    <button
                      onClick={() => homeTeam && onSave({ type: "knockout", key: matchKey, value: homeTeam })}
                      disabled={!homeTeam || saving}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-all ${
                        winner === homeTeam && homeTeam
                          ? "bg-accent/20 text-accent border border-accent/40 font-bold"
                          : "hover:bg-white/5 text-gray-300 disabled:text-gray-700"
                      }`}
                    >
                      {homeInfo ? `${homeInfo.flag} ${homeInfo.name}` : homeTeam ?? "TBD"}
                    </button>
                    <span className="text-gray-600 text-xs">vs</span>
                    <button
                      onClick={() => awayTeam && onSave({ type: "knockout", key: matchKey, value: awayTeam })}
                      disabled={!awayTeam || saving}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-all ${
                        winner === awayTeam && awayTeam
                          ? "bg-accent/20 text-accent border border-accent/40 font-bold"
                          : "hover:bg-white/5 text-gray-300 disabled:text-gray-700"
                      }`}
                    >
                      {awayInfo ? `${awayInfo.flag} ${awayInfo.name}` : awayTeam ?? "TBD"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BonusResultsEditor({
  results,
  onSave,
  saving,
}: {
  results: TournamentResults | null;
  onSave: (body: { type: string; key: string; value: string }) => Promise<void>;
  saving: boolean;
}) {
  const bonusPicks = tournament.scoring.bonusPicks;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Set the actual winners for each bonus pick category.
      </p>
      {bonusPicks.map((bonus) => {
        const currentValue = results?.bonus?.[bonus.key] ?? "";
        return (
          <BonusInput
            key={bonus.key}
            bonus={bonus}
            currentValue={currentValue}
            onSave={(value) => onSave({ type: "bonus", key: bonus.key, value })}
            saving={saving}
          />
        );
      })}
    </div>
  );
}

function BonusInput({
  bonus,
  currentValue,
  onSave,
  saving,
}: {
  bonus: typeof tournament.scoring.bonusPicks[number];
  currentValue: string;
  onSave: (value: string) => Promise<void>;
  saving: boolean;
}) {
  const [value, setValue] = useState(currentValue);

  useEffect(() => { setValue(currentValue); }, [currentValue]);

  const isTeamType = bonus.type === "team";

  return (
    <div className={`rounded-lg border p-4 ${currentValue ? "border-accent/30 bg-accent/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{bonus.icon}</span>
        <span className="font-bold text-sm">{bonus.label}</span>
        <span className="text-xs text-gray-500">({bonus.points} pts, Tier {bonus.tier})</span>
        {currentValue && <span className="text-xs text-accent ml-auto">Set: {currentValue}</span>}
      </div>
      <div className="flex gap-2">
        {isTeamType ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
          >
            <option value="">Select team...</option>
            {tournament.teams.map((t) => (
              <option key={t.code} value={t.code}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${bonus.type} name...`}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-gray-600"
          />
        )}
        <button
          onClick={() => onSave(value)}
          disabled={!value || saving}
          className="px-4 py-2 text-sm bg-pitch text-white rounded hover:bg-pitch/80 disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
      {isTeamType && bonus.type === "team" && (
        <p className="text-xs text-gray-600 mt-1">
          For ties, enter comma-separated codes (e.g., &quot;FRA,GER,NED&quot;)
        </p>
      )}
    </div>
  );
}

function PhaseEditor({
  results,
  onSave,
  saving,
}: {
  results: TournamentResults | null;
  onSave: (body: { type: string; value: string }) => Promise<void>;
  saving: boolean;
}) {
  const currentPhase = results?.phase ?? "pre_tournament";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Override the tournament phase. This controls pick visibility and deadline enforcement.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PHASE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSave({ type: "phase", value: opt.value })}
            disabled={saving}
            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              currentPhase === opt.value
                ? "bg-accent/20 text-accent border border-accent/40"
                : "bg-white/[0.02] text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white"
            }`}
          >
            {opt.label}
            {currentPhase === opt.value && " (current)"}
          </button>
        ))}
      </div>
    </div>
  );
}
