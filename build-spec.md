# ACKO Clinic Floor Simulator — Build Brief

## 1. What you are building

A browser-based prototype that **looks like Slack and behaves like Slack**, used to simulate how the ACKO Clinic physical floor is coordinated. It is not connected to Slack, has no backend, and makes no network calls. Everything runs in the browser as an in-memory simulation.

ACKO Clinic is a physical health clinic. Its floor staff coordinate every patient visit through chat channels — one ephemeral channel per visit — driven by three bots. This prototype recreates that chat environment and lets a viewer watch, or play, a clinic day: full-body screenings, doctor consultations, single diagnostic tests, walk-ins, and the failure paths that happen when things go wrong.

The prototype must be convincing enough that someone who uses Slack daily feels at home, and complete enough that a viewer can step through any clinic workflow end to end.

## 2. What it must demonstrate

A viewer should be able to:

1. Watch a full-body screening run across nine diagnostic pods, coordinated entirely through a visit channel.
1. Watch a doctor consultation, including a test ordered mid-consultation.
1. Run a walk-in (both member and non-member) where staff create a visit on the spot.
1. Run a single diagnostic test booking.
1. Trigger failure branches — late patient, doctor unavailable, blood-draw failure, machine breakdown, patient walk-out — and see how the chat absorbs them.
1. See a live floor board showing every room’s status, so the room-as-a-constraint logic is visible, not just implied.
1. Switch roles (Visit Manager, Floor Manager, Doctor, Technician) and see how the same workspace looks different to each — DMs and private messages are role-scoped.

## 3. Tech stack and hard constraints

- **Framework:** React with Vite. TypeScript preferred.
- **Styling:** Tailwind CSS.
- **State:** in-memory React state (a store via Zustand or React context + reducer). Optionally persist a session to `localStorage` so a reload resumes; if persistence adds complexity, skip it.
- **Runs with:** `npm install && npm run dev`. No environment variables, no API keys.
- **No backend.** No server, no database, no WebSocket, no Slack SDK, no Slack API, no AI or image-generation calls. The “bots” are simulation code.
- Any visual that represents a clinical report must be a templated React component with hardcoded fields. Never generate report imagery.
- Single repository, single app. Keep it simple to read and run.

## 4. Domain model

Seed all of this as static data the app boots with.

### 4.1 Bots

Three simulated bots post messages. They are not interactive agents; they are scripted by the simulation engine.

|Bot         |Responsibility                                                                                                                     |
|------------|-----------------------------------------------------------------------------------------------------------------------------------|
|**VisitBot**|Visit lifecycle: channel creation, the pinned visit card, handoffs, room-ready notices, checkout, channel close.                   |
|**PodBot**  |Clinical forms and their results: pod intake modals, structured result summaries, finding escalations, doctor wrap-up records.     |
|**AppRelay**|The bridge to the patient’s phone: in-transit notices, arrival events, and one-line descriptions of pushes sent to the patient app.|

### 4.2 Staff

|Name          |Handle           |Role                       |
|--------------|-----------------|---------------------------|
|Kavya Rao     |`@kavya.rao`     |Visit Manager              |
|Anjali Pillai |`@anjali.pillai` |Floating Concierge         |
|Rohit Iyer    |`@rohit.iyer`    |Floor Manager / Ops Anchor |
|Dr. Anand     |`@dr.anand`      |Doctor (GP)                |
|Dr. Meera     |`@dr.meera`      |Doctor (GP)                |
|Dr. Priya     |`@dr.priya`      |Doctor (GP)                |
|Geetha Murthy |`@geetha.murthy` |Nurse                      |
|Sneha Reddy   |`@sneha.reddy`   |Cardiac technician         |
|Ananya Sen    |`@ananya.sen`    |CT technician              |
|Vikram Joshi  |`@vikram.joshi`  |Oral technician            |
|Nikhil Menon  |`@nikhil.menon`  |Sensory technician         |
|Farah Sheikh  |`@farah.sheikh`  |Body composition technician|
|Deepak Varma  |`@deepak.varma`  |Functional technician      |
|Aditi Bhat    |`@aditi.bhat`    |Sonography technician      |
|Maya Naidu    |`@maya.naidu`    |Cervical technician        |
|Reshma Qureshi|`@reshma.qureshi`|Mammography technician     |

Shift-rotated groups expand to whoever is on shift: `@cardio-tech-onshift`, `@ct-tech-onshift`, and so on, plus `@floating-boy-onshift` for refreshment runs. For the prototype, each group resolves to the single seeded technician for that pod.

### 4.3 Rooms

Each room carries one of three operational states: **Ready**, **Occupied**, **Blocked**. While a visit is using a room, the room emits two progress events the floor board listens for: *Process Started* and *Test Done*.

- **9 diagnostic pods:** Cardiac, CT, Oral, Sensory, Body Composition, Functional, Sonography, Cervical, Mammography.
- **4 personal pods:** PP1–PP4 (changing, sample collection, refreshment; used at the start of a screening).
- **3 consult rooms:** CR1–CR3.
- **1 lobby / welcome area.**

A screening blocks a personal pod plus a sequence of diagnostic pods. A consultation blocks one consult room. A single diagnostic test blocks one pod. Technicians can manually set a pod to Blocked (for example, machine failure) and back to Ready.

### 4.4 Channels

**Standing channels** exist permanently:

