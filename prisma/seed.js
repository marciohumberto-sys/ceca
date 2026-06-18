import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.receivable.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  const perfume = await prisma.product.create({
    data: {
      name: "Perfume Essencial 100ml",
      sku: "PROD-001",
      category: "Perfumes",
      salePrice: 89.9,
      costPrice: 42.5,
      stockQuantity: 12,
      minStock: 3,
    },
  });

  const hidratante = await prisma.product.create({
    data: {
      name: "Hidratante Corporal 200ml",
      sku: "PROD-002",
      category: "Cuidados",
      salePrice: 39.9,
      costPrice: 18.75,
      stockQuantity: 0,
      minStock: 5,
    },
  });

  const cliente = await prisma.customer.create({
    data: {
      name: "Cliente Teste",
      phone: "(81) 99999-0000",
      document: "000.000.000-00",
      email: "cliente@teste.com",
      address: "Bezerros/PE",
    },
  });

  const venda = await prisma.sale.create({
    data: {
      customerId: cliente.id,
      customerName: cliente.name,
      subtotal: 129.8,
      discount: 0,
      total: 129.8,
      paymentMethod: "PIX",
      status: "finalizada",
      items: {
        create: [
          {
            productId: perfume.id,
            productName: perfume.name,
            quantity: 1,
            unitPrice: 89.9,
            total: 89.9,
          },
          {
            productId: hidratante.id,
            productName: hidratante.name,
            quantity: 1,
            unitPrice: 39.9,
            total: 39.9,
          },
        ],
      },
      receivables: {
        create: [
          {
            customerId: cliente.id,
            customerName: cliente.name,
            dueDate: new Date(),
            amount: 129.8,
            paidAmount: 129.8,
            status: "pago",
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  console.log("Seed concluído:", venda.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });