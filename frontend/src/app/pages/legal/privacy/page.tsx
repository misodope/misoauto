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
              Last updated: February 2026
            </Text>
          </Box>

          <Text as="p">
            This Privacy Policy explains how MisoAuto (&quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
            your personal information when you use our service. By using
            MisoAuto, you agree to the collection and use of information as
            described in this policy.
          </Text>

          <Section title="Information We Collect">
            <Text as="p" weight="bold" mb="2">
              Account Information
            </Text>
            <Text as="p" mb="3">
              When you register, we collect personal information such as your
              name, email address, and phone number.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Connected Platform Accounts
            </Text>
            <Text as="p" mb="3">
              When you connect a third-party account (such as TikTok, YouTube,
              or Instagram), we receive access tokens and basic profile
              information necessary to publish content on your behalf. We do not
              store your passwords for those platforms.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Instagram
            </Text>
            <Text as="p" mb="3">
              For Instagram, we store your Instagram account ID, username, and
              access token, along with the IDs and links of Reels published or
              prepared through MisoAuto. We use this information to publish the
              Reels you choose. We do not sell or share this information.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Content You Upload
            </Text>
            <Text as="p" mb="3">
              We store videos and other content you upload to MisoAuto solely
              for the purpose of scheduling and distributing them to your
              connected accounts.
            </Text>

            <Text as="p" weight="bold" mb="2">
              Phone Number and SMS Consent
            </Text>
            <Text as="p">
              Phone numbers collected for SMS consent are used specifically for
              sending service-related notifications, security codes, and
              updates.{' '}
              <strong>
                Consent to receive SMS is not a condition of purchase.
              </strong>
            </Text>
          </Section>

          <Section title="How We Use Your Information">
            <Text as="p" mb="2">
              We use the information we collect to:
            </Text>
            <ul style={{ paddingLeft: 'var(--space-4)' }}>
              <li>Operate and provide the MisoAuto service</li>
              <li>Schedule and publish your content to connected platforms</li>
              <li>Send service-related SMS and email notifications</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve and analyze how our service is used</li>
              <li>
                Send marketing communications <strong>only</strong> if you have
                explicitly opted in to receive them
              </li>
            </ul>
          </Section>

          <Section title="How We Do Not Use Your Information">
            <Text as="p" mb="3">
              We will <strong>never</strong> sell, rent, or trade your personal
              information to any third party. Your data exists solely to power
              your experience with MisoAuto.
            </Text>
          </Section>

          {/* CRITICAL SECTION FOR TWILIO APPROVAL */}
          <Section title="SMS Privacy &amp; Third-Party Sharing">
            <Text as="p">
              We value your privacy.{' '}
              <strong>
                No mobile information will be shared with third
                parties/affiliates for marketing or promotional purposes.
              </strong>{' '}
              Text messaging originator opt-in data and consent will not be
              shared with any third parties.
            </Text>
          </Section>

          <Section title="Deleting Your Data" id="deleting-your-data">
            <Text as="p" mb="2">
              You can request deletion of your Instagram data from MisoAuto in
              any of these ways:
            </Text>
            <ol style={{ paddingLeft: 'var(--space-4)' }}>
              <li>Disconnect the account in MisoAuto under Integrations.</li>
              <li>
                Remove MisoAuto in Instagram under Settings → Website
                permissions → Apps and websites. This sends us a deletion
                request. We will provide a confirmation code that you can check
                at <RadixLink href="/data-deletion">/data-deletion</RadixLink>.
              </li>
              <li>
                Email{' '}
                <RadixLink href="mailto:jerry+support@misodope.com">
                  jerry+support@misodope.com
                </RadixLink>
                .
              </li>
            </ol>
            <Text as="p" mt="3">
              Removal deletes the Instagram access token, IDs, username, and
              Instagram post records stored in MisoAuto. We act on deletion
              requests promptly.
            </Text>
          </Section>

          <Section title="Data Retention">
            <Text as="p">
              We retain your personal information for as long as your account is
              active or as needed to provide the Service. Connected-platform
              data is deleted when you disconnect that platform or submit a
              deletion request; this is separate from deleting your MisoAuto
              account. If you delete your account, we will remove your personal
              data within a reasonable time, except where we are required to
              retain it by law.
            </Text>
          </Section>

          <Section title="Security">
            <Text as="p">
              We take reasonable measures to protect your personal information
              from unauthorized access, disclosure, or loss. However, no
              internet transmission is completely secure, and we cannot
              guarantee absolute security.
            </Text>
          </Section>

          <Section title="Changes to This Policy">
            <Text as="p">
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              this page with a revised &quot;Last updated&quot; date.
            </Text>
          </Section>

          <Section title="Contact Us">
            <Text as="p" mb="2">
              If you have any questions or concerns about this Privacy Policy or
              our data practices, please contact us at:
            </Text>
            <Box
              mt="2"
              pl="2"
              style={{ borderLeft: '2px solid var(--gray-5)' }}
            >
              <Text as="p" weight="bold">
                MisoAuto by MisoDope LLC.
              </Text>
              <Text as="p">5900 Balcones Dr. STE 100</Text>
              <Text as="p">Austin, TX, 78731-4298</Text>
              <Text as="p" mt="2">
                Email:{' '}
                <RadixLink href="mailto:jerry+support@misodope.com">
                  jerry+support@misodope.com
                </RadixLink>
              </Text>
            </Box>
          </Section>
        </Flex>
      </Box>
      <Footer />
    </Flex>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <Box id={id}>
      <Heading size="4" mb="2">
        {title}
      </Heading>
      {children}
    </Box>
  );
}
