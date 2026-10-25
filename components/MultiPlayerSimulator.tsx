'use client';

import React, { useState } from 'react';
import { HostConsole } from './HostConsole';
import { ParticipantMobileView } from './ParticipantMobileView';
import { PresenterScreen } from './PresenterScreen';
import { QuizState } from '@/lib/types';
import { Smartphone, Monitor, Crown, Users } from 'lucide-react';

interface MultiPlayerSimulatorProps {
  state: QuizState;
  executeAction: (action: string, payload?: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown }>;
}

export function MultiPlayerSimulator({ state, executeAction }: MultiPlayerSimulatorProps) {
  const [leftView, setLeftView] = useState<'host' | 'presenter'>('host');
  const [rightSeatA, setRightSeatA] = useState<number>(1);
  const [rightSeatB, setRightSeatB] = useState<number>(2);

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4 animate-fadeIn text-amber-50">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-[#120822] border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold font-cinzel text-amber-300">
              Live Multi-Device LAN Simulator
            </h3>
            <p className="text-[11px] text-amber-200/70">
              Test Host controls and mobile participant buzzers simultaneously on this screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-400 font-semibold uppercase">Left Panel:</span>
          <button
            onClick={() => setLeftView('host')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
              leftView === 'host'
                ? 'bg-amber-500 text-black border-yellow-300'
                : 'bg-black/40 text-amber-300/70 border-amber-500/20'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> Host
          </button>
          <button
            onClick={() => setLeftView('presenter')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
              leftView === 'presenter'
                ? 'bg-amber-500 text-black border-yellow-300'
                : 'bg-black/40 text-amber-300/70 border-amber-500/20'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Presenter
          </button>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Host or Presenter View */}
        <div className="lg:col-span-7 bg-[#10091d] rounded-2xl border border-amber-500/30 p-2 sm:p-4 max-h-[85vh] overflow-y-auto">
          {leftView === 'host' ? (
            <HostConsole state={state} executeAction={executeAction} />
          ) : (
            <PresenterScreen state={state} />
          )}
        </div>

        {/* Right Side: 2 Mobile Participant Simulators */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mobile Controller 1 */}
          <div className="bg-[#0e071a] rounded-3xl border-2 border-amber-500/40 p-2 shadow-2xl flex flex-col justify-between">
            <div className="p-2 border-b border-amber-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Mobile Screen 1
              </span>
              <select
                value={rightSeatA}
                onChange={(e) => setRightSeatA(Number(e.target.value))}
                className="bg-black/60 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 text-[11px]"
              >
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <option key={s} value={s}>
                    Seat {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-y-auto max-h-[75vh] p-1">
              <ParticipantMobileView
                state={state}
                executeAction={executeAction}
                forcedSeat={rightSeatA}
              />
            </div>
          </div>

          {/* Mobile Controller 2 */}
          <div className="bg-[#0e071a] rounded-3xl border-2 border-amber-500/40 p-2 shadow-2xl flex flex-col justify-between">
            <div className="p-2 border-b border-amber-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Mobile Screen 2
              </span>
              <select
                value={rightSeatB}
                onChange={(e) => setRightSeatB(Number(e.target.value))}
                className="bg-black/60 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 text-[11px]"
              >
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <option key={s} value={s}>
                    Seat {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-y-auto max-h-[75vh] p-1">
              <ParticipantMobileView
                state={state}
                executeAction={executeAction}
                forcedSeat={rightSeatB}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
