import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/recebimentos', icon: CreditCard, label: 'Receber' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/clientes', icon: MoreHorizontal, label: 'Mais' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-graphite-100 shadow-bottom-nav">
      <div className="flex items-center justify-around px-2 h-16 safe-area-bottom">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-brand'
                  : 'text-graphite-400 hover:text-graphite-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 ${
                    isActive ? 'bg-brand-50' : ''
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
