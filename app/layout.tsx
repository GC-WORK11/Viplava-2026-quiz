import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Viplava 2026: Srila Prabhupada Maha Quiz | Mathura-Gokul Dham',
  description: 'Interactive 6-player LAN and web spiritual quiz platform celebrating Srila Prabhupada and Viplava 2026 at Gokul, Mathura Dham.',
  openGraph: {
    title: 'Viplava 2026: Srila Prabhupada Maha Quiz',
    description: 'Interactive 6-player spiritual quiz platform with Direct & Pass, Rapid Fire, and Buzzer rounds.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Viplava 2026: Srila Prabhupada Maha Quiz',
    description: 'Interactive 6-player spiritual quiz platform with Direct & Pass, Rapid Fire, and Buzzer rounds.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#0b0713] text-[#fef9ee] min-h-screen antialiased selection:bg-amber-500 selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
