import { NextRequest, NextResponse } from "next/server";
import { getResults, saveResults, isKvConfigured } from "@/lib/storage";
import type { TournamentResults } from "@/lib/types";

export async function GET() {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "KV not configured" }, { status: 503 });
  }

  const results = await getResults();
  return NextResponse.json(results ?? { groups: {}, knockout: {}, bonus: {}, phase: "pre_tournament", updatedAt: "" });
}

export async function POST(req: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "KV not configured" }, { status: 503 });
  }

  const body = await req.json() as Partial<TournamentResults>;
  const existing = await getResults();

  const updated: TournamentResults = {
    groups: body.groups ?? existing?.groups ?? {},
    knockout: body.knockout ?? existing?.knockout ?? {},
    bonus: body.bonus ?? existing?.bonus ?? {},
    phase: body.phase ?? existing?.phase ?? "pre_tournament",
    updatedAt: new Date().toISOString(),
  };

  await saveResults(updated);
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "KV not configured" }, { status: 503 });
  }

  const body = await req.json() as {
    type: "group" | "knockout" | "bonus" | "phase";
    key?: string;
    value?: string | string[];
  };

  const existing = await getResults();
  const updated: TournamentResults = {
    groups: existing?.groups ? { ...existing.groups } : {},
    knockout: existing?.knockout ? { ...existing.knockout } : {},
    bonus: existing?.bonus ? { ...existing.bonus } : {},
    phase: existing?.phase ?? "pre_tournament",
    updatedAt: new Date().toISOString(),
  };

  switch (body.type) {
    case "group":
      if (body.key && Array.isArray(body.value)) {
        updated.groups[body.key] = body.value;
      }
      break;
    case "knockout":
      if (body.key && typeof body.value === "string") {
        updated.knockout[body.key] = body.value;
      }
      break;
    case "bonus":
      if (body.key && typeof body.value === "string") {
        updated.bonus[body.key] = body.value;
      }
      break;
    case "phase":
      if (typeof body.value === "string") {
        updated.phase = body.value as TournamentResults["phase"];
      }
      break;
  }

  await saveResults(updated);
  return NextResponse.json(updated);
}
