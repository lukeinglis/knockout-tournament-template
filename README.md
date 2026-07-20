# Knockout Tournament Template

A config-driven fantasy bracket app built with Next.js 16, Tailwind CSS, and Vercel KV. Supports any bracket-style tournament: World Cup, Euros, March Madness, club competitions, and more.

## Quick Start

1. Clone this repo
2. Edit `tournament.config.ts` with your tournament's teams, groups, bracket, and scoring rules
3. Set up Vercel KV (add `KV_REST_API_URL` and `KV_REST_API_TOKEN` to `.env.local`)
4. `npm run dev`

## How It Works

### Single Config File

Everything about your tournament is defined in `tournament.config.ts`:

- **Teams**: name, code, flag emoji, group assignment
- **Groups**: how many groups, teams per group, how many advance
- **Bracket**: knockout rounds with point values, matchup seeding, bracket wiring
- **Scoring**: points per group position, bonus picks, late submission penalties
- **Dates**: when picks open/close, when picks are revealed, tournament end
- **Branding**: name, subtitle, colors, admin emails

### Two-Tier Scoring

- **Tier 1** (Group Stage): Predict group standings + bonus picks (Golden Boot, etc.)
- **Tier 2** (Knockout): Fill out the bracket + bonus picks (MVP, etc.)

### Admin Results UI

Mark results through `/admin/results` instead of editing code:
- Set group final standings
- Mark knockout match winners (auto-advances to next round)
- Set bonus pick results (player names, team codes)

### Features

- Simple name + email auth (no passwords, perfect for friend leagues)
- Live leaderboard with sortable columns
- Bracket picker (interactive) and bracket display (read-only)
- Late submission penalty system
- Fuzzy player name matching for bonus picks
- Auto-refresh during live matches

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` | Yes | Vercel KV connection URL |
| `KV_REST_API_TOKEN` | Yes | Vercel KV auth token |

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Project Structure

```
tournament.config.ts          # Your tournament definition
src/
  lib/
    types.ts                  # TypeScript types
    config.ts                 # Derived values from tournament.config
    storage.ts                # Vercel KV storage layer
    auth.ts                   # Name + email auth
    scoring.ts                # Scoring engine (reads config + KV results)
  app/
    admin/results/            # Admin UI for managing results
    join/                     # Player registration
    my-picks/                 # Pick submission
    leaderboard/              # Standings
    groups/                   # Group standings and picks
    rules/                    # Auto-generated from config
  components/
    bracket/                  # Bracket display and picker
    leaderboard/              # Sortable standings table
```

## Deploying

Deploy to Vercel with one click. The app uses Vercel KV for storage, which is provisioned through the Vercel Marketplace.

## Credits

Built from lessons learned running a 44-participant World Cup 2026 Fantasy contest.
