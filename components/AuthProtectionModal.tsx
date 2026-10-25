'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { soundManager } from '@/lib/soundEffects';

const AUTH_STORAGE_KEY = 'viplava_moderator_auth_108';
export const REQUIRED_PASSCODE = '108';

const subscribeAuth = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('viplava-auth-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('viplava-auth-change', callback);
    window.removeEventListener('storage', callback);
  };
};

const getAuthSnapshot = () => {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === REQUIRED_PASSCODE;
  } catch {
    return false;
  }
};

const getAuthServerSnapshot = () => false;

export function useModeratorAuth() {
  const isUnlocked = React.useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  const login = (pass: string): boolean => {
    if (pass.trim() === REQUIRED_PASSCODE) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, REQUIRED_PASSCODE);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('viplava-auth-change'));
        }
      } catch {
        // Safe fallback
      }
      soundManager.playCorrect();
      return true;
    }
    soundManager.playWrong();
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('viplava-auth-change'));
      }
    } catch {
      // Safe fallback
    }
  };

  return { isUnlocked, hasChecked: true, login, logout };
}

interface AuthProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetViewName?: string;
}

export function AuthProtectionModal({
  isOpen,
  onClose,
  onSuccess,
  targetViewName = 'Moderator Tools',
}: AuthProtectionModalProps) {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useModeratorAuth();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(passcode)) {
      setSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        setSuccess(false);
        setPasscode('');
        onSuccess();
        onClose();
      }, 500);
    } else {
      setErrorMsg('Incorrect passcode. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1b1030] to-[#0e071c] border-2 border-amber-500/50 rounded-3xl p-6 text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.35)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
            <KeyRound className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-black font-cinzel text-amber-200">
            Protected Access
          </h3>
          <p className="text-xs text-amber-200/70 leading-relaxed px-2">
            <strong>{targetViewName}</strong> is restricted to Quiz Masters &amp; Administrators.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
              Enter Passcode
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border-2 border-amber-500/40 focus:border-amber-400 text-center font-mono text-xl tracking-widest text-amber-200 focus:outline-none shadow-inner"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Access Granted! Storing session...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Control Deck</span>
          </button>
        </form>

        <p className="text-[10px] text-center text-amber-300/50 mt-4">
          Session will be securely remembered on this device.
        </p>
      </div>
    </div>
  );
}
