'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Flex, Heading, Text, Button, Box, Card, Grid } from '@radix-ui/themes';
import { VideoIcon, CalendarIcon, RocketIcon } from '@radix-ui/react-icons';
import { useAuth } from './contexts/AuthContext';
import { Footer } from './components/Footer';

const HeroBackground = dynamic(
  () => import('./components/HeroBackground/HeroBackground').then((m) => m.HeroBackground),
  { ssr: false }
);

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/home');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
        style={{ textAlign: 'center' }}
      >
        <Text size="4" color="gray">
          Loading...
        </Text>
      </Flex>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <Flex direction="column">
      {/* Hero Section */}
      <Box style={{ position: 'relative', overflow: 'hidden' }}>
        <HeroBackground />
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="9"
          px="6"
          style={{ minHeight: '40vh', position: 'relative', zIndex: 1 }}
        >
          <Heading size="9" mb="4" align="center">
            Automate Your Social Media
          </Heading>
          <Text
            size="5"
            color="gray"
            mb="8"
            align="center"
            style={{ maxWidth: 600 }}
          >
            MisoAuto helps you upload videos, schedule posts across platforms, and
            get notified when your content goes live — all from one dashboard.
          </Text>

          <Flex gap="4" justify="center" wrap="wrap">
            <Button asChild size="4" variant="solid">
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button asChild size="4" variant="outline">
              <Link href="/auth/login">Log In</Link>
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Features Section */}
      <Box px="6" py="6">
        <Heading size="7" mb="6" align="center">
          How It Works
        </Heading>
        <Grid
          columns={{ initial: '1', sm: '3' }}
          gap="6"
          style={{ maxWidth: 960, margin: '0 auto' }}
        >
          <Card size="3">
            <Flex direction="column" align="center" gap="3" p="4">
              <VideoIcon width={32} height={32} />
              <Heading size="4">Upload Videos</Heading>
              <Text size="3" color="gray" align="center">
                Upload your video content and manage it all in one place.
              </Text>
            </Flex>
          </Card>

          <Card size="3">
            <Flex direction="column" align="center" gap="3" p="4">
              <CalendarIcon width={32} height={32} />
              <Heading size="4">Schedule Posts</Heading>
              <Text size="3" color="gray" align="center">
                Schedule your posts to go live on TikTok and other platforms at
                the perfect time.
              </Text>
            </Flex>
          </Card>

          <Card size="3">
            <Flex direction="column" align="center" gap="3" p="4">
              <RocketIcon width={32} height={32} />
              <Heading size="4">Get Notified</Heading>
              <Text size="3" color="gray" align="center">
                Receive SMS and email notifications when your content is
                published or needs attention.
              </Text>
            </Flex>
          </Card>
        </Grid>
      </Box>

      <Footer />
    </Flex>
  );
}
