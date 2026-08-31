# Uncooked — Red Ocean vs Blue Ocean

**Date:** 28 August 2026  
**Audience:** product, engineering, go-to-market  
**Related:** [SECURITY_TEST.md](./SECURITY_TEST.md), [DESIGN.md](./DESIGN.md), [IT_ACT_INDIA.md](./IT_ACT_INDIA.md)

This is the strategy Uncooked should execute. It is not a slogan. It maps to routes and roles that already exist in this repo.

---

## 1. The two oceans

**Red ocean** = compete inside the existing “student events / ticketing / campus social” market. Beat rivals on features, fees, and ads. Capture demand that already uses Instagram, WhatsApp, Unstop, Townscript, Luma, Google Forms.

**Blue ocean** = create space those products cannot occupy: **verified campus operations**. A dean, a gate volunteer, and a sponsor all trust the same list because the host is verified and the pass was scanned.

| | Red ocean | Blue ocean for Uncooked |
| :--- | :--- | :--- |
| Question | How do we beat Eventbrite / Unstop / Luma? | How do we make “Instagram RSVP” insufficient for a real campus event? |
| Buyer | Students hunting fests | Clubs + college + sponsors (students stay free) |
| Demand | Existing event-goers | Trust, footfall proof, official guest lists |
| Trade-off | More features vs lower price | Trust + ops without a noisy feed |
| Uncooked trap | “Luma for India” | Density in one campus, scanner + verified hosts |

**One-line strategy**

- Red: “Better Eventbrite for Indian colleges.”
- Blue: “The only list a dean, a gate volunteer, and a sponsor will all trust.”

---

## 2. Current red ocean (do not stay here)

Rivals by job-to-be-done:

| Job | Default tools |
| :--- | :--- |
| Discovery | Instagram, WhatsApp, posters |
| Registration | Google Forms, Unstop, Dare2Compete |
| Paid tickets | Townscript, BookMyShow, Razorpay links |
| Pretty RSVP | Luma, Eventbrite |
| Official lists | College ERP, Excel |

Red-ocean behaviour Uncooked must stop:

- Fake scale (120+ campuses, 99.99% uptime, PCI-DSS)
- Feature race: Aura, live chat, wallet passes, native app copy
- Competing on take-rate before the door scanner exists
- Homepage as an Instagram clone

If positioning is “Luma for India,” Uncooked is in their ocean with less brand and less capital.

---

## 3. Blue ocean (what to own)

**Product:** operating system for **verified campus activity** — host identity, a cryptographic pass, a guest list a college can stand behind, and a path from event → club → opportunity.

**Non-customers to pull in**

1. **Soon-to-be:** clubs on Forms + Excel, if publish is ~3 minutes and they get a verified badge (`/host/apply` → admin review → `/host`).
2. **Refusing:** faculty advisors, student welfare, hostel wardens who will not treat Instagram as official.
3. **Unexplored:** sponsors and recruiters who will not fund an unverified page; institutions that need DPDP-shaped handling of student data.

New money: **colleges and sponsors paying for trust**, not students paying for another app.

---

## 4. Strategy canvas

What to move vs typical tools:

| Factor | Instagram | Unstop | Townscript | Uncooked if red | Uncooked if blue |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Viral feed / noise | High | Med | Low | Med | **Low** |
| Ticket take-rate as the story | n/a | Med | High | Tempting | **Low / free-first** |
| Social graph | High | Low | Low | Don’t build | Don’t build |
| Check-in that works | None | Weak | OK | HMAC only today | **Scanner live** |
| Host is who they claim | None | Weak | Weak | Apply flow exists | **College-backed badge** |
| Campus admin control | None | None | None | Admin console | **Campus of record** |
| Event → job path | None | Jobs only | None | Separate board | **Same journey** |
| India privacy / DPDP | None | Weak | Weak | Already in code | **Sell to institutions** |

---

## 5. ERRC grid (Four Actions)

### Eliminate

- Viral live feed, fake CPU telemetry, Aura-as-product
- PCI / 99.99% / pen-test / native-app / SMS / wallet claims
- Face tracking, DMs, national ads before one campus is habitual

### Reduce

- Student-facing noise: one discovery surface (`/events` + `/events/[id]`)
- Time-to-host: apply → approve → publish (already the path)
- Personal data collected (DPDP is a product feature)

### Raise

- **Verified host** on every public event card; unpublished if unverified
- **Pass integrity:** HMAC already exists → finish door scanner
- **College admin:** weekend view, suspend, privacy-safe guest list
- **India-grade trust:** 18+, export/erase, grievance officer — sold to institutions

### Create

- **Campus of record** (Lucknow / one college slug first), not 120 campuses
- **Event → opportunity loop** on the event details page
- **Sponsor pack:** checked-in count, not registration vanity
- **Faculty advisor seat:** attest a club without becoming `SUPER_ADMIN`

---

## 6. Implementation on this codebase

Already in the repo (do not rebuild):

- Roles: `USER` / `ORGANIZER` / `SUPER_ADMIN`
- Host apply: `/host/apply`, `POST /api/host/apply`, admin review
- HMAC tickets: `src/server/tickets/hmac.js`
- Events, opportunities, dashboard, profile, DPDP export/erase
- Admin lock / role (cannot grant `SUPER_ADMIN` from console)

### Phase 1 — close the ocean (ship next)

| Item | Where |
| :--- | :--- |
| Door scanner | New `/host/scanner/[eventId]`; verify HMAC; set `checkInStatus` |
| Verified-only public catalog | `GET /api/events` only approved organisers |
| Campus as first-class | `campus` on User/Event; filter `/events` |
| Real footfall | checked-in count for hosts (not fake telemetry) |
| Event ↔ opportunity | “Hiring at this fest” on `/events/[id]` |

### Phase 2 — make rivals irrelevant

| Item | Where |
| :--- | :--- |
| `CAMPUS_ADVISOR` role | Attest host apps for one campus only |
| Privacy-safe attendee export | Name yes; email only if the student opted in |
| Free events remain free | Paid take-rate only after scanner is trusted; Razorpay hosted checkout (SAQ A) later |
| One-city density | Student councils and clubs in Lucknow first |

### Phase 3 — do not build (red ocean)

Aura LLM, Pusher chat, recommendation-score theater, multi-PSP, wallet passes, “enterprise OS” fake stats, national campaign before one campus is default.

---

## 7. Who pays (matches the ocean)

| Buyer | Offer | Why blue |
| :--- | :--- | :--- |
| Students | Free discover + free RSVP | Do not tax the demand side |
| Clubs | Free to host free events | Switch cost from Forms ≈ 0 |
| Paid fests | Small % **after** scanner works | Compete on ops, not 2% vs 3% |
| College | Annual campus seat (advisor + audit + DPDP) | New buyer |
| Sponsors | Pay for **checked-in** report | Demand Instagram cannot sell cleanly |

---

## 8. Decision rule

If a feature helps **Instagram-style discovery** more than **gate + dean + sponsor trust**, it is red ocean. Cut it.

If a feature makes an unverified WhatsApp list look unsafe next to Uncooked, it is blue ocean. Build it.

Next engineering bets, in order: **scanner → verified-only listings → campus slug → event-to-job link.**
