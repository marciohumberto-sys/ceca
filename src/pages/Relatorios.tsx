import { BarChart3, TrendingUp, Package, CreditCard, Users, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { mockResumoFinanceiro, mockMaisVendidos, mockRecebimentos, mockClientes, formatCurrency } from '../data/mockData';
import PageHeader from '../components/PageHeader';

const atrasados = mockClientes.filter((c) => c.status === 'Em atraso');
const totalPendente = mockRecebimentos.reduce((s, r) => s + r.valor, 0);

const relatorios = [
  {
    id: 'r1',
    titulo: 'Vendas por Período',
    descricao: 'Evolução das vendas diárias, semanais e mensais com comparativo.',
    icon: TrendingUp,
    color: '#1DB86E',
    bg: '#EDFAF3',
    dado: `R$ 47.320,50 em maio`,
  },
  {
    id: 'r2',
    titulo: 'Produtos Mais Vendidos',
    descricao: 'Ranking de produtos por volume de vendas e receita gerada.',
    icon: Package,
    color: '#7C5CBF',
    bg: '#EDE8F8',
    dado: `Top: Fone Bluetooth · 84 un.`,
  },
  {
    id: 'r3',
    titulo: 'Recebimentos Pendentes',
    descricao: 'Títulos em aberto, vencimentos e posição de inadimplência.',
    icon: CreditCard,
    color: '#E08C2D',
    bg: '#FEF3E2',
    dado: `${formatCurrency(totalPendente)} a receber`,
  },
  {
    id: 'r4',
    titulo: 'Clientes em Atraso',
    descricao: 'Lista de clientes com débitos vencidos e análise de risco.',
    icon: Users,
    color: '#E05252',
    bg: '#FEECEC',
    dado: `${atrasados.length} clientes`,
  },
];

export default function Relatorios() {
  const metaPct = Math.min(100, (mockResumoFinanceiro.totalEntradas / mockResumoFinanceiro.previsaoMes) * 100);

  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Relatórios"
        subtitle="Resumo financeiro e operacional · Maio 2026"
      />

      {/* ── Financial Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#1DB86E' }} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-graphite-400 font-medium uppercase tracking-wide">Total Entradas</p>
              <p className="text-2xl font-bold text-brand-700 mt-1">{formatCurrency(mockResumoFinanceiro.totalEntradas)}</p>
            </div>
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={16} className="text-brand" strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-graphite-400 mb-1.5">
              <span>Meta do Mês</span>
              <span className="font-bold text-brand">{Math.round(metaPct)}%</span>
            </div>
            <div className="w-full h-1.5 bg-graphite-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${metaPct}%`, background: 'linear-gradient(90deg, #38C985, #1DB86E)' }} />
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#E05252' }} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-graphite-400 font-medium uppercase tracking-wide">Total Saídas</p>
              <p className="text-2xl font-bold text-danger mt-1">{formatCurrency(mockResumoFinanceiro.totalSaidas)}</p>
            </div>
            <div className="w-9 h-9 bg-danger-light rounded-xl flex items-center justify-center">
              <ArrowDownRight size={16} className="text-danger" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs text-graphite-400 mt-4">
            <span className="text-danger font-semibold">45%</span> das entradas do mês
          </p>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: '#7C5CBF' }} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-graphite-400 font-medium uppercase tracking-wide">Saldo Líquido</p>
              <p className="text-2xl font-bold text-graphite-900 mt-1">{formatCurrency(mockResumoFinanceiro.saldo)}</p>
            </div>
            <div className="w-9 h-9 bg-purple-light rounded-xl flex items-center justify-center">
              <BarChart3 size={16} className="text-purple" strokeWidth={2} />
            </div>
          </div>
          <p className="text-xs text-graphite-400 mt-4">
            Previsão mês: <span className="font-semibold text-graphite-700">{formatCurrency(mockResumoFinanceiro.previsaoMes)}</span>
          </p>
        </div>
      </div>

      {/* ── Report Cards ── */}
      <div>
        <p className="section-title">Relatórios Disponíveis</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {relatorios.map((r) => (
            <div key={r.id} className="card card-hover flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}>
                  <r.icon size={20} style={{ color: r.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-graphite-900">{r.titulo}</p>
                  <p className="text-xs text-graphite-400 mt-0.5 leading-relaxed">{r.descricao}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-graphite-50">
                <span className="text-xs font-semibold text-graphite-500">{r.dado}</span>
                <button
                  id={`gerar-relatorio-${r.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-graphite-200 text-graphite-600 hover:border-brand hover:text-brand hover:bg-brand-50 transition-all duration-150"
                >
                  <Download size={12} strokeWidth={2} />
                  Gerar relatório
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Products ── */}
      <div className="card">
        <p className="text-sm font-bold text-graphite-800 mb-4">Produtos Mais Vendidos — Maio 2026</p>
        <div className="flex flex-col gap-4">
          {mockMaisVendidos.map((p, i) => {
            const max = Math.max(...mockMaisVendidos.map((x) => x.vendas));
            return (
              <div key={p.id} className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-graphite-300 w-5 text-center flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold text-graphite-800 truncate">{p.nome}</p>
                    <span className="text-xs font-bold text-graphite-600 ml-2 flex-shrink-0">{p.vendas} un.</span>
                  </div>
                  <div className="w-full h-1.5 bg-graphite-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(p.vendas / max) * 100}%`, background: p.cor }} />
                  </div>
                  <p className="text-[11px] text-graphite-400 mt-1">{formatCurrency(p.receita)} em receita</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
