'use client';

import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Volume2,
  Tv,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { QuizState, QuizPhase } from '@/lib/types';
import { soundManager } from '@/lib/soundEffects';

interface HostRunbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: QuizState;
  onSetPhase: (phase: QuizPhase) => void;
}

interface StepItem {
  id: string;
  text: string;
  detail?: string;
  actionLabel?: string;
  action?: () => void;
}

interface Act {
  id: string;
  actNumber: string;
  title: string;
  timing: string;
  summary: string;
  targetPhase?: QuizPhase;
  steps: StepItem[];
}

export function HostRunbookModal({
  isOpen,
  onClose,
  state,
  onSetPhase,
}: HostRunbookModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeActId, setActiveActId] = useState<string>('act_lobby');

  if (!isOpen) return null;

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const participants = state.participants;
  const claimedCount = participants.filter((p) => Boolean(p.isClaimed)).length;

  const acts: Act[] = [
    {
      id: 'act_preflight',
      actNumber: 'ACT 0',
      title: 'Pre-Flight & Audio Check',
      timing: '10 Mins Prior',
      summary: 'Ensure projection, audio amplification, and local network are verified.',
      steps: [
        {
          id: 'step_projector',
          text: 'Open Hall Projector Display in a separate screen or window',
          detail: 'Navigate to /?view=presenter&standalone=true and press F11 for full-screen borderless display.',
          actionLabel: 'Launch Projector Window',
          action: () => {
            if (typeof window !== 'undefined') {
              window.open('/?view=presenter&standalone=true', '_blank');
            }
          },
        },
        {
          id: 'step_sound_conch',
          text: 'Test Auspicious Conch Fanfare (Opening Cue)',
          detail: 'Adjust hall master volume so the conch sounds crisp without clipping.',
          actionLabel: 'Play Conch Sound',
          action: () => soundManager.playConch(),
        },
        {
          id: 'step_sound_buzzer',
          text: 'Test High-Stakes Buzzer & Correct Answer Chimes',
          detail: 'Check that players and audience can clearly hear the buzz-in sound cue.',
          actionLabel: 'Play Buzzer Sound',
          action: () => soundManager.playBuzzer(),
        },
        {
          id: 'step_local_wifi',
          text: 'Verify Local Wi-Fi or Mobile Hotspot Network',
          detail: 'Ensure the host computer and contestant smartphones are on the same Wi-Fi SSID for zero-latency communication.',
        },
      ],
    },
    {
      id: 'act_lobby',
      actNumber: 'ACT 1',
      title: 'Contestant Check-In & Seat Claiming',
      timing: '5 Mins Prior',
      summary: '6 contestants scan QR code, enter custom names, and claim Seats 1–6.',
      targetPhase: 'LOBBY',
      steps: [
        {
          id: 'step_set_lobby',
          text: 'Switch Main Stage Screen to LOBBY Phase',
          detail: 'The projector will prominently display the scannable Join QR Code and 6 live seat podiums.',
          actionLabel: 'Set Phase: LOBBY',
          action: () => onSetPhase('LOBBY'),
        },
        {
          id: 'step_contestant_scan',
          text: 'Instruct Contestants to Scan QR & Enter Custom Names',
          detail: 'Each contestant points their phone camera at the screen, types their name, and selects their assigned physical seat (1–6).',
        },
        {
          id: 'step_verify_roster',
          text: 'Verify All 6 Seats Are Claimed on Projector Board',
          detail: 'Watch each seat card illuminate in gold with the contestant’s custom name and avatar.',
        },
        {
          id: 'step_start_announcement',
          text: 'Welcome the Assembly & Recite Opening Mangalacarana',
          detail: 'Introduce the 4 rounds of Viplava 2026 and sound the conch to begin.',
          actionLabel: 'Sound Opening Conch',
          action: () => soundManager.playConch(),
        },
      ],
    },
    {
      id: 'act_round1',
      actNumber: 'ACT 2',
      title: 'Round 1: Direct & Pass',
      timing: '15 Minutes',
      summary: '18 direct questions (3 per seat). Direct = +10 pts (30s). Pass = +5 pts.',
      targetPhase: 'ROUND_1_RULES',
      steps: [
        {
          id: 'step_r1_rules',
          text: 'Display Round 1 Rules on Main Projector',
          detail: 'Direct question gets 30s (+10 pts). If passed to next clockwise seat (+5 pts). No negative marks.',
          actionLabel: 'Show Round 1 Rules',
          action: () => onSetPhase('ROUND_1_RULES'),
        },
        {
          id: 'step_r1_active',
          text: 'Launch Question 1 for Seat 1',
          detail: 'Read question aloud clearly. Start the 30-second timer on the console.',
          actionLabel: 'Start Round 1 Questions',
          action: () => onSetPhase('ROUND_1_ACTIVE'),
        },
        {
          id: 'step_r1_pass_flow',
          text: 'Manage Passes & Answers Accurately',
          detail: 'If contestant passes or time expires, click "Pass to Next Seat" (+5 pts). Click "Reveal Answer" before next question.',
        },
        {
          id: 'step_r1_leaderboard',
          text: 'Present Round 1 Leaderboard to Audience',
          detail: 'Review scores with the audience before transitioning to the Rapid Fire round.',
          actionLabel: 'Show R1 Leaderboard',
          action: () => onSetPhase('ROUND_1_LEADERBOARD'),
        },
      ],
    },
    {
      id: 'act_round2',
      actNumber: 'ACT 3',
      title: 'Round 2: Rapid Fire Blitz',
      timing: '12 Minutes',
      summary: 'Each contestant answers 10 rapid questions in 60 seconds (+10 pts each).',
      targetPhase: 'ROUND_2_RULES',
      steps: [
        {
          id: 'step_r2_rules',
          text: 'Display Rapid Fire Blitz Rules on Projector',
          detail: 'Explain that the 60-second timer starts on the first word. Contestants can say "Pass" to skip.',
          actionLabel: 'Show Round 2 Rules',
          action: () => onSetPhase('ROUND_2_RULES'),
        },
        {
          id: 'step_r2_active',
          text: 'Call Seat 1 to the Spotlight & Start 60s Timer',
          detail: 'Read questions swiftly. Click "+10 Correct" for each correct answer.',
          actionLabel: 'Start Round 2 Blitz',
          action: () => onSetPhase('ROUND_2_ACTIVE'),
        },
        {
          id: 'step_r2_sequence',
          text: 'Proceed Sequentially through Seats 2 to 6',
          detail: 'Repeat the 60s drill for each participant. Each seat gets their unique set of 10 questions.',
        },
        {
          id: 'step_r2_leaderboard',
          text: 'Display Round 2 Cumulative Leaderboard',
          detail: 'Observe score shifts as rapid fire points are tallied.',
          actionLabel: 'Show R2 Leaderboard',
          action: () => onSetPhase('ROUND_2_LEADERBOARD'),
        },
      ],
    },
    {
      id: 'act_round3',
      actNumber: 'ACT 4',
      title: 'Round 3: High-Stakes Buzzer Round',
      timing: '15 Minutes',
      summary: '12 open questions. +15 pts for correct, -5 penalty for wrong answer.',
      targetPhase: 'ROUND_3_RULES',
      steps: [
        {
          id: 'step_r3_rules',
          text: 'Display Buzzer Round Rules on Projector',
          detail: 'Emphasize high stakes: +15 for correct answer, but -5 penalty for incorrect! 15s to answer upon buzzing.',
          actionLabel: 'Show Round 3 Rules',
          action: () => onSetPhase('ROUND_3_RULES'),
        },
        {
          id: 'step_r3_active',
          text: 'Launch Buzzer Round Question 1',
          detail: 'Read question completely. Then click "Unlock Buzzer" to arm mobile buzzers.',
          actionLabel: 'Start Round 3 Buzzer',
          action: () => onSetPhase('ROUND_3_ACTIVE'),
        },
        {
          id: 'step_r3_buzz_handling',
          text: 'Acknowledge First Buzzed Contestant',
          detail: 'The projector will instantly spotlight who buzzed first with a loud chime. Mark Correct (+15) or Wrong (-5).',
        },
        {
          id: 'step_r3_leaderboard',
          text: 'Display Final Round Standings',
          detail: 'Review the podium contenders and check if a tie-breaker is required.',
          actionLabel: 'Show R3 Leaderboard',
          action: () => onSetPhase('ROUND_3_LEADERBOARD'),
        },
      ],
    },
    {
      id: 'act_podium',
      actNumber: 'ACT 5',
      title: 'Tie-Breaker & Grand Winner Podium',
      timing: '5 Minutes',
      summary: 'Resolve any 1st place ties and celebrate the champions with confetti fanfare.',
      targetPhase: 'FINAL_PODIUM',
      steps: [
        {
          id: 'step_check_tie',
          text: 'Check for First-Place Score Tie',
          detail: 'If two or more contestants share top points, launch the Fastest-Finger Tie-Breaker.',
          actionLabel: 'Check Tie-Breaker Rules',
          action: () => onSetPhase('TIE_BREAKER_RULES'),
        },
        {
          id: 'step_grand_podium',
          text: 'Launch Grand Finale / Winner Podium',
          detail: 'Reveals 1st, 2nd, and 3rd place winners with victory fanfare and celebratory confetti explosion.',
          actionLabel: 'Launch Grand Podium',
          action: () => {
            onSetPhase('FINAL_PODIUM');
            soundManager.playVictory();
          },
        },
        {
          id: 'step_awards',
          text: 'Present Viplava 2026 Trophies & Book Sets',
          detail: 'Invite temple authorities and senior devotees to honor all 6 participants.',
        },
      ],
    },
  ];

  const totalStepsCount = acts.reduce((acc, act) => acc + act.steps.length, 0);
  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedStepsCount / totalStepsCount) * 100);

  const currentAct = acts.find((a) => a.id === activeActId) || acts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#140b22] border-2 border-amber-500/50 rounded-3xl text-amber-50 shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-amber-500/25 bg-[#1b0f2e]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-cinzel text-amber-200">
                  Quiz Master Stage Runbook
                </h2>
                <span className="text-[11px] font-bold text-amber-400/80 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  6-Player Protocol
                </span>
              </div>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Viplava 2026: Live Stage Conductor Guide &amp; Real-Time Checklist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-amber-400/70">
                Checklist Progress
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {completedStepsCount} / {totalStepsCount} ({progressPercent}%)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-amber-400 hover:text-amber-100 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LIVE ROSTER STRIP: Shows quick status of all 6 seats */}
        <div className="bg-black/50 px-4 sm:px-6 py-2.5 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-200">Stage Roster:</span>
            <span className="font-mono font-black text-amber-300">
              {claimedCount} / 6 Ready
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
            {participants.map((p) => {
              const isReady = Boolean(p.isClaimed);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    isReady
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-amber-500/20 text-amber-400/50'
                  }`}
                  title={`Seat ${p.seatNumber}: ${isReady ? (p.claimedName || p.spiritualName) : 'Unclaimed'}`}
                >
                  <span className="text-xs">{p.avatar}</span>
                  <span className="font-bold">S{p.seatNumber}</span>
                  <span className="truncate max-w-[70px]">
                    {isReady ? (p.claimedName || p.spiritualName.split(' ')[0]) : 'Waiting'}
                  </span>
                  {isReady ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN BODY: ACT NAVIGATION + STEPS VIEW */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ACT TABS SIDEBAR */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-amber-500/20 bg-black/30 p-2 sm:p-3 overflow-y-auto space-y-1 shrink-0">
            {acts.map((act) => {
              const isActive = act.id === activeActId;
              const actStepIds = act.steps.map((s) => s.id);
              const actDone = actStepIds.every((id) => completedSteps[id]);

              return (
                <button
                  key={act.id}
                  onClick={() => setActiveActId(act.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-100 shadow-md'
                      : 'bg-black/20 border-transparent hover:bg-white/5 text-amber-300/70 hover:text-amber-200'
                  }`}
                >
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black text-amber-400">
                        {act.actNumber}
                      </span>
                      <span className="text-[10px] text-amber-300/60 font-medium">
                        • {act.timing}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">{act.title}</div>
                  </div>

                  <div className="shrink-0">
                    {actDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-amber-500/50" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE ACT DETAILS & STEP CHECKLIST */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#140b22]">
            {/* ACT HERO BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-amber-400 uppercase">
                    {currentAct.actNumber}
                  </span>
                  <span className="text-xs text-amber-300/70">• {currentAct.timing}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black font-cinzel text-amber-200 mt-0.5">
                  {currentAct.title}
                </h3>
                <p className="text-xs text-amber-200/80 mt-1 max-w-lg leading-relaxed">
                  {currentAct.summary}
                </p>
              </div>

              {currentAct.targetPhase && (
                <button
                  onClick={() => onSetPhase(currentAct.targetPhase!)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Launch Phase</span>
                </button>
              )}
            </div>

            {/* STEPS LIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400/80">
                Action Checklist:
              </h4>

              {currentAct.steps.map((step) => {
                const isDone = !!completedSteps[step.id];

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-950/25 border-emerald-500/40 opacity-90'
                        : 'bg-black/40 border-amber-500/25 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="mt-0.5 text-amber-400 hover:text-amber-200 transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-amber-400/60" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div
                          onClick={() => toggleStep(step.id)}
                          className={`text-xs sm:text-sm font-bold cursor-pointer select-none leading-snug ${
                            isDone ? 'line-through text-emerald-300/80' : 'text-amber-100'
                          }`}
                        >
                          {step.text}
                        </div>
                        {step.detail && (
                          <p className="text-[11px] text-amber-300/70 leading-relaxed">
                            {step.detail}
                          </p>
                        )}
                      </div>

                      {step.action && step.actionLabel && (
                        <button
                          onClick={step.action}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 hover:text-amber-100 text-xs font-bold transition-all shrink-0 flex items-center gap-1 active:scale-95"
                        >
                          <span>{step.actionLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-[#1b0f2e] border-t border-amber-500/25 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-amber-400/70 font-medium">
            Viplava 2026 • A Quiz on Srila Prabhupada Life Runbook
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompletedSteps({})}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300/70 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Checklist</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
