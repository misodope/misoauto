'use client';

import Link from 'next/link';
import {
  Flex,
  Heading,
  Text,
  Box,
  Card,
  Button,
  Badge,
  Separator,
} from '@radix-ui/themes';
import {
  Link2Icon,
  UploadIcon,
  MixerHorizontalIcon,
  CalendarIcon,
  BellIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons';
import { Footer } from '../../components/Footer';

const steps = [
  {
    number: 1,
    icon: <Link2Icon width={28} height={28} />,
    title: 'Connect Your Platforms',
    description:
      'Start by linking your social media accounts. Head to the Integrations page and authorize MisoAuto to post on your behalf. We support TikTok and YouTube today, with more platforms coming soon.',
    detail:
      'One-time OAuth setup per platform. Your credentials are never stored — we only keep the tokens needed to post.',
  },
  {
    number: 2,
    icon: <UploadIcon width={28} height={28} />,
    title: 'Upload Your Video',
    description:
      "Upload your video directly inside MisoAuto. Drop in your file, give it a title, and add a caption. That's it — no re-uploading per platform.",
    detail:
      'We store your video securely and use it across every platform you select, so you upload once and we handle the rest.',
  },
  {
    number: 3,
    icon: <MixerHorizontalIcon width={28} height={28} />,
    title: 'Pick Your Platforms',
    description:
      "Choose which connected platforms to post to. Want it on TikTok only? Just TikTok. All of them? One click. You're in full control.",
    detail:
      'Each platform gets the same video and caption. Per-platform caption customization is on the roadmap.',
  },
  {
    number: 4,
    icon: <CalendarIcon width={28} height={28} />,
    title: 'Post Now or Schedule',
    description:
      "Publish immediately or pick a future date and time. Your scheduled posts sit in the calendar view so you always know what's going live and when.",
    detail:
      'The scheduler handles timezone conversion automatically. Set it and forget it.',
  },
  {
    number: 5,
    icon: <BellIcon width={28} height={28} />,
    title: 'Get Notified',
    description:
      'MisoAuto sends you an email or SMS the moment your content goes live — or if something needs your attention.',
    detail:
      'Configure your notification preferences in Settings. You can opt into email, SMS, or both.',
  },
  {
    number: 6,
    icon: <CheckCircledIcon width={28} height={28} />,
    title: 'Track Everything',
    description:
      'Your dashboard shows all uploaded videos, scheduled posts, and posting history across every platform in one clean view.',
    detail:
      "No more jumping between apps to remember what you posted where. It's all here.",
  },
];

export default function LearnMore() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Flex
        direction="column"
        align="center"
        px={{ initial: '4', sm: '6' }}
        py="9"
        style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}
        gap="8"
      >
        {/* Header */}
        <Box style={{ whiteSpace: 'nowrap' }}>
          <Badge
            size="2"
            variant="soft"
            mb="4"
            style={{ display: 'inline-block' }}
          >
            How It Works
          </Badge>
          <Heading size="9" mb="4">
            Upload once. Post everywhere.
          </Heading>
          <Text size="5" color="gray" style={{}}>
            MisoAuto takes the repetitive work out of cross-posting so you can
            focus on creating.
          </Text>
        </Box>

        <Separator size="4" />

        {/* Steps */}
        <Flex direction="column" gap="5" style={{ width: '100%' }}>
          {steps.map((step, idx) => (
            <Card key={step.number} size="3" style={{ width: '100%' }}>
              <Flex gap="5" align="start" p="2">
                {/* Step number + connector */}
                <Flex
                  direction="column"
                  align="center"
                  gap="2"
                  style={{ minWidth: 48 }}
                >
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--accent-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-11)',
                      flexShrink: 0,
                    }}
                  >
                    {step.icon}
                  </Box>
                  {idx < steps.length - 1 && (
                    <Box
                      style={{
                        width: 2,
                        height: 24,
                        background: 'var(--gray-5)',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Flex>

                {/* Content */}
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                  <Flex align="center" gap="2">
                    <Badge size="1" variant="outline" color="gray">
                      Step {step.number}
                    </Badge>
                    <Heading size="5">{step.title}</Heading>
                  </Flex>
                  <Text size="3" style={{ lineHeight: 1.7 }}>
                    {step.description}
                  </Text>
                  <Text size="2" color="gray" style={{ lineHeight: 1.6 }}>
                    {step.detail}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Separator size="4" />

        {/* Why it's different */}
        <Flex
          direction="column"
          gap="5"
          style={{ width: '100%', textAlign: 'center' }}
        >
          <Heading size="6">Why MisoAuto?</Heading>
          <Flex direction={{ initial: 'column', sm: 'row' }} gap="4">
            {[
              {
                label: 'No complex flows',
                body: "We stripped out everything that wasn't needed. If it doesn't help you post faster, it's not here.",
              },
              {
                label: 'Built by a creator',
                body: "MisoAuto was built by MisoDope — a creator who lived this pain daily. It's not designed by committee.",
              },
              {
                label: 'You stay in control',
                body: 'Schedule, post immediately, or delete. Your content is yours. We just help it move faster.',
              },
            ].map((item) => (
              <Card
                key={item.label}
                size="2"
                style={{ flex: 1, textAlign: 'left' }}
              >
                <Flex direction="column" gap="2" p="2">
                  <Text size="4" weight="bold">
                    {item.label}
                  </Text>
                  <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                    {item.body}
                  </Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* CTA */}
        <Flex
          direction="column"
          align="center"
          gap="4"
          style={{ textAlign: 'center' }}
        >
          <Heading size="6">Start posting smarter today.</Heading>
          <Text size="4" color="gray">
            Early access — account approval required.
          </Text>
          <Flex gap="3" justify="center" wrap="wrap" style={{ width: '100%' }}>
            <Button asChild size="3" variant="solid">
              <Link href="/auth/register">Create Your Account</Link>
            </Button>
            <Button asChild size="3" variant="outline">
              <Link href="/about">Our Story</Link>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Footer />
    </Flex>
  );
}
