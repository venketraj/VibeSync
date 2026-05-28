# VibeSync

AI mood sync for your music library.

VibeSync is a 7-day hackathon MVP for uploading song metadata, classifying songs into moods with a hybrid metadata engine plus APIFreeLLM fallback, and storing mood labels in Supabase so the library can later stay synced across devices.

## Tuesday Scope

Built today:

- Next.js App Router shell
- Dark landing page
- Lightweight demo signup/login backed by a Supabase `demo_users` table
- Protected dashboard
- CSV/sample metadata import
- Song table
- Hybrid local mood classifier with APIFreeLLM fallback
- Supabase storage for songs and mood labels
- Basic mood count cards

Intentionally not built yet:

- Playlist generation
- Saved playlists
- Full cross-device demo screen
- Final launch page
- Feedback collection
- Embeddings
- Spotify or Apple Music integration
- Audio upload
- Native mobile app
- Complex recommender algorithm

## Setup

```bash
npm install
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APIFREELLM_API_KEY=
```

Optional:

```bash
APIFREELLM_MODEL=apifreellm
```

`APIFREELLM_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only used in server code.

## Supabase Note

This MVP assumes these Supabase tables already exist:

- `profiles`
- `songs`
- `song_mood_labels`

The app expects `songs` to include user-owned metadata columns plus `fingerprint`, and `song_mood_labels` to include `user_id`, `song_id`, `primary_mood`, `secondary_moods`, `confidence`, `reason`, `tags`, and `classifier_version`.

Your existing `profiles` table is tied to Supabase Auth through a foreign key. The custom demo auth flow intentionally avoids that table and uses a separate `demo_users` table.

## Demo Auth SQL

Run this once in Supabase SQL Editor:

```sql
create table if not exists public.demo_users (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.song_mood_labels
add column if not exists classifier_version text;
```

Current demo auth behavior:

- Create account asks for name and email.
- Signup creates a Supabase Auth user server-side, then inserts the same id into `demo_users`.
- Login checks whether that email exists.
- A short-lived demo cookie opens protected pages.
- This is intentionally simple for the hackathon demo, not production password auth.

## Hybrid Classification

VibeSync first uses an in-house metadata mood engine. It scores genre, BPM, title, album, artist, year, and any safe lyrics snippet against the fixed mood taxonomy. If local confidence is at least `0.65`, the app saves that local classification immediately.

If local confidence is low, VibeSync calls APIFreeLLM as a fallback from server code only. If APIFreeLLM fails or returns invalid JSON, the app falls back to the local result. This reduces cost, improves speed, and keeps the app useful even if the external LLM API fails.

## Tuesday Demo Steps

1. Start the app with `npm run dev`.
2. Create an account with name and email at `/login`.
3. Open `/dashboard`.
4. Click `Import sample library`.
5. Click `Classify songs`.
6. Confirm total songs, classified count, and mood cards update.
7. Open `/library` and verify moods appear beside songs.
8. Logout, login again, and confirm the stored songs still appear.

## Wednesday Checkpoint

Completed for Wednesday:

- Hybrid local-first classification with APIFreeLLM fallback
- Bulk classification for up to 50 unclassified songs
- Mood dashboard with counts and percentages
- Library mood filtering
- Manual mood correction
- Classifier source visibility
- Checkpoint-ready documentation

VibeSync first uses an in-house metadata mood engine. If confidence is low, it calls APIFreeLLM from server code only. If APIFreeLLM fails, the local result is still saved so the demo remains useful.

Current demo flow: sign in, import sample songs or upload CSV, classify unclassified songs, review the dashboard, filter the library, and manually correct a mood.

Checkpoint docs:

- [Product brief](docs/WEDNESDAY_PRODUCT_BRIEF.md)
- [Investor one-pager](docs/WEDNESDAY_INVESTOR_ONE_PAGER.md)
- [User flow](docs/WEDNESDAY_USER_FLOW.md)
- [Deck content](docs/WEDNESDAY_CHECKPOINT_DECK_CONTENT.md)

Known limitations:

- Demo auth is intentionally simple.
- Playlist generation is not built yet.
- External music integrations are not built yet.
- APIFreeLLM is only used as fallback when local confidence is low.

## Mood Taxonomy

The Tuesday MVP uses exactly:

```txt
happy, sad, calm, energetic, romantic, focus, party, workout, nostalgic, angry
```

## Thursday Prototype Progress

Added in Thursday prototype:

- Playlist generation added
- Save playlist added
- Feedback events added
- Sync proof added
- Privacy note added
- Validation plan added

What remains for Friday:

- Final launch narrative and demo polish
- Validation interview execution and synthesis
- Final acceptance walkthrough and checkpoint-ready packaging

## Final Hackathon Launch

### Product overview

VibeSync is a metadata-first music intelligence MVP. Users upload song metadata, classify songs by mood with a hybrid local-first approach, generate mood playlists, and keep labels synced with Supabase across devices.

Live prototype link: `TODO_ADD_PROTOTYPE_LINK`
Demo video link: `TODO_ADD_DEMO_VIDEO_LINK`
Playwright automation link: `TODO_ADD_PLAYWRIGHT_ASSETS_LINK`

### Features built

- Demo auth and protected pages
- CSV upload and sample library import
- Local-first mood classification with APIFreeLLM fallback
- Dashboard mood cards and classifier source visibility
- Library mood filter and manual correction
- Playlist generation and save playlist
- Feedback events (like/hide/save)
- Cloud sync proof card
- Metadata-only privacy messaging

### Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- APIFreeLLM fallback

### Hybrid classification

VibeSync scores song metadata locally first. When confidence is low, it can call APIFreeLLM from server-only routes. If APIFreeLLM is unavailable, local fallback still returns a result.

### Playlist generation

Playlists are generated only from the logged-in user's songs, prioritizing mood matches, confidence, seed-song genre affinity, artist diversity, and freshness/randomness.

### Supabase sync

Songs, mood labels, feedback events, and playlists are persisted by `user_id` so data reappears after logout/login and on another browser session.

### APIFreeLLM usage

APIFreeLLM is used for fallback mood classification and optional playlist title/description generation. The API key stays server-side.

### Codex usage

Codex was used to scaffold, implement, and polish the end-to-end MVP, including structured APIs, docs, QA assets, and launch prep.

### Setup instructions

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add environment variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APIFREELLM_API_KEY`, `APIFREELLM_MODEL`.
4. Deploy.
5. Test the deployed URL end to end (login, sample import, classify, playlist, sync).

### Known limitations

- Metadata-only classification can be imperfect for ambiguous songs.
- No audio upload or playback in this MVP.
- No Spotify/Apple integrations in this launch version.

### Friday submission checklist

- Prototype link ready
- Demo video ready
- Validation summary ready
- Launch post draft ready

## Advanced Friday Polish

- Playlist explanation added
- Export CSV added
- PWA/mobile-ready polish added
- Native mobile local song scanning is a roadmap item, not part of this MVP