|Channel                                          |Purpose                                                                             |
|-------------------------------------------------|------------------------------------------------------------------------------------|
|`#ops-today`                                     |Live dashboard. One status thread per active visit. The Floor Manager monitors here.|
|`#alerts`                                        |Machine failures, walk-outs, urgent escalations.                                    |
|`#shift-handover`                                |Start and end of day; equipment and staffing status.                                |
|`#role-vm`, `#role-fc`, `#role-fm`, `#role-techs`|Peer coordination per role.                                                         |
|`#supplements-followup`                          |Post-visit subscription and renewal queries.                                        |
|`#audit-log`                                     |Compliance-only access log.                                                         |

**Ephemeral visit channels** are created per visit and archived after it ends. Naming: `#v-YYYYMMDD-<6charUUID>-<C|S|T>` where `C` = consulting, `S` = screening, `T` = single test. Example: `#v-20260517-A7K3M2-S`. Channel membership is managed by VisitBot; staff cannot manually invite or remove people from a visit channel.

### 4.5 Visit

A visit has: UUID, type (screening / consulting / single-test), patient (first name, last name, age, gender, member status, language, accessibility flags), package or concern, assigned VM (screening only) or doctor (consulting), ops anchor, status, current room, and an ordered list of pods for screenings.

Patient identity rules, enforced everywhere:

- Channel names use the UUID only, never the patient name.
- Inside messages, patients appear as first-initial + last-name (`P. Sharma`).
- Full name appears once, on the pinned visit card.
- No date of birth, address, or phone number in any message.

### 4.6 Message

A message has: id, channel, author (bot or staff), timestamp (in-fiction clinic time, `HH:MM` 24-hour), a source type that drives a coloured left bar, body text, optional Block Kit card, optional buttons, optional reactions, and an optional `visibleOnlyTo` handle for ephemeral messages and DMs.

Source colour bar:

- **Navy** — message in a visit channel.
- **Ochre** — direct message to a staff member.
- **Red** — alert or escalation (overrides navy when the message is an escalation).

## 5. The Slack interface

Recreate Slack’s structure closely enough that it reads as Slack at a glance.

### 5.1 Layout

- **Left rail (narrow):** workspace switcher icon, a few nav icons (Home, DMs, Activity). Decorative is fine.
- **Channel sidebar:** dark background. Sections: *Starred*, *Channels* (standing channels), *Visits* (active visit channels, sorted by date prefix), *Direct messages*. Unread channels show bold text and a count badge. The active channel is highlighted.
- **Main pane:** channel header (name, member count, topic), scrolling message list, and a composer at the bottom.
- **Right panel (optional, toggle):** pinned items and channel members.

### 5.2 Composer

The composer looks like Slack’s — text input, formatting icons, send button. In this prototype the floor is driven by buttons inside bot messages, not free typing. Keep the composer present and styled, but it only needs to support posting a plain text message into the current channel from the current role. Slash commands (`/walkin`, `/queue`, `/escalate`) are typed here and open the relevant modal or scenario.

### 5.3 Message rendering

- **Bot messages** show the bot name with an `APP` tag, like Slack apps.
- **Block Kit card:** a bordered card. Title line, then fields laid out in a two-column grid, an optional divider, then a button row. This is used for the pinned visit card, result summaries, and checkout cards.
- **Buttons:** rounded, action-verb labels (`Patient with me`, `Take over`, `Wrap up`, `Visit closed`). Destructive actions (`Reschedule`, `Skip`, `Close incomplete`) render in a red style. Maximum four buttons per message; more options open a modal.
- **Reactions:** emoji pills with counts below a message. Used as state confirmations: 👋 = staff made contact, ✅ = step complete or script delivered, 🤝 = handoff acknowledged.
- **Ephemeral messages:** rendered with a faded background and an “Only visible to you” label. Shown only when the current role matches the message’s `visibleOnlyTo`.
- **@-mentions:** rendered as blue highlighted pills.
- **DMs:** appear in the Direct messages section, visible only to the current role when it matches the recipient.

### 5.4 Bot copy style

Every bot message follows these rules. Enforce them in the message templates so nothing drifts.

- Operational tone — bots talk to staff, not patients.
- Action over status: “Handoff at Cardiac pod” beats “Patient is being handed off.”
- Always specific: real names, IDs, numbers. Never “a patient.”
- One emoji per message, at the start of the headline line, used as a scan-cue. Map: 📋 booking card, ☀️ morning digest, 🚗 in transit, 🛎️ arrival, 🤝 handoff, 🚪 room ready, 🩺 vitals/cardiac result, 🩻 imaging result, 🦷 oral result, 👁️ sensory result, 📊 body-composition result, 🏃 functional result, 🌸 cervical result, 💬 script to read aloud, ✅ step complete, ⏭️ next step, ⚠️ recoverable caution, 🚨 escalation, 📝 wrap-up record, 🛒 checkout, 🎉 milestone, 📅 reschedule.
- Status messages are 2–5 lines. Longer only for lists and wrap-ups.
- Future references use absolute time (“at 09:18”), not relative (“in 15 min”).

## 6. The simulation engine

This is the core. It plays scenarios into channels.

### 6.1 Concepts

A **Scenario** is a named, ordered tree of **Beats**. A Beat does one thing: it posts one or more messages and optionally applies side effects, then either chains automatically to the next beat or waits for the viewer.

