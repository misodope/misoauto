'use client';

import { Box, Flex, Heading } from '@radix-ui/themes';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import UserInfoSection from './components/UserInfoSection/UserInfoSection';
import ChangePasswordSection from './components/ChangePasswordSection/ChangePasswordSection';
import NotificationPreferencesSection from './components/NotificationPreferencesSection/NotificationPreferencesSection';

function SettingsContent() {
  return (
    <Box p="6">
      <Heading size="7" mb="6">
        Settings
      </Heading>
      <Flex direction="column" gap="6" maxWidth="640px">
        <UserInfoSection />
        <ChangePasswordSection />
        <NotificationPreferencesSection />
      </Flex>
    </Box>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
