import {
  PrismaClient,
  PlatformType,
  VideoStatus,
  PostStatus,
} from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

function getRandomEnumValue<T extends { [key: string]: string | number }>(
  enumObj: T,
): T[keyof T] {
  const values = Object.values(enumObj);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex] as T[keyof T];
}

async function main() {
  await prisma.videoPost.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.video.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.user.deleteMany();

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

  const users = await Promise.all(
    Array(10)
      .fill(null)
      .map(() =>
        prisma.user.create({
          data: {
            email: faker.internet.email(),
            name: faker.person.fullName(),
            password: faker.internet.password(),
          },
        }),
      ),
  );

  for (const user of users) {
    const userPlatforms = faker.helpers.arrayElements(platforms, {
      min: 2,
      max: 4,
    });

    for (const platform of userPlatforms) {
      await prisma.socialAccount.create({
        data: {
          platformId: platform.id,
          userId: user.id,
          accessToken: faker.string.alphanumeric(40),
          refreshToken: faker.string.alphanumeric(40),
          tokenExpiry: faker.date.future(),
          accountId: faker.string.alphanumeric(10),
          username: faker.internet.username(),
        },
      });
    }
  }

  for (const user of users) {
    const videoCount = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < videoCount; i++) {
      const video = await prisma.video.create({
        data: {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          s3Key: `videos/${user.id}/${faker.string.uuid()}.mp4`,
          s3Bucket: 'misoauto-videos',
          duration: faker.number.float({ min: 30, max: 600 }),
          fileSize: faker.number.int({ min: 1000000, max: 100000000 }),
          mimeType: 'video/mp4',
          status: VideoStatus.READY,
          userId: user.id,
        },
      });

      const userAccounts = await prisma.socialAccount.findMany({
        where: { userId: user.id },
      });

      for (const account of userAccounts) {
        if (faker.number.int({ min: 0, max: 1 })) {
          await prisma.videoPost.create({
            data: {
              videoId: video.id,
              platformId: account.platformId,
              socialAccountId: account.id,
              platformPostId: faker.string.alphanumeric(20),
              postUrl: faker.internet.url(),
              status: PostStatus.PUBLISHED,
              scheduledFor: faker.date.future(),
              postedAt: faker.date.past(),
            },
          });
        }
      }
    }
  }

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