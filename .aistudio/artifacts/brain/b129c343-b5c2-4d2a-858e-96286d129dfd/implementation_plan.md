# Viplava 2026: Live 6-Player Quiz Conducting Workflow & In-App Runbook

An end-to-end operational protocol and feature implementation plan for orchestrating the **Viplava 2026: Srila Prabhupada Maha Quiz**. This blueprint details how the 6 contestants connect via QR code on mobile, enter their custom names to claim Seats 1–6, how the Quiz Master monitors the live roster on the hall projector, and how the entire event is conducted smoothly round by round using a new interactive in-console **Host Runbook**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your preferences from the Phase 1 clarification, the following architecture has been selected:
> - **Projector Check-In Display**: A high-impact **Live Visual Roster** on the main projector screen during `LOBBY` phase featuring a high-res QR code, real-time connection status badges, and dynamic seat cards that illuminate as contestants register.
> - **Contestant Check-In Flow**: Contestants scan the QR code (or open the shared link), input their **custom name**, and claim their assigned seat (Seats 1–6) with a single tap.
> - **Quiz Master Guide**: An embedded, interactive **Host Runbook & Procedure Checklist** directly inside the Host Console (`/host`), allowing the Quiz Master to track every stage (sound checks, player onboarding, rule recitations, question pacing, scoring, and podium celebrations) with one-click quick actions.

- **Confirmed Decision 1**: Contestants enter their custom name on their mobile device during seat selection, which immediately updates the projector display and host console.
- **Confirmed Decision 2**: An interactive step-by-step Runbook is integrated into the Host Console with live step tracking, time checkpoints, and phase launch buttons.
- **Recommended Default**: Display the Join QR Code prominently on both the Projector Lobby and a quick modal in the Host Console so either display can be used for scanning.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a frictionless 3-screen synchronization ecosystem (Host Console, Hall Projector, and 6 Mobile Participant Buzzers). Contestants scan a central QR code, enter their names, and claim Seats 1 through 6. The host observes all 6 seats turn "CLAIMED & READY" in real time on the projector before launching Round 1.
- **Target Audience / Persona**:
  - **Quiz Master / Host**: Needs an authoritative, low-stress conductor cockpit with built-in runbooks, timer controls, pass/penalty overrides, and audio triggers.
  - **Audience & Presenter**: Needs an immersive, cinematic Sanskrit/Vedic aesthetic (Cinzel typography, dark temple gradients, gold accents) with zero lag and clear spotlight visuals.
  - **6 Contestants**: Need an instant zero-login mobile controller that locks onto their claimed seat, provides a responsive buzzer (under 50ms latency), and displays direct answer buttons.
- **Key Value**: Guarantees zero confusion during participant onboarding and 100% reliable execution of all 4 competition rounds without external internet dependencies.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow 1: Pre-Quiz Hall Setup & Projection (Quiz Master)
1. **Host Login**: Host opens `/` and clicks **Host Console** in the top navigation, entering moderator PIN `108`.
2. **Projector Launch**: In a separate window or connected projector screen, the host opens `/?view=presenter&standalone=true` and toggles Fullscreen (`F11` or projector button).
3. **Lobby Roster Display**: The projector displays the **Viplava 2026 Lobby Roster**:
   - Left side: Prominent QR code labeled *"Scan to Join as Contestant"*.
   - Right side: 6 Seat Podiums (Seats 1–6) displaying avatar icons, seat numbers, and live status (`Waiting for Contestant...`).

#### Flow 2: Contestant QR Scan & Seat Claiming (Contestants 1–6)
1. **Scan QR**: Each of the 6 contestants points their smartphone camera at the projector screen.
2. **Mobile Onboarding**: Contestant lands on `/?view=participant`.
3. **Claiming Modal / Prompt**:
   - If unassigned, an intuitive check-in card appears:
     - Text input: `Enter Your Name` (e.g., "Arjuna Das" or "Radha").
     - 6 Seat Buttons: Shows available seats (1 to 6) and disables seats already taken by other players.
   - Tap **"Claim Seat & Enter Quiz"**.
4. **Instant Lock-In**:
   - Mobile screen switches to the gold-accented Controller View configured specifically for their seat number.
   - The device vibrates softly (`navigator.vibrate`) to confirm connection.
   - Local storage remembers their claimed seat so page reloads never lose their seat.

#### Flow 3: Live Verification on Projector Roster
- As each participant claims a seat, their seat card on the hall projector immediately transitions:
  - Background glows with golden radial illumination.
  - Status changes from `Waiting...` to `Connected & Ready`.
  - The contestant's custom name is revealed with their spiritual avatar.
- When all 6 seats show green/gold checkmarks (`6 / 6 Contestants Checked In`), the Host Console sounds the auspicious Conch cue and highlights **"Start Round 1"**.

