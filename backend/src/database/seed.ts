import {
  PrismaClient,
  PlatformType,
  VideoStatus,
  PostStatus,
} from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.platform.deleteMany();

  const platforms = await Promise.all([
    prisma.platform.create({
      data: {
        name: PlatformType.YOUTUBE,
        displayName: 'YouTube',
        isActive: true,
      },
    }),
    prisma.platform.create({
      data: {
        name: PlatformType.TIKTOK,
        displayName: 'TikTok',
        isActive: true,
      },
    }),
    prisma.platform.create({
      data: {
        name: PlatformType.INSTAGRAM,
        displayName: 'Instagram',
        isActive: true,
      },
    }),
    prisma.platform.create({
      data: {
        name: PlatformType.FACEBOOK,
        displayName: 'Facebook',
        isActive: true,
      },
    }),
  ]);

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