```
Scenario = {
  id, title, type,                       // screening | consulting | single-test | walk-in | branch
  seed: { patient, channelName, preloadMessages? },
  beats: Beat[]
}

Beat = {
  id,
  trigger: "auto" | "button" | "form",   // how this beat is reached
  delayMs?,                              // for auto beats in autoplay mode
  emit: Message[],                       // messages posted when the beat fires
  sideEffects?: Effect[],                // see 6.3
  buttons?: { label, style, nextBeatId }[],   // rendered on the last emitted message
  formId?,                               // for trigger:"form" — which pod/intake modal opens
  next?: beatId                          // for auto/form beats
}
```

### 6.2 How beats advance

- **auto** beats fire on a timer (`delayMs`, default ~1500ms) in autoplay mode, or on a “Step” click in manual mode, then move to `next`.
- **button** beats render their buttons on the most recent message. The simulation pauses. Clicking a button jumps to that button’s `nextBeatId`. This is how branching works — alternative buttons lead to alternative sub-trees.
- **form** beats open a modal (the pod intake form). On submit, the entered values are interpolated into the result message, and the beat moves to `next`.

### 6.3 Side effects

A beat can apply effects to the wider simulation state:

- `createChannel`, `archiveChannel`, `lockChannel`
- `addChannelMember`, `removeChannelMember`
- `setRoomStatus(room, status)` and `emitRoomEvent(room, "ProcessStarted" | "TestDone")`
- `setOpsTodayStatus(visit, statusLine)` — updates the visit’s row in `#ops-today`
- `pinMessage`, `addReaction`
- `crossPost(message, channel)` — for example, posting a machine-failure alert into `#alerts` and `#shift-handover`

### 6.4 The clock

A logical clock displays in-fiction time. Each beat’s messages carry their scripted `HH:MM` timestamp. In autoplay the clock jumps to each beat’s stamp as it fires, so a three-hour screening compresses into roughly thirty seconds. A speed control (0.5×, 1×, 2×, 4×) changes `delayMs`. Manual mode shows a “Step” button.

### 6.5 Concurrency

Multiple scenarios can run at once. Each owns its visit channel; all of them write rows into `#ops-today` and update the shared floor board. A “Run the day” control launches three or four staggered scenarios so the Floor Manager view has something live to monitor.

### 6.6 Roles

A role switcher sets the current viewer: Visit Manager, Floor Manager, Doctor, or Technician. The role changes visibility only — ephemeral messages and DMs render only when the role matches. Default role is Visit Manager. Switch to Floor Manager to make `#ops-today` the natural home; switch to Doctor to see the private patient-history summaries.

## 7. Scenario library

Build these. Scenarios 7.1–7.5 are the core flows; 7.6 are the branches. Message bodies below are the production copy — use them verbatim. Where a beat has buttons, the **bold** button is the happy path; other buttons lead to the branch noted.

### 7.1 Screening — full flow with a flagged finding

Patient: **Priya Sharma, 34F**, ACKO member since 2024, Annual Plus screening, booked for 09:00. Channel `#v-20260517-A7K3M2-S`. Nine pods. This is the flagship scenario; script every beat.

1. **Booking confirmed (Fri 17:30)** — VisitBot posts the pinned visit card: name, demographics, package, time, expected duration ~2.5h, refreshment preference, language, accessibility, assigned VM `@kavya.rao`, ops anchor `@rohit.iyer`. Buttons: `View patient history`, `Edit visit`, `Reassign VM`. Side effect: `createChannel`, add Kavya and Rohit. *View patient history* opens an ephemeral message visible only to the clicker.
1. **Morning digest (08:00)** — DM from VisitBot to `@kavya.rao` listing the day’s three visits.
1. **In transit (08:50)** — AppRelay: “🚗 P. Sharma is on the way · ETA 10 min.” Side effect: `setOpsTodayStatus` to “In transit”.
1. **Arrival (08:58)** — AppRelay: “🛎️ P. Sharma at the lobby”, mentions `@anjali.pillai` and `@kavya.rao`. The FC reacts 👋 to confirm contact.
1. **VM takes over (09:00)** — VisitBot: “🤝 @kavya.rao is now primary steward. 🍋 Lemon water ordered.”
1. **Personal pod (09:02–09:15)** — VisitBot unlocks PP4, issues a key card; buttons `Pod ready check`, `Need a different pod`. Then a readiness message with `Patient ready`, `Need more time`. Then completion: “✅ Personal pod complete ⏭️ Next: Cardiac pod.”
1. **Cardiac pod (09:18)** — VisitBot handoff card: “🤝 Handoff at Cardiac pod, @kavya.rao → @sneha.reddy”, button `Patient with me`. Clicking it opens the **cardiac form** (form beat). On submit, PodBot posts the cardiac result summary (BP, pulse, blood draw attempts, sample IDs, comfort cues). Side effects: `emitRoomEvent` Process Started then Test Done.
1. **Inter-pod nudge (09:32)** — DM from VisitBot to `@kavya.rao` with a script to read aloud. Kavya reacts ✅ in the channel.
1. **CT pod (09:38)** — handoff → CT form → PodBot CT result.
1. **Pods 3–7 (09:55–10:38)** — Oral, Sensory, Body Composition, Functional each follow the identical pattern: handoff card, `Patient with me`, pod form, PodBot summary, next-pod pointer.
1. **Sonography — flagged finding (10:38)** — handoff → sono form; the form is submitted with a “call doctor” flag. PodBot: “⚠️ Finding flagged on sonography. Adding @dr.anand to channel.” Side effect: add `@dr.anand`. PodBot then posts buttons for the doctor: `Reassured, continue screening`, `Recommend follow-up`, `Escalate to urgent`. The happy path is **Recommend follow-up**, which opens a small modal (follow-up window: within 1 week / 2–4 weeks / 1–3 months). PodBot logs the decision and removes `@dr.anand`. Screening resumes.
1. **Cervical and Mammography (10:58, 11:18)** — same pattern, two more pods.
1. **Screening complete (11:32)** — VisitBot milestone card: pods done, results live vs. pending, findings flagged. Buttons: `Yes, consult now`, `Will book later`.
1. **Consult, wrap-up, checkout (11:38–12:18)** — consult room readied, nurse logs post-screening vitals, doctor enters (ephemeral history summary visible only to the doctor), PodBot posts the doctor’s wrap-up record (diagnosis, prescription, supplements, follow-up). VisitBot posts the checkout card with a tick-list (membership, supplement subscription, follow-up bookings, dietician); button `Visit closed`.
1. **Visit closed (12:18)** — VisitBot end-of-visit summary; channel locks, then archives. Side effects: `lockChannel`, `setOpsTodayStatus` to “Closed”.

