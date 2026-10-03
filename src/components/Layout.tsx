import React, { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, ShoppingBag, UtensilsCrossed, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './StateViews';

const Layout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/foods', icon: UtensilsCrossed, label: 'Menu Catalog', end: false },
    { to: '/orders', icon: ShoppingBag, label: 'Orders', end: false },
    ...(isAdmin ? [{ to: '/staff', icon: Users, label: 'Staff', end: false }] : []),
  ];

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  const nav = (
    <nav aria-label="Main" className="flex-1 px-4 space-y-1">
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium border ${
              isActive ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800 border-transparent'
            }`
          }
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const account = (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-950 rounded-xl border border-gray-800 mb-2">
        <div aria-hidden="true" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white uppercase">{user?.name?.charAt(0)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>
      <button type="button" onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
        <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
      </button>
    </div>
  );

  const brand = (
    <div className="p-6">
      <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">FoodAdmin</Link>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{user?.role} portal</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-950">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg">Skip to main content</a>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex-col min-h-screen sticky top-0 h-screen">
        {brand}{nav}{account}
      </aside>

      {/* Mobile header and drawer */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-800">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">FoodAdmin</Link>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} className="p-2 rounded-lg text-gray-300 hover:bg-gray-800">
          {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="md:hidden fixed inset-0 top-14 z-30 bg-gray-900 flex flex-col overflow-y-auto">
          <div className="pt-2">{nav}</div>
          {account}
        </div>
      )}

      <main id="main" tabIndex={-1} className="flex-1 min-w-0 relative pt-14 md:pt-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] max-w-full h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="p-4 sm:p-6 md:p-8 relative z-10 max-w-7xl mx-auto">
          <Suspense fallback={<LoadingState label="Loading page" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Layout;
