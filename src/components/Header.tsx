import { Bell, Search } from 'lucide-react';
import { mockUser } from '../data/mockData';

export default function Header() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-graphite-100 h-12 flex items-center">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 w-full flex items-center justify-between gap-4">
        {/* Greeting */}
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-xs sm:text-sm font-bold text-graphite-900 leading-none truncate">
            {greeting}, {mockUser.name}! 👋
          </p>
          <p className="text-[10px] text-graphite-400 leading-none hidden sm:block mt-1">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            id="header-search-btn"
            aria-label="Pesquisar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700 transition-all duration-150"
          >
            <Search size={16} strokeWidth={1.8} />
          </button>

          <button
            id="header-notifications-btn"
            aria-label="Notificações"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700 transition-all duration-150 relative"
          >
            <Bell size={16} strokeWidth={1.8} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full ring-2 ring-bg-card" />
          </button>

          {/* Mobile avatar */}
          <div
            className="lg:hidden w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ml-1 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DB86E, #107540)' }}
            aria-label={mockUser.name}
          >
            {mockUser.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
