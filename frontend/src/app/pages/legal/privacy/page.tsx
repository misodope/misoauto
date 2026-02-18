'use client';

import { Box, Heading, Text, Flex, Link as RadixLink } from '@radix-ui/themes';
import { Footer } from '../../../components/Footer';

export default function PrivacyPolicy() {
  return (
    <Flex direction="column" minHeight="100vh">
      <Box p="6" flexGrow="1" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Flex direction="column" gap="5">
          <Box>
            <Heading size="8" mb="2">
              Privacy Policy
            </Heading>
            <Text size="2" color="gray">
              Last updated: January 2025
            </Text>
          </Box>

          <Text as="p">
            This Privacy Policy explains how we collect, use, and disclose your
            personal information when you use MisoAuto.
          </Text>

          <Section title="Collection of Information">
            <Text as="p" weight="bold" mb="2">
              Personal Information
            </Text>
            <Text as="p" mb="3">
              We collect personal information such as your name, email address,
              and phone number when you voluntarily provide it by registering
              for our services or contacting us.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Phone Number and SMS Data
            </Text>
            <Text as="p" mb="3">
              Phone numbers collected for SMS consent will be used specifically
              for sending you service-related notifications, security codes, and
              updates.
              <strong>
                {' '}
                Consent to receive SMS is not a condition of purchase.
              </strong>
            </Text>
          </Section>

          {/* CRITICAL SECTION FOR TWILIO APPROVAL */}
          <Section title="SMS Privacy & Third-Party Sharing">
            <Text as="p" mb="3">
              We value your privacy.{' '}
              <strong>
                No mobile information will be shared with third
                parties/affiliates for marketing/promotional purposes.
              </strong>{' '}
              All the above categories exclude text messaging originator opt-in
              data and consent; this information will not be shared with any
              third parties.
            </Text>
          </Section>

          <Section title="Use of Information">
            <Text as="p" mb="2">
              We use the information we collect to:
            </Text>
            <ul style={{ paddingLeft: 'var(--space-4)' }}>
              <li>
                Provide service-related SMS notifications and security alerts.
              </li>
              <li>Improve our app and analyze user interaction.</li>
              <li>
                Send marketing communications <strong>only</strong> if you have
                explicitly opted-in to receive them.
              </li>
            </ul>
          </Section>

          <Section title="Contact Us">
            <Text as="p">
              Questions? Contact us at{' '}
              <RadixLink href="mailto:jerry+support@misodope.com">
                jerry+support@misodope.com
              </RadixLink>
              .
            </Text>
          </Section>
        </Flex>
      </Box>
      <Footer />
    </Flex>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Heading size="4" mb="2">
        {title}
      </Heading>
      {children}
    </Box>
  );
}
