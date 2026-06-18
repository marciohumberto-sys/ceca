import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({ where: { id: 'cmpoj0eax0000hxjcuq3glubf' } });
  console.log(`Updated stock: ${product.stockQuantity}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
