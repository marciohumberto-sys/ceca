import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../data/mockData';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'Pago') return <span className="badge-success">{status}</span>;
  if (status === 'Atrasado') return <span className="badge-danger">{status}</span>;
  return <span className="badge-warning">{status}</span>;
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, change, icon: Icon, accentColor, accentBg, isCurrency = true,
}: {
  label: string; value: number; change: number;
  icon: React.ElementType; accentColor: string; accentBg: string; isCurrency?: boolean;
}) {
  const isPositive = change >= 0;
  return (
    <div className="kpi-card relative overflow-hidden group">
      {/* accent line top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accentColor }} />

      <div className="flex items-start justify-between pt-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: accentBg }}
        >
          <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-success-light text-brand-700' : 'bg-danger-light text-danger'}`}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(change)}%
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-graphite-900 tracking-tight leading-none">
          {isCurrency ? formatCurrency(value) : value}
        </p>
        <p className="text-xs text-graphite-400 mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-graphite-800">{title}</h2>
      <Link to={to} className="flex items-center gap-1 text-xs text-brand font-semibold hover:underline transition-opacity hover:opacity-80">
        Ver tudo <ChevronRight size={13} />
      </Link>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [resumo, setResumo] = useState<any>(null);
  const [latestSales, setLatestSales] = useState<any[]>([]);
  const [receivablesToday, setReceivablesToday] = useState<any[]>([]);
  const [upcomingReceivables, setUpcomingReceivables] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);

  const loadDashboardData = () => {
    setLoading(true);
    setError(null);
    console.log('[Frontend] Iniciando busca dos dados do dashboard...');
    fetch((import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/dashboard')
      .then(res => {
        console.log('[Frontend] Resposta completa da API:', res);
        console.log('[Frontend] Status HTTP:', res.status);
        if (!res.ok) {
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend] Payload retornado da API:', data);
        if (!data.resumoFinanceiro) {
          throw new Error("resumoFinanceiro está indefinido no payload da API. O backend provavelmente está desatualizado.");
        }
        setKpis({
          vendasSemana: { value: data.vendasSemana, label: 'Vendas da Semana', change: +8.4 },
          vendasMes: { value: data.vendasMes, label: 'Vendas do Mês', change: +3.2 },
          recebimentosPendentes: { value: data.recebimentosPendentes, label: 'Recebimentos Pendentes', change: -2.1 },
          clientesAtraso: { value: data.clientesAtraso, label: 'Clientes com Pendência', change: +1 },
        });
        setResumo(data.resumoFinanceiro);
        setLatestSales(data.latestSales || []);
        setReceivablesToday(data.receivablesToday || []);
        setUpcomingReceivables(data.upcomingReceivables || []);
        setLowStockProducts(data.lowStockProducts || []);
        setTopSellingProducts(data.topSellingProducts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] Erro completo capturado no catch:', err);
        setError(`Falha ao carregar dashboard: ${err.message || err}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12">
        <p className="text-sm font-semibold text-graphite-400 animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  if (error || !kpis || !resumo) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12 flex-col gap-3">
        <p className="text-sm font-semibold text-red-500">{error || 'Erro desconhecido ao carregar os dados.'}</p>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const topSalesMax = topSellingProducts.length > 0 ? Math.max(...topSellingProducts.map((p) => p.vendas)) : 1;
  const metaPct = Math.min(100, (resumo.totalEntradas / (resumo.previsaoMes || 1)) * 100);

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI Grid ── */}
      <section aria-label="KPIs principais">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={kpis.vendasSemana.label} value={kpis.vendasSemana.value}
            change={kpis.vendasSemana.change} icon={ShoppingCart} accentColor="#1DB86E" accentBg="#EDFAF3" />
          <KpiCard label={kpis.vendasMes.label} value={kpis.vendasMes.value}
            change={kpis.vendasMes.change} icon={DollarSign} accentColor="#7C5CBF" accentBg="#EDE8F8" />
          <KpiCard label={kpis.recebimentosPendentes.label} value={kpis.recebimentosPendentes.value}
            change={kpis.recebimentosPendentes.change} icon={CreditCard} accentColor="#E08C2D" accentBg="#FEF3E2" />
          <KpiCard label={kpis.clientesAtraso.label} value={kpis.clientesAtraso.value}
            change={kpis.clientesAtraso.change} icon={AlertCircle} accentColor="#E05252" accentBg="#FEECEC" isCurrency={false} />
        </div>
      </section>

      {/* ── Main row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Últimas Vendas (2/3) */}
        <section className="lg:col-span-2 card" aria-label="Últimas vendas">
          <SectionHeader title="Últimas Vendas" to="/vendas" />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 lg:hidden">
            {latestSales.length === 0 ? (
              <div className="py-6 text-center text-graphite-400 text-xs font-medium">Nenhuma venda registrada.</div>
            ) : latestSales.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-graphite-50 border border-graphite-100 hover:border-graphite-200 transition-colors">
                <div className="avatar text-xs flex-shrink-0" style={{ background: v.color }}>{v.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite-800 truncate">{v.cliente}</p>
                  <p className="text-xs text-graphite-400">{v.data} · {v.itens} {v.itens === 1 ? 'item' : 'itens'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-graphite-900">{formatCurrency(v.valor)}</p>
                  <StatusBadge status={v.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-[2.25rem_4.8fr_1.5fr_1fr_1.2fr] gap-x-4 px-2 py-1.5 bg-graphite-100/60 border-b border-graphite-100 rounded-lg text-[10px] font-bold text-graphite-400 uppercase tracking-widest mb-1.5">
              <span />
              <span>Cliente / Pagamento</span>
              <span className="text-right">Valor</span>
              <span className="text-center">Itens</span>
              <span className="text-center">Status</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {latestSales.length === 0 ? (
                <div className="py-8 text-center text-graphite-400 text-sm">Nenhuma venda registrada.</div>
              ) : latestSales.map((v) => (
                <div
                  key={v.id}
                  className="relative grid grid-cols-[2.25rem_4.8fr_1.5fr_1fr_1.2fr] gap-x-4 items-center py-2 px-2 hover:bg-graphite-100/40 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  {/* Left active green indicator pill */}
                  <div className="absolute left-0.5 top-1 bottom-1 w-[3px] bg-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

                  <div className="avatar text-xs font-bold" style={{ background: v.color }}>{v.initials}</div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-sm font-bold text-graphite-900 truncate">{v.cliente}</p>
                    <p className="text-[11px] text-graphite-400 font-medium mt-0.5 truncate">{v.pagamento}</p>
                  </div>
                  <p className="text-sm font-semibold text-graphite-900 text-right self-center">{formatCurrency(v.valor)}</p>
                  <p className="text-[11px] text-graphite-400 font-medium text-center self-center">{v.itens}</p>
                  <div className="flex justify-center items-center">
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resumo Financeiro (1/3) */}
        <section className="card" aria-label="Resumo financeiro">
          <SectionHeader title="Resumo Financeiro" to="/relatorios" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-100 bg-brand-50">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={16} className="text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-graphite-500 font-medium">Entradas</p>
                <p className="text-base font-bold text-brand-700 truncate">{formatCurrency(resumo.totalEntradas)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-danger-light bg-danger-light">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <ArrowDownRight size={16} className="text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-graphite-500 font-medium">Saídas</p>
                <p className="text-base font-bold text-danger truncate">{formatCurrency(resumo.totalSaidas)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-graphite-100 bg-graphite-50">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Banknote size={16} className="text-graphite-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-graphite-500 font-medium">Saldo Líquido</p>
                <p className="text-base font-bold text-graphite-900 truncate">{formatCurrency(resumo.saldo)}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="pt-3 border-t border-graphite-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-graphite-600">Meta do Mês</span>
                <span className="text-xs font-bold text-brand">{Math.round(metaPct)}%</span>
              </div>
              <div className="w-full h-2 bg-graphite-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${metaPct}%`, background: 'linear-gradient(90deg, #38C985, #1DB86E)' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-graphite-400">Meta: {formatCurrency(resumo.previsaoMes)}</p>
                <p className="text-xs font-semibold text-graphite-500">{formatCurrency(resumo.totalEntradas)} atingidos</p>
              </div>
            </div>

            {/* Quick recebimentos de hoje */}
            <div className="pt-3 border-t border-graphite-100">
              <p className="text-xs font-bold text-graphite-700 mb-2">Vencendo Hoje</p>
              {receivablesToday.length === 0 ? (
                <div className="py-2 text-center text-graphite-400 text-xs font-medium">Nenhum recebimento hoje.</div>
              ) : receivablesToday.slice(0, 2).map((r) => (
                <div key={r.id} className="flex items-center gap-2 py-1.5">
                  <div className="avatar text-[10px] w-7 h-7" style={{ background: r.color }}>{r.initials}</div>
                  <p className="text-xs font-medium text-graphite-700 flex-1 truncate">{r.cliente}</p>
                  <span className={r.diasAtraso > 0 ? 'badge-danger' : 'badge-warning'}>
                    {r.diasAtraso > 0 ? `${r.diasAtraso}d` : 'Hoje'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Próximos Recebimentos */}
        <section className="card" aria-label="Próximos recebimentos">
          <SectionHeader title="Próximos Recebimentos" to="/recebimentos" />
          <div className="flex flex-col gap-3">
            {upcomingReceivables.length === 0 ? (
              <div className="py-8 text-center text-graphite-400 text-xs font-medium">Nenhum recebimento pendente.</div>
            ) : upcomingReceivables.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 group">
                <div className="avatar text-xs flex-shrink-0" style={{ background: r.color }}>{r.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite-800 truncate">{r.cliente}</p>
                  <p className="text-xs text-graphite-400">Vence {r.vencimento}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-graphite-900">{formatCurrency(r.valor)}</p>
                  {r.diasAtraso > 0
                    ? <span className="badge-danger">{r.diasAtraso}d atraso</span>
                    : r.status === 'Hoje'
                      ? <span className="badge-warning">Hoje</span>
                      : <span className="badge-neutral">Pendente</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reposição */}
        <section className="card" aria-label="Reposição">
          <SectionHeader title="Reposição" to="/produtos" />
          <div className="flex flex-col gap-4">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-graphite-400 text-xs font-medium">Nenhum produto em reposição.</div>
            ) : lowStockProducts.map((p) => {
              // Limitar porcentagem entre 0% e 100%
              const pct = p.minimo > 0 ? Math.max(0, Math.min(100, (p.estoque / p.minimo) * 100)) : 0;
              // Se o estoque for menor ou igual a zero, usamos um alerta mais discreto (laranja suave) em vez de vermelho vivo
              const isNegativeOrZero = p.estoque <= 0;
              const color = isNegativeOrZero
                ? '#E08C2D' // Laranja suave de atenção discreta
                : pct < 20
                  ? '#E05252' // Vermelho
                  : pct < 50
                    ? '#E08C2D' // Laranja
                    : '#1DB86E'; // Verde
              const bgColor = isNegativeOrZero
                ? '#FEF3E2'
                : pct < 20
                  ? '#FEECEC'
                  : pct < 50
                    ? '#FEF3E2'
                    : '#EDFAF3';
              return (
                <div key={p.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: bgColor }}>
                      <Package size={12} style={{ color }} />
                    </div>
                    <p className="text-sm font-medium text-graphite-800 flex-1 truncate">{p.nome}</p>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{p.estoque}/{p.minimo}</span>
                  </div>
                  <div className="w-full bg-graphite-100 rounded-full h-1.5 overflow-hidden">
                    <div className="rounded-full h-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mais Vendidos */}
        <section className="card" aria-label="Produtos mais vendidos">
          <SectionHeader title="Mais Vendidos" to="/produtos" />
          <div className="flex flex-col gap-4">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-graphite-400 text-xs font-medium">Nenhum produto vendido ainda.</div>
            ) : topSellingProducts.map((p, i) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-graphite-300 w-5 flex-shrink-0 text-center">#{i + 1}</span>
                    <p className="text-sm font-semibold text-graphite-800 truncate">{p.nome}</p>
                  </div>
                  <p className="text-xs font-bold text-graphite-600 flex-shrink-0 ml-2">{p.vendas}×</p>
                </div>
                <div className="w-full bg-graphite-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="rounded-full h-full transition-all duration-700"
                    style={{ width: `${(p.vendas / topSalesMax) * 100}%`, background: p.cor }}
                  />
                </div>
                <p className="text-[11px] text-graphite-400 mt-1">{formatCurrency(p.receita)} em receita</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
