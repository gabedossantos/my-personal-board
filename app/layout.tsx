<<<<<<< HEAD
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "../../../packages/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simulated Boardroom - Stress-Test Your Business Strategy",
  description:
    "Present your business ideas to AI-powered board members and receive realistic feedback before real investor meetings. Get insights from experienced CFO, CMO, and COO perspectives.",
  keywords:
    "business strategy, boardroom simulation, AI feedback, startup validation, investor preparation",
=======

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Simulated Boardroom - Stress-Test Your Business Strategy',
  description: 'Present your business ideas to virtual board members and receive realistic feedback before real investor meetings. Get insights from experienced CFO, CMO, and COO perspectives.',
  keywords: 'business strategy, boardroom simulation, feedback, startup validation, investor preparation',
>>>>>>> 9a3bd97 (Commit all recent changes)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
<<<<<<< HEAD
          <main className="min-h-screen">{children}</main>
=======
          <main className="min-h-screen">
            {children}
          </main>
>>>>>>> 9a3bd97 (Commit all recent changes)
        </ThemeProvider>
      </body>
    </html>
  );
}
