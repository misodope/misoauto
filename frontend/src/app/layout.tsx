import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, Toaster } from './components/Toaster';
import { Theme } from '@radix-ui/themes';
import { QueryProvider } from '@frontend/app/lib/api/Provider';

import './globals.css';
import './layout.scss';
import '@radix-ui/themes/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MisoAuto - Social Media Automation',
  description:
    'Automate your social media content distribution across multiple platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <Theme
              appearance="dark"
              accentColor="yellow"
              grayColor="slate"
              radius="medium"
            >
              <ToastProvider>
                <Navigation />
                <main className="main-content">{children}</main>
                <Toaster />
              </ToastProvider>
            </Theme>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
