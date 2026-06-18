import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Sistema 360 OK"
  });
});

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        items: {
          select: { quantity: true }
        }
      }
    });

    // 1. Encontrar maior SKU numérico existente
    let nextSkuNum = 1001;
    const numericSkus = products
      .map(p => parseInt(p.sku, 10))
      .filter(num => !isNaN(num) && Number.isInteger(num));
    
    if (numericSkus.length > 0) {
      nextSkuNum = Math.max(...numericSkus) + 1;
    }

    // 2. Identificar produtos sem SKU numérico válido e ordenar por data de criação para atribuição cronológica
    const productsToFix = products.filter(p => {
      const isNumeric = p.sku && /^\d+$/.test(p.sku);
      return !isNumeric;
    });

    if (productsToFix.length > 0) {
      // Ordenar os produtos a corrigir de forma cronológica (createdAt mais antigo primeiro)
      productsToFix.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      for (const p of productsToFix) {
        const assignedSku = String(nextSkuNum);
        nextSkuNum++;
        
        await prisma.product.update({
          where: { id: p.id },
          data: { sku: assignedSku }
        });
        
        // Atualizar o SKU na lista em memória para retornar na resposta atual
        p.sku = assignedSku;
      }
      console.log(`[API] Corrigidos ${productsToFix.length} produtos antigos com SKUs sequenciais numéricos.`);
    }

    console.log(`[API] /products - Produtos retornados: ${products.length}`);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro ao buscar produtos"
    });
  }
});

app.get("/customers", async (req, res) => {
  try {
    const customersData = await prisma.customer.findMany({
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: { sales: true }
        },
        receivables: {
          where: { status: "pendente" }
        }
      }
    });

    const customers = customersData.map(c => {
      const openAmount = c.receivables.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const lastPurchaseDate = c.sales.length > 0 ? c.sales[0].createdAt : null;

      return {
        ...c,
        purchaseCount: c._count.sales,
        lastPurchaseDate,
        openAmount
      };
    });

    console.log(`[API] /customers - Clientes retornados: ${customers.length}`);
    res.json(customers);
  } catch (error) {
    console.error("[API] /customers - Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro interno ao buscar clientes" });
  }
});

app.get("/sales", async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { items: true, receivables: true },
      orderBy: { createdAt: "desc" },
    });
    console.log(`[API] /sales - Vendas retornadas: ${sales.length}`);
    res.json(sales);
  } catch (error) {
    console.error("[API] /sales - Erro ao buscar vendas:", error);
    res.status(500).json({ error: "Erro interno ao buscar vendas" });
  }
});

app.get("/receivables", async (req, res) => {
  const receivables = await prisma.receivable.findMany({
    orderBy: { dueDate: "asc" },
  });
  res.json(receivables);
});

app.post("/receivables", async (req, res) => {
  try {
    const { customerId, customerName, description, amount, dueDate, paymentMethod, status, observations } = req.body;
    
    if (!customerId || !customerName || !amount || !dueDate) {
      return res.status(400).json({ error: "Faltam campos obrigatórios." });
    }

    const receivable = await prisma.receivable.create({
      data: {
        customerId,
        customerName,
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        paymentMethod: paymentMethod || "Pix",
        status: status || "pendente",
        observations
      }
    });

    console.log(`[API] Recebimento criado com sucesso.`);
    res.status(201).json(receivable);
  } catch (error) {
    console.error("[API] Erro ao criar recebimento:", error);
    res.status(500).json({ error: "Erro ao criar recebimento" });
  }
});

app.put("/receivables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, customerName, description, amount, dueDate, paymentMethod, status, observations } = req.body;
    
    // Validate required fields
    if (!customerId || !customerName || !amount || !dueDate) {
      return res.status(400).json({ error: "Faltam campos obrigatórios." });
    }

    const updated = await prisma.receivable.update({
      where: { id },
      data: {
        customerId,
        customerName,
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        paymentMethod,
        status,
        observations
      }
    });

    console.log(`[API] Recebimento ${id} atualizado com sucesso.`);
    res.json(updated);
  } catch (error) {
    console.error("[API] Erro ao atualizar recebimento:", error);
    res.status(500).json({ error: "Erro ao atualizar recebimento" });
  }
});

