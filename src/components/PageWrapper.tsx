import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      {/* Main content — offset for sidebar on desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 py-4 pb-20 lg:pb-6">
          {/* Consistent max-width container across all pages */}
          <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
