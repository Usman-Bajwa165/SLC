'use client';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/client';
import { Users, TrendingUp, AlertCircle, Banknote, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

function StatCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={clsx('p-3 rounded-xl', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-28 bg-gray-100" />)}
        </div>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-blue">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Stars Law College Finance Dashboard</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={d.totalActiveStudents ?? '—'}
          sub="Enrolled & active"
          icon={Users}
          color="bg-brand-blue"
        />
        <StatCard
          title="Today's Receipts"
          value={d.todayPaymentCount ?? 0}
          sub={`PKR ${Number(d.todayReceived || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Total Outstanding"
          value={`PKR ${Number(d.totalOutstanding || 0).toLocaleString()}`}
          sub="Across all students"
          icon={AlertCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Account Balances"
          value={d.accounts?.length ?? 0}
          sub="Active accounts"
          icon={Banknote}
          color="bg-brand-gold"
        />
      </div>

      {/* Account Balances */}
      {d.accounts && d.accounts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Balances</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {d.accounts.map((a: any) => (
              <div key={a.label} className="bg-surface-muted rounded-lg p-3">
                <p className="text-xs text-gray-500 truncate">{a.label}</p>
                <p className="text-base font-bold text-brand-blue mt-1">
                  PKR {Number(a.balance).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Student', href: '/students/new', color: 'bg-brand-blue' },
            { label: 'Record Payment', href: '/payments/new', color: 'bg-green-600' },
            { label: 'Outstanding Report', href: '/reports?tab=outstanding', color: 'bg-red-500' },
            { label: 'Import Students', href: '/import-export', color: 'bg-brand-gold' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={clsx(
                'flex items-center justify-between px-4 py-3 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90',
                a.color,
              )}
            >
              {a.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
