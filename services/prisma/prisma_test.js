import prisma from "./index.js";

async function main() {
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);

  const user  = await prisma.user.findUnique({
    where: {
      id: 1,
    },
  });
  console.log("user", user)
  await prisma.$disconnect();
}

main().catch((e) => {
  throw e;
});