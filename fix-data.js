import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixRelations() {
  const sales = await prisma.sale.findMany({ where: { customerId: null } });
  let salesUpdated = 0;
  
  for (const sale of sales) {
    if (sale.customerName) {
      const customer = await prisma.customer.findFirst({
        where: { name: sale.customerName }
      });
      if (customer) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { customerId: customer.id }
        });
        salesUpdated++;
      }
    }
  }

  const receivables = await prisma.receivable.findMany({ where: { customerId: null } });
  let recUpdated = 0;
  for (const rec of receivables) {
    if (rec.customerName) {
      const customer = await prisma.customer.findFirst({
        where: { name: rec.customerName }
      });
      if (customer) {
        await prisma.receivable.update({
          where: { id: rec.id },
          data: { customerId: customer.id }
        });
        recUpdated++;
      }
    }
  }

  console.log(`Fix completed. Sales updated: ${salesUpdated}, Receivables updated: ${recUpdated}`);
}

fixRelations()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
