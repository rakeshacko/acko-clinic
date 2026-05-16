# Decisions taken after V1

V1 (commit `5f8988e`) was the desktop-only prototype that landed on
the feature branch. Everything in this document was decided during the
follow-on session, in roughly the order it happened. It complements
`DECISIONS.md` (the V1 choices) — together they are the full record.

## 1. Branch + deploy

- All V1 work was on `claude/clinic-floor-slack-prototype-NZxUe` per
  the harness instructions, which is why `main` was empty when the
  user first tried to deploy. Resolved by explicit user request to
  merge to `main` (fast-forward, no merge commit) and push.
- Recommended hosts for a frontend-only Vite app: **Vercel** (easiest
  from a phone browser, auto-detects Vite, preview URL per push) or
  **Netlify** / **Cloudflare Pages** (same shape). **StackBlitz** for
  instant in-browser preview without an account. No CLI required for
  any of these — they all work from a mobile browser.
- We do not deploy from the agent session — the providers need user
  auth credentials we don't carry.

## 2. Mobile / responsive layout

Clinic staff are on phones, not desktops. The desktop 4-pane shell
collapses to a single-pane app shell under the `md` breakpoint
(<768 px).

- **Single visible pane on mobile.** Sidebar (channel list) and
  channel pane are mutually exclusive. Tapping a channel hides the
  list; a back arrow in the channel header returns to it. State lives
  in the store as `mobileSidebarOpen`. On desktop both panes are
  always visible regardless of this flag.
- **Bottom tab bar** replaces the desktop left rail on mobile: Home /
  Channel / Floor / Run. Carries an unread badge on Home. Switching
  tabs dismisses any active overlay (cockpit, floor board) so
  navigation stays predictable.
- **Cockpit and floor board** become full-width sheets that stop
  56 px short of the bottom, leaving the tab bar visible. The
  desktop floating "Run a visit" FAB is hidden on mobile (the tab bar
  carries it).
- **Modals** (pod intake, walk-in) slide up from the bottom edge as
  bottom sheets on mobile, centred on desktop.
- **Composer** drops its formatting toolbar on mobile and becomes a
  single-row input. iOS auto-zoom suppressed by forcing
  `font-size:16px` on inputs/textarea/select at `max-width:768px`.
- **Ops-today rows** render as touch-target cards on mobile and as a
  table on desktop. Same data, different layouts.
- **Templates and Block Kit cards** changed every fixed width
  `w-[Npx]` to `w-full max-w-[Npx]` so nothing horizontally
  overflows. Field grids stack to one column under `sm`. The
  screening-report's two panels stack vertically.
- **iOS safe areas:** `viewport-fit=cover`, `env(safe-area-inset-*)`
  padding on the tab bar and sidebar header.
- **Viewport height:** `100dvh` (dynamic viewport height) on the
  root instead of `100vh`, because `100vh` on iOS includes the URL
  bar and breaks layouts that try to fill the screen.
- **Lock the document.** `html`, `body`, `#root` use
  `overflow: hidden`, `overscroll-behavior: none`, and `body` is
  `position: fixed; inset: 0` so iOS rubber-band can't scroll the
  page out from under the app shell.
- **Constrain inner scroll.** `min-h-0` at every level of the flex
  chain (root → pane wrapper → pane root → scroll container) so
  `flex-1` can actually shrink and let `overflow-y:auto` kick in.
  Without this the message list pushes the page taller than the
  viewport and the whole document scrolls. Scroll containers also
  get `overscroll-contain` and `-webkit-overflow-scrolling: touch`
  for native iOS momentum.

## 3. The click / role model

The biggest design question of the session: who can act on a button,
and how do other viewers see who acted?

- **Slack-faithful rule:** a regular Slack message renders
  **identically** for every viewer. There is no per-user rendering of
  `chat.postMessage` content; the only "addressed to one person"
  surface Slack has is the ephemeral message, which is a separate
  message. We cannot show the same message with different button
  states to different viewers. An earlier proposal to do exactly
  that was rejected as fake-Slack — would have broken Section A of
  the brief.
- **What real Slack apps do** for role gating: anyone in the channel
  can click any button (no way around that); the app receives the
  clicker's `user_id` in the interaction payload and decides what to
  do — usually post a confirmation, optionally `chat.update` the
  original message to add an "Acted by …" line, or send an ephemeral
  reject toast. The `@`-mention in the message body is the **social
  signal** for "this is your action," not an enforcement mechanism.
- **Our model:** anyone can click. When clicked, the message gets an
  in-place `✓ {Name} · {role} · {button label} · {HH:MM}` line and
  all of its buttons go disabled. Mirrors `chat.update` on the same
  message; visible to everyone in the channel, since that's how
  Slack actually behaves.
- **`Message.actedBy`** is the new field carrying this state. Only
  one click per message; subsequent clicks are no-ops. Disabled state
  flows through `NativeBlock` via a `lockedByAction` flag.
- **Reactions are not used to drive flow.** We previously asked the
  technician to "react 👋 on contact, then click *Patient with me*"
  in the handoff card — that's bookkeeping that the user shouldn't
  have to do. We briefly added an auto-reaction side effect to keep
  the visual convention, then removed it once the acted-by line
  rendered: the line carries the same information and is harder to
  miss. Reactions remain available as a normal Slack affordance
  (click any emoji pill to add yours), they just don't gate the
  simulation.

