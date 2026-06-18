import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react';
import { mockUser } from '../data/mockData';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/recebimentos', icon: CreditCard, label: 'Recebimentos' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios', hidden: true },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full bg-bg-card border-r border-graphite-100 shadow-sidebar z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-graphite-100">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1DB86E 0%, #107540 100%)' }}>
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <div className="flex items-baseline gap-1">
            <span className="text-graphite-900 font-bold text-sm tracking-tight">Sistema</span>
            <span className="text-brand font-bold text-sm">360</span>
          </div>
          <span className="text-graphite-400 text-[10px] font-medium tracking-wide uppercase">Comercial</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        <p className="section-title px-2 mt-1 mb-2">Principal</p>
        {navItems.filter((item) => !item.hidden).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'nav-item-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-200 ease-out ${isActive ? 'bg-brand-100' : 'group-hover:bg-graphite-100'}`}>
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="flex-1 transition-transform duration-200 ease-out group-hover:translate-x-[2px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3 pb-4 border-t border-graphite-100 pt-3">
        {/* Temporarily hidden */}
        {false && (
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'nav-item-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-200 ease-out ${isActive ? 'bg-brand-100' : 'group-hover:bg-graphite-100'}`}>
                  <Settings size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="flex-1 transition-transform duration-200 ease-out group-hover:translate-x-[2px]">Configurações</span>
              </>
            )}
          </NavLink>
        )}

        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-graphite-50 border border-graphite-100">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E, #107540)' }}
          >
            {mockUser.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-graphite-800 truncate leading-tight">Ceça</p>
            <p className="text-xs text-graphite-400 truncate leading-tight">Importados</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
