import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'World Leaders Missile Volley',
  description: '전 세계 유력 정치인들을 희화화한 풍자 배구 게임',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a180b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&family=Press+Start+2P&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display bg-background-dark text-slate-100 antialiased overflow-x-hidden`}>
        <div className="relative flex flex-col min-h-screen w-full max-w-[430px] mx-auto shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
