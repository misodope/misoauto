'use client';

import { Box, Heading, Text, Flex, Link as RadixLink } from '@radix-ui/themes';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <Box p="6" style={{ maxWidth: 800, margin: '0 auto' }}>
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
          personal information when you use MisoAuto. By using our app or
          website, you consent to the terms of this Privacy Policy.
        </Text>

        <Section title="Collection of Information">
          <Text as="p" weight="bold" mb="2">
            Personal Information
          </Text>
          <Text as="p" mb="3">
            We may collect personal information such as your name, email
            address, and phone number when you register for our services or
            contact us.
          </Text>

          <Text as="p" weight="bold" mb="2">
            Phone Number and SMS Data
          </Text>
          <Text as="p" mb="3">
            When you provide your phone number, you consent to receive SMS
            messages from MisoAuto. We collect and store your phone number to
            send you service-related notifications, security codes, and updates
            about your scheduled content. By using MisoAuto, you automatically
            opt-in to these communications.
          </Text>

          <Text as="p" weight="bold" mb="2">
            Usage Information
          </Text>
          <Text as="p" mb="3">
            We may collect information about how you use our app or website,
            such as the pages you visit and the features you use.
          </Text>

          <Text as="p" weight="bold" mb="2">
            Device Information
          </Text>
          <Text as="p">
            We may collect information about the device you are using to access
            our app or website, such as the model, operating system, and IP
            address.
          </Text>
        </Section>

        <Section title="Use of Information">
          <Text as="p" mb="2">
            We use the information we collect for the following purposes:
          </Text>
          <ul style={{ paddingLeft: 'var(--space-4)' }}>
            <li>
              To provide you with our services, including to respond to your
              inquiries and support requests.
            </li>
            <li>
              To send you SMS notifications about your account, scheduled posts,
              and service updates.
            </li>
            <li>
              To improve our app or website, including by analyzing how users
              interact with our services.
            </li>
            <li>
              To send you marketing and promotional communications, but only if
              you have explicitly consented to receive them.
            </li>
          </ul>
        </Section>

        <Section title="SMS Communications">
          <Text as="p" mb="3">
            By using MisoAuto, you automatically opt-in to receive SMS messages.
            These messages are essential to the operation of our service and may
            include:
          </Text>
          <ul
            style={{
              paddingLeft: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <li>Two-factor authentication codes</li>
            <li>Account security alerts</li>
            <li>Notifications about your scheduled content</li>
            <li>Service status updates</li>
            <li>Important account notifications</li>
          </ul>
          <Text as="p" mb="3">
            Message and data rates may apply depending on your carrier and plan.
            Message frequency varies based on your account activity.
          </Text>
          <Text as="p">
            To opt-out of non-essential SMS messages, reply STOP to any message
            or adjust your preferences in account settings. Note that opting out
            of all SMS messages may limit certain features of the service.
          </Text>
        </Section>

        <Section title="Disclosure of Information">
          <Text as="p" weight="bold" mb="2">
            With your consent
          </Text>
          <Text as="p" mb="3">
            We may share your personal information with third parties if you
            have given us your consent to do so.
          </Text>

          <Text as="p" weight="bold" mb="2">
            For legal reasons
          </Text>
          <Text as="p" mb="3">
            We may share your personal information with law enforcement or
            government authorities if required by law or if we believe that such
            disclosure is necessary to protect our rights, property, or safety,
            or that of our users.
          </Text>

          <Text as="p" weight="bold" mb="2">
            With service providers
          </Text>
          <Text as="p">
            We may share your personal information with service providers who
            perform services on our behalf, such as payment processing, SMS
            delivery, and data storage. These providers are contractually
            obligated to protect your information.
          </Text>
        </Section>

        <Section title="Security">
          <Text as="p">
            We take reasonable steps to protect the personal information we
            collect from you against unauthorized access, use, or disclosure.
            However, no method of transmission over the internet or method of
            electronic storage is 100% secure, so we cannot guarantee its
            absolute security.
          </Text>
        </Section>

        <Section title="Updates to this Privacy Policy">
          <Text as="p">
            We may update this Privacy Policy from time to time. If we make any
            material changes to this Privacy Policy, we will notify you by
            posting a notice on our app or website or by sending you an email.
          </Text>
        </Section>

        <Section title="Contact Us">
          <Text as="p">
            If you have any questions or concerns about our Privacy Policy,
            please contact us at{' '}
            <RadixLink href="mailto:jerry+support@misodope.com">
              jerry+support@misodope.com
            </RadixLink>
            .
          </Text>
        </Section>

        <Box pt="4" style={{ borderTop: '1px solid var(--gray-6)' }}>
          <Text size="2" color="gray">
            See also:{' '}
            <Link
              href="/legal/terms"
              style={{ color: 'var(--accent-11)', textDecoration: 'underline' }}
            >
              Terms of Service
            </Link>
            {' | '}
            <Link
              href="/legal"
              style={{ color: 'var(--accent-11)', textDecoration: 'underline' }}
            >
              Back to Legal
            </Link>
          </Text>
        </Box>
      </Flex>
    </Box>
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
