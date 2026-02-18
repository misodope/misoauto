import Link from 'next/link';
import {
  Box,
  Flex,
  Text,
  Separator,
  Link as RadixLink,
} from '@radix-ui/themes';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box asChild style={{ width: '100%', marginTop: 'auto' }}>
      <footer>
        <Separator size="4" />
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          align="center"
          justify="between"
          gap="4"
          px="6"
          py="4"
          style={{ maxWidth: 1200, width: '100%' }}
        >
          <Text size="2" color="gray">
            &copy; {currentYear} MisoAuto. All rights reserved.
          </Text>

          <Flex gap="4" align="center" wrap="wrap" justify="center">
            <RadixLink asChild size="2" color="gray">
              <Link href="/legal/terms">Terms of Service</Link>
            </RadixLink>
            <RadixLink asChild size="2" color="gray">
              <Link href="/legal/privacy">Privacy Policy</Link>
            </RadixLink>
            <RadixLink
              href="mailto:jerry+support@misodope.com"
              size="2"
              color="gray"
            >
              Contact
            </RadixLink>
          </Flex>
        </Flex>
      </footer>
    </Box>
  );
}
