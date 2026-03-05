'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsApi, departmentsApi } from '@/lib/api/client';
import { Plus, Search, Eye, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

const STATUS_BADGES: Record<string, string> = {
  active: 'badge-active',
  promoted: 'badge-promoted',
  graduated: 'badge-graduated',
  left: 'badge-left',
};

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['students', { q: search, department: dept, status, page }],
    queryFn: () => studentsApi.list({ q: search || undefined, department: dept || undefined, status: status || undefined, page }),
  });
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });

  const students = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Students</h2>
          <p className="text-sm text-gray-500">{meta?.total ?? 0} total students</p>
        </div>
        <Link href="/students/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or registration no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-48"
          value={dept}
          onChange={(e) => { setDept(e.target.value); setPage(1); }}
        >
          <option value="">All Departments</option>
          {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          className="input w-36"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="promoted">Promoted</option>
          <option value="graduated">Graduated</option>
          <option value="left">Left</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Reg. No</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Sem</th>
                <th className="text-left px-4 py-3">Outstanding</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
                : students.map((s: any) => {
                  const outstanding = s.financeRecords?.reduce(
                    (sum: number, f: any) => sum + parseFloat(f.remaining || 0), 0,
                  ) ?? 0;
                  return (
                    <tr key={s.id} className="table-row">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.registrationNo}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.department?.name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          s.programMode === 'semester' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700',
                        )}>
                          {s.programMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.currentSemester ?? '—'}</td>
                      <td className={clsx('px-4 py-3 font-semibold', outstanding > 0 ? 'text-red-600' : 'text-green-600')}>
                        {outstanding > 0 ? `PKR ${outstanding.toLocaleString()}` : 'Clear'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_BADGES[s.status] || 'badge-active'}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/students/${s.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-blue" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/payments/new?studentId=${s.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600" title="Add Payment">
                            <CreditCard className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {meta.page} of {meta.lastPage} ({meta.total} records)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                disabled={meta.page === meta.lastPage}
                className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
