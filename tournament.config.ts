import type { TournamentConfig } from "./src/lib/types";

/**
 * Tournament Configuration
 *
 * This is the single source of truth for your tournament.
 * Edit this file to set up teams, groups, bracket structure,
 * scoring rules, dates, and branding.
 *
 * See README.md for a full guide on each section.
 */
export const tournament: TournamentConfig = {
  // ── Branding ──
  name: "My Tournament Fantasy",
  shortName: "MTF",
  subtitle: "Your tagline here",
  disclaimer: "",
  url: "https://example.com",
  commissioner: "Admin",

  // ── Dates (ISO 8601) ──
  dates: {
    tier1Opens: null,
    tier1Deadline: "2026-06-11T19:00:00Z",
    tier1Reveal: "2026-06-11T19:00:00Z",
    tier2Opens: "2026-06-28T06:00:00Z",
    tier2Deadline: "2026-06-28T19:00:00Z",
    tier2Reveal: null,
    tournamentEnd: "2026-07-19T23:59:59Z",
  },

  // ── Teams ──
  // Add all teams with a unique code, flag emoji, and group assignment.
  teams: [
    { name: "Team A1", code: "TA1", flag: "🏁", group: "A" },
    { name: "Team A2", code: "TA2", flag: "🏁", group: "A" },
    { name: "Team A3", code: "TA3", flag: "🏁", group: "A" },
    { name: "Team A4", code: "TA4", flag: "🏁", group: "A" },
    { name: "Team B1", code: "TB1", flag: "🏁", group: "B" },
    { name: "Team B2", code: "TB2", flag: "🏁", group: "B" },
    { name: "Team B3", code: "TB3", flag: "🏁", group: "B" },
    { name: "Team B4", code: "TB4", flag: "🏁", group: "B" },
  ],

  // ── Groups ──
  groups: {
    labels: ["A", "B"],
    size: 4,
    advanceCount: 2,
  },

  // ── Bracket ──
  bracket: {
    rounds: [
      { key: "semi", label: "SF", matches: 2, points: 8 },
      { key: "third_place", label: "3rd", matches: 1, points: 8 },
      { key: "final", label: "Final", matches: 1, points: 10 },
    ],
    firstRoundMatchups: [
      { matchNumber: 1, home: "A1", away: "B2" },
      { matchNumber: 2, home: "B1", away: "A2" },
    ],
    paths: [
      { from: ["semi_1", "semi_2"], to: "final_1" },
    ],
  },

  // ── Scoring ──
  scoring: {
    groupExactPosition: 3,
    groupRightBucket: 1,
    bonusPicks: [
      { key: "mvp", label: "MVP", icon: "🌟", tier: 2, points: 10, type: "player" },
    ],
    tiebreaker: { label: "Final Score Prediction", type: "score" },
    lateSubmissionPenalty: { missedMatch: 0, taintedTeam: 0.5 },
  },

  // ── Auth ──
  admins: ["admin@example.com"],
  localStorageKey: "bracket_user",

  // ── Live Data Provider (optional) ──
  dataProvider: null,

  // ── Theme ──
  theme: {
    primary: "#1B5E20",
    secondary: "#0A1628",
    accent: "#00E676",
    gold: "#FFD700",
  },
};
