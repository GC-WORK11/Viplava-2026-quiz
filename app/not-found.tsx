import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0713] text-[#fef9ee] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold font-serif text-amber-400 mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-3">Page Not Found</h2>
      <p className="text-zinc-400 mb-6 max-w-md">
        The spiritual quiz view you requested could not be found. Please return to the Maha Quiz arena.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20 transition-all"
      >
        Return to Quiz
      </Link>
    </div>
  );
}
