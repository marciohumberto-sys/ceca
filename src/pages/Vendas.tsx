import { useState, useEffect } from 'react';
import { ShoppingCart, Search, SlidersHorizontal, TrendingUp, CheckCircle2, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const formatBRL = (value: string | number) => {
  const str = String(value);
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseFloat(digits) / 100;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseBRLToNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return parseFloat(digits) / 100;
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'Pago') return <span className="badge-success px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">{status}</span>;
  if (status === 'Atrasado') return <span className="badge-danger px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">{status}</span>;
  return <span className="badge-warning px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">{status}</span>;
}

export default function Vendas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sale form states
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleItems, setSaleItems] = useState<any[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('À vista');
  const [installments, setInstallments] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [discount, setDiscount] = useState(0);
  const [savingSale, setSavingSale] = useState(false);
  const [saveSaleError, setSaveSaleError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const fetchSales = () => {
    setLoading(true);
    setError(null);
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/sales')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          setError('Os dados retornados pelo servidor estão em formato incorreto.');
          setLoading(false);
          return;
        }
        
        const mappedSales = data.map((sale: any) => {
          const cliente = sale.customerName || 'Cliente Não Informado';
          const initials = cliente.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
          const color = colors[cliente.length % colors.length];

          let status = 'Pendente';
          if (sale.receivables && sale.receivables.length > 0) {
            const rec = sale.receivables[0];
            if (rec.status === 'pago') {
              status = 'Pago';
            } else if (rec.status === 'pendente') {
              const due = new Date(rec.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              due.setHours(0, 0, 0, 0);
              if (due < today) {
                status = 'Atrasado';
              }
            }
          }

          return {
            id: 'VEN-' + sale.id.substring(0, 5).toUpperCase(),
            originalId: sale.id,
            cliente,
            data: new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            pagamento: sale.paymentMethod || '-',
            itens: `${sale.items?.length || 0} ${sale.items?.length === 1 ? 'item' : 'itens'}`,
            status,
            valor: Number(sale.total || 0),
            color,
            initials,
            customerId: sale.customerId,
            items: sale.items || [],
            notes: sale.notes || '',
            discount: Number(sale.discount || 0)
          };
        });
        setSales(mappedSales);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] Erro ao buscar vendas:', err);
        setError('Não foi possível carregar as vendas. Verifique se o servidor backend está ativo.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSales();

    // Fetch customers
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(console.error);

    // Fetch products
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const handleEditSaleClick = (v: any) => {
    setSelectedSaleId(v.originalId);
    setIsEditing(true);
    setSelectedCustomerId(v.customerId || '');
    if (v.items && v.items.length > 0) {
      setSaleItems(v.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice)
      })));
    } else {
      setSaleItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    }
    setNotes(v.notes || '');

    if (v.receivables && v.receivables.length > 1) {
      setPaymentType('Parcelado');
      setInstallments(v.receivables.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        dueDate: r.dueDate ? r.dueDate.split('T')[0] : '',
        status: r.status,
        description: r.description || '',
        observations: r.observations || '',
        paymentMethod: r.paymentMethod || 'PIX'
      })));
    } else if (v.receivables && v.receivables.length === 1) {
      setPaymentType('À vista');
      const rec = v.receivables[0];
      setInstallments([{
        id: rec.id,
        amount: Number(rec.amount),
        dueDate: rec.dueDate ? rec.dueDate.split('T')[0] : '',
        status: rec.status,
        description: rec.description || '',
        observations: rec.observations || '',
        paymentMethod: rec.paymentMethod || 'PIX'
      }]);
    } else {
      setPaymentType('À vista');
      setInstallments([]);
    }

    setPaymentMethod(v.pagamento || 'PIX');
    setDiscount(v.discount || 0);
    setSaveSaleError(null);
    setIsModalOpen(true);
  };

  const handleDeleteSaleClick = (v: any) => {
    setSaleToDelete(v);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/sales/${saleToDelete.originalId}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao excluir venda: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchSales();
        setIsDeleteModalOpen(false);
        setSaleToDelete(null);
        setSuccessToast('Venda excluída com sucesso');
        setTimeout(() => setSuccessToast(null), 1800);
      })
      .catch((err) => {
        console.error('[Frontend] Erro ao excluir venda:', err);
        setDeleteError(err.message || 'Não foi possível excluir a venda.');
      })
      .finally(() => setDeleting(false));
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setSaveSaleError('Selecione um cliente.');
      return;
    }
    if (saleItems.length === 0) {
      setSaveSaleError('Adicione pelo menos um produto.');
      return;
    }
    
    const invalidItem = saleItems.find(item => !item.productId || item.quantity < 1);
    if (invalidItem) {
      setSaveSaleError('Todos os produtos devem ser selecionados e ter quantidade válida.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    if (!customer) {
      setSaveSaleError('Cliente inválido.');
      return;
    }

    setSavingSale(true);
    setSaveSaleError(null);

    const totalVenda = saleItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) - discount;

    let finalInstallments = [];
    if (paymentType === 'À vista') {
      finalInstallments = installments.length > 0 ? installments : [{
        amount: totalVenda,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pago',
        description: 'À vista',
        paymentMethod: paymentMethod
      }];
      finalInstallments[0].amount = totalVenda;
    } else {
      const sum = installments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      if (Math.abs(sum - totalVenda) > 0.01) {
        setSaveSaleError(`A soma das parcelas (R$ ${sum.toFixed(2)}) difere do total da venda (R$ ${totalVenda.toFixed(2)}).`);
        setSavingSale(false);
        return;
      }
      finalInstallments = installments;
    }

    const payload = {
      customerId: customer.id,
      customerName: customer.name,
      paymentMethod,
      discount,
      notes,
      items: saleItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: prod ? prod.name : 'Produto Desconhecido',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      }),
      installments: finalInstallments
    };

    const url = isEditing 
      ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/sales/${selectedSaleId}`
      : (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/sales';
    
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na API ao salvar venda: ${res.status}`);
        }
        return res.json();
      })
      .then(_data => {
        setSaleItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
        setNotes('');
        setInstallments([]);
        setPaymentType('À vista');
        setDiscount(0);
        fetchSales();
        
        // Close modal immediately
        setIsModalOpen(false);
        setIsEditing(false);
        setSelectedSaleId(null);

        // Show floating Success Toast
        setSuccessToast(isEditing ? 'Venda atualizada com sucesso' : 'Venda registrada com sucesso');
        setTimeout(() => {
          setSuccessToast(null);
        }, 1800);
      })

      .catch(err => {
        console.error('[Frontend] Erro ao cadastrar venda:', err);
        setSaveSaleError('Não foi possível registrar a venda. Verifique se o backend está ativo.');
      })
      .finally(() => {
        setSavingSale(false);
      });
  };

  const totalVendido = sales.reduce((s, v) => s + v.valor, 0);
  const pagas = sales.filter((v) => v.status === 'Pago');
  const pendentes = sales.filter((v) => v.status === 'Pendente');
  const atrasadas = sales.filter((v) => v.status === 'Atrasado');

  const filtered = sales.filter((v) => {
    const matchSearch = v.cliente.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Vendas"
        subtitle={`${sales.length} registros${loading ? ' (carregando...)' : ''}`}
        action={
          <button
            id="nova-venda-btn"
            onClick={() => {
              setIsEditing(false);
              setSelectedSaleId(null);
              if (products.length > 0) {
                setSaleItems([{ productId: products[0].id, quantity: 1, unitPrice: Number(products[0].salePrice) }]);
              } else {
                setSaleItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
              }
              setNotes('');
              setPaymentType('À vista');
              setInstallments([]);
              setSaveSaleError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
          >
            <ShoppingCart size={15} strokeWidth={2.5} />
            Nova Venda
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Vendido', value: formatCurrency(totalVendido), icon: TrendingUp, color: '#7C5CBF', bg: '#EDE8F8' },
          { label: 'Pagas', value: `${pagas.length} vendas`, icon: CheckCircle2, color: '#1DB86E', bg: '#EDFAF3' },
          { label: 'Pendentes', value: `${pendentes.length} vendas`, icon: Clock, color: '#E08C2D', bg: '#FEF3E2' },
          { label: 'Atrasadas', value: `${atrasadas.length} vendas`, icon: AlertCircle, color: '#E05252', bg: '#FEECEC' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card relative overflow-hidden flex items-center gap-3 py-3.5 px-3.5">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />
            <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: bg }}>
              <Icon size={15} style={{ color }} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-graphite-400 font-bold uppercase tracking-wider leading-none truncate">{label}</p>
              <p className="text-base font-bold text-graphite-900 mt-1.5 leading-none truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2 bg-graphite-50/50 p-1.5 rounded-2xl border border-graphite-100">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input
            id="vendas-search"
            type="text"
            placeholder="Buscar cliente ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-card border border-graphite-200 rounded-xl text-sm text-graphite-800 placeholder-graphite-300 hover:border-graphite-300 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all duration-200 ease-out"
          />
        </div>
        <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-graphite-200 flex-shrink-0">
          {['Todos', 'Pago', 'Pendente', 'Atrasado'].map((s) => (
            <button
              key={s}
              id={`filtro-${s.toLowerCase()}`}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-graphite-500 hover:text-graphite-850 hover:bg-graphite-50/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button id="vendas-filtros-btn" className="flex items-center gap-1.5 px-3 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-semibold text-graphite-500 hover:border-graphite-300 transition-colors flex-shrink-0">
          <SlidersHorizontal size={13} /> Filtros
        </button>
      </div>

      {/* ── Sales List ── */}
      <div className="card p-0 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2.25rem_48fr_12fr_11fr_11fr_10fr_8fr] items-center gap-x-4 px-5 py-2 bg-graphite-100/90 border-b border-graphite-200/60 text-[10px] font-bold text-graphite-600 uppercase tracking-widest">
          <span />
          <span>Cliente</span>
          <span className="text-center">Pagamento</span>
          <span className="text-center">Itens</span>
          <span className="text-center">Status</span>
          <span className="text-right">Valor</span>
          <span className="text-center">Ações</span>
        </div>

        <div className="flex flex-col divide-y divide-graphite-50">
          {loading ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Carregando vendas...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm font-medium">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Nenhuma venda encontrada.</div>
          ) : filtered.map((v) => (
            <div
              key={v.id}
              className="relative flex lg:grid lg:grid-cols-[2.25rem_48fr_12fr_11fr_11fr_10fr_8fr] gap-x-4 items-center px-5 py-1.5 hover:bg-graphite-100/50 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] rounded-xl transition-all duration-200 cursor-pointer group"
            >
              {/* Left active green indicator pill */}
              <div className="absolute left-0.5 top-1 bottom-1 w-[3px] bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

              {/* Mobile layout */}
              <div className="flex items-center gap-3 flex-1 lg:contents">
                <div className="avatar text-xs flex-shrink-0 font-bold" style={{ background: v.color }}>{v.initials}</div>
                <div className="flex-1 min-w-0 lg:contents">
                  <div className="lg:flex lg:flex-col lg:min-w-0 leading-tight self-center">
                    <p className="text-sm font-bold text-graphite-900 truncate">{v.cliente}</p>
                    <p className="text-[11px] text-graphite-400 font-medium mt-0.5 truncate">{v.data}</p>
                  </div>
                  <span className="hidden lg:block text-center self-center">
                    <span className="inline-flex items-center px-2 py-0.5 bg-graphite-100 text-graphite-600 rounded-lg text-[10px] font-semibold whitespace-nowrap">
                      {v.pagamento}
                    </span>
                  </span>
                  <span className="hidden lg:block text-[11px] text-graphite-400 font-medium text-center self-center">{v.itens}</span>
                  <div className="hidden lg:flex justify-center items-center self-center"><StatusBadge status={v.status} /></div>
                  <p className="hidden lg:block text-sm font-bold text-graphite-900 text-right self-center">{formatCurrency(v.valor)}</p>
                  <div className="hidden lg:flex justify-center items-center gap-2 self-center flex-shrink-0">
                    <button
                      title="Editar"
                      onClick={(e) => { e.stopPropagation(); handleEditSaleClick(v); }}
                      className="p-1.5 text-graphite-400 hover:text-brand hover:bg-graphite-100 rounded-lg transition-colors duration-150"
                    >
                      <Edit2 size={13} strokeWidth={2.2} />
                    </button>
                    <button
                      title="Excluir"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSaleClick(v); }}
                      className="p-1.5 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors duration-150"
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Mobile right */}
              <div className="lg:hidden text-right flex-shrink-0 ml-3 flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-graphite-900">{formatCurrency(v.valor)}</p>
                <StatusBadge status={v.status} />
                <div className="flex gap-1.5 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEditSaleClick(v); }} className="p-1 text-graphite-400 hover:text-brand bg-graphite-100 rounded-md">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSaleClick(v); }} className="p-1 text-graphite-400 hover:text-danger bg-danger-light/30 rounded-md">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!savingSale) {
            setIsModalOpen(false);
            setSaveSaleError(null);
          }
        }}
        title={isEditing ? "Editar Venda" : "Nova Venda"}
        subtitle={isEditing ? "Altere os dados desta venda" : "Registre uma nova venda no histórico comercial"}
        maxWidth="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              disabled={savingSale}
              onClick={() => {
                setIsModalOpen(false);
                setSaveSaleError(null);
              }}
              className="px-4 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-bold text-graphite-500 hover:text-graphite-800 hover:border-graphite-300 hover:bg-graphite-50/50 shadow-sm transition-all duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={savingSale}
              onClick={handleSaveSale}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-[0_4px_12px_rgba(29,184,110,0.15)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
            >
              {savingSale ? 'Salvando...' : 'Salvar Venda'}
            </button>
          </>
        }
      >
        <form className="flex flex-col gap-4.5" onSubmit={handleSaveSale}>
          {saveSaleError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium">
              {saveSaleError}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Cliente</label>
            <select 
              className="form-select"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              disabled={savingSale}
              required
            >
              {customers.length === 0 ? (
                <option value="">Nenhum cliente cadastrado</option>
              ) : customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 border border-graphite-200 rounded-xl p-3 bg-graphite-50/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest">Produtos</label>
              <button
                type="button"
                onClick={() => setSaleItems([...saleItems, { productId: products.length > 0 ? products[0].id : '', quantity: 1, unitPrice: products.length > 0 ? Number(products[0].salePrice) : 0 }])}
                className="text-xs font-bold text-brand hover:text-brand-dark transition-colors"
              >
                + Adicionar Item
              </button>
            </div>
            {saleItems.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_4rem_5rem_auto] sm:grid-cols-[1fr_5rem_6rem_auto] gap-2 items-end">
                <div className="flex flex-col min-w-0">
                  {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Produto</label>}
                  <select
                    className="form-select text-xs h-9 px-2"
                    value={item.productId}
                    onChange={e => {
                      const newId = e.target.value;
                      const prod = products.find(p => p.id === newId);
                      const newItems = [...saleItems];
                      newItems[index].productId = newId;
                      if (prod) newItems[index].unitPrice = Number(prod.salePrice);
                      setSaleItems(newItems);
                    }}
                    disabled={savingSale}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Qtd.</label>}
                  <input
                    type="number"
                    min="1"
                    className="form-input text-xs h-9 px-2"
                    value={item.quantity}
                    onChange={e => {
                      const newItems = [...saleItems];
                      newItems[index].quantity = Math.max(1, parseInt(e.target.value) || 1);
                      setSaleItems(newItems);
                    }}
                    disabled={savingSale}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Preço</label>}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input text-xs h-9 px-2"
                    value={item.unitPrice}
                    onChange={e => {
                      const newItems = [...saleItems];
                      newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                      setSaleItems(newItems);
                    }}
                    disabled={savingSale}
                    required
                  />
                </div>
                <div className="flex flex-col justify-end h-9">
                  {saleItems.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...saleItems];
                        newItems.splice(index, 1);
                        setSaleItems(newItems);
                      }}
                      className="h-9 px-2 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors flex items-center justify-center"
                      disabled={savingSale}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <div className="w-8"></div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2 mt-2 border-t border-graphite-200">
              <span className="text-xs font-bold text-graphite-600">
                Subtotal dos itens: {formatCurrency(saleItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Tipo de Pagamento</label>
              <select 
                className="form-select"
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                disabled={savingSale}
              >
                <option value="À vista">À vista</option>
                <option value="Parcelado">Parcelado Flexível</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Forma de Pagamento Principal</label>
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                disabled={savingSale}
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Desconto (R$)</label>
              <input 
                type="text" 
                placeholder="R$ 0,00"
                className="form-input"
                value={discount > 0 ? formatBRL(discount.toFixed(2).replace('.', '')) : ''}
                onChange={e => setDiscount(parseBRLToNumber(e.target.value))}
                disabled={savingSale}
              />
            </div>
          </div>

          {paymentType === 'À vista' && (
            <div className="flex flex-col gap-2 border border-brand/20 rounded-xl p-3 bg-brand-50/10">
              <label className="text-[10.5px] font-bold text-brand uppercase tracking-widest">Detalhes do Pagamento À vista</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-graphite-500 font-bold mb-1">Status</label>
                  <select
                    className="form-select text-xs h-9 px-2"
                    value={installments.length > 0 ? installments[0].status : 'pago'}
                    onChange={e => {
                      const newInst = installments.length > 0 ? [...installments] : [{ amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'pago' }];
                      newInst[0].status = e.target.value;
                      setInstallments(newInst);
                    }}
                    disabled={savingSale}
                  >
                    <option value="pago">Já Recebido (Pago)</option>
                    <option value="pendente">A Receber (Pendente)</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-graphite-500 font-bold mb-1">Data (Vencimento)</label>
                  <input
                    type="date"
                    className="form-input text-xs h-9 px-2"
                    value={installments.length > 0 ? installments[0].dueDate : new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      const newInst = installments.length > 0 ? [...installments] : [{ amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'pago' }];
                      newInst[0].dueDate = e.target.value;
                      setInstallments(newInst);
                    }}
                    disabled={savingSale}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentType === 'Parcelado' && (
            <div className="flex flex-col gap-2 border border-graphite-200 rounded-xl p-3 bg-graphite-50/30">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest">Parcelas</label>
                <button
                  type="button"
                  onClick={() => setInstallments([...installments, { amount: 0, dueDate: '', status: 'pendente', description: `Parcela ${installments.length + 1}` }])}
                  className="text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                >
                  + Adicionar Parcela
                </button>
              </div>
              
              {installments.length === 0 && (
                <p className="text-xs text-graphite-400 italic">Nenhuma parcela adicionada.</p>
              )}

              {installments.map((inst, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_6rem_auto] sm:grid-cols-[2fr_7rem_7rem_8rem_auto] gap-2 items-end bg-white p-2.5 rounded-lg border border-graphite-100">
                  <div className="flex flex-col min-w-0 sm:col-span-1 col-span-2">
                    {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Descrição</label>}
                    <input
                      type="text"
                      className="form-input text-xs h-9 px-2"
                      placeholder="Ex: Parcela 1/3"
                      value={inst.description}
                      onChange={e => {
                        const newInst = [...installments];
                        newInst[index].description = e.target.value;
                        setInstallments(newInst);
                      }}
                      disabled={savingSale}
                    />
                  </div>
                  <div className="flex flex-col">
                    {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Vencimento</label>}
                    <input
                      type="date"
                      className="form-input text-xs h-9 px-2"
                      value={inst.dueDate}
                      onChange={e => {
                        const newInst = [...installments];
                        newInst[index].dueDate = e.target.value;
                        setInstallments(newInst);
                      }}
                      disabled={savingSale}
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Status</label>}
                    <select
                      className="form-select text-xs h-9 px-2"
                      value={inst.status}
                      onChange={e => {
                        const newInst = [...installments];
                        newInst[index].status = e.target.value;
                        setInstallments(newInst);
                      }}
                      disabled={savingSale}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    {index === 0 && <label className="text-[10px] text-graphite-500 font-bold mb-1 hidden sm:block">Valor (R$)</label>}
                    <input
                      type="text"
                      className="form-input text-xs h-9 px-2 font-medium"
                      placeholder="R$ 0,00"
                      value={inst.amount ? formatBRL(Number(inst.amount).toFixed(2).replace('.', '')) : ''}
                      onChange={e => {
                        const newInst = [...installments];
                        newInst[index].amount = parseBRLToNumber(e.target.value);
                        setInstallments(newInst);
                      }}
                      disabled={savingSale}
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-end h-9">
                    <button
                      type="button"
                      onClick={() => {
                        const newInst = [...installments];
                        newInst.splice(index, 1);
                        setInstallments(newInst);
                      }}
                      className="h-9 px-2.5 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors flex items-center justify-center"
                      disabled={savingSale}
                      title="Remover parcela"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Resumo e Validação */}
              {installments.length > 0 && (() => {
                const totalVenda = saleItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) - discount;
                const somaParcelas = installments.reduce((s, i) => s + Number(i.amount || 0), 0);
                const diff = totalVenda - somaParcelas;
                const isEqual = Math.abs(diff) < 0.01;

                return (
                  <div className="mt-3 bg-white border border-graphite-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-graphite-400 font-medium">Total da Venda</span>
                          <span className="font-bold text-graphite-800 text-sm">{formatCurrency(totalVenda)}</span>
                        </div>
                        <div className="w-px h-8 bg-graphite-100 hidden sm:block"></div>
                        <div className="flex flex-col">
                          <span className="text-graphite-400 font-medium">Soma das Parcelas</span>
                          <span className={`font-bold text-sm ${isEqual ? 'text-brand' : 'text-graphite-800'}`}>
                            {formatCurrency(somaParcelas)}
                          </span>
                        </div>
                        {!isEqual && (
                          <>
                            <div className="w-px h-8 bg-graphite-100 hidden sm:block"></div>
                            <div className="flex flex-col">
                              <span className="text-danger/80 font-medium">Diferença</span>
                              <span className="font-bold text-danger text-sm">
                                {diff > 0 ? 'Falta ' : 'Passou '}
                                {formatCurrency(Math.abs(diff))}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {isEqual ? (
                        <div className="flex items-center gap-1.5 text-brand bg-brand-50/50 px-2.5 py-1.5 rounded-md self-start sm:self-auto">
                          <CheckCircle2 size={14} />
                          <span className="text-[11px] font-bold">Parcelas conferem</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-danger bg-danger-light/20 px-2.5 py-1.5 rounded-md self-start sm:self-auto">
                          <AlertCircle size={14} />
                          <span className="text-[11px] font-bold">Corrija os valores</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Observação (Opcional)</label>
            <textarea
              className="form-input min-h-[60px] py-2 resize-y text-sm"
              placeholder="Ex: Entrega agendada, preferência de cor..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={savingSale}
            />
          </div>
        </form>
      </Modal>

      {/* Alerta de sucesso (Toast) */}
      {successToast && (
        <div className="fixed top-[42%] left-1/2 z-[9999] pointer-events-none animate-feedback-card">
          <div className="bg-white border border-graphite-100/50 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08),0_0_2px_rgba(0,0,0,0.12)] p-6 flex flex-col items-center justify-center gap-4 w-[260px] min-h-[140px] pointer-events-auto">
            {successToast.includes('excluíd') ? (
              <div className="w-12 h-12 rounded-2xl bg-danger-light flex items-center justify-center text-danger flex-shrink-0 animate-feedback-icon shadow-[0_0_20px_rgba(224,82,82,0.15)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 animate-feedback-icon shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
            <p className="text-[13px] font-bold text-graphite-800 text-center leading-snug">{successToast}</p>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setSaleToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir Venda"
        subtitle="Confirme a exclusão permanente desta venda"
        footer={
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSaleToDelete(null);
                setDeleteError(null);
              }}
              className="px-4 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-bold text-graphite-500 hover:text-graphite-800 hover:border-graphite-300 hover:bg-graphite-50/50 shadow-sm transition-all duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-[0_4px_12px_rgba(224,82,82,0.15)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #E05252 0%, #B83D3D 100%)' }}
            >
              {deleting ? 'Excluindo...' : 'Excluir Venda'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {deleteError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium">
              {deleteError}
            </div>
          )}
          <p className="text-sm text-graphite-600">
            Tem certeza que deseja excluir esta venda de <strong className="text-graphite-800">{saleToDelete?.cliente}</strong> no valor de <strong className="text-graphite-800">{saleToDelete ? formatCurrency(saleToDelete.valor) : ''}</strong>? O recebimento vinculado e os itens voltarão ao estoque. Esta ação não poderá ser desfeita.
          </p>
        </div>
      </Modal>

    </div>
  );
}

