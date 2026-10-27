export const dynamic = 'force-dynamic';

// Lightweight clock-sync ping endpoint (NTP-style).
// Kept as small as possible so round-trip measurement stays accurate.
export async function GET() {
  return Response.json(
    { t: Date.now() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
