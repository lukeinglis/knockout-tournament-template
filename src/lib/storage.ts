import { kv } from "@vercel/kv";
import type { UserRecord, PicksRecord, TournamentResults } from "./types";

export function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function getKv() {
  if (!isKvConfigured()) {
    throw new Error(
      "Vercel KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN."
    );
  }
  return kv;
}

// ── Users ──

export async function getUserByName(nameLower: string): Promise<UserRecord | null> {
  return getKv().get<UserRecord>(`user:${nameLower}`);
}

export async function getUserByEmail(emailLower: string): Promise<string | null> {
  return getKv().get<string>(`email:${emailLower}`);
}

export async function getUserById(id: string): Promise<string | null> {
  return getKv().get<string>(`userid:${id}`);
}

export async function createUser(user: UserRecord): Promise<void> {
  const db = getKv();
  await Promise.all([
    db.set(`user:${user.nameLower}`, user),
    db.set(`email:${user.emailLower}`, user.nameLower),
    db.set(`userid:${user.id}`, user.nameLower),
  ]);
}

// ── Participants ──

export async function getParticipantIds(): Promise<string[]> {
  return (await getKv().get<string[]>("participants")) ?? [];
}

export async function addParticipant(id: string): Promise<void> {
  const ids = await getParticipantIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await getKv().set("participants", ids);
  }
}

// ── Picks ──

export async function getPicks(participantId: string): Promise<PicksRecord | null> {
  return getKv().get<PicksRecord>(`picks:${participantId}`);
}

export async function savePicks(picks: PicksRecord): Promise<void> {
  const db = getKv();
  const timestamp = new Date().toISOString();
  await Promise.all([
    db.set(`picks:${picks.participantId}`, picks),
    db.set(`picks-history:${picks.participantId}:${timestamp}`, picks),
  ]);
}

// ── Results (admin-managed) ──

export async function getResults(): Promise<TournamentResults | null> {
  return getKv().get<TournamentResults>("results");
}

export async function saveResults(results: TournamentResults): Promise<void> {
  await getKv().set("results", { ...results, updatedAt: new Date().toISOString() });
}

// ── Bulk ──

export async function getAllUsersWithPicks(): Promise<{ user: UserRecord; picks: PicksRecord | null }[]> {
  const db = getKv();
  const ids = await getParticipantIds();

  const results = await Promise.all(
    ids.map(async (id) => {
      const nameLower = await db.get<string>(`userid:${id}`);
      if (!nameLower) return null;
      const user = await db.get<UserRecord>(`user:${nameLower}`);
      if (!user) return null;
      const picks = await db.get<PicksRecord>(`picks:${id}`);
      return { user, picks };
    })
  );

  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}