app.delete("/receivables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.receivable.delete({
      where: { id }
    });
    console.log(`[API] Recebimento ${id} excluído com sucesso.`);
    res.json({ message: "Recebimento excluído com sucesso" });
  } catch (error) {
    console.error("[API] Erro ao excluir recebimento:", error);
    res.status(500).json({ error: "Erro ao excluir recebimento" });
  }
});

app.put("/receivables/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o recebimento para obter o valor original e status atual
    const receivable = await prisma.receivable.findUnique({
      where: { id }
    });
    
    if (!receivable) {
      return res.status(404).json({ error: "Recebimento não encontrado" });
    }
    
    const isCurrentlyPaid = receivable.status === "pago";
    
    const updated = await prisma.receivable.update({
      where: { id },
      data: {
        status: isCurrentlyPaid ? "pendente" : "pago",
        paidAmount: isCurrentlyPaid ? null : receivable.amount,
        paidAt: isCurrentlyPaid ? null : new Date()
      }
    });
    
    console.log(`[API] Recebimento ${id} alternado de ${isCurrentlyPaid ? "pago" : "pendente"} para ${isCurrentlyPaid ? "pendente" : "pago"}.`);
    res.json(updated);
  } catch (error) {
    console.error("[API] Erro ao alternar status do recebimento:", error);
    res.status(500).json({ error: "Erro ao alternar status do recebimento" });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    
    // Helpers para gerar iniciais e cores
    const getInitials = (name) => {
      if (!name) return "CL";
      const parts = name.split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };
    
    const getColor = (name) => {
      if (!name) return '#7C5CBF';
      const colors = ['#7C5CBF', '#1DB86E', '#C9A84C', '#E05252', '#38C985', '#E08C2D'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    // 1. Vendas da Semana (iniciando no domingo)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    
    // 2. Vendas do Mês / Entradas do Mês (iniciando no primeiro dia do mês)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    
    // Vencendo Hoje (dia atual)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      weeklySales,
      monthlySales,
      pendingReceivablesList,
      monthPaidReceivables,
      salesList,
      receivablesTodayList,
      upcomingList,
      lowStockProductsList,
      allProducts
    ] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startOfWeek } },
        select: { total: true }
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { total: true }
      }),
      prisma.receivable.findMany({
        where: { status: "pendente" },
        select: { amount: true, customerId: true, customerName: true }
      }),
      prisma.receivable.findMany({
        where: {
          status: "pago",
          paidAt: { gte: startOfMonth }
        },
        select: { amount: true }
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true, receivables: true }
      }),
      prisma.receivable.findMany({
        where: {
          dueDate: { gte: startOfToday, lte: endOfToday },
          status: { not: "pago" }
        },
        take: 5
      }),
      prisma.receivable.findMany({
        where: { status: "pendente" },
        orderBy: { dueDate: "asc" },
        take: 4
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { stockQuantity: { lte: 0 } },
            {
              stockQuantity: {
                lte: prisma.product.fields.minStock
              }
            }
          ]
        },
        take: 4
      }),
      prisma.product.findMany({
        include: { items: true }
      })
    ]);

    const vendasSemana = weeklySales.reduce((sum, s) => sum + Number(s.total), 0);
    const vendasMes = monthlySales.reduce((sum, s) => sum + Number(s.total), 0);
    const recebimentosPendentes = pendingReceivablesList.reduce((sum, r) => sum + Number(r.amount), 0);
    
    // Contagem de clientes únicos com recebimentos pendentes
    const uniquePendingCustomers = new Set(
      pendingReceivablesList.map(r => r.customerId || r.customerName).filter(Boolean)
    );
    
    const totalEntradas = monthPaidReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalSaidas = 0.00;
    const saldo = totalEntradas - totalSaidas;

    // Últimas Vendas mapeadas
    const latestSales = salesList.map(s => {
      const itemsCount = s.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const isPaid = s.receivables.length === 0 || s.receivables.every(r => r.status === "pago");
      const isAtrasado = s.receivables.some(r => r.status === "atrasado" || (r.status === "pendente" && new Date(r.dueDate) < new Date()));
      const status = isPaid ? 'Pago' : (isAtrasado ? 'Atrasado' : 'Pendente');
      
      return {
        id: s.id.substring(0, 8).toUpperCase(),
        cliente: s.customerName || 'Cliente Geral',
        initials: getInitials(s.customerName),
        color: getColor(s.customerName),
        data: new Date(s.createdAt).toLocaleDateString('pt-BR'),
        valor: Number(s.total),
        status,
        itens: itemsCount,
        pagamento: s.paymentMethod || 'Dinheiro'
      };
    });

    // Vencendo Hoje mapeados
    const receivablesToday = receivablesTodayList.map(r => ({
      id: r.id.substring(0, 8).toUpperCase(),
      cliente: r.customerName || 'Cliente Geral',
      initials: getInitials(r.customerName),
      color: getColor(r.customerName),
      vencimento: new Date(r.dueDate).toLocaleDateString('pt-BR'),
      parcela: 'À vista',
      valor: Number(r.amount),
      diasAtraso: 0,
      status: 'Hoje'
    }));

    // Próximos Recebimentos mapeados
    const upcomingReceivables = upcomingList.map(r => {
      const dueDate = new Date(r.dueDate);
      const diffTime = now.getTime() - dueDate.getTime();
      const diasAtraso = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
      const status = diasAtraso > 0 ? 'Atrasado' : (dueDate.toDateString() === now.toDateString() ? 'Hoje' : 'Pendente');
      
      return {
        id: r.id.substring(0, 8).toUpperCase(),
        cliente: r.customerName || 'Cliente Geral',
        initials: getInitials(r.customerName),
        color: getColor(r.customerName),
        vencimento: dueDate.toLocaleDateString('pt-BR'),
        parcela: 'À vista',
        valor: Number(r.amount),
        diasAtraso,
        status
      };
    });

    // Estoque Baixo mapeado
    const lowStockProducts = lowStockProductsList.map(p => ({
      id: p.id.substring(0, 8).toUpperCase(),
      nome: p.name,
      estoque: p.stockQuantity,
      minimo: p.minStock,
      categoria: p.category || 'Sem Categoria'
    }));

    // Mais Vendidos mapeados
    const mappedProducts = allProducts.map(p => {
      const totalVendido = p.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const receita = p.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      return {
        id: p.id.substring(0, 8).toUpperCase(),
        nome: p.name,
        vendas: totalVendido,
        receita: receita,
        cor: getColor(p.name)
      };
    });

    const topSellingProducts = mappedProducts
      .filter(p => p.vendas > 0)
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 4);

    console.log(`[API] /dashboard - Dashboard completa atualizada.`);

    res.json({
      vendasSemana,
      vendasMes,
      recebimentosPendentes,
      clientesAtraso: uniquePendingCustomers.size,
      resumoFinanceiro: {
        totalEntradas,
        totalSaidas,
        saldo,
        previsaoMes: 52000.0,
      },
      latestSales,
      receivablesToday,
      upcomingReceivables,
      lowStockProducts,
      topSellingProducts
    });
  } catch (error) {
    console.error("[API] /dashboard - Erro ao carregar dados do dashboard:", error);
    res.status(500).json({ error: "Erro interno ao carregar dados do dashboard" });
  }
});

