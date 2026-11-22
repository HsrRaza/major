import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PatchPilot — AI Code Intelligence & Refactoring Platform',
  description: 'Enterprise Architectural Review, Code Quality Analysis, AST Smells Detection, and AI-Powered Refactoring Platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[#F8FAFC] text-[#172033] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
