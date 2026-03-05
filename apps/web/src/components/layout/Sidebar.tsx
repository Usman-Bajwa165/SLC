'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Calendar, Users, CreditCard,
  Landmark, BarChart3, Upload, BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/sessions', label: 'Sessions', icon: Calendar },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/accounts', label: 'Accounts', icon: Landmark },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/import-export', label: 'Import / Export', icon: Upload },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 bg-brand-blue flex flex-col h-full shadow-xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-gold rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Stars Law College</div>
            <div className="text-blue-300 text-xs">Finance System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-gold text-white'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-blue-700">
        <p className="text-blue-400 text-xs">SLC System v1.0</p>
      </div>
    </aside>
  );
}
