'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, paymentsApi } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, AlertCircle, CheckCircle, User,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

const TABS = ['Details', 'Finance', 'Payments', 'Academic'];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Details');
  const [promoting, setPromoting] = useState(false);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.get(parseInt(id)),
  });

  const promoteMutation = useMutation({
    mutationFn: () => studentsApi.promote(parseInt(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', id] });
      setPromoting(false);
      alert('Student promoted successfully!');
    },
    onError: (err: any) => {
      alert(err.message);
      setPromoting(false);
    },
  });

  if (isLoading) return <div className="card p-8 text-center text-gray-400">Loading student...</div>;
  if (!student) return <div className="card p-8 text-center text-red-500">Student not found</div>;

  const totalOutstanding = student.financeRecords
    ?.filter((f: any) => !f.isSnapshot)
    .reduce((s: number, f: any) => s + parseFloat(f.remaining), 0) ?? 0;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
          <p className="text-sm text-gray-500">{student.registrationNo} · {student.department?.name}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/payments/new?studentId=${id}`} className="btn-primary">Record Payment</Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Program</p>
          <p className="font-bold text-brand-blue capitalize">{student.programMode}</p>
          {student.currentSemester && <p className="text-xs text-gray-400 mt-1">Semester {student.currentSemester}</p>}
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className={clsx('font-bold', totalOutstanding > 0 ? 'text-red-600' : 'text-green-600')}>
            {totalOutstanding > 0 ? `PKR ${totalOutstanding.toLocaleString()}` : 'Cleared'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-bold text-gray-700 capitalize">{student.status}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-5 py-3 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-b-2 border-brand-gold text-brand-blue'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'Details' && <DetailsTab student={student} />}
          {tab === 'Finance' && <FinanceTab records={student.financeRecords} />}
          {tab === 'Payments' && <PaymentsTab payments={student.payments} />}
          {tab === 'Academic' && (
            <AcademicTab
              student={student}
              onPromote={() => {
                if (confirm(`Promote ${student.name} to semester ${(student.currentSemester || 0) + 1}?`)) {
                  setPromoting(true);
                  promoteMutation.mutate();
                }
              }}
              promoting={promoting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ student }: any) {
  const rows = [
    ['Registration No', student.registrationNo],
    ['Full Name', student.name],
    ['Parent / Guardian', student.parentGuardian],
    ['CNIC', student.cnic?.replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3') || '—'],
    ['Roll No', student.rollNo || '—'],
    ['Department', student.department?.name],
    ['Session', student.session?.label || '—'],
    ['Program Mode', student.programMode],
    ['Enrolled At', student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : '—'],
    ['CGPA', student.cgpa ?? '—'],
  ];
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-gray-50">
            <td className="py-2.5 pr-4 font-medium text-gray-600 w-48">{k}</td>
            <td className="py-2.5 text-gray-800">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FinanceTab({ records }: any) {
  if (!records?.length) return <p className="text-gray-400 text-sm">No finance records</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
            <th className="pb-2 pr-4">Term</th>
            <th className="pb-2 pr-4">Fee Due</th>
            <th className="pb-2 pr-4">Paid</th>
            <th className="pb-2 pr-4">Carry Over</th>
            <th className="pb-2 pr-4">Remaining</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((f: any) => (
            <tr key={f.id} className={clsx('border-b border-gray-50', f.isSnapshot && 'opacity-50')}>
              <td className="py-2.5 pr-4 font-mono text-xs">
                {f.termLabel}
                {f.isSnapshot && <span className="ml-2 text-xs text-gray-400">(archived)</span>}
              </td>
              <td className="py-2.5 pr-4">PKR {Number(f.feeDue).toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-green-600">PKR {Number(f.feePaid).toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-orange-500">
                {Number(f.carryOver) > 0 ? `PKR ${Number(f.carryOver).toLocaleString()}` : '—'}
              </td>
              <td className={clsx('py-2.5 pr-4 font-semibold', Number(f.remaining) > 0 ? 'text-red-600' : 'text-green-600')}>
                PKR {Number(f.remaining).toLocaleString()}
              </td>
              <td className="py-2.5">
                {Number(f.remaining) <= 0
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <AlertCircle className="w-4 h-4 text-red-400" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab({ payments }: any) {
  if (!payments?.length) return <p className="text-gray-400 text-sm">No payments recorded</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs border-b border-gray-200">
            <th className="pb-2 pr-4">Receipt No</th>
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4">Amount</th>
            <th className="pb-2 pr-4">Method</th>
            <th className="pb-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => (
            <tr key={p.id} className="border-b border-gray-50">
              <td className="py-2.5 pr-4 font-mono text-xs text-brand-blue">{p.receiptNo}</td>
              <td className="py-2.5 pr-4 text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
              <td className="py-2.5 pr-4 font-semibold text-green-600">PKR {Number(p.amount).toLocaleString()}</td>
              <td className="py-2.5 pr-4">{p.method?.name}</td>
              <td className="py-2.5 text-gray-500">{p.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AcademicTab({ student, onPromote, promoting }: any) {
  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-surface-muted rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Program Mode</span>
          <span className="font-medium capitalize">{student.programMode}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Semester</span>
          <span className="font-bold text-brand-blue">{student.currentSemester ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">CGPA</span>
          <span className="font-medium">{student.cgpa ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Status</span>
          <span className="font-medium capitalize">{student.status}</span>
        </div>
      </div>

      {student.programMode === 'semester' && student.status !== 'graduated' && (
        <div className="border border-brand-blue rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-brand-blue mt-0.5" />
            <div>
              <p className="font-semibold text-brand-blue text-sm">Promote to Next Semester</p>
              <p className="text-xs text-gray-500 mt-1">
                This will snapshot current finance records, carry over any unpaid balance, and create a new term.
              </p>
              <button
                onClick={onPromote}
                disabled={promoting}
                className="btn-primary mt-3 text-sm"
              >
                {promoting ? 'Promoting...' : `Promote to Semester ${(student.currentSemester || 0) + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
