'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../Navigation/NavigationContext';

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent = ({ children }: MainContentProps) => {
  const { isLoggedIn } = useAuth();
  const { sideNavWidth } = useNavigation();

  const className = isLoggedIn
    ? 'main-content'
    : 'main-content main-content--no-sidebar';

  const style = isLoggedIn ? { left: sideNavWidth } : undefined;

  return (
    <main className={className} style={style}>
      {children}
    </main>
  );
};
