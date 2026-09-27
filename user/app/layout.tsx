import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';
import ExpressLoader from '@/components/ExpressLoader';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OBD | Billing & CRM',
  description: 'Billing & CRM SaaS administration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-[14px] text-[#111827]">
        <ExpressLoader>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ExpressLoader>
      </body>
    </html>
  );
}