### 7.2 Consultation — full flow with an in-room test

Patient: **Rajesh Kumar, 42M**, member, persistent acid reflux. Channel `#v-20260520-D4M7L2-C`. Consultations assign a doctor at booking and use the FC and FM rather than a VM.

1. Booking card — concern noted, doctor `@dr.meera` pre-assigned, no VM.
1. Arrival — AppRelay arrival event, FC `@anjali.pillai` mentioned.
1. Routing — VisitBot: “🚪 Consult room 3 ready”, nurse `@geetha.murthy` for vitals first, doctor to follow; AppRelay pushes “Please proceed to room 3” to the patient app.
1. Nurse vitals — PodBot posts vitals (note a slightly elevated BP and a small weight gain).
1. Doctor enters — PodBot posts an **ephemeral** history summary visible only to `@dr.meera`.
1. In-room test branch — doctor clicks `Need test`; PodBot offers `Instant treatment`, `Instant test (in-room)`, `Time-taking test (lab)`. On *Instant test*, a second menu (ECG, Sonography, BP repeat, Other). On *Sonography*, PodBot requests the portable sono cart; the sono tech arrives, the test runs with the doctor present, PodBot posts the in-room finding.
1. Wrap-up — PodBot posts the doctor’s wrap-up record (diagnosis, prescription, lifestyle advice, follow-up).
1. Checkout and close — VisitBot checkout card and close, ~1h total.

### 7.3 Walk-in — non-member

Patient: **S. Mehta, 45F**, non-member, persistent cough. Trigger: in `#role-fc`, `@anjali.pillai` types `/walkin`. A modal opens (first name, last name, phone, gender, age, visit type, concern or package, member yes/no). On submit, VisitBot creates `#v-<today>-T8K2P9-C`, posts a walk-in visit card, and — because the patient is a non-member — offers `Brief membership pitch` and `Skip pitch, proceed`. Either path then proceeds as a consultation (reuse the 7.2 beats from routing onward).

### 7.4 Walk-in — member

Same `/walkin` entry, but the patient is an ACKO member. VisitBot routes straight to a same-day slot picker (`Today 14:00`, `Today 16:30`, and so on). On slot selection, the channel becomes a normal consulting visit and continues as 7.2.

### 7.5 Single diagnostic test

Patient: **Arjun Khan, 38M**, member, booked a standalone low-dose CT. Channel `#v-20260519-K2L9P4-T`. Short flow: booking card → arrival → FC routes to the CT pod → handoff → CT form → PodBot result → checkout → close. No VM, no consult unless the result flags something. This scenario exists to show the third booking type and that a single pod can be the whole visit.

### 7.6 Branch scenarios

Build each as a launchable scenario. Each can also be injected into a running screening or consultation as a stretch goal; the simpler build is standalone scenarios that start from a sensible pre-seeded channel state.

|ID|Branch                        |Trigger                                                                          |Key beats                                                                                                                                                                                                                            |
|--|------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|B1|Late patient, within tolerance|Patient taps *Running late*, ETA delay ≤ 20 min (screening) / 10 min (consulting)|AppRelay posts the delay with `Wait & adjust slot` / `Reschedule anyway`. *Wait & adjust* updates the slot and pushes a new start time to the patient app.                                                                           |
|B2|Late patient, beyond tolerance|Same, delay over tolerance                                                       |AppRelay escalates with `Force-wait (downstream visits delay)` / `Reschedule`. *Reschedule* shows next-48h slots; selecting one creates a new dated channel and locks the old one.                                                   |
|B3|Doctor unavailable            |Doctor marks unavailable, or no-show 5 min past start                            |AppRelay alerts the ops anchor with `Pick another doctor` / `Reschedule patient`. *Pick another doctor* lists available GPs with their next slot; selecting one swaps the doctor in the channel.                                     |
|B4|Blood draw, 1st attempt fails |Cardiac tech selects *Vein not found* in the cardiac form                        |PodBot posts a script to read aloud and `Retry now` / `Defer to later`.                                                                                                                                                              |
|B5|Blood draw, 2nd attempt fails |*Vein not found* again                                                           |PodBot defers the draw, the patient continues other pods, the tech is paged for a retry after pod 5; VM gets a reassurance script.                                                                                                   |
|B6|Blood draw, 3rd attempt fails |Retry after later pods also fails                                                |PodBot escalates, adds a doctor to the channel, offers `Alternative collection site`, `Defer to scheduled lab visit`, `Skip (non-critical)`.                                                                                         |
|B7|Machine failure               |Tech clicks *Machine down* in a pod form                                         |PodBot cross-posts to `#alerts` and `#shift-handover`, sets the pod to Blocked on the floor board, gives the VM a holding script, and offers the ops anchor `Machine back online`, `Reschedule this test`, `Skip and refund portion`.|
|B8|Patient walks out mid-visit   |VM clicks *Patient leaving early* on the visit card                              |VisitBot opens an exit form (reason, reschedule preference, 24h follow-up call). Channel state becomes Incomplete with a 7-day hold; AppRelay opens the reschedule flow in the patient app.                                          |

