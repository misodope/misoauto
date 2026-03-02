'use client';

import Link from 'next/link';
import {
  Flex,
  Heading,
  Text,
  Box,
  Card,
  Button,
  Avatar,
  Separator,
} from '@radix-ui/themes';
import { RocketIcon, HeartIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { Footer } from '../../components/Footer';

export default function About() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Flex
        direction="column"
        align="center"
        px={{ initial: '4', sm: '6' }}
        py="9"
        style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}
        gap="8"
      >
        {/* Header */}
        <Box style={{ textAlign: 'center' }}>
          <Heading size="9" mb="4">
            About MisoAuto
          </Heading>
          <Text size="5" color="gray" style={{ maxWidth: 600, display: 'block' }}>
            Built by a creator, for creators.
          </Text>
        </Box>

        <Separator size="4" />

        {/* Origin Story */}
        <Flex direction="column" gap="5">
          <Flex align="center" gap="3">
            <Box
              p="2"
              style={{
                background: 'var(--accent-3)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <HeartIcon width={24} height={24} color="var(--accent-11)" />
            </Box>
            <Heading size="5">The Problem</Heading>
          </Flex>
          <Text size="4" color="gray" style={{ lineHeight: 1.8 }}>
            Cross-posting content is genuinely painful. As a content creator, every
            time I finished editing a video I had to open TikTok, upload, write a
            caption, pick hashtags — then do the exact same thing on YouTube Shorts,
            Instagram Reels, and anywhere else my audience lived. Each platform has its
            own quirks, its own upload flow, its own scheduler. It was repetitive,
            tedious, and honestly just killed the creative energy.
          </Text>
          <Text size="4" color="gray" style={{ lineHeight: 1.8 }}>
            I kept searching for a tool that was simple. Not an enterprise dashboard
            with 40 features I'd never use — just something that let me upload once,
            pick my platforms, and move on. That tool didn't exist in a way that felt
            right, so I built it myself.
          </Text>
        </Flex>

        {/* Creator Card */}
        <Card size="3" style={{ width: '100%' }}>
          <Flex gap="5" align="center" p="2" wrap="wrap">
            <Avatar
              size="6"
              fallback="JC"
              radius="full"
              color="yellow"
            />
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Heading size="5">Jerry Chen — MisoDope</Heading>
              <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                Hey, I'm Jerry — better known online as{' '}
                <strong style={{ color: 'var(--accent-11)' }}>MisoDope</strong>. I'm
                a content creator who got tired of the repetitive grind of cross-posting
                and decided to build the tool I actually wanted. MisoAuto is that tool.
                It's opinionated, it's minimal, and it respects your time.
              </Text>
              <Text size="2" color="gray">
                Founder &amp; Developer, MisoDope LLC
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* Values */}
        <Flex direction="column" gap="5" style={{ width: '100%' }}>
          <Flex align="center" gap="3">
            <Box
              p="2"
              style={{
                background: 'var(--accent-3)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <LightningBoltIcon width={24} height={24} color="var(--accent-11)" />
            </Box>
            <Heading size="5">What We Believe</Heading>
          </Flex>

          <Flex direction={{ initial: 'column', sm: 'row' }} gap="4">
            <Card size="2" style={{ flex: 1 }}>
              <Flex direction="column" gap="2" p="2">
                <Text size="4" weight="bold">
                  Simplicity wins
                </Text>
                <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                  No complex flows, no bloated dashboards. You upload, you pick your
                  platforms, you schedule. Done.
                </Text>
              </Flex>
            </Card>

            <Card size="2" style={{ flex: 1 }}>
              <Flex direction="column" gap="2" p="2">
                <Text size="4" weight="bold">
                  Creators first
                </Text>
                <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                  Every decision is made asking one question: does this make a
                  creator's life easier?
                </Text>
              </Flex>
            </Card>

            <Card size="2" style={{ flex: 1 }}>
              <Flex direction="column" gap="2" p="2">
                <Text size="4" weight="bold">
                  Built in the open
                </Text>
                <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                  MisoAuto is a real tool used by a real creator. Feedback shapes
                  every feature.
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Flex>

        {/* Mission */}
        <Flex direction="column" gap="5">
          <Flex align="center" gap="3">
            <Box
              p="2"
              style={{
                background: 'var(--accent-3)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <RocketIcon width={24} height={24} color="var(--accent-11)" />
            </Box>
            <Heading size="5">Where We're Going</Heading>
          </Flex>
          <Text size="4" color="gray" style={{ lineHeight: 1.8 }}>
            MisoAuto started as a personal tool and is growing into a platform for any
            creator who values their time. More platforms, smarter scheduling, and
            better analytics are on the roadmap — all keeping the same philosophy:
            make cross-posting so easy it stops feeling like a chore.
          </Text>
        </Flex>

        <Separator size="4" />

        {/* CTA */}
        <Flex direction="column" align="center" gap="4" style={{ textAlign: 'center' }}>
          <Heading size="6">Ready to simplify your workflow?</Heading>
          <Text size="4" color="gray">
            Join creators already saving time with MisoAuto.
          </Text>
          <Flex gap="3" wrap="wrap" justify="center">
            <Button asChild size="3" variant="solid">
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button asChild size="3" variant="outline">
              <Link href="/learn-more">See How It Works</Link>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Footer />
    </Flex>
  );
}
