import { PrismaClient, PlatformType } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const platformSeeds = [
    [PlatformType.YOUTUBE, 'YouTube'],
    [PlatformType.TIKTOK, 'TikTok'],
    [PlatformType.INSTAGRAM, 'Instagram'],
    [PlatformType.FACEBOOK, 'Facebook'],
  ] as const;

  const platforms = await Promise.all(
    platformSeeds.map(([name, displayName]) =>
      prisma.platform.upsert({
        where: { name },
        update: { displayName, isActive: true },
        create: { name, displayName, isActive: true },
      }),
    ),
  );

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
