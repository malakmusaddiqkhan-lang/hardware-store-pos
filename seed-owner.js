const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: { password: "123" },
    create: {
      username: "owner",
      password: "123",
      role: "OWNER",
    },
  });
  console.log("✅ Owner account ready:", owner);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());