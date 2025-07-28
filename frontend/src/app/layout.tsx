import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation/Navigation';
import DevAuthHelper from './components/DevAuthHelper/DevAuthHelper';
import { AuthProvider } from './contexts/AuthContext';
import './globals.css';
import './layout.scss';

import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MisoAuto - Social Media Automation',
  description: 'Automate your social media content distribution across multiple platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Theme 
            appearance="dark" 
            accentColor="yellow" 
            grayColor="slate"
            radius="medium"
          >
            <Navigation />
            <main className="main-content">
              {children}
            </main>
            <DevAuthHelper />
          </Theme>
        </AuthProvider>
      </body>
    </html>
  );
}
