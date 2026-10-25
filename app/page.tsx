'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuizSync } from '@/hooks/useQuizSync';
import { HeaderNav, AppView } from '@/components/HeaderNav';
import { HostConsole } from '@/components/HostConsole';
import { PresenterScreen } from '@/components/PresenterScreen';
import { ParticipantMobileView } from '@/components/ParticipantMobileView';
import { LeaderboardView } from '@/components/LeaderboardView';
import { AdminPanel } from '@/components/AdminPanel';
import { MultiPlayerSimulator } from '@/components/MultiPlayerSimulator';
import { JoinQRModal } from '@/components/JoinQRModal';
import { AuthProtectionModal, useModeratorAuth } from '@/components/AuthProtectionModal';
import { Loader2 } from 'lucide-react';

function QuizAppContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams.get('view') as AppView | null;
  const urlSeat = searchParams.get('seat');
  const isStandalone = searchParams.get('standalone') === 'true';

  const [currentView, setCurrentView] = useState<AppView>(urlView || 'presenter');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingProtectedView, setPendingProtectedView] = useState<AppView | null>(null);

  const { isUnlocked, logout } = useModeratorAuth();

  const [forcedSeat, setForcedSeat] = useState<number | null>(() => {
    if (urlSeat) {
      const parsed = parseInt(urlSeat, 10);
      if (parsed >= 1 && parsed <= 6) return parsed;
    }
    return null;
  });

  const { state, isConnected, isLoading, executeAction } = useQuizSync();

  const handleSeatSelectedFromModal = (seat: number) => {
    setForcedSeat(seat);
    setCurrentView('participant');
  };

  const handleOpenAuth = (targetView: AppView) => {
    setPendingProtectedView(targetView);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingProtectedView) {
      setCurrentView(pendingProtectedView);
      setPendingProtectedView(null);
    }
  };

  const handleTogglePause = () => {
    if (!state) return;
    executeAction('toggle_pause_round', { isPaused: !state.isPaused });
  };

  if (isLoading && !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0713] text-amber-200 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <div className="font-cinzel text-lg tracking-wider">Loading Viplava 2026 Quiz...</div>
      </div>
    );
  }

  // Standalone Presenter Mode (for external projector / HDMI display without nav)
  if (isStandalone && currentView === 'presenter') {
    return (
      <div className="min-h-screen bg-[#07040d] text-amber-50">
        <PresenterScreen state={state} isStandalone={true} />
      </div>
    );
  }

  // Dedicated Participant View: Strictly no links to other pages, only quiz attempt things
  if (currentView === 'participant') {
    return (
      <div className="min-h-screen bg-[#0b0713] text-amber-50 flex flex-col selection:bg-amber-500 selection:text-black">
        {/* Minimal focused contestant header with no other page links */}
        <header className="px-4 py-2.5 bg-[#140b24]/90 border-b border-amber-500/20 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🦚</span>
            <div>
              <div className="text-xs font-black font-cinzel text-amber-300">VIPLAVA 2026 • CONTESTANT PORTAL</div>
              <div className="text-[10px] text-amber-200/60">Stage Live Quiz Attempt Interface</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </header>

        <main className="flex-1">
          <ParticipantMobileView
            state={state}
            executeAction={executeAction}
            forcedSeat={forcedSeat}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0713] text-amber-50 selection:bg-amber-500 selection:text-black">
      {/* Top Header Navigation */}
      <HeaderNav
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        phase={state.phase}
        isConnected={isConnected}
        onOpenQR={() => setIsQRModalOpen(true)}
        isUnlocked={isUnlocked}
        onOpenAuth={handleOpenAuth}
        onLockAuth={logout}
        isPaused={state.isPaused}
        onTogglePause={handleTogglePause}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'host' && (
          <HostConsole state={state} executeAction={executeAction} />
        )}

        {currentView === 'presenter' && (
          <PresenterScreen state={state} isStandalone={false} />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView state={state} />
        )}

        {currentView === 'admin' && (
          <AdminPanel state={state} executeAction={executeAction} />
        )}

        {currentView === 'simulator' && (
          <MultiPlayerSimulator state={state} executeAction={executeAction} />
        )}
      </main>

      {/* Connection / LAN Setup Modal */}
      <JoinQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        participants={state.participants}
        onSelectSeat={handleSeatSelectedFromModal}
        customHostUrl={state.customHostUrl}
        detectedNetworkIp={state.detectedNetworkIp}
      />

      {/* Passcode 108 Authentication Modal */}
      <AuthProtectionModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        targetViewName={pendingProtectedView ? pendingProtectedView.toUpperCase() : 'Moderator Tools'}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b0713] text-amber-200">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <QuizAppContent />
    </Suspense>
  );
}

