'use client';

import { Box, Heading, Text, Flex, Link as RadixLink } from '@radix-ui/themes';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <Box p="6" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="8" mb="2">
            Terms of Service
          </Heading>
          <Text size="2" color="gray">
            Last updated: January 2025
          </Text>
        </Box>

        <Section title="Introduction">
          <Text as="p">
            These Terms of Service govern your use of MisoAuto. By using our app
            or website, you agree to these Terms of Service.
          </Text>
        </Section>

        <Section title="SMS Messaging and Communications">
          <Text as="p" mb="3">
            By using MisoAuto, you automatically opt-in to receive SMS messages
            and other communications related to our services. These messages may
            include:
          </Text>
          <ul
            style={{
              paddingLeft: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <li>Account verification and security codes</li>
            <li>Service notifications and alerts</li>
            <li>Updates about your scheduled content and posts</li>
            <li>Important announcements regarding your account</li>
          </ul>
          <Text as="p" mb="3">
            Message and data rates may apply. Message frequency varies based on
            your usage of the platform.
          </Text>
          <Text as="p">
            You may opt-out of non-essential SMS messages at any time by
            replying STOP to any message or by updating your notification
            preferences in your account settings. However, certain
            service-critical messages (such as security codes) cannot be
            disabled while maintaining an active account.
          </Text>
        </Section>

        <Section title="Intellectual Property">
          <Text as="p">
            All content and materials on our app or website, including but not
            limited to text, graphics, logos, images, and software, are the
            property of our company or its licensors and are protected by
            copyright, trademark, and other intellectual property laws.
          </Text>
        </Section>

        <Section title="Disclaimer of Warranties">
          <Text as="p">
            Our app or website is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis. We make no representations or warranties of
            any kind, express or implied, as to the operation of our app or
            website or the information, content, materials, or products included
            on our app or website.
          </Text>
        </Section>

        <Section title="Limitation of Liability">
          <Text as="p">
            We will not be liable for any damages of any kind arising from the
            use of our app or website, including but not limited to direct,
            indirect, incidental, punitive, and consequential damages.
          </Text>
        </Section>

        <Section title="Indemnification">
          <Text as="p">
            You agree to indemnify, defend, and hold harmless our company and
            its affiliates, officers, directors, employees, and agents from any
            and all claims, liabilities, damages, and expenses (including
            reasonable attorneys&apos; fees) arising from your use of our app or
            website or your breach of these Terms of Service.
          </Text>
        </Section>

        <Section title="Termination">
          <Text as="p">
            We may terminate your access to our app or website at any time
            without notice if we believe that you have breached these Terms of
            Service or if we believe that such termination is necessary to
            protect our rights, property, or safety, or that of our users.
          </Text>
        </Section>

        <Section title="Updates to these Terms of Service">
          <Text as="p">
            We may update these Terms of Service from time to time. If we make
            any material changes to these Terms of Service, we will notify you
            by posting a notice on our app or website or by sending you an
            email.
          </Text>
        </Section>

        <Section title="Contact Us">
          <Text as="p">
            If you have any questions or concerns about these Terms of Service,
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
              href="/legal/privacy"
              style={{ color: 'var(--accent-11)', textDecoration: 'underline' }}
            >
              Privacy Policy
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
