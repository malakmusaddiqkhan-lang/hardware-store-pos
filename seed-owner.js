const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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