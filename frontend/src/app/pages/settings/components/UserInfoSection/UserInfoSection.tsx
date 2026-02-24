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
import { useAuth } from '@frontend/app/contexts/AuthContext';
import { useToast } from '@frontend/app/components/Toaster';
import { useUpdateProfile } from '@frontend/app/hooks/apis/users/use-users';

export default function UserInfoSection() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    updateProfile(
      { name: formData.name, email: formData.email },
      {
        onSuccess: () => success('Profile updated', 'Your information has been saved.'),
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
            User Information
          </Heading>
          <Text size="2" color="gray">
            Update your name and email address.
          </Text>
        </Box>

        <Separator size="4" />

        <Box asChild>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" htmlFor="settings-name">
                  Full Name
                </Text>
                <TextField.Root
                  id="settings-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  size="3"
                />
                {errors.name && (
                  <Text size="1" color="red" mt="1">
                    {errors.name}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" htmlFor="settings-email">
                  Email
                </Text>
                <TextField.Root
                  id="settings-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  size="3"
                />
                {errors.email && (
                  <Text size="1" color="red" mt="1">
                    {errors.email}
                  </Text>
                )}
              </Box>

              <Flex justify="end">
                <Button type="submit" size="2" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </Flex>
    </Card>
  );
}
