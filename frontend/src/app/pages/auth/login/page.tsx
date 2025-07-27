'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import * as Form from '@radix-ui/react-form';
import { Button, Text, Heading, Flex, Box, TextField } from '@radix-ui/themes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login attempt:', { email });
  };

  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      minHeight="100vh"
      p="6"
      maxWidth="400px"
      mx="auto"
    >
      <Heading size="6" mb="4" align="center">Login to MisoAuto</Heading>
      <Box asChild width="100%">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">Email</Text>
              <TextField.Root
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                size="3"
              />
            </Box>
            
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">Password</Text>
              <TextField.Root
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                size="3"
              />
            </Box>
            
            <Button type="submit" size="3" variant="solid" mt="2" style={{ width: '100%' }}>
              Log In
            </Button>
          </Flex>
        </form>
      </Box>
        
        <Flex justify="center" mt="4">
          <Text size="2">
            Don't have an account?{' '}
            <Link 
              href="/pages/auth/register"
              style={{
                color: 'var(--accent-11)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                borderRadius: '4px',
                padding: '2px 4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-12)';
                e.currentTarget.style.backgroundColor = 'var(--accent-3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--accent-11)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Register here
            </Link>
          </Text>
        </Flex>
    </Flex>
  );

}