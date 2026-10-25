import { quizStore } from '@/lib/quizStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state immediately
      const initialState = quizStore.getState();
      const initialPayload = `data: ${JSON.stringify(initialState)}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Subscribe to changes
      cleanup = quizStore.subscribe((state) => {
        try {
          const payload = `data: ${JSON.stringify(state)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      });
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
