'use client';

import { useState, FormEvent } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Separator,
} from '@radix-ui/themes';
import { useToast } from '@frontend/app/components/Toaster';
import { useUpdatePassword } from '@frontend/app/hooks/apis/users/use-users';

export default function ChangePasswordSection() {
  const { success, error } = useToast();
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    updatePassword(
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          success('Password updated', 'Your password has been changed successfully.');
          setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
          setErrors({});
        },
        onError: (err) => {
          const message = err.response?.data?.message || 'Please check your current password and try again.';
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
            Change Password
          </Heading>
          <Text size="2" color="gray">
            Enter your current password and choose a new one.
          </Text>
        </Box>

        <Separator size="4" />

        <Box asChild>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" htmlFor="current-password">
                  Current Password
                </Text>
                <TextField.Root
                  id="current-password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  size="3"
                />
                {errors.currentPassword && (
                  <Text size="1" color="red" mt="1">
                    {errors.currentPassword}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" htmlFor="new-password">
                  New Password
                </Text>
                <TextField.Root
                  id="new-password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  size="3"
                />
                {errors.newPassword && (
                  <Text size="1" color="red" mt="1">
                    {errors.newPassword}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" htmlFor="confirm-new-password">
                  Confirm New Password
                </Text>
                <TextField.Root
                  id="confirm-new-password"
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => handleChange('confirmNewPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  size="3"
                />
                {errors.confirmNewPassword && (
                  <Text size="1" color="red" mt="1">
                    {errors.confirmNewPassword}
                  </Text>
                )}
              </Box>

              <Flex justify="end">
                <Button type="submit" size="2" disabled={isPending}>
                  {isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </Flex>
    </Card>
  );
}
