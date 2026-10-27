'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, Wifi, QrCode } from 'lucide-react';
import { Participant } from '@/lib/types';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { resolveParticipantJoinUrl } from '@/lib/networkHelper';

interface JoinQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onSelectSeat?: (seat: number) => void;
  customHostUrl?: string;
  detectedNetworkIp?: string;
  serverPort?: string;
}

const subscribeOrigin = () => () => {};
const getOriginSnapshot = () => (typeof window !== 'undefined' ? window.location.origin : '');
const getOriginServerSnapshot = () => '';

export function JoinQRModal({
  isOpen,
  onClose,
  participants,
  onSelectSeat,
  customHostUrl,
  detectedNetworkIp,
  serverPort,
}: JoinQRModalProps) {
  const [copied, setCopied] = useState(false);
  const currentOrigin = React.useSyncExternalStore(subscribeOrigin, getOriginSnapshot, getOriginServerSnapshot);
  const { joinUrl, displayAddress } = resolveParticipantJoinUrl(
    currentOrigin,
    customHostUrl,
    detectedNetworkIp,
    serverPort
  );

  if (!isOpen) return null;

  const copyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#160f24] border-2 border-amber-500/50 rounded-2xl p-6 text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-amber-300">Connect Student Mobiles</h2>
              <p className="text-xs text-amber-200/70">Local Router / Hotspot or Web Link for 6 Participants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {/* LAN Connection Instructions */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Wifi className="w-4 h-4 text-amber-400" />
                <span>Local Router / Hotspot Setup</span>
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                Connect the 6 participant phones to the same Wi-Fi router or laptop hotspot. Then scan the QR code or navigate to:
              </p>
              <div className="flex items-center gap-2 bg-black/50 p-2.5 rounded-lg border border-amber-500/30">
                <code className="text-xs text-amber-300 font-mono break-all flex-1">
                  {joinUrl || 'http://<network-ip>:3000/?view=participant'}
                </code>
                <button
                  onClick={() => copyUrl(joinUrl)}
                  className="p-1.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors shrink-0"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {displayAddress && (
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Detected Wi-Fi IP: {displayAddress}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Quick Direct Seat Links
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (onSelectSeat) onSelectSeat(p.seatNumber);
                      onClose();
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 hover:bg-amber-600/30 border border-amber-500/30 text-left transition-all group"
                  >
                    <span className="text-lg">{p.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-amber-200 group-hover:text-amber-100 truncate">
                        Seat {p.seatNumber}
                      </div>
                      <div className="text-[10px] text-amber-300/60 truncate">
                        {p.isClaimed && p.claimedName ? p.claimedName : (p.spiritualName || 'Waiting...')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-gradient-to-b from-amber-950/40 to-purple-950/40 border border-amber-500/30 text-center">
            <div className="mb-3 bg-white p-2 rounded-xl shadow-lg">
              <QRCodeDisplay
                text={joinUrl || 'http://localhost:3000/?view=participant'}
                size={170}
                darkColor="#0b0713"
              />
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Scan to open Participant Controller</span>
            </div>
            <p className="text-[11px] text-amber-200/60 mt-1">
              Phones automatically open to the seat selection and registration screen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-sm shadow-lg transition-all"
          >
            Ready to Play
          </button>
        </div>
      </div>
    </div>
  );
}