## 8. Pod intake forms

When a technician clicks `Patient with me`, a modal opens — the pod intake form. The technician fills it; on submit, PodBot interpolates the values into the result summary. Keep the modal styling consistent across pods so the codebase stays small.

|Pod             |Form fields                                                                                                                                                                          |Result summary shape                                                      |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
|Cardiac         |BP systolic / diastolic / pulse, position, abnormal flag; blood: vein quality, needle type, attempts, sample IDs; comfort cues (water, music, sealed kit); omega-3 cross-sell outcome|🩺 Cardiac complete · BP X/Y, pulse Z · blood N attempts, samples to lab   |
|CT              |Eye mask given, ear plugs given, blanket offered; image quality flag; tech notes                                                                                                     |🩻 CT complete · image quality OK · cues confirmed                         |
|Oral            |Cleaning needed yes/no; treatment recommendation; urgency (routine / soon / urgent)                                                                                                  |🦷 Oral complete · cleaning Y/N · urgency level                            |
|Sensory         |Vision score per eye, near/far flag; hearing dB threshold per ear, conductivity flag                                                                                                 |👁️ Sensory complete · vision X/Y · hearing within/outside normal           |
|Body Composition|Scan complete flag; body-composition values (fat %, lean mass, bone density)                                                                                                         |📊 Body composition complete · fat %, lean mass kg, bone density flag      |
|Functional      |Cognitive score, grip strength per hand, mobility score, balance flag                                                                                                                |🏃 Functional complete · cognitive normal/flag · grip X/Y kg               |
|Sonography      |Areas scanned (multi-select), findings flag (normal / call doctor / urgent)                                                                                                          |🩻 Sono complete · findings normal — or — 🚨 finding flagged + doctor pinged|
|Cervical        |Self-insertion preference, smaller speculum used, communication cue, sample IDs                                                                                                      |🌸 Cervical complete · sample IDs to lab · ETA 4 hrs                       |
|Mammography     |Cycle phase asked, lady technician confirmed, warm plates confirmed; image auto-check, retake flag                                                                                   |🩻 Mammography complete · image quality OK · no retake                     |

Generic vitals form (consultation nurse step): BP, pulse, height, weight, temperature.

## 9. Floor board and `#ops-today`

Two operational views that update live as scenarios run.

**Floor board** — a separate tab or right-panel view. A grid of all rooms: 9 diagnostic pods, 4 personal pods, 3 consult rooms. Each room tile shows its name, status (Ready green / Occupied amber / Blocked red), and, when occupied, the patient initial-and-surname and the current event (Process Started / Test Done). This view is the point where the room-as-a-constraint logic becomes visible — a viewer should be able to watch pods fill and clear as a screening moves through them.

**`#ops-today`** — a standing channel that holds one compact, continuously updated status thread per active visit: patient, visit type, current room, current step, elapsed time. The Floor Manager scans this instead of opening every visit channel. When several scenarios run together, this channel is where the day is legible at a glance.

## 10. Control panel

A simulation cockpit, in a slide-over drawer or a dedicated tab, separate from the Slack chrome.

- **Scenario launcher** — start any scenario from section 7. Show running scenarios with progress.
- **Run the day** — launch three or four staggered scenarios at once for a populated Floor Manager view.
- **Playback** — autoplay on/off, speed (0.5× / 1× / 2× / 4×), and a “Step” button for manual mode.
- **Role switcher** — Visit Manager / Floor Manager / Doctor / Technician.
- **Branch injector (stretch)** — inject a branch from section 7.6 into a running scenario.
- **Reset** — clear all channels and state back to the seeded start.
- **Clock** — current in-fiction clinic time.

## 11. Visual design

Keep Slack’s structure and proportions so it reads as Slack instantly: dark aubergine channel sidebar, white message pane, the familiar channel header and composer. Within that frame, use ACKO’s clinic palette as a light accent — a warm neutral for surfaces and a sage-green primary for buttons — so it is subtly branded without stopping looking like Slack. Use a clean sans-serif close to Slack’s (Lato or Inter). Messages need comfortable line height and clear separation between the author block and the body. Block Kit cards should look like real Slack app cards: bordered, slightly inset, two-column field grids. Reactions, unread badges, and the `APP` tag on bots all matter for believability — they are cheap and they sell the illusion.

## 12. Build order

1. Scaffold the app (Vite, React, Tailwind, store). Build the Slack shell — left rail, channel sidebar, message pane, composer. Load seed data and render the standing channels with a few static messages.
1. Build full message rendering: every message type, Block Kit cards, coloured source bars, buttons, reactions, @-mentions, ephemeral messages, DMs.
1. Build the simulation engine: the scenario and beat model, the clock, autoplay and step modes, button-driven branching, form modals, side effects.
1. Script scenario 7.1 (screening) end to end. This proves the engine against the hardest flow.
1. Add scenarios 7.2–7.5.
1. Add the branch scenarios 7.6.
1. Build the floor board and the `#ops-today` dashboard.
1. Build the control panel and role switcher.
1. Polish: message transitions, unread counts, empty states, the clock display.

