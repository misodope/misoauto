'use client';

import { Container } from '@radix-ui/themes';
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
    <Container size="4" p="50px" className={className} style={style}>
      {children}
    </Container>
  );
};
