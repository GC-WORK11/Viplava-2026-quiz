'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  text: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function QRCodeDisplay({
  text,
  size = 180,
  className = '',
  darkColor = '#0f081c',
  lightColor = '#ffffff',
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, {
      width: size * 2,
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [text, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex flex-col items-center justify-center bg-black/40 border border-amber-500/30 rounded-2xl animate-pulse text-xs text-amber-200/80 p-3 text-center"
      >
        <span>Generating QR...</span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={dataUrl}
      alt="Scan QR Code to Join Quiz"
      width={size}
      height={size}
      className={`rounded-2xl shadow-2xl border-2 border-amber-400/50 bg-white p-2 ${className}`}
    />
  );
}
