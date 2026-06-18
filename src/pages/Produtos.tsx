import { useState, useEffect } from 'react';
import { Package, Plus, Search, SlidersHorizontal, Boxes, Trophy, DollarSign, ShoppingCart, Edit2, Trash2 } from 'lucide-react';

import { formatCurrency } from '../data/mockData';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const formatBRL = (value: string) => {
  const digits = value.replace(/\D/g, '');
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
  if (status === 'Ativo') {
    return (
      <span className="badge-success w-24 justify-center px-1.5 py-0.5 font-bold text-[10px] leading-none tracking-wide text-center whitespace-nowrap">
        {status}
      </span>
    );
  }
  if (status === 'Estoque Baixo') {
    return (
      <span className="badge-warning w-24 justify-center px-1.5 py-0.5 font-bold text-[10px] leading-none tracking-wide text-center whitespace-nowrap">
        {status}
      </span>
    );
  }
  return (
    <span className="badge-danger w-24 justify-center px-1.5 py-0.5 font-bold text-[10px] leading-none tracking-wide text-center whitespace-nowrap">
      {status}
    </span>
  );
}

export default function Produtos() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Eletrônicos',
    price: '',
    stock: '0',
    minStock: '0'
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit and Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const handleEditProductClick = (product: any) => {
    setSelectedProductId(product.id);
    setIsEditing(true);
    const priceCents = (product.preco * 100).toFixed(0);
    setFormData({
      name: product.nome,
      category: product.categoria,
      price: formatBRL(priceCents),
      stock: String(product.estoque),
      minStock: String(product.minimo)
    });
    setSaveError(null);
    setIsModalOpen(true);

  };

  const handleDeleteProductClick = (product: any) => {
    setProductToDelete(product);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/products/${productToDelete.id}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao excluir produto: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        fetchProducts();
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        setSuccessToast('Produto excluído com sucesso');
        setTimeout(() => {
          setSuccessToast(null);
        }, 1800);
      })


      .catch((err) => {
        console.error('[Frontend] Erro ao excluir produto:', err);
        setDeleteError(err.message || 'Não foi possível excluir o produto.');
      })
      .finally(() => {
        setDeleting(false);
      });
  };


  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/products')
      .then(res => {
        console.log('[Frontend] Resposta de /products status:', res.status);
        if (!res.ok) {
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend] Payload recebido de /products:', data);
        if (!Array.isArray(data)) {
          console.error('[Frontend] Erro: Dados não são um array', data);
          setError('Os dados retornados pelo servidor estão em formato incorreto.');
          setLoading(false);
          return;
        }

        const mappedProducts = data.map((p: any) => {
          const sku = p.sku || '1001';
          const category = p.category || 'Sem Categoria';
          const stock = p.stockQuantity ?? 0;
          const minStock = p.minStock ?? 0;
          let status = 'Ativo';
          if (stock < 0) {
            status = 'Sob encomenda';
          } else if (stock <= minStock) {
            status = 'Estoque Baixo';
          }
          const totalVendido = p.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

          return {
            id: p.id,
            cod: sku,
            nome: p.name,
            categoria: category,
            estoque: stock,
            minimo: minStock,
            preco: Number(p.salePrice || 0),
            status,
            totalVendido
          };

        });

        console.log('[Frontend] Produtos mapeados:', mappedProducts);
        setProducts(mappedProducts);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] Erro ao buscar produtos:', err);
        setError('Não foi possível carregar os produtos. Verifique se o servidor backend está ativo.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setSaveError('O nome do produto é obrigatório.');
      return;
    }
    if (!formData.category) {
      setSaveError('A categoria é obrigatória.');
      return;
    }
    if (!formData.price) {
      setSaveError('O preço é obrigatório.');
      return;
    }
    if (formData.stock === '') {
      setSaveError('O estoque é obrigatório.');
      return;
    }
    if (formData.minStock === '') {
      setSaveError('O estoque mínimo é obrigatório.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload = {
      name: formData.name,
      category: formData.category,
      salePrice: parseBRLToNumber(formData.price),
      stockQuantity: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      active: true
    };

    const url = isEditing
      ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/products/${selectedProductId}`
      : (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/products';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na API ao salvar produto: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend] Produto salvo com sucesso:', data);
        setFormData({
          name: '',
          category: 'Eletrônicos',
          price: '',
          stock: '0',
          minStock: '0'
        });
        
        // Refresh list
        fetchProducts();

        // Close modal immediately
        setIsModalOpen(false);
        setIsEditing(false);
        setSelectedProductId(null);

        // Show Success Toast outside
        setSuccessToast(isEditing ? 'Produto atualizado com sucesso' : 'Produto salvo com sucesso');
        setTimeout(() => {
          setSuccessToast(null);
        }, 1800);
      })

      .catch(err => {
        console.error('[Frontend] Erro ao salvar produto:', err);
        setSaveError('Não foi possível salvar o produto. Verifique se o backend está ativo.');
      })
      .finally(() => {
        setSaving(false);
      });
  };


  const valorEstoque = products.reduce((s, p) => s + (p.estoque > 0 ? p.estoque * p.preco : 0), 0);
  const totalProdutosVendidos = products.reduce((sum, p) => sum + p.totalVendido, 0);
  const categorias = ['Todas', ...Array.from(new Set(products.map((p) => p.categoria)))];

  let maisVendido = '—';
  let maxVendas = 0;
  products.forEach(p => {
    if (p.totalVendido > maxVendas) {
      maxVendas = p.totalVendido;
      maisVendido = p.nome;
    }
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || String(p.cod).toLowerCase().includes(search.toLowerCase());
    const matchCat = categoria === 'Todas' || p.categoria === categoria;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    const aNum = parseInt(String(a.cod).replace(/\D/g, ''), 10) || 0;
    const bNum = parseInt(String(b.cod).replace(/\D/g, ''), 10) || 0;
    return aNum - bNum;
  });

  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos cadastrados${loading ? ' (carregando...)' : ''}`}
        action={
          <button
            id="novo-produto-btn"
            onClick={() => {
              setIsEditing(false);
              setSelectedProductId(null);
              setFormData({
                name: '',
                category: 'Eletrônicos',
                price: '',
                stock: '0',
                minStock: '0'
              });
              setSaveError(null);
              setIsModalOpen(true);

            }}

            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E, #107540)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Novo Produto
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Produtos', value: `${products.length}`, icon: Boxes, color: '#7C5CBF', bg: '#EDE8F8' },
          { label: 'Produtos Vendidos', value: `${totalProdutosVendidos} itens`, icon: ShoppingCart, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Mais Vendido', value: maisVendido, icon: Trophy, color: '#C9A84C', bg: '#F5E6B8' },
          { label: 'Valor em Estoque', value: formatCurrency(valorEstoque), icon: DollarSign, color: '#1DB86E', bg: '#EDFAF3' },
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
            id="produtos-search"
            type="text"
            placeholder="Buscar produto ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-card border border-graphite-200 rounded-xl text-sm text-graphite-800 placeholder-graphite-300 hover:border-graphite-300 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all duration-200 ease-out"
          />
        </div>
        <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-graphite-200 flex-shrink-0 overflow-x-auto max-w-full">
          {categorias.map((cat) => (
            <button
              key={cat}
              id={`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setCategoria(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.97] whitespace-nowrap ${
                categoria === cat
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-graphite-500 hover:text-graphite-850 hover:bg-graphite-50/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button id="produtos-filtros-btn" className="flex items-center gap-1.5 px-3 py-2 bg-bg-card border border-graphite-200 rounded-xl text-xs font-semibold text-graphite-500 hover:border-graphite-300 hover:bg-graphite-50/50 active:scale-[0.97] transition-all duration-200 ease-out flex-shrink-0">
          <SlidersHorizontal size={13} /> Filtros
        </button>
      </div>

      {/* ── Product List ── */}
      <div className="card p-0 overflow-hidden">
        {/* Desktop header */}
        <div className="hidden lg:grid grid-cols-[42fr_14fr_12fr_12fr_12fr_10fr] items-center gap-x-4 px-5 py-2 bg-graphite-100/90 border-b border-graphite-200/60 text-[10px] font-bold text-graphite-600 uppercase tracking-widest">
          <span>Produto</span>
          <span className="text-center">Categoria</span>
          <span className="text-center">Estoque</span>
          <span className="text-right">Preço</span>
          <span className="text-center">Status</span>
          <span className="text-center">Ações</span>
        </div>

        <div className="flex flex-col divide-y divide-graphite-50">
          {loading ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Carregando produtos...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm font-medium">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-graphite-400 text-sm">Nenhum produto encontrado.</div>
          ) : filtered.map((p) => {
            const isNegative = p.estoque < 0;
            const pct = isNegative ? 0 : Math.min(100, (p.estoque / (p.minimo || 1)) * 100);
            const barColor = isNegative ? '#E05252' : (pct < 20 ? '#E05252' : pct < 50 ? '#E08C2D' : '#1DB86E');

            return (
              <div
                key={p.cod}
                className="relative flex lg:grid lg:grid-cols-[42fr_14fr_12fr_12fr_12fr_10fr] items-center gap-x-4 px-5 py-1.5 hover:bg-graphite-100/50 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] rounded-xl transition-all duration-200 cursor-pointer group"
              >
                {/* Left active green indicator pill */}
                <div className="absolute left-0.5 top-1 bottom-1 w-[3px] bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

                {/* Mobile layout */}
                <div className="flex items-center gap-3 flex-1 lg:contents">
                  {/* Inside Column 1 on desktop (PRODUTO) - Icon + text grouped to reduce distance */}
                  <div className="flex items-center gap-2 min-w-0 lg:col-span-1 self-center">
                    <div className="w-8 h-8 rounded-xl bg-graphite-100/70 border border-graphite-200/60 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-graphite-400" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="text-sm font-bold text-graphite-900 truncate">{p.nome}</p>
                      <p className="text-[10.5px] text-graphite-400 font-medium mt-0.5 truncate">#{p.cod}<span className="lg:hidden"> • {p.categoria}</span></p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 lg:contents">
                    {/* Column 2 (CATEGORIA) */}
                    <div className="hidden lg:flex justify-center items-center self-center">
                      <span className="text-[11px] text-graphite-500 bg-graphite-100/55 px-2.5 py-0.5 rounded-lg font-medium whitespace-nowrap">{p.categoria}</span>
                    </div>
                    
                    {/* Column 3 (ESTOQUE) */}
                    <div className="hidden lg:flex flex-col items-center justify-center flex-shrink-0 leading-tight self-center">
                      <span className="text-sm font-bold" style={{ color: barColor }}>{p.estoque}</span>
                      <span className="text-[10px] text-graphite-400 font-medium">mín. {p.minimo}</span>
                    </div>

                    {/* Column 4 (PREÇO) */}
                    <p className="hidden lg:block text-sm font-bold text-graphite-900 text-right self-center">{formatCurrency(p.preco)}</p>

                    {/* Column 5 (STATUS) */}
                    <div className="hidden lg:flex justify-center items-center self-center">
                      <StatusBadge status={p.status} />
                    </div>

                    {/* Column 6 (AÇÕES) */}
                    <div className="hidden lg:flex justify-center items-center gap-2 self-center flex-shrink-0">
                      <button
                        title="Editar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProductClick(p);
                        }}
                        className="p-1.5 text-graphite-400 hover:text-brand hover:bg-graphite-100 rounded-lg transition-colors duration-150"
                      >
                        <Edit2 size={13} strokeWidth={2.2} />
                      </button>
                      <button
                        title="Excluir"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProductClick(p);
                        }}
                        className="p-1.5 text-graphite-400 hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors duration-150"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile right */}
                <div className="lg:hidden text-right flex-shrink-0 ml-3 flex flex-col gap-1 items-end">
                  <p className="text-sm font-bold text-graphite-900">{formatCurrency(p.preco)}</p>
                  <StatusBadge status={p.status} />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProductClick(p);
                      }}
                      className="p-1 text-graphite-400 hover:text-brand bg-graphite-100 rounded-md"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProductClick(p);
                      }}
                      className="p-1 text-graphite-400 hover:text-danger bg-danger-light/30 rounded-md"
                    >
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
          if (!saving) {
            setIsModalOpen(false);
            setSaveError(null);
          }
        }}

        title={isEditing ? "Editar Produto" : "Novo Produto"}
        subtitle={isEditing ? "Altere as informações do produto no inventário" : "Cadastre um novo produto no inventário do sistema"}
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
              onClick={handleSaveProduct}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-[0_4px_12px_rgba(29,184,110,0.15)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Produto'}
            </button>
          </>
        }
      >

        <form className="flex flex-col gap-4.5" onSubmit={handleSaveProduct}>
          {saveError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium">
              {saveError}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Nome do Produto</label>
            <input 
              type="text" 
              placeholder="Ex: Teclado Mecânico RGB"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Categoria</label>
            <select 
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              disabled={saving}
              required
            >
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Acessórios">Acessórios</option>
              <option value="Periféricos">Periféricos</option>
              <option value="Papelaria">Papelaria</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Preço (R$)</label>
              <input 
                type="text" 
                placeholder="R$ 0,00"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: formatBRL(e.target.value) }))}
                disabled={saving}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Estoque</label>
              <input 
                type="number" 
                placeholder="0"
                className="form-input"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                disabled={saving}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10.5px] font-bold text-graphite-500 uppercase tracking-widest mb-1.5 block">Mínimo</label>
              <input 
                type="number" 
                placeholder="0"
                className="form-input"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                disabled={saving}
                required
              />
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
            setProductToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir Produto"
        subtitle="Confirme a exclusão permanente do produto do sistema"
        footer={
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProductToDelete(null);
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
              {deleting ? 'Excluindo...' : 'Excluir Produto'}
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
            Tem certeza que deseja excluir o produto <strong className="text-graphite-800">"{productToDelete?.nome}"</strong>? Esta ação não poderá ser desfeita.
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


