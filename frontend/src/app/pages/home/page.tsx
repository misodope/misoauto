'use client';

import { useEffect } from 'react';
import { Flex, Heading, Text } from '@radix-ui/themes';

export default function Home() {
  useEffect(() => {
    console.log('Home page mounted');
  }, []);

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      p="8"
      style={{ textAlign: 'center' }}
    >
      <Heading size="8" mb="4">Welcome to MisoAuto</Heading>
      <Text size="5" color="gray">Your social media automation platform</Text>
    </Flex>
  );
}