## 13. Out of scope

Do not build: any real Slack connection or Slack SDK usage; a backend, server, or database; authentication or multi-user support; a real patient mobile app (the patient phone is represented only by AppRelay messages describing pushes); real patient data or real PHI; any AI or image-generation feature. Clinical report visuals, if shown at all, are static templated components.

## 14. Acceptance check

The prototype is done when a viewer can, in one sitting: launch the screening scenario and watch it run across nine pods to a closed visit; launch a consultation and order an in-room test; create a walk-in for a non-member from a slash command; run a single diagnostic test; trigger a machine failure and see the pod go red on the floor board and an alert cross-post to `#alerts`; run the day and watch four visits move simultaneously in `#ops-today`; and switch to the Doctor role and see a patient-history summary that the Visit Manager role cannot see.

# ACKO Clinic Floor Simulator — Companion Doc

## Slack Message Capabilities Reference & Dual-Rendering Architecture

This document pairs with `acko-clinic-floor-simulator-build-brief.md`. Read both. Where this document and Section 5.3 (Message rendering) of the build brief disagree, **this document wins** — it replaces and expands that section.

Two jobs here:

1. **Part A** is a reference for what a Slack bot can actually post. The prototype is a Slack look-alike; it must mimic real Slack faithfully, including real Slack’s limits. Build only message capabilities that real Slack has.
1. **Part B** specifies how the prototype renders message content in **two ways** — native Block Kit components and image cards from custom templates — with a viewer toggle to compare them. The product team has not decided which approach wins for which message type. The prototype is the instrument for making that decision, so it must support both well.

-----

# Part A — Slack message capabilities reference

Everything below is what a Slack app/bot can post today. The prototype should be able to render every block type listed, because the message data model is a list of blocks.

## A.1 Block Kit blocks

Block Kit is Slack’s layout system. A message is an array of blocks. A bot composes JSON; Slack renders it natively on web, desktop, iOS, and Android. **Limit: up to 50 blocks per message, 100 per modal or Home tab.**

|Block            |What it renders                                                                                                                                                                                             |Notes for the prototype                                                                                  |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
|`section`        |Text, optionally a two-column `fields` grid, optionally one `accessory` element (button, image, select)                                                                                                     |The workhorse. mrkdwn text.                                                                              |
|`header`         |Large bold heading text (plain text)                                                                                                                                                                        |One line, ~150 char cap.                                                                                 |
|`markdown`       |A block of markdown-formatted text                                                                                                                                                                          |Dedicated markdown rendering.                                                                            |
|`rich_text`      |Slack’s native representation of formatted text — supports lists, blockquotes, inline code, and (rolled out March 2026) tables, task lists, syntax-highlighted code blocks, dividers, variable-sized headers|This is what a normal typed message becomes internally.                                                  |
|`divider`        |A horizontal rule                                                                                                                                                                                           |Visual separation only.                                                                                  |
|`context`        |Small, secondary text alongside small images                                                                                                                                                                |Used for metadata, timestamps, attribution.                                                              |
|`context_actions`|Context-style row that can carry actions                                                                                                                                                                    |Newer; consult the reference for exact schema.                                                           |
|`actions`        |A row of interactive elements (buttons, selects, pickers)                                                                                                                                                   |Up to 5 elements.                                                                                        |
|`input`          |A labelled form input                                                                                                                                                                                       |Used mainly in modals.                                                                                   |
|`image`          |A standalone image with alt text and optional title                                                                                                                                                         |Image must be a hosted public URL or an uploaded Slack file. **No interactive elements inside an image.**|
|`video`          |An embedded video player                                                                                                                                                                                    |Title, thumbnail, description.                                                                           |
|`file`           |A reference to a remote or uploaded file                                                                                                                                                                    |Renders a file card.                                                                                     |
|`card`           |**(New, April 2026)** A structured card — optional icon, required title, optional subtitle, optional 4:3 hero image, a formatted body, and optional action buttons                                          |The native answer to “I want a UI card.” See A.2.                                                        |
|`alert`          |**(New, April 2026)** A severity-leveled callout: default, info, success, warning, error                                                                                                                    |Native answer to escalation/status messages. See A.2.                                                    |
|`carousel`       |**(New, April 2026)** Up to 10 cards in a horizontal scrollable strip                                                                                                                                       |For presenting multiple options without flooding the pane.                                               |
|`table`          |Structured tabular data rendered natively in the message (“Data Table”)                                                                                                                                     |Native answer to posting result tables.                                                                  |
|`task_card`      |A task-oriented card block                                                                                                                                                                                  |Newer; consult the reference for exact schema.                                                           |
|`plan`           |A plan block                                                                                                                                                                                                |Newer; consult the reference for exact schema.                                                           |

For `card`, `alert`, `carousel`, `table`, `task_card`, `plan`, and `context_actions`, treat the descriptions above as accurate and pull exact field schemas from the reference URLs in A.7 if deeper detail is needed.

## A.2 The two new blocks that matter most here — verbatim shapes

**Card block.** Structured, scannable context. Supports an optional icon, a required title, an optional subtitle, an optional hero image (4:3), a formatted body, and optional action buttons.

