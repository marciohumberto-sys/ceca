import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserCheck, AlertCircle, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const formatPhone = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, ''); // Keep only digits
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

function StatusBadge({ status }: { status: string }) {
  const badgeClass =
    status === 'Ativo'
      ? 'badge-success'
      : status === 'Em atraso'
        ? 'badge-danger'
        : 'badge-warning';

  return (
    <span className={`${badgeClass} w-22 justify-center px-1 py-0.5 font-bold text-[9.5px] leading-none tracking-wide text-center whitespace-nowrap`}>
      {status}
    </span>
  );
}

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation form states
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    statusInicial: 'Ativo'
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit and Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const fetchCustomers = () => {
    setLoading(true);
    setError(null);
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/customers')
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

        const mappedCustomers = data.map((c: any) => {
          const initials = c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
          const color = colors[c.name.length % colors.length];

          // Use the explicit fields from backend if available, fallback to old logic
          const valorAberto = c.openAmount !== undefined ? c.openAmount : (c.receivables?.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0) || 0);
          
          let status = 'Ativo';
          if (valorAberto > 0) {
            let hasOverdue = false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (const r of c.receivables || []) {
              const due = new Date(r.dueDate);
              due.setHours(0, 0, 0, 0);
              if (due < today) {
                hasOverdue = true;
                break;
              }
            }
            status = hasOverdue ? 'Em atraso' : 'Pendente';
          }

          const rawLastPurchaseTime = c.lastPurchaseDate 
            ? new Date(c.lastPurchaseDate).getTime() 
            : (c.sales && c.sales.length > 0 ? new Date(c.sales[0].createdAt).getTime() : 0);

          const ultimaCompra = c.lastPurchaseDate 
            ? new Date(c.lastPurchaseDate).toLocaleDateString('pt-BR') 
            : (c.sales && c.sales.length > 0 ? new Date(c.sales[0].createdAt).toLocaleDateString('pt-BR') : '—');

          return {
            id: 'CLI-' + c.id.substring(0, 5).toUpperCase(),
            rawId: c.id,
            nome: c.name,
            initials,
            color,
            telefone: c.phone ? formatPhone(c.phone) : 'Não Informado',
            email: c.email || '',
            ultimaCompra,
            rawLastPurchaseTime,
            valorAberto,
            status,
            totalCompras: c.purchaseCount !== undefined ? c.purchaseCount : (c._count?.sales || 0),
            createdAt: c.createdAt
          };
        });

        setCustomers(mappedCustomers);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] Erro ao buscar clientes:', err);
        setError('Não foi possível carregar os clientes. Verifique se o servidor backend está ativo.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditCustomerClick = (customer: any) => {
    setSelectedCustomerId(customer.rawId);
    setIsEditing(true);
    setFormData({
      nome: customer.nome,
      telefone: customer.telefone !== 'Não Informado' ? customer.telefone : '',
      email: customer.email,
      statusInicial: customer.status === 'Ativo' ? 'Ativo' : 'Pendente'
    });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDeleteCustomerClick = (customer: any) => {
    setCustomerToDelete(customer);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/customers/${customerToDelete.rawId}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao excluir cliente: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchCustomers();
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        setSuccessToast('Cliente excluído com sucesso');
        setTimeout(() => {
          setSuccessToast(null);
        }, 1800);
      })
      .catch((err) => {
        console.error('[Frontend] Erro ao excluir cliente:', err);
        setDeleteError(err.message || 'Não foi possível excluir o cliente.');
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setSaveError('O nome completo é obrigatório.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/customers/${selectedCustomerId}`
      : (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/customers';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.nome,
        phone: formData.telefone.replace(/\D/g, ''),
        email: formData.email,
        active: true
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na API ao salvar: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend] Cliente criado com sucesso:', data);
        setFormData({ nome: '', telefone: '', email: '', statusInicial: 'Ativo' });
        
        // Refresh list and KPIs
        fetchCustomers();
        
        // Close modal immediately
        setIsModalOpen(false);
        setIsEditing(false);
        setSelectedCustomerId(null);

        // Show floating Success Toast
        setSuccessToast(isEditing ? 'Cliente atualizado com sucesso' : 'Cliente salvo com sucesso');
        setTimeout(() => {
          setSuccessToast(null);
        }, 1800);
      })
      .catch(err => {
        console.error('[Frontend] Erro ao criar cliente:', err);
        setSaveError('Não foi possível salvar o cliente. Verifique se o backend está ativo.');
      })
      .finally(() => {
        setSaving(false);
      });
  };


  const ativos = customers.filter((c) => c.totalCompras > 0);
  const comPendencias = customers.filter((c) => c.valorAberto > 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const novosNoMes = customers.filter(c => {
    const created = new Date(c.createdAt);
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
  }).length;

  const filtered = customers.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search);
    const matchStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const aHasPending = a.valorAberto > 0;
    const bHasPending = b.valorAberto > 0;

    // 1. Clientes com pendência primeiro.
    if (aHasPending && !bHasPending) return -1;
    if (!aHasPending && bHasPending) return 1;

    if (aHasPending && bHasPending) {
      // 2. Dentro dos pendentes, maior valor em aberto primeiro.
      if (b.valorAberto !== a.valorAberto) {
        return b.valorAberto - a.valorAberto;
      }
    }

    // 3. Depois, última compra mais recente.
    return b.rawLastPurchaseTime - a.rawLastPurchaseTime;
  });

  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes cadastrados${loading ? ' (carregando...)' : ''}`}
        action={
          <button
            id="novo-cliente-btn"
            onClick={() => {
              setIsEditing(false);
              setSelectedCustomerId(null);
              setFormData({ nome: '', telefone: '', email: '', statusInicial: 'Ativo' });
              setSaveError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E, #107540)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Novo Cliente
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Clientes', value: `${customers.length}`, icon: Users, color: '#7C5CBF', bg: '#EDE8F8' },
          { label: 'Clientes Ativos', value: `${ativos.length}`, icon: UserCheck, color: '#1DB86E', bg: '#EDFAF3' },
          { label: 'Com Pendências', value: `${comPendencias.length}`, icon: AlertCircle, color: '#E05252', bg: '#FEECEC' },
          { label: 'Novos no Mês', value: `${novosNoMes}`, icon: UserPlus, color: '#C9A84C', bg: '#F5E6B8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover relative overflow-hidden flex items-center gap-3 py-3.5 px-3.5 group">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />
            <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105" style={{ background: bg }}>
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
            id="clientes-search"
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-card border border-graphite-200 rounded-xl text-sm text-graphite-800 placeholder-graphite-300 hover:border-graphite-300 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all duration-200 ease-out"
          />
        </div>
        <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-graphite-200 flex-shrink-0 overflow-x-auto max-w-full">
          {['Todos', 'Ativo', 'Pendente', 'Em atraso'].map((s) => (
            <button
              key={s}
              id={`cli-filtro-${s.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.97] whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-graphite-500 hover:text-graphite-850 hover:bg-graphite-50/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Client List ── */}
      <div className="card p-0 overflow-hidden">
        {/* Desktop header */}
        <div className="hidden lg:grid lg:grid-cols-[52fr_12fr_12fr_12fr_12fr_10fr] gap-x-4 px-5 py-2 bg-graphite-100/90 border-b border-graphite-200/60 text-[10px] font-bold text-graphite-600 uppercase tracking-widest">
          <span>Cliente</span>
          <span className="text-center">Telefone</span>
          <span className="text-center">Última Compra</span>
          <span className="text-right">Em Aberto</span>
          <span className="text-center">Status</span>
          <span className="text-center">Ações</span>
        </div>

        <div className="flex flex-col divide-y divide-graphite-50">
          {loading ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Carregando clientes...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm font-medium">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Nenhum cliente encontrado.</div>
          ) : filtered.map((c) => (
            <div
              key={c.id}
              className="relative px-5 py-1.5 hover:bg-graphite-100/50 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] rounded-xl transition-all duration-200 cursor-pointer group"
            >
              {/* Left active green indicator pill */}
              <div className="absolute left-0.5 top-1 bottom-1 w-[3px] bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

              {/* Mobile card */}
              <div className="lg:hidden flex items-center gap-3">
                <div className="avatar text-sm flex-shrink-0 font-bold" style={{ background: c.color }}>{c.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite-800 truncate">{c.nome}</p>
                  <p className="text-xs text-graphite-400">{c.telefone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={c.status} />
                    {c.valorAberto > 0 && (
                      <span className="text-xs font-bold text-danger">{formatCurrency(c.valorAberto)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-graphite-400">Última</p>
                  <p className="text-xs font-medium text-graphite-700">{c.ultimaCompra}</p>
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEditCustomerClick(c); }} className="p-1 text-graphite-400 hover:text-brand bg-graphite-100 rounded-md">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomerClick(c); }} className="p-1 text-graphite-400 hover:text-danger bg-danger-light/30 rounded-md">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop row */}
              <div className="hidden lg:grid lg:grid-cols-[52fr_12fr_12fr_12fr_12fr_10fr] gap-x-4 items-center w-full">
                {/* Column 1 (CLIENTE) - avatar + text grouped with gap-2 */}
                <div className="flex items-center gap-2 min-w-0 lg:col-span-1 self-center">
                  <div className="avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 font-bold" style={{ background: c.color }}>
                    {c.initials}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-sm font-bold text-graphite-900 truncate">{c.nome}</p>
                    <p className="text-[10.5px] text-graphite-400/80 font-normal mt-0.5 truncate">
                      {c.totalCompras} compra{c.totalCompras !== 1 ? 's' : ''}
                      {c.valorAberto > 0 && (
                        <>
                          <span className="text-graphite-300"> • </span>
                          <span className="text-graphite-400/70 font-normal">Em aberto: </span>
                          <span className="text-danger font-semibold">{formatCurrency(c.valorAberto)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Column 2 (TELEFONE) */}
                <p className="hidden lg:block text-[11px] text-graphite-500 font-medium text-center self-center whitespace-nowrap">
                  {c.telefone}
                </p>
                
                {/* Column 3 (ÚLTIMA COMPRA) */}
                <p className="hidden lg:block text-[11px] text-graphite-500 font-medium text-center self-center whitespace-nowrap">
                  {c.ultimaCompra}
                </p>

                {/* Column 4 (EM ABERTO) */}
                <p className={`hidden lg:block text-[13.5px] font-semibold text-right self-center ${c.valorAberto > 0 ? 'text-danger' : 'text-graphite-300'}`}>
                  {c.valorAberto > 0 ? formatCurrency(c.valorAberto) : '—'}
                </p>

                {/* Column 5 (STATUS) */}
                <div className="hidden lg:flex justify-center items-center self-center">
                  <StatusBadge status={c.status} />
                </div>

                {/* Column 6 (AÇÕES) */}
                <div className="hidden lg:flex justify-center items-center gap-2 self-center flex-shrink-0">
                  <button
                    title="Editar"
                    onClick={(e) => { e.stopPropagation(); handleEditCustomerClick(c); }}
                    className="p-1.5 text-graphite-400 hover:text-brand hover:bg-graphite-100 rounded-lg transition-colors duration-150"
                  >
                    <Edit2 size={13} strokeWidth={2.2} />
                  </button>
                  <button
                    title="Excluir"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCustomerClick(c); }}
                    className="p-1.5 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors duration-150"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
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
          if (!saving) {
            setIsModalOpen(false);
            setSaveError(null);
          }
        }}
        title={isEditing ? "Editar Cliente" : "Novo Cliente"}
        subtitle={isEditing ? "Altere as informações do cliente" : "Cadastre um novo cliente para a base do módulo comercial"}
        footer={
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setIsModalOpen(false);
                setSaveError(null);
              }}
              className="px-4 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-bold text-graphite-500 hover:text-graphite-800 hover:border-graphite-300 hover:bg-graphite-50/50 shadow-sm transition-all duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-[0_4px_12px_rgba(29,184,110,0.15)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>
          </>
        }
      >
        <form className="flex flex-col gap-4.5" onSubmit={handleSave}>
          {saveError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium">
              {saveError}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
            <input 
              type="text" 
              placeholder="Ex: Ana Paula Rocha"
              className="form-input"
              value={formData.nome}
              onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Telefone</label>
              <input 
                type="text" 
                placeholder="Ex: (11) 99823-4512"
                className="form-input"
                value={formData.telefone}
                onChange={e => setFormData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">E-mail</label>
              <input 
                type="email" 
                placeholder="Ex: ana.paula@email.com"
                className="form-input"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Status Inicial</label>
            <select 
              className="form-select"
              value={formData.statusInicial}
              onChange={e => setFormData(prev => ({ ...prev, statusInicial: e.target.value }))}
              disabled={saving}
            >
              <option value="Ativo">Ativo</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir Cliente"
        subtitle="Confirme a exclusão permanente do cliente do sistema"
        footer={
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCustomerToDelete(null);
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
              {deleting ? 'Excluindo...' : 'Excluir Cliente'}
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
            Tem certeza que deseja excluir o cliente <strong className="text-graphite-800">"{customerToDelete?.nome}"</strong>? Esta ação não poderá ser desfeita.
          </p>
        </div>
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

    </div>
  );
}

