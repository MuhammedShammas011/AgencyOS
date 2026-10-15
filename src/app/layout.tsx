import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AgencyStoreProvider } from '@/lib/context/agency-store-context';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Agency OS — Internal Agency Intelligence Platform',
  description: 'Proprietary operating system and command center for high-end creative, marketing, and design agencies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-[#D7FF64] selection:text-[#121606]`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F6F2] text-[#171717]">
        <AgencyStoreProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1C1C1A',
                color: '#FFFFFF',
                border: '1px solid #2F2F2C',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </AgencyStoreProvider>
      </body>
    </html>
  );
}
