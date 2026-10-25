'use client';

import React from 'react';
import {
  Tv,
  Gamepad2,
  Trophy,
  Settings,
  Volume2,
  VolumeX,
  QrCode,
  Layers,
  Crown,
  Lock,
  Unlock,
  ExternalLink,
  Pause,
  Play,
  Wifi,
} from 'lucide-react';
import { soundManager } from '@/lib/soundEffects';
import { QuizPhase } from '@/lib/types';

export type AppView = 'host' | 'presenter' | 'participant' | 'leaderboard' | 'admin' | 'simulator';

interface HeaderNavProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  phase: QuizPhase;
  isConnected: boolean;
  onOpenQR: () => void;
  isUnlocked: boolean;
  onOpenAuth: (targetView: AppView) => void;
  onLockAuth: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const PHASE_SHORT_NAMES: Record<QuizPhase, string> = {
  LOBBY: 'Lobby',
  ROUND_1_RULES: 'R1 Rules',
  ROUND_1_ACTIVE: 'Round 1: Direct & Pass',
  ROUND_1_LEADERBOARD: 'R1 Scores',
  ROUND_2_RULES: 'R2 Rules',
  ROUND_2_ACTIVE: 'Round 2: Rapid Fire',
  ROUND_2_LEADERBOARD: 'R2 Scores',
  ROUND_3_RULES: 'R3 Rules',
  ROUND_3_ACTIVE: 'Round 3: Buzzer Round',
  ROUND_3_LEADERBOARD: 'R3 Scores',
  TIE_BREAKER_RULES: 'Tie-Breaker Rules',
  TIE_BREAKER_ACTIVE: 'Tie-Breaker Battle',
  FINAL_PODIUM: 'Final Champions',
};

export function HeaderNav({
  currentView,
  onViewChange,
  phase,
  isConnected,
  onOpenQR,
  isUnlocked,
  onOpenAuth,
  onLockAuth,
  isPaused = false,
  onTogglePause,
}: HeaderNavProps) {
  const [soundOn, setSoundOn] = React.useState(true);

  const toggleSound = () => {
    const next = soundManager.toggle();
    setSoundOn(next);
    if (next) soundManager.playBell();
  };

  const isProtectedView = (view: AppView) => ['host', 'presenter', 'admin', 'simulator'].includes(view);

  const handleNavClick = (view: AppView) => {
    if (isProtectedView(view) && !isUnlocked) {
      onOpenAuth(view);
      return;
    }
    onViewChange(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d0718]/95 backdrop-blur-md border-b border-amber-500/20 px-3 py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🦚</span>
          <div className="hidden sm:block">
            <span className="font-cinzel font-black tracking-wider text-base text-amber-300">
              VIPLAVA 2026
            </span>
            <span className="text-xs text-amber-200/60 ml-2 font-medium">
              Quiz
            </span>
          </div>
        </div>

        {/* Simplified Segmented Tabs */}
        <nav className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-amber-500/20 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleNavClick('presenter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              currentView === 'presenter'
                ? 'bg-amber-500 text-black shadow'
                : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Projector</span>
          </button>

          <button
            onClick={() => handleNavClick('host')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              currentView === 'host'
                ? 'bg-amber-500 text-black shadow'
                : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Host</span>
            {!isUnlocked && <Lock className="w-3 h-3 text-amber-400/80" />}
          </button>

          <button
            onClick={() => handleNavClick('participant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              currentView === 'participant'
                ? 'bg-amber-500 text-black shadow'
                : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Contestant</span>
          </button>

          <button
            onClick={() => handleNavClick('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              currentView === 'leaderboard'
                ? 'bg-amber-500 text-black shadow'
                : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Scores</span>
          </button>

          {isUnlocked && (
            <>
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
                }`}
                title="Edit Questions & Scores"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>

              <button
                onClick={() => handleNavClick('simulator')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  currentView === 'simulator'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-amber-200/80 hover:text-amber-100 hover:bg-white/5'
                }`}
                title="Multi-Device Tester"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sim</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Tools: Clean & Functional */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pause Button for Host */}
          {isUnlocked && onTogglePause && (
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                isPaused
                  ? 'bg-rose-600 text-white border-yellow-300 animate-pulse'
                  : 'bg-black/40 text-amber-300 border-amber-500/30 hover:bg-amber-950/60'
              }`}
              title={isPaused ? 'Resume Round' : 'Pause Round'}
            >
              {isPaused ? <Play className="w-4 h-4 text-yellow-300" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {/* Dedicated Presenter Popout for Projector */}
          {isUnlocked && (
            <a
              href="/?view=presenter&standalone=true"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold"
              title="Open Presenter on Projector Screen"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Projector ↗</span>
            </a>
          )}

          {/* Sound Synthesizer */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundOn
                ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                : 'bg-black/40 border-slate-700 text-slate-500'
            }`}
            title="Toggle Audio Synthesizer"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* QR Code / LAN Connect */}
          <button
            onClick={onOpenQR}
            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-colors"
            title="Connect Mobile Phones via Wi-Fi"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Lock / Unlock */}
          {!isUnlocked ? (
            <button
              onClick={() => onOpenAuth('host')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold"
              title="Unlock Host Controls"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Host</span>
            </button>
          ) : (
            <button
              onClick={onLockAuth}
              className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
              title="Lock Session"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}

          {/* Local Sync Badge */}
          <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local Sync</span>
          </div>
        </div>
      </div>
    </header>
  );
}
