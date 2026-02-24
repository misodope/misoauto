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
              Last updated: February 2026
            </Text>
          </Box>

          <Section title="Acceptance of Terms">
            <Text as="p">
              By accessing or using MisoAuto (the &quot;Service&quot;), you agree to be
              bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to
              these Terms, do not use the Service. These Terms apply to all
              visitors, users, and others who access or use the Service.
            </Text>
          </Section>

          <Section title="Description of Service">
            <Text as="p">
              MisoAuto is a social media content management platform that allows
              content creators to upload videos, schedule posts across multiple
              platforms (including TikTok and YouTube), and receive notifications
              when their content is published. We act as an intermediary between
              you and third-party platforms and do not guarantee the availability
              or behavior of those external services.
            </Text>
          </Section>

          <Section title="User Accounts">
            <Text as="p" mb="3">
              You must create an account to use the Service. You are responsible
              for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You agree to
              notify us immediately of any unauthorized use of your account.
            </Text>
            <Text as="p">
              You must be at least 13 years of age to use the Service. By
              creating an account, you represent that you meet this requirement.
            </Text>
          </Section>

          <Section title="User Content">
            <Text as="p" mb="3">
              You retain ownership of all videos and content you upload to
              MisoAuto (&quot;User Content&quot;). By uploading content, you grant
              MisoAuto a limited, non-exclusive license to store, process, and
              distribute your content solely for the purpose of providing the
              Service (e.g., scheduling and publishing to your connected
              accounts).
            </Text>
            <Text as="p" mb="3">
              You are solely responsible for your User Content and represent
              that you have all rights necessary to upload and distribute it. You
              agree not to upload content that:
            </Text>
            <Box pl="4">
              <Text as="p" mb="1">• Violates any third-party intellectual property rights</Text>
              <Text as="p" mb="1">• Contains unlawful, harmful, or offensive material</Text>
              <Text as="p" mb="1">• Violates the terms of service of any connected platform (TikTok, YouTube, etc.)</Text>
              <Text as="p">• Includes malware, spam, or deceptive content</Text>
            </Box>
          </Section>

          <Section title="Third-Party Platform Integrations">
            <Text as="p" mb="3">
              The Service integrates with third-party platforms such as TikTok
              and YouTube. Your use of those platforms is governed by their
              respective terms of service and privacy policies. MisoAuto is not
              affiliated with, endorsed by, or responsible for the policies or
              actions of any third-party platform.
            </Text>
            <Text as="p">
              We may lose access to third-party APIs at any time due to changes
              in those platforms&apos; policies, and such changes may affect the
              availability of certain features within MisoAuto.
            </Text>
          </Section>

          <Section title="Privacy">
            <Text as="p">
              Your use of the Service is also governed by our{' '}
              <RadixLink href="/pages/legal/privacy">Privacy Policy</RadixLink>,
              which describes how we collect, use, and protect your personal
              information.
            </Text>
          </Section>

          <Section title="SMS Messaging and Communications">
            <Text as="p" mb="3">
              By providing your phone number and affirmatively opting in on our
              registration forms, you agree to receive recurring automated SMS
              messages from MisoAuto.
            </Text>

            <Text as="p" weight="bold" mb="2">
              User Support &amp; Opt-Out
            </Text>
            <Text as="p" mb="3">
              You can cancel the SMS service at any time. Just text{' '}
              <strong>&quot;STOP&quot;</strong>
              to our number. After you send &quot;STOP&quot;, we will send you an SMS to
              confirm your subscription status. For help, text{' '}
              <strong>&quot;HELP&quot;</strong> to our number or email
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

          <Section title="Prohibited Uses">
            <Text as="p" mb="3">
              You agree not to use the Service to:
            </Text>
            <Box pl="4">
              <Text as="p" mb="1">• Violate any applicable laws or regulations</Text>
              <Text as="p" mb="1">• Impersonate any person or entity</Text>
              <Text as="p" mb="1">• Attempt to gain unauthorized access to any part of the Service</Text>
              <Text as="p" mb="1">• Interfere with or disrupt the integrity or performance of the Service</Text>
              <Text as="p">• Use automated means to scrape, crawl, or extract data from the Service</Text>
            </Box>
          </Section>

          <Section title="Termination">
            <Text as="p">
              We reserve the right to suspend or terminate your account at our
              discretion if you violate these Terms or engage in conduct that we
              determine to be harmful to the Service or other users. You may
              also delete your account at any time. Upon termination, your right
              to use the Service ceases immediately.
            </Text>
          </Section>

          <Section title="Disclaimer of Warranties">
            <Text as="p" mb="3">
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis
              without warranties of any kind, either express or implied,
              including but not limited to warranties of merchantability, fitness
              for a particular purpose, or non-infringement.
            </Text>
            <Text as="p">
              We do not warrant that the Service will be uninterrupted,
              error-free, or free of viruses or other harmful components. We
              make no warranties regarding the 100% delivery of SMS
              notifications or the successful publication of content to
              third-party platforms.
            </Text>
          </Section>

          <Section title="Limitation of Liability">
            <Text as="p">
              To the fullest extent permitted by law, MisoAuto shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages arising out of or related to your use of the
              Service, including but not limited to loss of content, loss of
              revenue, or failure to publish scheduled posts. Our total
              liability to you for any claim shall not exceed the amount you
              paid us in the twelve months preceding the claim.
            </Text>
          </Section>

          <Section title="Changes to These Terms">
            <Text as="p">
              We may update these Terms from time to time. We will notify you of
              material changes by posting the updated Terms on this page with a
              revised &quot;Last updated&quot; date. Your continued use of the Service
              after changes are posted constitutes your acceptance of the updated
              Terms.
            </Text>
          </Section>

          <Section title="Governing Law">
            <Text as="p">
              These Terms are governed by the laws of the United States, without
              regard to conflict of law principles. Any disputes arising under
              these Terms shall be resolved in a court of competent jurisdiction.
            </Text>
          </Section>

          <Section title="Contact Us">
            <Text as="p">
              If you have any questions about these Terms, please contact us at:{' '}
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
