import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Placemate AI – Your AI-Powered Campus Placement Co-Pilot',
    template: '%s | Placemate AI',
  },
  description:
    'AI-personalised study roadmaps, ATS resume analysis, mock interviews, and TPO analytics for engineering campus placements in India.',
  keywords: ['campus placement', 'placement preparation', 'ATS resume', 'mock interview', 'engineering college', 'AI'],
  openGraph: {
    title: 'Placemate AI',
    description: 'Your AI-powered campus placement co-pilot for engineering students.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
