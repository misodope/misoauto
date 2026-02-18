'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Text,
  Heading,
  Flex,
  Box,
  TextField,
  Checkbox,
} from '@radix-ui/themes';
import { useAuth } from '../../../contexts/AuthContext';
import { useLogin, useRegister } from '@frontend/app/hooks';
import { Footer } from '../../../components/Footer';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [smsConsent, setSmsConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const {
    mutate: register,
    isPending: isRegistering,
    error: registerError,
  } = useRegister();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/home');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.submit;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Registration attempt:', {
        name: formData.name,
        email: formData.email,
      });

      register(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          smsConsent,
        },
        {
          onSuccess: () => {
            setFormData({
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
            });
            setErrors({});
            // useAuth effect will redirect once logged in
          },
          onError: (error) => {
            console.error('Registration failed:', JSON.stringify(error));
            const errorMessage =
              error.response?.data?.message ||
              'Registration failed. Please try again.';
            setErrors({ submit: errorMessage });
          },
        },
      );
    }
  };

  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
      >
        <Text size="4" color="gray">
          Loading...
        </Text>
      </Flex>
    );
  }

  if (isLoggedIn) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
      >
        <Text size="4" color="gray">
          Redirecting...
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" minHeight="90vh">
      <Flex
        direction="column"
        align="center"
        justify="center"
        flexGrow="1"
        p="6"
        maxWidth="400px"
        mx="auto"
        width="100%"
      >
        <Heading size="6" mb="4" align="center">
          Create an Account
        </Heading>
        <Box asChild width="100%">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Full Name
                </Text>
                <TextField.Root
                  type="text"
                  value={formData.name}
                  onChange={(e: any) => handleChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  size="3"
                />
                {errors.name && (
                  <Text size="1" color="red">
                    {errors.name}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Email
                </Text>
                <TextField.Root
                  type="email"
                  value={formData.email}
                  onChange={(e: any) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  size="3"
                />
                {errors.email && (
                  <Text size="1" color="red">
                    {errors.email}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Password
                </Text>
                <TextField.Root
                  type="password"
                  value={formData.password}
                  onChange={(e: any) =>
                    handleChange('password', e.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  size="3"
                />
                {errors.password && (
                  <Text size="1" color="red">
                    {errors.password}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Confirm Password
                </Text>
                <TextField.Root
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e: any) =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                  size="3"
                />
                {errors.confirmPassword && (
                  <Text size="1" color="red">
                    {errors.confirmPassword}
                  </Text>
                )}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Phone Number: 
                </Text>
                <TextField.Root
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e: any) => handleChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  size="3"
                />
                {errors.email && (
                  <Text size="1" color="red">
                    {errors.email}
                  </Text>
                )}
              </Box>

              <Box>
                <Flex gap="2" align="start">
                  <Checkbox
                    checked={smsConsent}
                    onCheckedChange={(checked) =>
                      setSmsConsent(checked === true)
                    }
                    mt="1"
                  />
                  <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>
                    I agree to receive recurring automated SMS notifications and
                    service updates from MisoAuto. Message and data rates may
                    apply. Message frequency varies. Text <strong>HELP</strong>{' '}
                    for help or <strong>STOP</strong> to opt out. Consent is not
                    a condition of purchase or account creation. View our{' '}
                    <Link
                      href="/legal/terms"
                      style={{
                        color: 'var(--accent-11)',
                        textDecoration: 'underline',
                      }}
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/legal/privacy"
                      style={{
                        color: 'var(--accent-11)',
                        textDecoration: 'underline',
                      }}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </Text>
                </Flex>
              </Box>

              {errors.submit && (
                <Box>
                  <Text size="2" color="red" align="center">
                    {errors.submit}
                  </Text>
                </Box>
              )}

              <Button
                type="submit"
                size="3"
                variant="solid"
                mt="2"
                style={{ width: '100%' }}
                disabled={isRegistering}
              >
                {isRegistering ? 'Creating Account...' : 'Register'}
              </Button>
            </Flex>
          </form>
        </Box>

        <Flex justify="center" mt="4">
          <Text size="2">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              style={{
                color: 'var(--accent-11)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                borderRadius: '4px',
                padding: '2px 4px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--accent-12)';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  'var(--accent-3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  'var(--accent-11)';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  'transparent';
              }}
            >
              Login here
            </Link>
          </Text>
        </Flex>
      </Flex>
      <Footer />
    </Flex>
  );
}
