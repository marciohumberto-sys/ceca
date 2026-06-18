import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: { select: { sales: true } },
      sales: true
    }
  });
  console.log(JSON.stringify(customers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
