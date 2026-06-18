import {
  Bell,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
  Building2,
  User,
  Globe,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { mockUser } from '../data/mockData';
import PageHeader from '../components/PageHeader';

const groups = [
  {
    title: 'Empresa',
    items: [
      { icon: Building2, label: 'Dados da Empresa', description: 'Ceça Importados · CNPJ e endereço', id: 'empresa-dados' },
      { icon: Globe, label: 'Domínio e Acesso', description: 'URL de acesso e permissões', id: 'empresa-dominio' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { icon: User, label: 'Meu Perfil', description: 'Nome, e-mail e foto de perfil', id: 'conta-perfil' },
      { icon: Shield, label: 'Segurança', description: 'Senha, autenticação em dois fatores', id: 'conta-seguranca' },
    ],
  },
  {
    title: 'Preferências',
    items: [
      { icon: Bell, label: 'Notificações', description: 'E-mail, push e alertas do sistema', id: 'pref-notif' },
      { icon: Palette, label: 'Aparência', description: 'Tema, densidade e idioma', id: 'pref-aparencia' },
      { icon: Smartphone, label: 'App Mobile', description: 'Configurações do app para celular', id: 'pref-mobile' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { icon: HelpCircle, label: 'Central de Ajuda', description: 'Tutoriais, FAQ e suporte', id: 'ajuda-central' },
    ],
  },
];

export default function Configuracoes() {
  return (
    <div className="flex flex-col gap-5">

      <PageHeader
        title="Configurações"
        subtitle="Gerencie sua conta e preferências"
      />

      {/* ── Profile Card ── */}
      <div className="card flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1DB86E, #107540)' }}
        >
          {mockUser.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-graphite-900">{mockUser.name}</p>
          <p className="text-sm text-graphite-400">{mockUser.role}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-xs text-brand font-semibold">Plano Pro · Ativo</span>
          </div>
        </div>
        <button
          id="editar-perfil-btn"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-graphite-200 text-graphite-600 hover:border-brand hover:text-brand hover:bg-brand-50 transition-all"
        >
          Editar
        </button>
      </div>

      {/* ── Company Info ── */}
      <div className="card border-l-4 border-l-brand p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-brand" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-graphite-900">Ceça Importados</p>
          <p className="text-xs text-graphite-400">CNPJ: 00.000.000/0001-00 · São Paulo, SP</p>
        </div>
        <span className="badge-success flex-shrink-0">Verificada</span>
      </div>

      {/* ── Settings Groups ── */}
      {groups.map((group) => (
        <div key={group.title}>
          <p className="section-title px-1">{group.title}</p>
          <div className="card p-0 overflow-hidden divide-y divide-graphite-50">
            {group.items.map(({ icon: Icon, label, description, id }) => (
              <button
                key={id}
                id={id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-graphite-50 transition-colors text-left w-full group"
              >
                <div className="w-9 h-9 bg-graphite-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-graphite-100 transition-colors">
                  <Icon size={16} className="text-graphite-600" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite-800">{label}</p>
                  <p className="text-xs text-graphite-400">{description}</p>
                </div>
                <ChevronRight size={15} className="text-graphite-300 group-hover:text-graphite-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* ── Logout ── */}
      <button
        id="sair-btn"
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-danger-light text-danger hover:bg-danger-light transition-colors text-sm font-semibold w-full"
      >
        <LogOut size={16} strokeWidth={2} />
        Sair da conta
      </button>

      <p className="text-xs text-graphite-300 text-center pb-2">Sistema 360 Comercial · v1.0.0 · Ceça Importados</p>
    </div>
  );
}