```json
{
  "type": "card",
  "card": {
    "title":    { "type": "plain_text", "text": "Daily Standup Reminder" },
    "subtitle": { "type": "mrkdwn", "text": "Runs every weekday at *9:00 AM*" },
    "body":     { "type": "mrkdwn", "text": "Last run: Today at 9:00 AM · Status: ✅ Success" }
  },
  "actions": [
    { "type": "button", "text": { "type": "plain_text", "text": "Edit" },      "action_id": "edit_automation", "value": "automation_12345" },
    { "type": "button", "text": { "type": "plain_text", "text": "View Logs" }, "action_id": "view_logs",       "value": "automation_12345" }
  ]
}
```

**Alert block.** Visual severity. Five levels: `default`, `info`, `success`, `warning`, `error`. Supports rich mrkdwn.

```json
{
  "type": "alert",
  "alert": {
    "level": "warning",
    "text": { "type": "mrkdwn", "text": "*Dependency conflict detected* — run `npm audit fix` before deploying." }
  }
}
```

In ACKO Clinic terms: the Card block is the natural home for the pinned visit card and pod result summaries; the Alert block is the natural home for the red escalation messages (blood-draw failure, machine down, walk-out).

## A.3 Interactive elements

These live inside `actions`, `section` accessories, or `input` blocks. None of them can live inside an `image`.

Buttons; static / external / users / channels / conversations select menus; multi-select menus; overflow menus; date picker; time picker; datetime picker; checkboxes; radio buttons; plain-text input; email input; number input; URL input; file input; workflow buttons.

## A.4 Images and files — how Slack actually handles them

This is the crux of the dual-rendering decision, so be precise.

- A bot **can** post images. An image must be either a publicly reachable hosted URL or a file uploaded to Slack first. It is then shown via an `image` block, or as a `section` accessory, or as an uploaded file.
- **An image is inert.** You cannot place a button, a select menu, or any interactive element inside it. If an image card needs actions, those actions are a **separate `actions` block posted beneath the image**. There is no way around this.
- An image does not reflow. It renders at a fixed pixel size; on a phone it is scaled down or scrolled.
- An image carries no live text — not selectable, not searchable, not theme-aware. A screen reader gets only its alt text.
- To produce a “UI-looking” image from an HTML/CSS template in production, you need a render step — a headless browser (Puppeteer or Playwright) or a render service — that rasterises the template, then an upload. That is real infrastructure with real per-render latency.
- Bots can also upload non-image files: PDFs, CSVs, code snippets. These render as file cards, not inline UI.

## A.5 Other things a bot can post or do

- **Ephemeral messages** — visible to exactly one user in a channel. Used in the prototype for the doctor’s private patient-history summary.
- **Threaded replies** — a message posted as a reply under a parent.
- **Reactions** — emoji added to a message; used as state confirmations.
- **Scheduled messages** — posted at a future time.
- **Direct messages** — bot to one user.
- **Message edits and deletes** — a bot can update a message **in place** after posting it (`chat.update`) or delete it. This matters: a live status — a visit card, an `#ops-today` row — should be **one message that updates**, not a stream of new messages.
- **Modals** — pop-over views built from blocks, opened in response to an interaction.
- **App Home tab** — a per-app surface built from blocks.
- **Canvases** — bot-authored rich documents that can be attached to a channel and updated over time. A good home for a live, formatted visit summary.
- **Streaming text** — methods (`chat.startStream`, `chat.appendStream`, `chat.stopStream`) that let an agent type a response live. Not needed for this prototype, but listed for completeness.

## A.6 Limits to respect in the prototype

- 50 blocks per message; 100 per modal or Home tab.
- 5 elements per `actions` block.
- `section` text around 3,000 characters; `header` text around 150; button text around 75.
- One `accessory` per `section`.
- Carousel: up to 10 cards.

## A.7 Reference URLs (for Claude Code to consult for exact schemas)

- Block Kit overview — https://docs.slack.dev/block-kit/
- Blocks reference (all block types) — https://docs.slack.dev/reference/block-kit/blocks/
- Block elements reference — https://docs.slack.dev/reference/block-kit/block-elements/
- Card block — https://docs.slack.dev/reference/block-kit/blocks/card-block
- Alert block — https://docs.slack.dev/reference/block-kit/blocks/alert-block
- Carousel block — https://docs.slack.dev/reference/block-kit/blocks/carousel-block
- Table block — https://docs.slack.dev/reference/block-kit/blocks/table-block
- New agent blocks announcement — https://slack.dev/build-richer-agent-experiences-with-block-kit/
- Block Kit Builder (live previewer) — https://app.slack.com/block-kit-builder/

-----

# Part B — Dual-rendering architecture

The prototype must render rich message content **two ways** and let a viewer compare them. This is a deliberate product requirement: the team has not decided which approach to use for which message type, and some complex cases will need custom templates that Block Kit cannot express.

## B.1 The two render paths

**Native path.** Content is rendered as faithful React re-creations of Slack blocks — `section`, `header`, `card`, `alert`, `table`, `actions`, and the rest. Buttons are embedded and live. Text is selectable. The layout reflows. It respects light/dark theme. This is what real native Block Kit gives you.

**Image-card path.** Content is rendered by a **custom template** — a React component that takes structured data and produces a rich, pixel-controlled layout. In image mode that template renders into a **non-interactive, fixed-width framed container** that reads as an uploaded image attachment in Slack. Because a real Slack image cannot hold interactive elements, any buttons for an image-card message render as a **separate `actions` block beneath the image**. The prototype must enforce this — it is the honest behaviour and the demo depends on it being honest.

## B.2 Message content model

Extend the `Message` model from the build brief so a message’s body is a list of blocks, and introduce two prototype-specific block types that both pull from the Template Registry:

