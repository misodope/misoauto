'use client';

import Link from 'next/link';
import { Text, Avatar, Flex, Button, Box } from '@radix-ui/themes';
import {
  HomeIcon,
  VideoIcon,
  Link2Icon,
  GearIcon,
  FileTextIcon,
} from '@radix-ui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SideNav, NavItem } from '../SideNav';
import DropdownMenu from '../DropdownMenu';
import UploadIndicator from '../UploadIndicator';
import { useNavigation } from './NavigationContext';
import styles from './Navigation.module.scss';

export default function Navigation() {
  const { isLoggedIn, isLoading, logout, user } = useAuth();
  const { collapsed, setCollapsed, sideNavWidth } = useNavigation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/home',
      icon: <HomeIcon />,
    },
    {
      id: 'videos',
      label: 'Videos',
      href: '/videos',
      icon: <VideoIcon />,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      href: '/integrations',
      icon: <Link2Icon />,
    },
  ];

  const footerItems: NavItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: <GearIcon />,
    },
    {
      id: 'legal',
      label: 'Legal',
      href: '/legal',
      icon: <FileTextIcon />,
    },
  ];

  // Non-authenticated: simple top nav
  if (!isLoggedIn) {
    return (
      <Box className={styles.topNav}>
        <Flex justify="between" align="center" p="4">
          <Text size="6" weight="bold">
            <Link href="/" className={styles.logo}>
              MisoAuto
            </Link>
          </Text>
          {!isLoading && (
            <Flex gap="2">
              <Button asChild variant="ghost" size="2">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild variant="soft" size="2">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </Flex>
          )}
        </Flex>
      </Box>
    );
  }

  // Authenticated: SideNav + TopNav with avatar
  const sideNavHeader = (
    <Link href="/home" className={styles.brandLink}>
      <Text size="5" weight="bold">
        MisoAuto
      </Text>
    </Link>
  );

  return (
    <>
      <SideNav
        items={navItems}
        header={sideNavHeader}
        footerItems={footerItems}
        variant="default"
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <Box className={styles.topNav} style={{ left: sideNavWidth }}>
        <Flex justify="end" align="center"  gap="3" p="4" height="100%">
          <UploadIndicator />
          <DropdownMenu
            items={[
              {
                id: 'logout',
                name: 'Logout',
                onClick: logout,
              },
            ]}
            trigger={
              <Avatar
                size="2"
                fallback={user?.name?.charAt(0).toUpperCase() || 'U'}
                radius="full"
                className={styles.avatar}
              />
            }
          />
        </Flex>
      </Box>
    </>
  );
}
