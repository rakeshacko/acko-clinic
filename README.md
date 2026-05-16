# ACKO Clinic Floor Simulator

A browser-based Slack look-alike that simulates ACKO Clinic floor
operations. Three bots (VisitBot, PodBot, AppRelay) drive scripted
scenarios — full screenings, doctor consults, walk-ins, single tests,
and the failure branches that happen when reality intrudes.

The prototype is frontend-only: no backend, no database, no Slack SDK,
no network calls, no AI, no real image rendering. The "bots" are
simulation code.

## Run it

```
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

## What to try

1. The control panel opens by default on the right. Click **Run the
   day** to launch four staggered visits at once, then switch to
   `#ops-today` to watch them.
2. Click **Run** on **Screening · P. Sharma (flagship)** for the full
   nine-pod flow. Pod intake modals open at each handoff. The
   Sonography form's *Call doctor (flagged finding)* button branches
   to the doctor-decision sub-tree.
3. Switch role to **Doctor** and re-open the screening channel — the
   patient history summary that appears mid-consult is visible only
   to the doctor.
4. Open the **floor board** (left rail floor icon or control panel) to
   watch pods cycle Ready → Occupied → Ready. Run **B7 · Machine
   failure** to see a pod go red and an alert cross-post to `#alerts`.
5. Toggle **Card rendering** between Native, Image, and Side-by-side
   in the control panel to compare how each template renders.

See `build-spec.md` for the full brief and `DECISIONS.md` for the
implementation choices.