#### Flow 4: Quiz Master Execution via Interactive Runbook
The Host Console features an interactive, collapsible **Host Runbook** drawer with 5 orchestrated acts:
- **Act 0: Pre-Flight Check**: Audio test (Buzzer, Correct chime, Conch), projector fullscreen check, participant check-in verification.
- **Act 1: Round 1 (Direct & Pass)**: 18 questions (3 per seat). Direct answer (10 pts, 30s timer) -> If passed (5 pts to next seat).
- **Act 2: Round 2 (Rapid Fire Blitz)**: 6 sets of 10 questions. 60 seconds rapid fire per seat (10 pts each, no negative).
- **Act 3: Round 3 (Buzzer Round)**: 12 high-stakes questions. Host unlocks buzzer -> Fastest contestant buzzes -> 15s to answer (+15 correct, -5 penalty).
- **Act 4: Tie-Breaker & Grand Podium**: Automated fastest-finger tie-breaker (if needed) -> Grand Winner announcement with confetti celebration and victory fanfare.

### Visual Identity & Theme
- **Aesthetic Direction**: Divine Vedic majesty meets modern broadcast quiz show.
- **Color Palette**:
  - Neutral Canvas: Deep dark amethyst slate (`#0B0616` and `#120A21`).
  - Surfaces: Translucent obsidian cards with gold hairline borders (`border-amber-500/30`).
  - Accents: Radiant Krishna Peacock Gold (`#F59E0B`), warm lotus amber (`#FBBF24`), emerald check indicators (`#10B981`), and penalty ruby (`#EF4444`).
- **Typography**: `Cinzel` display face for chapter titles, seat badges, and scores; `Plus Jakarta Sans` for crystal-clear mobile legibility; tabular numerals for timers.
- **Motion**: Subtle settling transitions ($\le 200\text{ms}$) on seat claiming; confetti particle bursts on podium finish.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Custom Name Input on Mobile Seat Claiming**
  - *Chosen Approach*: When a contestant opens `/?view=participant`, they are presented with an elegant Name + Seat selection card. Submitting updates the participant entity in the server-side `quizStore` (`updateParticipant`) and caches the seat in `localStorage`.
  - *Why*: Gives participants personal ownership and displays their real identity on the big projector screen, while retaining their seat number (Seats 1–6) for rule assignment.
  - *Alternatives Considered*: Pure static spiritual names without customization was too rigid for live university/temple events.

- **Decision 2: Integrated Interactive Runbook in Host Console**
  - *Chosen Approach*: A collapsible sidebar / modal in the Host Console featuring step-by-step checkboxes, timers, and "Jump to Phase" shortcuts.
  - *Why*: In high-pressure live stage environments, the Quiz Master needs immediate context ("Who has the next direct question?", "What is the penalty rule?", "Is the buzzer armed?") without switching tabs or looking at paper sheets.
  - *Alternatives Considered*: Separate printed PDF guide; rejected because it doesn't stay in sync with live app state.

- **Decision 3: Server-Authoritative Seat Conflict Prevention**
  - *Chosen Approach*: The `claim_seat` API action ensures if Contestant A claims Seat 2, Seat 2 shows as "Claimed by [Name]" on Contestant B's phone with an option to override only if approved.
  - *Why*: Eliminates two contestants accidentally sharing the same seat.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HALL PROJECTOR SCREEN                           │
│                   (/?view=presenter&standalone=true)                   │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Big Join QR Code    │  │  Live 6-Seat Roster Status Board      │  │
│  │   "Scan with Mobile"  │  │  [Seat 1: Arjuna Das] ● Ready         │  │
│  │                       │  │  [Seat 2: Radha Rani] ● Ready         │  │
│  │   WiFi SSID: ISKCON   │  │  [Seat 3: Gauranga]   ● Ready         │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
└────────────────────────────────────▲───────────────────────────────────┘
                                     │ SSE / Long-poll Sync (500ms)
┌────────────────────────────────────┴───────────────────────────────────┐
│                      QUIZ STORE SERVER RUNTIME                         │
│                           (/api/quiz)                                  │
│   • Singleton Global State (__GLOBAL_QUIZ_STATE__)                     │
│   • Actions: CLAIM_SEAT, UPDATE_PARTICIPANT, SET_PHASE, BUZZER_PRESS   │
└──────────────────▲──────────────────────────────────▲──────────────────┘
                   │                                  │
