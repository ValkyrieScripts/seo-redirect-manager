import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  ArrowRightLeft,
  Link2,
  FileDown,
  LogOut,
  Menu,
  X,
  Settings,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'from-violet-500 to-purple-600' },
  { to: '/domains', icon: Globe, label: 'Domains', color: 'from-blue-500 to-cyan-500' },
  { to: '/projects', icon: FolderKanban, label: 'Projects', color: 'from-purple-500 to-pink-500' },
  { to: '/redirects', icon: ArrowRightLeft, label: 'Redirects', color: 'from-emerald-500 to-teal-500' },
  { to: '/backlinks', icon: Link2, label: 'Backlinks', color: 'from-orange-500 to-rose-500' },
  { to: '/export', icon: FileDown, label: 'Export', color: 'from-cyan-500 to-blue-500' },
  { to: '/instructions', icon: BookOpen, label: 'Instructions', color: 'from-pink-500 to-rose-500' },
  { to: '/settings', icon: Settings, label: 'Settings', color: 'from-slate-500 to-slate-600' },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-800/50">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl blur-md opacity-50" />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg">
            <ArrowRightLeft className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <span className="block text-lg font-bold text-white">
            Redirect
          </span>
          <span className="block text-xs text-slate-500 -mt-0.5">Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="mb-4 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </span>
        </div>
        {navItems.slice(0, 6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              )
            }
            onClick={() => setIsMobileOpen(false)}
            end={item.to === '/'}
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : 'bg-slate-800/50 group-hover:bg-slate-800'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                    )}
                  />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary-400" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-4 px-3 pt-4 border-t border-slate-800/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            System
          </span>
        </div>
        {navItems.slice(6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              )
            }
            onClick={() => setIsMobileOpen(false)}
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : 'bg-slate-800/50 group-hover:bg-slate-800'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                    )}
                  />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800/50 p-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white font-semibold">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username || 'Admin'}
            </p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white hover:border-slate-600/50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/50 text-slate-300 backdrop-blur-sm lg:hidden transition-all hover:bg-slate-700 hover:text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-[#0d0d15] border-r border-slate-800/50 transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