## 4. Acting-as picker

- The cockpit's old 6-button role grid (`VM / FC / FM / Doctor /
  Nurse / Tech`) became a single dropdown listing every staff member
  by full name and role label ("Sneha Reddy · Cardiac technician").
  Reasoning: a handoff moves between specific people, and the
  category picker forced the user to guess which seeded handle each
  role mapped to. Now you pick the actual person.
- `setCurrentUser(handle)` is the new store action; it sets
  `currentUserHandle` and derives `currentRole` from the staff
  record. The old `setCurrentRole` is kept for the desktop FAB
  flow.
- Below the dropdown we show the chosen staff member's avatar, name,
  and handle, plus a one-line explainer ("Buttons in the channel
  only show 'Acted by you' when this person clicks").

## 5. Copy and nomenclature

The cockpit and scenario titles were too engineering-flavoured.
Renames, all user-facing:

- Section headings: *Scenarios* → **Start a visit**; *Branches* →
  **Things going wrong**; *Running* → **In progress**; *Playback* →
  **How fast**; *Card rendering* → **Card style**; *Views* →
  **Other views**; *Reset* → **Start over**.
- Buttons: *Run* → **Start**; *Run the day (launch 4)* → **Start a
  busy day (4 visits)**; *Step* → **Next step**; *Reset everything*
  → **Clear everything**. Render modes labelled **Slack-native /
  Image card / Compare** instead of the literal `native / image /
  side-by-side`.
- Scenario titles: e.g. *Screening · P. Sharma (flagship)* →
  **Annual screening — Priya Sharma**; *B7 · Machine failure (CT)*
  → **CT machine down mid-visit**. All eight branch scenarios
  renamed similarly. Each carries a one-line `subtitle` explaining
  what happens.
- In-progress instances show the current beat's human label
  ("Cardiac pod handoff") instead of the internal beat id
  ("cardiac-handoff").
- Visit channel topics changed from `SCREENING · P. Sharma` to
  `Annual screening · P. Sharma`.
- Cockpit FAB label: *Control panel* → *Cockpit* → **Run a visit**.

The handoff card body was rewritten too: from "Technician please
react 👋 on contact, then click *Patient with me* to open the
intake" to "*P. Sharma* arriving at *Cardiac pod*. Open the intake
when she's with you."

The patient-identity rules from the brief still apply: full name
appears only on the pinned visit card; everywhere else it's `P.
Sharma` (first initial + last name).

## 6. Card redesign

The original cards were rectangles with text. They needed to read as
designed UI:

- **Visit card.** Gradient header band with a coloured avatar circle
  carrying the patient's initials; visit-type chip + member-status
  chip; iconified info rows for time / duration / package / concern
  / refreshment / accessibility; an "Assigned" section with mini
  PersonChips for VM, doctor, ops anchor; pinned-state footer with
  the visit ID.
- **Pod result.** Top status strip in green (complete) or amber
  (flagged), with a tick or warning glyph and the start→finish
  window. Title row with pod emoji, name, technician. A three-up
  hero grid for the primary readouts (BP / pulse / position
  equivalents), with smaller secondary key-value rows underneath.
  Comfort cues render as sage-tinted inline chips. Flag callout in
  amber. Next-pod pointer in a warm footer.
- **Checkout.** Progress bar showing X / Y items checked. Divided
  list with proper checkbox glyphs. Total-time footer.
- **Escalation.** Left-side stripe (red for error, amber for
  warning) and tinted header band with the severity label, then
  title, detail, and small uppercase context line.

The two image-only templates (`screening-report`,
`floor-board-snapshot`) keep their existing layouts; they were
already designed enough.

When a Native mode is requested for an image-only template, a small
context line appears above the image-card frame explaining why
("This template can only render as an image card — Block Kit can't
express it natively"), so the side-by-side comparison reads honestly.

## 7. Misc UX fixes

Small things found while testing:

- **B7 ops-today status** updated on each resolution path
  (recovered / rescheduled / refunded) so the row doesn't read
  "CT BLOCKED" forever after the user picks a fix.
- **Sidebar DMs filtered** by current user so multiple bot DMs
  don't all show as "VisitBot" under one role.
- **Visit channel headers** carry the `#` prefix to match Slack.
- **"Start a busy day"** stays on `#ops-today` so all four scenarios
  populate the dashboard live, instead of bouncing the user to the
  last started channel.
- **Start dismisses the cockpit.** Clicking Start on a scenario
  closes the cockpit overlay so the user lands on the visit channel
  they just started, instead of staying behind the Run drawer.
- **Clock model** moved to "always equal to the latest beat
  timestamp" (including across day boundaries), so the screening's
  Friday-17:30 booking → Monday-08:00 morning digest no longer
  leaves the clock stuck.

## 8. Glossary fixup

For the record: **Visit Manager** is a staff role (Kavya Rao is
ours), not a bot. The three bots are **VisitBot**, **PodBot**, and
**AppRelay** with avatar marks `VB`, `PB`, `AR`. This came up once
in conversation; nothing in the code changed.
