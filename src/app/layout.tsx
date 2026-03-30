import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHC Finance Dashboard',
  description: 'Supported Home Care — Financial Analytics Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
