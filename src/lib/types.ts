/** Tournament configuration types */

export interface TeamConfig {
  name: string;
  code: string;
  flag: string;
  group: string;
  seed?: number;
}

export interface GroupConfig {
  labels: string[];
  size: number;
  advanceCount: number;
}

export interface BracketRound {
  key: string;
  label: string;
  matches: number;
  points: number;
}

export interface BracketMatchup {
  matchNumber: number;
  home: string;
  away: string;
}

export interface BracketPath {
  from: [string, string];
  to: string;
}

export interface BonusPickConfig {
  key: string;
  label: string;
  icon: string;
  tier: 1 | 2;
  points: number;
  type: "player" | "team";
}

export interface ScoringConfig {
  groupExactPosition: number;
  groupRightBucket: number;
  bonusPicks: BonusPickConfig[];
  tiebreaker: { label: string; type: "score" };
  lateSubmissionPenalty: { missedMatch: number; taintedTeam: number };
}

export interface TournamentDates {
  tier1Opens: string | null;
  tier1Deadline: string;
  tier1Reveal: string;
  tier2Opens: string | null;
  tier2Deadline: string;
  tier2Reveal: string | null;
  tournamentEnd: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  gold: string;
}

export interface DataProviderConfig {
  type: string;
  competition: string;
  apiKeyEnv: string;
  tlaMap?: Record<string, string>;
}

export interface TournamentConfig {
  name: string;
  shortName: string;
  subtitle: string;
  disclaimer: string;
  url: string;
  commissioner: string;

  dates: TournamentDates;
  teams: TeamConfig[];
  groups: GroupConfig;

  bracket: {
    rounds: BracketRound[];
    firstRoundMatchups: BracketMatchup[];
    paths: BracketPath[];
  };

  scoring: ScoringConfig;

  admins: string[];
  localStorageKey: string;

  dataProvider: DataProviderConfig | null;
  theme: ThemeConfig;
}

/** Runtime types */

export type TournamentPhase = "pre_tournament" | "group_stage" | "knockout" | "complete";

export interface GroupPrediction {
  group: string;
  order: string[];
}

export interface KnockoutPick {
  round: string;
  matchNumber: number;
  winner: string;
}

export interface BonusPicks {
  [key: string]: string;
}

export interface Tiebreaker {
  homeScore: number;
  awayScore: number;
}

export interface Points {
  tier1Groups: number;
  tier1Bonus: number;
  tier2Bracket: number;
  tier2Bonus: number;
  total: number;
}

export interface Participant {
  id: string;
  name: string;
  groupPredictions: GroupPrediction[];
  bonusPicks: BonusPicks;
  knockoutPicks: KnockoutPick[];
  tier2SubmittedAt?: string;
  tiebreaker: Tiebreaker;
  points: Points;
}

export interface UserRecord {
  id: string;
  name: string;
  nameLower: string;
  email: string;
  emailLower: string;
  createdAt: string;
}

export interface PicksRecord {
  participantId: string;
  groupPredictions: GroupPrediction[];
  bonusPicks: BonusPicks;
  knockoutPicks: KnockoutPick[];
  tiebreaker: Tiebreaker;
  tier2Submitted: boolean;
  tier2SubmittedAt?: string;
  submittedAt: string;
}

export interface TournamentResults {
  groups: Record<string, string[]>;
  knockout: Record<string, string>;
  bonus: Record<string, string>;
  phase: TournamentPhase;
  updatedAt: string;
}
