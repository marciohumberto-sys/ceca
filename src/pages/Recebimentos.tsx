import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Wallet, CalendarClock, AlertTriangle, CheckCircle2, Check, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

export default function Recebimentos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReceivableId, setSelectedReceivableId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [receivableToDelete, setReceivableToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    description: '',
    dueDate: '',
    amount: '',
    status: 'pendente',
    paymentMethod: 'Pix',
    observations: ''
  });

  const fetchCustomers = () => {
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(err => console.error('[Frontend] Erro ao buscar clientes:', err));
  };


  const fetchReceivables = () => {
    console.log('[Frontend] Iniciando requisição para /receivables...');
    setError(null);
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/receivables')
      .then(res => {
        console.log('[Frontend] Resposta de /receivables status:', res.status);
        if (!res.ok) {
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend] Payload recebido de /receivables:', data);
        if (!Array.isArray(data)) {
          console.error('[Frontend] Erro: Dados não são um array', data);
          setError('Os dados retornados pelo servidor estão em formato incorreto.');
          setLoading(false);
          return;
        }

        const mappedReceivables = data.map((r: any) => {
          const cliente = r.customerName || 'Cliente Não Informado';
          const initials = cliente.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
          const color = colors[cliente.length % colors.length];

          let status = 'Pendente';
          let diasAtraso = 0;

          if (r.status === 'pago') {
            status = 'Pago';
          } else {
            const due = new Date(r.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);
            
            if (due.getTime() === today.getTime()) {
              status = 'Hoje';
            } else if (due < today) {
              status = 'Atrasado';
              const diffTime = today.getTime() - due.getTime();
              diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
              status = 'Pendente';
            }
          }

          return {
            id: 'REC-' + r.id.substring(0, 5).toUpperCase(),
            originalId: r.id,
            customerId: r.customerId,
            cliente,
            initials,
            color,
            vencimento: new Date(r.dueDate).toLocaleDateString('pt-BR'),
            rawDueDate: r.dueDate.split('T')[0],
            parcela: r.description || 'À vista',
            valor: Number(r.amount || 0),
            diasAtraso,
            status,
            paidAt: r.paidAt,
            rawStatus: r.status,
            paymentMethod: r.paymentMethod || 'Pix',
            observations: r.observations || ''
          };
        });

        console.log('[Frontend] Recebimentos mapeados:', mappedReceivables);
        setReceivables(mappedReceivables);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] Erro ao buscar recebimentos:', err);
        setError('Não foi possível carregar os recebimentos. Verifique se o servidor backend está ativo.');
        setLoading(false);
      });
  };

  const handleToggleStatus = async (originalId: string) => {
    try {
      console.log(`[Frontend] Alternando status do recebimento originalId: ${originalId}`);
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/receivables/${originalId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Erro ao atualizar recebimento: ${res.status}`);
      }

      console.log('[Frontend] Status do recebimento alternado com sucesso no backend.');
      fetchReceivables();
    } catch (err) {
      console.error('[Frontend] Erro ao alternar status do recebimento:', err);
      alert('Ocorreu um erro ao alternar o status do recebimento.');
    }
  };

  const handleEditReceivableClick = (r: any) => {
    setSelectedReceivableId(r.originalId);
    setIsEditing(true);
    setFormData({
      customerId: r.customerId || '',
      customerName: r.cliente,
      description: r.parcela,
      dueDate: r.rawDueDate,
      amount: r.valor.toString(),
      status: r.rawStatus,
      paymentMethod: r.paymentMethod,
      observations: r.observations
    });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDeleteReceivableClick = (r: any) => {
    setReceivableToDelete(r);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!receivableToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/receivables/${receivableToDelete.originalId}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao excluir recebimento: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchReceivables();
        setIsDeleteModalOpen(false);
        setReceivableToDelete(null);
        setSuccessToast('Recebimento excluído com sucesso');
        setTimeout(() => setSuccessToast(null), 1800);
      })
      .catch((err) => {
        console.error('[Frontend] Erro ao excluir recebimento:', err);
        setDeleteError(err.message || 'Não foi possível excluir o recebimento.');
      })
      .finally(() => setDeleting(false));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount || !formData.dueDate) {
      setSaveError('Cliente, Valor e Vencimento são obrigatórios.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/receivables/${selectedReceivableId}`
      : (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/receivables';
    const method = isEditing ? 'PUT' : 'POST';

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    const customerName = selectedCustomer ? selectedCustomer.name : formData.customerName;

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        customerName
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar');
        return res.json();
      })
      .then(() => {
        fetchReceivables();
        setIsModalOpen(false);
        setIsEditing(false);
        setSelectedReceivableId(null);
        setSuccessToast(isEditing ? 'Recebimento atualizado com sucesso' : 'Recebimento registrado com sucesso');
        setTimeout(() => setSuccessToast(null), 1800);
      })
      .catch(() => setSaveError('Erro ao salvar. Verifique se o backend está ativo.'))
      .finally(() => setSaving(false));
  };

  useEffect(() => {
    fetchReceivables();
    fetchCustomers();
  }, []);

  const totalReceber = receivables
    .filter((r) => r.status !== 'Pago')
    .reduce((s, r) => s + r.valor, 0);

  const atrasados = receivables.filter((r) => r.diasAtraso > 0 && r.status !== 'Pago');
  const hoje = receivables.filter((r) => r.status === 'Hoje');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const recebidoMes = receivables
    .filter((r) => {
      const isPaid = r.status === 'Pago';
      if (!isPaid) return false;
      const paidDate = r.paidAt ? new Date(r.paidAt) : new Date();
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((s, r) => s + r.valor, 0);

  const filtered = receivables.filter((r) => {
    const isPaid = r.status === 'Pago';
    const statusText = isPaid ? 'Pago' : r.status;

    const matchSearch = r.cliente.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    
    let matchStatus = false;
    if (statusFilter === 'Todos') {
      matchStatus = true;
    } else if (statusFilter === 'Pendente') {
      matchStatus = statusText === 'Pendente';
    } else if (statusFilter === 'Atrasado') {
      matchStatus = statusText === 'Atrasado';
    } else if (statusFilter === 'Hoje') {
      matchStatus = statusText === 'Hoje';
    }

    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Recebimentos"
        subtitle={`${receivables.length} títulos cadastrados${loading ? ' (carregando...)' : ''}`}
        action={
          <button
            id="novo-recebimento-btn"
            onClick={() => {
              setIsEditing(false);
              setSelectedReceivableId(null);
              setFormData({
                customerId: '',
                customerName: '',
                description: '',
                dueDate: '',
                amount: '',
                status: 'pendente',
                paymentMethod: 'Pix',
                observations: ''
              });
              setSaveError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Novo Recebimento
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'A Receber', value: formatCurrency(totalReceber), icon: Wallet, color: '#7C5CBF', bg: '#EDE8F8' },
          { label: 'Vencem Hoje', value: `${hoje.length} título${hoje.length !== 1 ? 's' : ''}`, icon: CalendarClock, color: '#E08C2D', bg: '#FEF3E2' },
          { label: 'Em Atraso', value: `${atrasados.length} título${atrasados.length !== 1 ? 's' : ''}`, icon: AlertTriangle, color: '#E05252', bg: '#FEECEC' },
          { label: 'Recebidos no Mês', value: formatCurrency(recebidoMes), icon: CheckCircle2, color: '#1DB86E', bg: '#EDFAF3' },
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
            id="recebimentos-search"
            type="text"
            placeholder="Buscar cliente ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-card border border-graphite-200 rounded-xl text-sm text-graphite-800 placeholder-graphite-300 hover:border-graphite-300 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all duration-200 ease-out"
          />
        </div>
        <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-graphite-200 flex-shrink-0">
          {['Todos', 'Hoje', 'Atrasado', 'Pendente'].map((s) => (
            <button
              key={s}
              id={`rec-filtro-${s.toLowerCase()}`}
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
        <button id="rec-filtros-btn" className="flex items-center gap-1.5 px-3 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-semibold text-graphite-500 hover:border-graphite-300 transition-colors flex-shrink-0">
          <SlidersHorizontal size={13} /> Filtros
        </button>
      </div>

      {/* ── List ── */}
      <div className="card p-0 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2.25rem_50fr_11fr_11fr_12fr_12fr_10fr] items-center gap-x-4 px-5 py-2 bg-graphite-100/90 border-b border-graphite-200/60 text-[10px] font-bold text-graphite-600 uppercase tracking-widest">
          <span />
          <span>Cliente</span>
          <span className="text-center">Parcela</span>
          <span>Vencimento</span>
          <span className="text-right">Valor</span>
          <span className="text-center">Status</span>
          <span className="text-center">Ações</span>
        </div>

        <div className="flex flex-col divide-y divide-graphite-50">
          {loading ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Carregando recebimentos...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm font-medium">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Nenhum recebimento encontrado.</div>
          ) : filtered.map((r) => {
            const isPago = r.status === 'Pago';
            return (
              <div
                key={r.id}
                className={`relative flex lg:grid lg:grid-cols-[2.25rem_50fr_11fr_11fr_12fr_12fr_10fr] items-center gap-x-4 px-5 py-1.5 hover:bg-graphite-100/50 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] rounded-xl transition-all duration-200 cursor-pointer group ${isPago ? 'opacity-55' : ''}`}
              >
                {/* Left active green indicator pill */}
                <div className="absolute left-0.5 top-1 bottom-1 w-[3px] bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

                {/* Mobile layout */}
                <div className="flex items-center gap-3 flex-1 lg:contents">
                  <div className="avatar text-xs flex-shrink-0 font-bold" style={{ background: isPago ? '#B8BFCC' : r.color }}>{r.initials}</div>
                  <div className="flex-1 min-w-0 lg:contents">
                    <div className="lg:flex lg:flex-col lg:min-w-0 leading-tight self-center">
                      <p className={`text-sm font-bold truncate ${isPago ? 'line-through text-graphite-400 font-semibold' : 'text-graphite-900'}`}>{r.cliente}</p>
                      <p className="text-[11px] text-graphite-400 font-medium mt-0.5 truncate lg:hidden">Parcela {r.parcela}</p>
                    </div>
                    <span className="hidden lg:block text-[11px] text-graphite-500 font-semibold tracking-wide text-center self-center">{r.parcela}</span>
                    <div className="hidden lg:flex flex-col items-start flex-shrink-0 leading-tight self-center">
                      {r.diasAtraso > 0 && !isPago && (
                        <span className="badge-danger mb-0.5 px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">{r.diasAtraso}d atraso</span>
                      )}
                      {r.status === 'Hoje' && !r.diasAtraso && !isPago && (
                        <span className="badge-warning mb-0.5 px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">Vence Hoje</span>
                      )}
                      {isPago && (
                        <span className="badge-success mb-0.5 px-2.5 py-1 font-bold text-[10.5px] leading-none tracking-wide">Pago</span>
                      )}
                      <p className="text-[11px] text-graphite-500 font-medium">{r.vencimento}</p>
                    </div>
                    <p className="hidden lg:block text-sm font-bold text-graphite-900 text-right self-center">{formatCurrency(r.valor)}</p>
                    <div className="hidden lg:flex justify-center items-center self-center">
                      <button
                        id={`marcar-pago-${r.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(r.originalId);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all duration-150 flex-shrink-0 leading-none whitespace-nowrap tracking-wide ${
                          isPago
                            ? 'bg-brand-50 border-brand-100 text-brand-700'
                            : 'bg-bg-card border-graphite-200/80 text-graphite-500 hover:border-brand/80 hover:text-brand hover:bg-brand-50/50 shadow-sm'
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
                        {isPago ? 'Desfazer' : 'Marcar pago'}
                      </button>
                    </div>
                    {/* Ações (Desktop) */}
                    <div className="hidden lg:flex justify-center items-center gap-2 self-center flex-shrink-0">
                      <button
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); handleEditReceivableClick(r); }}
                        className="p-1.5 text-graphite-400 hover:text-brand hover:bg-graphite-100 rounded-lg transition-colors duration-150"
                      >
                        <Edit2 size={13} strokeWidth={2.2} />
                      </button>
                      <button
                        title="Excluir"
                        onClick={(e) => { e.stopPropagation(); handleDeleteReceivableClick(r); }}
                        className="p-1.5 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors duration-150"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Mobile right */}
                <div className="lg:hidden text-right flex-shrink-0 ml-3 flex flex-col gap-1 items-end">
                  <p className="text-sm font-bold text-graphite-900">{formatCurrency(r.valor)}</p>
                  <button
                    id={`marcar-pago-mob-${r.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(r.originalId);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all duration-150 flex-shrink-0 whitespace-nowrap mb-1 ${
                      isPago
                        ? 'bg-brand-50 border-brand-100 text-brand-700'
                        : 'bg-bg border-graphite-200 text-graphite-500 hover:border-brand'
                    }`}
                  >
                    {isPago ? 'Desfazer' : 'Pagar'}
                  </button>
                  <div className="flex gap-1.5 mt-auto">
                    <button onClick={(e) => { e.stopPropagation(); handleEditReceivableClick(r); }} className="p-1 text-graphite-400 hover:text-brand bg-graphite-100 rounded-md">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteReceivableClick(r); }} className="p-1 text-graphite-400 hover:text-danger bg-danger-light/30 rounded-md">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!saving) setIsModalOpen(false);
        }}
        title={isEditing ? "Editar Recebimento" : "Novo Recebimento"}
        subtitle={isEditing ? "Altere os dados deste título de recebimento" : "Lance uma nova parcela ou título de recebimento comercial"}
        footer={
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsModalOpen(false)}
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
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Lançar Título'}
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
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Cliente</label>
            <select 
              className="form-select"
              value={formData.customerId}
              onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              disabled={saving}
            >
              <option value="">Selecione um cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Parcela / Detalhes</label>
              <input 
                type="text" 
                placeholder="Ex: 2/3 ou À vista"
                className="form-input"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Data de Vencimento</label>
              <input 
                type="date" 
                className="form-input"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Valor do Título (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0,00"
                className="form-input"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Status Inicial</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                disabled={saving}
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setReceivableToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir Recebimento"
        subtitle="Confirme a exclusão permanente deste recebimento"
        footer={
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setReceivableToDelete(null);
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
              {deleting ? 'Excluindo...' : 'Excluir Recebimento'}
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
            Tem certeza que deseja excluir este recebimento de <strong className="text-graphite-800">{receivableToDelete?.cliente}</strong> no valor de <strong className="text-graphite-800">{receivableToDelete ? formatCurrency(receivableToDelete.valor) : ''}</strong>? Esta ação não poderá ser desfeita.
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