```
Block =
  | NativeBlock          // section, header, card, alert, table, divider, context, actions, image, ...
  | { type: "template_native", templateId, data }   // render the template using native Block Kit components
  | { type: "template_image",  templateId, data }   // render the template as a framed, inert image card

Message = {
  ...existing fields...
  blocks: Block[],
  renderMode?: "native" | "image" | "auto"   // per-message override; defaults to the workspace setting
}
```

A message that uses a template should carry exactly one template block, optionally followed by an `actions` block. When the template block is `template_image`, the trailing `actions` block is the only place its buttons may appear.

## B.3 The Template Registry

A single registry of named custom templates. Each template is authored **once** as a typed React component and declares its capability:

```
Template = {
  id,                       // e.g. "visit-card", "pod-result", "screening-report"
  component,                // React component, props = the structured data
  nativeRenderer?,          // optional: a function/component that emits native Block Kit components for the same data
  capability: "both" | "image-only"
}
```

- `capability: "both"` — the template has a native Block Kit equivalent. It can render either way.
- `capability: "image-only"` — the layout genuinely cannot be expressed in Block Kit (annotated diagrams, multi-series charts, dense custom grids). It only renders as an image card. Requesting native mode for it falls back to image with a small notice.

## B.4 Render-mode resolution and the viewer toggle

- A **workspace-level setting** in the control panel: `Card rendering = Native | Image | Side-by-side`.
- A **per-message** `renderMode` override.
- `auto` resolves to native when the template’s capability allows it, otherwise image.
- **Side-by-side** renders both versions of every template message stacked or in two columns, so a viewer can judge them directly. This is the decision-tool mode — it exists specifically because the team does not yet know when to use which.
- The toggle is live: flipping it re-renders existing messages in place without restarting the scenario.

## B.5 Faithfulness rules

The prototype must not flatter either path. Each mode behaves the way it would in real Slack.

**Native mode:** buttons embedded and clickable; text selectable; respects the app’s light/dark theme; layout reflows to the pane width; uses Slack-native block styling.

**Image mode:** the template renders into a fixed-width, raster-like framed container; content is **not** selectable and **not** theme-aware (the template renders its own fixed theme); on the mobile preview width it scales down rather than reflowing; **no interactive element appears inside the frame**; buttons appear only in a trailing `actions` block; the frame shows a faux filename caption (e.g. `screening-report.png`) and an alt-text line, and a small “rendered from template” provenance chip so the render pipeline is visible.

## B.6 What “image mode” means in the prototype — no real raster pipeline

Do **not** build an HTML-to-image conversion pipeline. Do not install Puppeteer or Playwright. In the prototype, “image mode” is purely a **visual treatment**: the same React template component renders into a container styled to look like an inert uploaded image, with interactivity disabled inside it (no pointer events, no text selection) and the faithfulness rules from B.5 applied. This keeps the prototype simple while still showing the viewer exactly what the image approach looks and feels like, including its limitations. A short comment in the code should note that production image cards would require a real headless-browser render-and-upload step.

## B.7 Template catalogue

Build these templates. Each is used by the scenarios in the build brief.

|Template id           |Used for                                                                                  |Capability|Native rendering                                                                                |
|----------------------|------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------|
|`visit-card`          |The pinned visit summary at the top of every visit channel                                |both      |`card` block — title, subtitle, body fields, action buttons                                     |
|`pod-result`          |The structured result summary each pod posts                                              |both      |`card` block with a `table` block for the value rows                                            |
|`escalation`          |Blood-draw failure, machine down, walk-out, finding flagged                               |both      |`alert` block, level `error` or `warning`                                                       |
|`checkout`            |The end-of-visit checkout tick-list                                                       |both      |`card` block with a task-list-style body                                                        |
|`morning-digest`      |The VM’s start-of-day DM                                                                  |both      |`section` blocks                                                                                |
|`ops-today-row`       |One visit’s live status row in `#ops-today`                                               |both      |`section` + `context`, updated in place                                                         |
|`screening-report`    |A rich post-screening summary — body silhouette, pod-by-pod status, a simple results chart|image-only|falls back to image; a lighter `card`-based summary may be offered as a separate native template|
|`floor-board-snapshot`|A snapshot of the floor board posted into a channel                                       |image-only|falls back to image                                                                             |

The two `image-only` templates exist on purpose: they demonstrate the complicated cases where a custom template is the right tool and Block Kit is not enough. Everything else should render convincingly both ways so the side-by-side comparison is meaningful.

## B.8 Build-order delta

Insert into the build brief’s Section 12 build order, after step 2 (message rendering):

- **2a.** Build the native block components for every block type in A.1, with priority on `section`, `header`, `card`, `alert`, `table`, `actions`, `divider`, `context`, `image`.
- **2b.** Build the Template Registry, the two template block types, and the `visit-card`, `pod-result`, `escalation`, and `checkout` templates with both renderers.
- **2c.** Build the render-mode setting, the per-message override, and the side-by-side mode.
- **2d.** Build the two `image-only` templates (`screening-report`, `floor-board-snapshot`).

## B.9 Out of scope additions

In addition to the build brief’s Section 13: no HTML-to-image conversion pipeline, no headless browser, no real file upload, no real image hosting. Image mode is a visual treatment only.

## B.10 Acceptance check additions

In addition to the build brief’s Section 14: a viewer can flip the workspace between Native, Image, and Side-by-side rendering and see every template message re-render in place; in Image mode, no button is ever clickable inside the image frame and all actions sit in a strip beneath it; the `screening-report` template renders only as an image card and says so when native is requested.