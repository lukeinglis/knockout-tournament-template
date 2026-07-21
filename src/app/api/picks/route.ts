import { NextRequest, NextResponse } from "next/server";
import { getPicks, savePicks, getUserById, isKvConfigured } from "@/lib/storage";
import { tournament } from "../../../../tournament.config";

export async function GET(req: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const nameLower = await getUserById(userId);
  if (!nameLower) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const picks = await getPicks(userId);
  return NextResponse.json(picks ?? null);
}

export async function POST(req: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { userId, tier } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const nameLower = await getUserById(userId);
  if (!nameLower) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const existing = await getPicks(userId);

  if (tier === 1) {
    const deadline = new Date(tournament.dates.tier1Deadline);
    if (now >= deadline) {
      return NextResponse.json({ error: "Tier 1 picks are locked" }, { status: 403 });
    }

    const picks = {
      participantId: userId,
      groupPredictions: body.groupPredictions ?? [],
      bonusPicks: body.bonusPicks ?? {},
      knockoutPicks: existing?.knockoutPicks ?? [],
      tiebreaker: body.tiebreaker ?? { homeScore: 0, awayScore: 0 },
      tier2Submitted: existing?.tier2Submitted ?? false,
      tier2SubmittedAt: existing?.tier2SubmittedAt,
      submittedAt: now.toISOString(),
    };

    await savePicks(picks);
    return NextResponse.json({ ok: true });
  }

  if (tier === 2) {
    const deadline = new Date(tournament.dates.tier2Deadline);
    if (now >= deadline) {
      return NextResponse.json({ error: "Tier 2 picks are locked" }, { status: 403 });
    }
    if (existing?.tier2Submitted) {
      return NextResponse.json({ error: "Tier 2 picks already submitted (no edits allowed)" }, { status: 403 });
    }

    const picks = {
      participantId: userId,
      groupPredictions: existing?.groupPredictions ?? body.groupPredictions ?? [],
      bonusPicks: { ...(existing?.bonusPicks ?? {}), ...body.bonusPicks },
      knockoutPicks: body.knockoutPicks ?? [],
      tiebreaker: body.tiebreaker ?? existing?.tiebreaker ?? { homeScore: 0, awayScore: 0 },
      tier2Submitted: true,
      tier2SubmittedAt: now.toISOString(),
      submittedAt: now.toISOString(),
    };

    await savePicks(picks);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
}
