'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  Switch,
  Button,
  Separator,
} from '@radix-ui/themes';
import { useAuth } from '@frontend/app/contexts/AuthContext';
import { useToast } from '@frontend/app/components/Toaster';
import { useOptOut } from '@frontend/app/hooks/apis/users/use-users';

export default function NotificationPreferencesSection() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { mutate: optOut, isPending } = useOptOut();

  const [smsConsent, setSmsConsent] = useState(user?.smsConsent ?? false);
  const [emailConsent, setEmailConsent] = useState(user?.emailConsent ?? false);

  const handleSave = () => {
    optOut(
      { smsConsent, emailConsent },
      {
        onSuccess: () =>
          success(
            'Preferences saved',
            'Your notification preferences have been updated.',
          ),
        onError: (err) => {
          const message = err.response?.data?.message || 'Please try again.';
          error('Update failed', message);
        },
      },
    );
  };

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="4" mb="1">
            Notification Preferences
          </Heading>
          <Text size="2" color="gray">
            Manage how we contact you.
          </Text>
        </Box>

        <Separator size="4" />

        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Text size="3" weight="medium">
              SMS Notifications
            </Text>
            <Switch
              checked={smsConsent}
              onCheckedChange={setSmsConsent}
              size="2"
            />
          </Flex>

          <Separator size="4" />

          <Flex justify="between" align="center">
            <Text size="3" weight="medium">
              Email Notifications
            </Text>
            <Switch
              checked={emailConsent}
              onCheckedChange={setEmailConsent}
              size="2"
            />
          </Flex>

          <Flex justify="end">
            <Button size="2" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
