#!/usr/bin/env node
// Prints a scannable QR code for the quiz join URL straight to the terminal.
// Usage: node testing/qr.mjs [url]
import { networkInterfaces } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode');

function scoreIp(addr) {
  if (addr.startsWith('192.168.')) return 3;
  if (addr.startsWith('10.')) return 2;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr)) return 1;
  return 0;
}

function lanIp() {
  const cands = [];
  for (const nets of Object.values(networkInterfaces())) {
    for (const n of nets || []) {
      const fam = typeof n.family === 'string' ? n.family : n.family === 4 ? 'IPv4' : '';
      if (fam === 'IPv4' && !n.internal && n.address && !n.address.startsWith('127.')) {
        cands.push({ addr: n.address, score: scoreIp(n.address) });
      }
    }
  }
  cands.sort((a, b) => b.score - a.score);
  return cands[0]?.addr;
}

const port = process.env.PORT || '3100';
const url = process.argv[2] || `http://${lanIp() || '192.168.0.x'}:${port}/?view=participant`;

const art = await qrcode.toString(url, { type: 'terminal', small: true });
console.log('\n  Join the quiz — scan with your phone camera:\n');
console.log(art);
console.log(`  ${url}\n`);
