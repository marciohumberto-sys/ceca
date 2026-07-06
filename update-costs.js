import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Atualizando produtos com costPrice null...');
  const result = await prisma.$executeRaw`UPDATE "Product" SET "costPrice" = 0 WHERE "costPrice" IS NULL;`;
  console.log(`Linhas atualizadas: ${result}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
