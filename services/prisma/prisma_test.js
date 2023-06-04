import prisma from "./index.js";

async function main() {
  await prisma.$connect();

  const allUsers = await prisma.user.findMany();
  console.log(allUsers);

  await prisma.$disconnect();
}

main().catch((e) => {
  throw e;
});