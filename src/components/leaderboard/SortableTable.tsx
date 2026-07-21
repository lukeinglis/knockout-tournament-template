"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface RankedParticipant {
  id: string;
  name: string;
  tier1Total: number;
  tier2Total: number;
  total: number;
  maxPossible: number;
  tiebreaker: { homeScore: number; awayScore: number };
  bonusPicks?: { key: string; icon: string; label: string; pick: string; points: number; status: "earned" | "lost" | "possible" }[];
}

type SortColumn = "total" | "tier1" | "tier2" | "max";

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

function SortArrow({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-white ml-1">{direction === "desc" ? "↓" : "↑"}</span>;
}

export default function SortableTable({
  participants,
  tier1Max,
  tier2Max,
}: {
  participants: RankedParticipant[];
  tier1Max: number;
  tier2Max: number;
}) {
  const [sortCol, setSortCol] = useState<SortColumn>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const getValue = (p: RankedParticipant) => {
      switch (sortCol) {
        case "tier1": return p.tier1Total;
        case "tier2": return p.tier2Total;
        case "max": return p.maxPossible;
        default: return p.total;
      }
    };
    return [...participants].sort((a, b) => {
      const diff = getValue(b) - getValue(a);
      if (sortDir === "asc") return -diff || a.name.localeCompare(b.name);
      return diff || a.name.localeCompare(b.name);
    });
  }, [participants, sortCol, sortDir]);

  const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-navy z-10">
          <tr className="border-b border-white/10 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-14">#</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Player</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">
              <button type="button" onClick={() => handleSort("tier1")} className={`cursor-pointer hover:text-white transition-colors ${sortCol === "tier1" ? "text-accent" : "text-accent/60"}`}>
                <span className="hidden sm:inline">Tier 1</span><span className="sm:hidden">T1</span>
                <SortArrow active={sortCol === "tier1"} direction={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">
              <button type="button" onClick={() => handleSort("tier2")} className={`cursor-pointer hover:text-white transition-colors ${sortCol === "tier2" ? "text-gold" : "text-gold/60"}`}>
                <span className="hidden sm:inline">Tier 2</span><span className="sm:hidden">T2</span>
                <SortArrow active={sortCol === "tier2"} direction={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
              <button type="button" onClick={() => handleSort("total")} className={`cursor-pointer hover:text-white transition-colors ${sortCol === "total" ? "text-gray-300" : "text-gray-500"}`}>
                Total <SortArrow active={sortCol === "total"} direction={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
              <button type="button" onClick={() => handleSort("max")} className={`cursor-pointer hover:text-white transition-colors ${sortCol === "max" ? "text-gray-300" : "text-gray-500"}`}>
                Max <SortArrow active={sortCol === "max"} direction={sortDir} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p) => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4">
                {p.rank <= 3 ? (
                  <span className="text-lg">{getMedalEmoji(p.rank)}</span>
                ) : (
                  <span className="font-bold text-lg text-gray-500">{p.rank}</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div>
                  <Link href={`/leaderboard/${p.id}`} className="font-medium text-white hover:text-accent transition-colors">
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-600">TB: {p.tiebreaker.homeScore}:{p.tiebreaker.awayScore}</p>
                  {p.bonusPicks && p.bonusPicks.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {p.bonusPicks.map((bp) => (
                        <span key={bp.key} className={`text-[10px] ${bp.status === "earned" ? "text-green-400" : bp.status === "possible" ? "text-gray-500" : "text-gray-700 line-through"}`}>
                          {bp.icon} {bp.pick}
                          {bp.status === "earned" && <span className="ml-0.5 text-green-500">✓{bp.points}</span>}
                          {bp.status === "possible" && <span className="ml-0.5 text-gray-600">?{bp.points}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-lg text-accent">{p.tier1Total}</span>
                <p className="text-xs text-gray-600">/{tier1Max}</p>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-lg text-gold">{p.tier2Total}</span>
                <p className="text-xs text-gray-600">/{tier2Max}</p>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="font-bold text-2xl text-white">{p.total}</span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="font-bold text-lg text-gray-500">{p.maxPossible}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
