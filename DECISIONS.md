# Implementation decisions

The build brief left several details intentionally open. Where it was silent
or ambiguous, the choices below were made to keep the prototype simple and
honest. Each is small enough to be reversed.

## Stack

- **State:** Zustand (not React context) — slightly less ceremony for a
  reducer-with-actions store, and selector subscriptions help the message
  list rerender cheaply.
- **No localStorage persistence.** The brief allows skipping it; this
  prototype is fully ephemeral. Reload starts at the seeded state.
- **No router.** A single `App` with overlay/drawer toggles is enough for
  the views the spec calls for (floor board, control panel, walk-in modal).

## Time model

- Each beat carries an in-fiction `HH:MM` timestamp. Posting a message
  ratchets the global clock forward to that value (it never moves
  backward inside a scenario). When several scenarios run together, the
  clock reflects the latest beat across all of them.
- Real-time pacing (`delayMs` / playbackSpeed) is independent of the
  fictional timestamps. A 0.5× speed means each delay is doubled in
  wall time; the fictional clock still jumps by whatever the next beat
  says.

## Scenario engine

- **Three beat kinds:** `auto` (fires on a timer / step click and
  advances via `next`), `button` (halts; user clicks a button whose
  `nextBeatId` resumes), `form` (opens the pod intake modal; submit
  jumps to `next` or, for form `branchButtons`, a non-default beat).
- **Decorative buttons.** Buttons on a message that have no `nextBeatId`
  do nothing — they are visual stand-ins for actions the scenario
  doesn't model (e.g. "Edit visit", "Reassign VM"). This keeps cards
  honest without inventing flows.
- **Missing branch beats** (when a form's branch button points to a beat
  that doesn't exist in the active scenario) print a one-line
  simulator notice and pause the instance. The brief asks for the
  branches to live as standalone scenarios in 7.6, so we don't
  duplicate them inside the screening tree.
- **Live messages** use a `liveKey` to update in place rather than
  posting a new message — modeled after Slack's `chat.update`. The
  `#ops-today` row uses its own dedicated dashboard pane rather than a
  stream of edited messages, which makes the dashboard nature
  obvious.

## Render mode resolution

- A workspace setting `Native | Image | Side-by-side`. Per-message
  `renderMode` is honored as an override. `auto` and per-template
  capability decide fallback: image-only templates always render as
  images regardless of mode.
- "Image mode" is a visual treatment only, per Section B.6 of the
  brief: the same React component is rendered into a non-interactive
  framed container. No Puppeteer / Playwright / image pipeline.

## Roles & visibility

- Six roles are selectable; the brief lists four (VM, FM, Doctor,
  Technician). Nurse and FC are added because messages address them
  by name in the scripted scenarios.
- Switching role changes the visible user handle (e.g. Doctor → `dr.anand`).
  Ephemeral messages and DMs render only when the recipient matches the
  current handle.
- The role-channel filter (`#role-vm`, `#role-fc`, `#role-fm`,
  `#role-techs`) shows only the role channel matching the current
  viewer to keep the sidebar honest.

## Visual

- Slack aubergine (`#19171D` / `#3F0E40`) is the sidebar; main pane is
  white. ACKO sage (`#7BA694`) is the primary button colour and live
  badges. Warm neutral (`#FAF6F1`) sits behind cards and the
  ops-today dashboard.
- Avatars are coloured monograms; bots get a stable 2-letter mark
  (`VB`, `PB`, `AR`) so they are distinguishable at a glance.

## Out-of-scope clarifications

- The `/queue` and `/escalate` slash commands are recognised by the
  composer but currently dispatch a no-op event. They are reserved for
  the next iteration; the brief lists them as composer affordances
  but does not define their full flows.
- `Branch injector` from the control panel (stretch) is not built.
  Branches run as standalone scenarios from the scenario list.
