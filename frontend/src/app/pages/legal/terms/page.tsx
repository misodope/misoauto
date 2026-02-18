'use client';

import { Box, Heading, Text, Flex, Link as RadixLink } from '@radix-ui/themes';
import { Footer } from '../../../components/Footer';

export default function TermsOfService() {
  return (
    <Flex direction="column">
      <Box p="6" flexGrow="1" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Flex direction="column" gap="5">
          <Box>
            <Heading size="8" mb="2">
              Terms of Service
            </Heading>
            <Text size="2" color="gray">
              Last updated: January 2025
            </Text>
          </Box>

          <Section title="SMS Messaging and Communications">
            <Text as="p" mb="3">
              By providing your phone number and affirmatively opting in on our
              registration forms, you agree to receive recurring automated SMS
              messages from MisoAuto.
            </Text>

            <Text as="p" weight="bold" mb="2">
              User Support & Opt-Out
            </Text>
            <Text as="p" mb="3">
              You can cancel the SMS service at any time. Just text{' '}
              <strong>"STOP"</strong>
              to our number. After you send "STOP", we will send you an SMS to
              confirm your subscription status. For help, text{' '}
              <strong>"HELP"</strong> to our number or email
              jerry+support@misodope.com.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Carrier Disclaimer
            </Text>
            <Text as="p" mb="3">
              Message and data rates may apply. Message frequency varies.
              <strong>
                {' '}
                Carriers are not liable for delayed or undelivered messages.
              </strong>
            </Text>
          </Section>

          <Section title="Disclaimer of Warranties">
            <Text as="p">
              Our website is provided on an "as is" basis. We make no warranties
              regarding the 100% delivery of SMS notifications.
            </Text>
          </Section>

          <Section title="Contact Us">
            <Text as="p">
              Contact:{' '}
              <RadixLink href="mailto:jerry+support@misodope.com">
                jerry+support@misodope.com
              </RadixLink>
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
