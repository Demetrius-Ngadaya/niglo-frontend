import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'NIGLOY COMPANY — Interior, Plumbing, Events & More',
  description:
    'NIGLOY provides interior design & finishing, plumbing, photography & video production, catering, delivery and equipment rental — one company, complete solutions.',
};

// This root layout is intentionally minimal now — the public site's header/footer
// live in src/app/(public)/layout.tsx, and the admin panel has its own separate
// shell in src/app/admin/layout.tsx. Keeping them apart means the admin panel no
// longer inherits the public site's chrome at all.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
