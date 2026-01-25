'use client';

import Link from 'next/link';
import { Flex, Heading, Text, Button, Card, Grid, Box } from '@radix-ui/themes';
import { FileTextIcon, LockClosedIcon } from '@radix-ui/react-icons';

export default function Legal() {
  return (
    <Flex direction="column" p="6" gap="6" style={{ maxWidth: 800 }}>
      <Box>
        <Heading size="7" mb="2">
          Legal
        </Heading>
        <Text size="3" color="gray">
          Review our terms and policies.
        </Text>
      </Box>

      <Grid columns={{ initial: '1', sm: '2' }} gap="4">
        <Card size="3">
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <FileTextIcon width={20} height={20} />
              <Text size="5" weight="bold">
                Terms of Service
              </Text>
            </Flex>
            <Text size="2" color="gray">
              Read our terms and conditions for using MisoAuto.
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link href="/legal/terms">View Terms</Link>
            </Button>
          </Flex>
        </Card>

        <Card size="3">
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <LockClosedIcon width={20} height={20} />
              <Text size="5" weight="bold">
                Privacy Policy
              </Text>
            </Flex>
            <Text size="2" color="gray">
              Learn how we collect, use, and protect your data.
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link href="/legal/privacy">View Policy</Link>
            </Button>
          </Flex>
        </Card>
      </Grid>
    </Flex>
  );
}
