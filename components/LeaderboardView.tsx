'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { QuizState } from '@/lib/types';

interface LeaderboardViewProps {
  state: QuizState;
}

type TabType = 'total' | 'round1' | 'round2' | 'round3' | 'tieBreaker';

export function LeaderboardView({ state }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('total');
  const { participants } = state;

  const getSortedParticipants = () => {
    return [...participants].sort((a, b) => {
      if (activeTab === 'round1') return b.scores.round1 - a.scores.round1;
      if (activeTab === 'round2') return b.scores.round2 - a.scores.round2;
      if (activeTab === 'round3') return b.scores.round3 - a.scores.round3;
      if (activeTab === 'tieBreaker') return b.scores.tieBreaker - a.scores.tieBreaker;
      return b.totalScore - a.totalScore;
    });
  };

  const sorted = getSortedParticipants();
  const leader = sorted[0];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 animate-fadeIn text-amber-50">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Viplava 2026 Scoreboard</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500">
          Transcendental Standings
        </h2>
        <p className="text-xs sm:text-sm text-amber-200/70 max-w-lg mx-auto">
          Honoring the 6 contestants celebrating Srila Prabhupada&apos;s pastimes at Gokul, Mathura Dham
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'total', label: 'Overall Cumulative Total' },
          { id: 'round1', label: 'Round 1 (Direct & Pass)' },
          { id: 'round2', label: 'Round 2 (Rapid Fire)' },
          { id: 'round3', label: 'Round 3 (Buzzer)' },
          { id: 'tieBreaker', label: 'Tie-Breaker' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-black border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-[#150d24] text-amber-200/70 border-amber-500/20 hover:text-amber-100 hover:bg-[#1f1335]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leader Highlight Card */}
      {leader && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/20 flex items-center justify-center text-4xl shadow-inner">
              {leader.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-black/80">
                <Crown className="w-4 h-4 text-black" /> Leading Contestant
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-cinzel text-black">
                Seat {leader.seatNumber}: {leader.name} ({leader.spiritualName})
              </h3>
              <div className="text-xs font-semibold text-black/80">
                R1: {leader.scores.round1} pts • R2: {leader.scores.round2} pts • R3: {leader.scores.round3} pts
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase font-extrabold text-black/70">Top Score</div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-black">
              {activeTab === 'total'
                ? leader.totalScore
                : activeTab === 'round1'
                ? leader.scores.round1
                : activeTab === 'round2'
                ? leader.scores.round2
                : activeTab === 'round3'
                ? leader.scores.round3
                : leader.scores.tieBreaker}{' '}
              <span className="text-lg">pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <span>Rank &amp; Contestant</span>
          <span>Score Breakdown</span>
        </div>

        <div className="space-y-2">
          {sorted.map((p, idx) => {
            const isGold = idx === 0;
            const isSilver = idx === 1;
            const isBronze = idx === 2;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                  isGold
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                {/* Left side: Rank badge + Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm">
                    {isGold ? (
                      <span className="text-amber-400 text-lg">🥇</span>
                    ) : isSilver ? (
                      <span className="text-slate-300 text-lg">🥈</span>
                    ) : isBronze ? (
                      <span className="text-amber-600 text-lg">🥉</span>
                    ) : (
                      <span className="text-amber-400/60 font-bold">#{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-3xl">{p.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-amber-100">
                      Seat {p.seatNumber}: {p.name}
                    </div>
                    <div className="text-xs text-amber-300/70">{p.spiritualName}</div>
                  </div>
                </div>

                {/* Right side: Points by round + Total */}
                <div className="flex items-center gap-4 sm:gap-6 text-right">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-amber-200/60 font-mono">
                    <span title="Round 1 Direct & Pass">R1: +{p.scores.round1}</span>
                    <span className="text-amber-500/30">•</span>
                    <span title="Round 2 Rapid Fire">R2: +{p.scores.round2}</span>
                    <span className="text-amber-500/30">•</span>
                    <span title="Round 3 Buzzer">R3: {p.scores.round3 >= 0 ? `+${p.scores.round3}` : p.scores.round3}</span>
                    {p.scores.tieBreaker > 0 && (
                      <>
                        <span className="text-amber-500/30">•</span>
                        <span title="Tie Breaker">TB: +{p.scores.tieBreaker}</span>
                      </>
                    )}
                  </div>

                  <div className="w-24 text-right font-mono text-xl sm:text-2xl font-black text-amber-400">
                    {activeTab === 'total'
                      ? p.totalScore
                      : activeTab === 'round1'
                      ? p.scores.round1
                      : activeTab === 'round2'
                      ? p.scores.round2
                      : activeTab === 'round3'
                      ? p.scores.round3
                      : p.scores.tieBreaker}{' '}
                    <span className="text-xs font-normal text-amber-300/70">pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