┌──────────────────┴──────────────────┐   ┌───────────┴──────────────────┐
│        HOST CONSOLE (/host)         │   │   6x PARTICIPANT PHONES      │
│  • Moderation PIN (108)             │   │    (/?view=participant)      │
│  • Interactive Stage Runbook        │   │  • Seat Claim + Custom Name  │
│  • Question Navigation & Reveal     │   │  • Ultra-low latency Buzzer  │
│  • Timer, Score & Override Controls │   │  • Real-time Option Select   │
└─────────────────────────────────────┘   └──────────────────────────────┘
```

### Component & State Mapping

1. **`PresenterScreen.tsx` (Projector View)**
   - *Lobby Enhancements*: Split-screen layout in `LOBBY` phase featuring a high-contrast SVG QR Code on the left and 6 interactive Seat Podiums on the right.
   - *Status Indicators*: Shows avatar, seat number, custom contestant name, and a glowing `Ready` badge. Displays counter: `Ready: X / 6`.

2. **`ParticipantMobileView.tsx` (Contestant Phone View)**
   - *Claim Modal / Step*: If no seat has been claimed, displays an input for `Your Name` and a selector for `Seats 1 to 6` indicating available vs claimed seats.
   - *Claim Action*: Calls `claim_seat` / `update_participant` on `/api/quiz` and saves `seatNumber` and `participantName` to `localStorage`.
   - *Active Play*: Seamlessly renders the big Buzzer button, multiple choice options (Round 1 & 3), and round status banners.

3. **`HostConsole.tsx` & `HostRunbookModal.tsx` (Quiz Master Console)**
   - *Host Runbook Panel*: Collapsible guide with complete stage directions:
     - **Pre-Event**: WiFi confirmation, Projector setup, Audio soundcheck.
     - **Check-In**: QR code display, monitoring all 6 seats, kick-off conch.
     - **Round 1 (Direct & Pass)**: Instructions on reading questions, passing to clockwise seat, revealing answers.
     - **Round 2 (Rapid Fire)**: 60-second rapid fire timer operation, recording correct answers per player.
     - **Round 3 (Buzzer)**: Arming buzzer, verifying lock-out, awarding +15 or applying -5 penalty.
     - **Tie-Breaker & Podium**: Tie-breaker rules and confetti victory trigger.
   - *Quick Controls*: Direct trigger buttons next to each runbook step to instantly switch phases or start timers.

---

## 5. Step-by-Step Quiz Master Checklist (The 6-Player Protocol)

### Phase 0: Setup & Audio Check (10 Minutes Prior)
1. Ensure the host laptop is connected to the hall projector and audio speakers.
2. Open the host screen: select **Host Console**, enter Passcode `108`.
3. Open the projector screen in an incognito or secondary window: `/?view=presenter&standalone=true` and press `F11` for full screen.
4. Click **Sound Check** in Host Console to verify chime, buzzer, and conch volume.

### Phase 1: Registration & Seat Claiming (5 Minutes)
1. Keep the quiz in `LOBBY` phase. The projector automatically displays the big Join QR Code and the 6 Seat Podiums.
2. Instruct the 6 contestants to take their physical seats (Numbered 1 to 6 on stage).
3. Contestants scan the QR code using their phone cameras.
4. Each contestant types their name and selects their corresponding seat number (Seat 1 to 6) and taps **Claim Seat**.
5. Watch the projector: the 6 podium cards will turn gold and display each contestant's name.

### Phase 2: Starting the Quiz & Round 1 (Direct & Pass)
1. Once all 6 seats show as joined, the host clicks **"Start Round 1: Rules"** in the console. The projector displays the rules while the conch sounds.
2. Host clicks **"Begin Round 1 Questions"**.
3. For each question:
   - Question 1 starts directly with Seat 1.
   - Host clicks **Start Timer** (30s).
   - If Seat 1 answers correctly: Host clicks **Correct (+10 pts)**.
   - If Seat 1 is unsure or answers wrong: Host clicks **Pass to Next Seat** (switches question to Seat 2 for +5 pts).
   - Host clicks **Reveal Answer** on projector, then **Next Question**.

### Phase 3: Round 2 (Rapid Fire Blitz)
1. Host switches to **"Round 2 Rules"**, then **"Round 2 Active"**.
2. Call Seat 1 first.
3. Host presses **Start 60s Timer** and reads the 10 quick questions aloud.
4. For each answer given, host clicks **+10 Correct** on the console.
5. Move sequentially through Seat 2, 3, 4, 5, and 6.

### Phase 4: Round 3 (Buzzer Round)
1. Host switches to **"Round 3 Rules"**, then **"Round 3 Active"**.
2. Host reads the question from the console.
3. Host clicks **Unlock Buzzer**.
4. The buzzer activates on all 6 contestants' phones.
5. First contestant to hit the buzzer locks out all other players; their name and seat flash on the projector.
6. The buzzed contestant has 15 seconds to answer or select on their phone:
   - Correct: Host awards **+15 pts**.
   - Incorrect: Host applies **-5 penalty pts** and re-unlocks the buzzer.

### Phase 5: Winner Announcement & Grand Podium
1. Check the live scoreboard on the console. If there is a tie for 1st place, trigger the **Tie Breaker** round.
2. Host clicks **"Grand Finale / Podium"**.
3. Confetti explodes on the hall projector, victory fanfare plays, and 1st, 2nd, and 3rd place winners are displayed in golden grandeur.
