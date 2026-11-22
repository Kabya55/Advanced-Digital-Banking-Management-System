import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/store/provider';

export const metadata: Metadata = {
  title: 'Apex Bank | Advanced Digital Banking Management System',
  description:
    'A secure, professional, and feature-rich digital banking platform with role-based banking workflows, atomic fund transfers, and real-time financial analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
