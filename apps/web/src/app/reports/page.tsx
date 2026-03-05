'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/client';
import { BarChart3, Download } from 'lucide-react';
import { clsx } from 'clsx';

const TABS = ['Outstanding', 'Daily Receipts', 'Advance Summary'];

export default function ReportsPage() {
  const [tab, setTab] = useState('Outstanding');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Reports</h2>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-5 py-3 text-sm font-medium transition-colors',
                tab === t ? 'bg-white border-b-2 border-brand-gold text-brand-blue' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'Outstanding' && <OutstandingReport />}
          {tab === 'Daily Receipts' && <DailyReceiptsReport date={date} setDate={setDate} />}
          {tab === 'Advance Summary' && <AdvanceSummaryReport />}
        </div>
      </div>
    </div>
  );
}

function OutstandingReport() {
  const { data, isLoading } = useQuery({ queryKey: ['outstanding'], queryFn: reportsApi.outstanding });
  const rows = data?.rows || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <strong className="text-red-600">PKR {Number(data?.grandTotal || 0).toLocaleString()}</strong> total outstanding
        </p>
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/reports/outstanding/export`} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left px-3 py-2">Reg. No</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Department</th>
              <th className="text-left px-3 py-2">Session</th>
              <th className="text-right px-3 py-2">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={5} className="px-3 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              : rows.map((r: any) => (
                <tr key={r.studentId} className="table-row">
                  <td className="px-3 py-2.5 font-mono text-xs">{r.registrationNo}</td>
                  <td className="px-3 py-2.5 font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.department}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.session}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-red-600">PKR {Number(r.totalOutstanding).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyReceiptsReport({ date, setDate }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ['daily-receipts', date],
    queryFn: () => reportsApi.dailyReceipts(date),
  });
  const payments = data?.payments || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <input type="date" className="input w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <p className="text-sm text-gray-600">
          Total: <strong className="text-green-600">PKR {Number(data?.total || 0).toLocaleString()}</strong>
          {' '}({payments.length} payments)
        </p>
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/reports/daily-receipts/export?date=${date}`} className="btn-secondary flex items-center gap-2 text-sm ml-auto">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left px-3 py-2">Receipt No</th>
              <th className="text-left px-3 py-2">Student</th>
              <th className="text-left px-3 py-2">Method</th>
              <th className="text-right px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>
              : payments.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="px-3 py-2.5 font-mono text-xs text-brand-blue">{p.receiptNo}</td>
                  <td className="px-3 py-2.5">{p.student?.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.method?.name}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-green-600">PKR {Number(p.amount).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdvanceSummaryReport() {
  const { data, isLoading } = useQuery({ queryKey: ['advance-summary'], queryFn: reportsApi.advanceSummary });
  const rows = data?.rows || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left px-3 py-2">Reg. No</th>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Department</th>
            <th className="text-right px-3 py-2">Total Advance</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>
            : rows.length === 0
            ? <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">No advance records found</td></tr>
            : rows.map((r: any) => (
              <tr key={r.studentId} className="table-row">
                <td className="px-3 py-2.5 font-mono text-xs">{r.registrationNo}</td>
                <td className="px-3 py-2.5 font-medium">{r.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.department}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-brand-gold">PKR {Number(r.totalAdvance).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
