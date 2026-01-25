'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

export const SIDENAV_WIDTH = 260;
export const SIDENAV_COLLAPSED_WIDTH = 68;

interface NavigationContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  sideNavWidth: number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const NavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const sideNavWidth = collapsed ? SIDENAV_COLLAPSED_WIDTH : SIDENAV_WIDTH;

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggleCollapsed, sideNavWidth }),
    [collapsed, toggleCollapsed, sideNavWidth],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
