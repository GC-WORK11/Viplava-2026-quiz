'use client';

// NTP-style clock synchronization for fair buzzer timing.
// Each client estimates the offset between its local clock and the server clock
// by taking several ping samples and keeping the one with the lowest RTT
// (low-RTT samples have the least asymmetric network delay).
//
// offset = serverTime - (t0 + t3) / 2   where t0 = client send, t3 = client recv
// serverNow() then gives the client's best estimate of the server's clock,
// letting every phone timestamp taps on the SAME timeline. Ranking by these
// timestamps removes "whose packet arrived first" network-jitter bias.

let offsetMs = 0;
let bestRttMs = Number.POSITIVE_INFINITY;
let lastSyncAt = 0;
let started = false;
let syncing = false;

const RESYNC_INTERVAL_MS = 20_000;
const SAMPLES_PER_SYNC = 8;
const SAMPLE_DELAY_MS = 60;

async function takeSample(): Promise<{ offset: number; rtt: number } | null> {
  try {
    const t0 = Date.now();
    const res = await fetch('/api/quiz/time', { cache: 'no-store' });
    const text = await res.text();
    const t3 = Date.now();
    const serverT = (JSON.parse(text) as { t: number }).t;
    const rtt = t3 - t0;
    // Offset estimate: server clock value minus the midpoint of our round trip
    const offset = serverT - (t0 + t3) / 2;
    return { offset, rtt };
  } catch {
    return null;
  }
}

async function runSync(samples: number) {
  if (syncing) return;
  syncing = true;
  try {
    for (let i = 0; i < samples; i++) {
      const sample = await takeSample();
      if (sample) {
        // Adopt samples with the best (lowest) RTT — least asymmetric delay.
        // EMA-smooth small drift on subsequent samples.
        if (sample.rtt <= bestRttMs || bestRttMs === Number.POSITIVE_INFINITY) {
          if (sample.rtt < bestRttMs || bestRttMs === Number.POSITIVE_INFINITY) {
            bestRttMs = sample.rtt;
          }
          offsetMs = offsetMs * 0.3 + sample.offset * 0.7;
        }
        lastSyncAt = Date.now();
      }
      if (i < samples - 1) {
        await new Promise((r) => setTimeout(r, SAMPLE_DELAY_MS));
      }
    }
  } finally {
    syncing = false;
  }
}

export function startClockSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  void runSync(SAMPLES_PER_SYNC);
  setInterval(() => {
    if (Date.now() - lastSyncAt >= RESYNC_INTERVAL_MS) {
      void runSync(3);
    }
  }, 5_000);
}

// Best estimate of the server's current time (ms epoch).
export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function getRttMs(): number {
  return bestRttMs === Number.POSITIVE_INFINITY ? 0 : Math.round(bestRttMs);
}

export function isClockSynced(): boolean {
  return bestRttMs !== Number.POSITIVE_INFINITY;
}