app.post("/products", async (req, res) => {
  try {
    // 1. Encontrar maior SKU numérico existente
    const products = await prisma.product.findMany({
      select: { sku: true }
    });
    
    let nextSkuNum = 1001;
    const numericSkus = products
      .map(p => parseInt(p.sku, 10))
      .filter(num => !isNaN(num) && Number.isInteger(num));
    
    if (numericSkus.length > 0) {
      nextSkuNum = Math.max(...numericSkus) + 1;
    }

    const data = {
      ...req.body,
      sku: String(nextSkuNum)
    };

    const product = await prisma.product.create({ data });
    console.log(`[API] Produto criado com SKU auto-atribuído: ${product.sku}`);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: req.body
    });
    console.log(`[API] Produto ${id} atualizado com sucesso.`);
    res.json(product);
  } catch (error) {
    console.error("[API] Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o produto está vinculado a algum item de venda (SaleItem)
    const linkedSales = await prisma.saleItem.findFirst({
      where: { productId: id }
    });

    if (linkedSales) {
      console.log(`[API] Impedida exclusão do produto ${id} por possuir vendas vinculadas.`);
      return res.status(400).json({
        error: "Este produto possui vendas vinculadas e não pode ser excluído."
      });
    }

    await prisma.product.delete({
      where: { id }
    });
    console.log(`[API] Produto ${id} excluído com sucesso.`);
    res.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("[API] Erro ao excluir produto:", error);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});


