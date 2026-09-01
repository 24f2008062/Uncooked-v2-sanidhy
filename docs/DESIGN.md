# Uncooked — Design system

**Date:** 28 August 2026  
**Source of truth in code:** `src/app/globals.css`  
**Related:** [BLUE_OCEAN.md](./BLUE_OCEAN.md), [SECURITY_TEST.md](./SECURITY_TEST.md)

Use this file when adding or changing UI. Match what already ships. Do not invent a second visual language.

---

## 1. Intent

Uncooked should feel like a **calm campus operations tool**, not a noisy social feed.

- Dark-first (Luma-adjacent, not a clone of Instagram).
- Pink → orange → gold only for emphasis (CTAs, badges, focus).
- Large radius, quiet borders, one ambient glow per page.
- Honest copy. No fake telemetry, PCI, or 99.99% uptime on marketing surfaces.

Blue-ocean implication: the UI should make **trust visible** (verified host, signed pass, spots left) and keep **noise low**.

---

## 2. Foundations

### Type

- UI: Inter (`--font-inter`)
- Mono (IDs, stats, pass codes): Geist Mono (`--font-geist-mono`)
- Page titles: 3xl–5xl, bold, tight tracking
- Body: `text-sm` / `text-xs`, `--text-secondary`
- Labels: 10px, bold, uppercase, wide tracking

### Colour (dark, default)

| Token | Hex / value | Use |
| :--- | :--- | :--- |
| `--bg-primary` | `#0a0a0a` | Page |
| `--bg-secondary` | `#111111` | Footer, elevated bands |
| `--bg-card` | `#1a1a1a` | Cards, forms |
| `--text-primary` | `#f5f5f5` | Headings, values |
| `--text-secondary` | `#a0a0a0` | Body |
| `--text-muted` | `#666666` | Hints |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Default stroke |
| `--accent-pink` | `#f472b6` | Gradient start |
| `--accent-orange` | `#fb923c` | Primary accent, icons |
| `--accent-gold` | `#fbbf24` | Gradient end |
| `--accent-emerald` | `#34d399` | Success, free, verified |
| `--accent-indigo` | `#818cf8` | Occasional cool accent |

CTA fill: `linear-gradient(135deg, #ec4899 0%, #f97316 100%)`.  
Page wash: one blurred orange/pink circle (`bg-orange-500/10`, `blur-[140px]`), `pointer-events-none`.

Light theme exists via `[data-theme="light"]`. New screens must still read in light (tokens, not hardcoded `#fff` on text).

### Radius, space, motion

| Token | Value |
| :--- | :--- |
| `--radius-sm` … `--radius-xl` | 8 / 12 / 16 / 24px |
| Pills / primary buttons | `--radius-full` |
| Nav height | 64px |
| Content width | `max-w-[1100px]`–`1240px`, or `--content-max-width` |
| Tap target | **min 44px** (`.btn-primary` / `.btn-secondary`) |
| Fast / base / slow | 150 / 250 / 400ms cubic-bezier(0.4, 0, 0.2, 1) |

Hover lift only when `@media (hover: hover)`. Touch: no sticky translate.

---

## 3. Components (reuse these, don’t fork)

| Pattern | How |
| :--- | :--- |
| Page shell | `Navbar forceDarkTop` + `Footer` + optional `AgentWidget` on public pages |
| Account pages | `AccountNav` on `/dashboard`, `/profile`, `/host/apply` |
| Card | `rounded-3xl bg-card border border-border-subtle` |
| Event card | Image 48 (`h-48`), category + price pills, title, host, date/location, full-width action |
| Form field | `bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm`, focus `border-[var(--accent-orange)]` |
| Primary action | Gradient button **or** `.btn-primary` (white pill) — pick one per page, don’t mix five CTA styles |
| Secondary | `.btn-secondary` or ghost `border-border-subtle` |
| Pass | `TicketPassCard` + HMAC QR only for the owner |
| Status | Emerald = ok / free / verified; amber = pending; red = denied / danger |

Navbar: Events → `/events`. Signed-in: Dashboard + Profile. Do not send “Events” to `/dashboard`.

---

## 4. Layout recipes

**Marketing / listing** (`/`, `/events`, `/opportunities`, `/host`)  
Centered header, optional stats row, filter bar as a card, 1/2/3 column grid, bottom CTA band.  
Homepage hero CTAs (Luma-style pair): primary **Create Your First Event** → `/create`; secondary **Discover Events** → `/events` (never `/dashboard`).

**Detail** (`/events/[id]`)  
12-column: 7 content (banner, about, schedule) + 5 sticky pass/register card.

**Create** (`/create`)  
Auth required. Verified ORGANIZER/SUPER_ADMIN: 12-column form (7 main fields + 5 sticky options: ticket, capacity, waitlist) posting to `POST /api/events`. Non-hosts: card pointing to `/host/apply`. Reuse `AccountNav` + form field tokens.

**Scanner** (`/host/scanner/[eventId]`)  
Auth required. Host/admin door tool: paste HMAC pass JSON → `POST /api/events/[id]/check-in`. Emerald success / red invalid. No fake offline claims.

**Account** (`/dashboard`, `/profile`, `/host/apply`, `/create`)  
`AccountNav` under the title, then cards. Dashboard: 3 stat tiles, then passes + applications.

**Admin** (`/admin/*`)  
Separate dark console (`#09090b`, sidebar). Do not reuse marketing Navbar. Fail closed on 401/403.

---

## 5. Content and trust (design is copy too)

Show:

- Verified host name on event cards and detail
- Spots left / capacity (not fake “3,500 registrations” unless it is live data)
- Pass ID + QR only after a real registration
- 18+, consent, and privacy controls in profile — not hidden

Never show in UI:

- PCI-DSS, 99.99% uptime, completed pen tests
- `.edu` auto-verify, SMS, Apple/Google Wallet, native scanner app
- Invented campus counts
- Other attendees’ emails on public pages

Tone: short, specific, campus-operational. Prefer “Get pass” / “Apply to host” over “Delightful zero-noise OS.”

---

## 6. Accessibility and images

- Contrast: body on `#0a0a0a` uses `--text-secondary` or lighter, not `--text-muted` for primary instructions
- Icon + text on actions; don’t rely on colour alone for status
- `next/image`: only `images.unsplash.com` and `ui-avatars.com` (see `next.config.mjs`)
- Meaningful `alt` on event banners; decorative mesh can be empty alt
- Focus rings: orange, visible on keyboard

---

## 7. Checklist before merging UI

- [ ] Uses tokens / existing card and button classes
- [ ] Works at 320px and at 1280px+
- [ ] Light theme still readable
- [ ] Tap targets ≥ 44px
- [ ] No new remote image hosts
- [ ] No new PII on a public surface
- [ ] Copy matches what the API actually does
- [ ] Motion is opacity/transform only (no layout thrash)

If a screen needs a new pattern, add it here first, then to CSS, then to the page.
