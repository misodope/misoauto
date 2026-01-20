'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Button, Box, Flex, Text } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  active?: boolean;
}

export default function Navigation() {
  const pathname = usePathname();
  const { isLoggedIn, isLoading, logout } = useAuth();

  const navItems: NavItem[] = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/videos', label: 'Videos', icon: '🎥' },
    { path: '/integrations', label: 'Integrations', icon: '🔗' },
  ];

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      style={{
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-6)',
      }}
      p="4"
    >
      <Flex justify="between" align="center">
        <Text size="6" weight="bold">
          <Link
            href="/home"
            style={{ textDecoration: 'none', color: 'var(--accent-12)' }}
          >
            MisoAuto
          </Link>
        </Text>

        {}
        {isLoggedIn && (
          <NavigationMenu.Root>
            <NavigationMenu.List
              style={{
                display: 'flex',
                gap: '0.5rem',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                alignItems: 'center',
              }}
            >
              {navItems.map((item) => (
                <NavigationMenu.Item key={item.path}>
                  <NavigationMenu.Link asChild>
                    <Button
                      asChild
                      variant={pathname === item.path ? 'solid' : 'ghost'}
                      size="2"
                      style={{
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Link
                        href={item.path}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textDecoration: 'none',
                          padding: '0 12px',
                        }}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ))}
            </NavigationMenu.List>
          </NavigationMenu.Root>
        )}

        <Flex align="center" gap="3">
          {isLoading ? (
            <Text size="2" color="gray">
              Loading...
            </Text>
          ) : !isLoggedIn ? (
            <Flex gap="2">
              <Button asChild variant="ghost" size="2">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild variant="soft" size="2">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </Flex>
          ) : (
            <Button onClick={logout} variant="soft" size="2" color="red">
              Logout
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