app.post("/customers", async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: req.body
    });
    console.log(`[API] Cliente ${id} atualizado com sucesso.`);
    res.json(customer);
  } catch (error) {
    console.error("[API] Erro ao atualizar cliente:", error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se possui vendas
    const linkedSales = await prisma.sale.findFirst({
      where: { customerId: id }
    });

    // Verificar se possui recebimentos
    const linkedReceivables = await prisma.receivable.findFirst({
      where: { customerId: id }
    });

    if (linkedSales || linkedReceivables) {
      console.log(`[API] Impedida exclusão do cliente ${id} por possuir vínculos.`);
      return res.status(400).json({
        error: "Este cliente possui vendas ou recebimentos vinculados e não pode ser excluído."
      });
    }

    await prisma.customer.delete({
      where: { id }
    });
    
    console.log(`[API] Cliente ${id} excluído com sucesso.`);
    res.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("[API] Erro ao excluir cliente:", error);
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

app.post("/sales", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      items,
      discount = 0,
      paymentMethod,
      receivableStatus = "pendente",
      dueDate,
    } = req.body;

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    const total = subtotal - Number(discount);

    const sale = await prisma.sale.create({
      data: {
        customerId,
        customerName,
        subtotal,
        discount,
        total,
        paymentMethod,
        status: "finalizada",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
        receivables: {
          create: {
            customerId,
            customerName,
            dueDate: dueDate ? new Date(dueDate) : new Date(),
            amount: total,
            paidAmount: receivableStatus === "pago" ? total : null,
            status: receivableStatus,
            paidAt: receivableStatus === "pago" ? new Date() : null,
          },
        },
      },
      include: {
        items: true,
        receivables: true,
      },
    });
	
	    await Promise.all(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: Number(item.quantity),
            },
          },
        })
      )
    );

    res.status(201).json(sale);

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar venda" });
  }
});
app.put("/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, customerName, items, discount = 0, paymentMethod } = req.body;

    const oldSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, receivables: true }
    });

    if (!oldSale) return res.status(404).json({ error: "Venda não encontrada" });

    const oldItem = oldSale.items[0];
    const newItem = items[0];

    // Revert old stock
    await prisma.product.update({
      where: { id: oldItem.productId },
      data: { stockQuantity: { increment: Number(oldItem.quantity) } }
    });

    // Apply new stock
    await prisma.product.update({
      where: { id: newItem.productId },
      data: { stockQuantity: { decrement: Number(newItem.quantity) } }
    });

    const subtotal = Number(newItem.quantity) * Number(newItem.unitPrice);
    const total = subtotal - Number(discount);

    // Update sale
    await prisma.sale.update({
      where: { id },
      data: {
        customerId,
        customerName,
        subtotal,
        discount: Number(discount),
        total,
        paymentMethod
      }
    });

    // Update item
    await prisma.saleItem.update({
      where: { id: oldItem.id },
      data: {
        productId: newItem.productId,
        productName: newItem.productName,
        quantity: Number(newItem.quantity),
        unitPrice: Number(newItem.unitPrice),
        total: subtotal
      }
    });

    // Update receivable if exists
    if (oldSale.receivables && oldSale.receivables.length > 0) {
      await prisma.receivable.update({
        where: { id: oldSale.receivables[0].id },
        data: {
          customerId,
          customerName,
          amount: total
        }
      });
    }

    res.json({ message: "Venda atualizada com sucesso" });
  } catch (error) {
    console.error("[API] Erro ao atualizar venda:", error);
    res.status(500).json({ error: "Erro ao atualizar venda" });
  }
});

app.delete("/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, receivables: true }
    });
    
    if (!sale) return res.status(404).json({ error: "Venda não encontrada" });

    // Restock
    await Promise.all(
      sale.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: Number(item.quantity) } }
        })
      )
    );

    await prisma.receivable.deleteMany({ where: { saleId: id } });
    await prisma.saleItem.deleteMany({ where: { saleId: id } });
    await prisma.sale.delete({ where: { id } });

    res.json({ message: "Venda excluída com sucesso" });
  } catch (error) {
    console.error("[API] Erro ao excluir venda:", error);
    res.status(500).json({ error: "Erro ao excluir venda" });
  }
});
if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => {
    console.log("Servidor rodando na porta 3001");
  });
}

export default app;