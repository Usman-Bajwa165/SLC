"use client";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  reportsApi,
  accountsApi,
  departmentsApi,
  sessionsApi,
  staffApi,
} from "@/lib/api/client";
import { cn, formatDateTime, formatCurrency } from "@/lib/utils";
import { exportToPDF } from "@/lib/report-utils";
import { showBar, hideBar } from "@/lib/progress";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import {
  Search,
  Filter,
  X,
  ChevronRight,
  User,
  GraduationCap,
  BookOpen,
  ReceiptText,
  Download,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Printer,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const TABS = ["Students", "Staff", "Daily Receipts", "Accounts"];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "Students";
  const [tab, setTab] = useState(
    TABS.includes(initialTab) ? initialTab : "Students",
  );

  const changeTab = (t: string) => {
    showBar();
    setTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="h-full flex flex-col space-y-1 animate-fade-in px-4 pb-1 pt-0 max-w-[1640px] mx-auto overflow-hidden print:overflow-visible print:h-auto print:max-w-none print:px-0">
      <div className="flex-1 flex flex-col min-h-0 card-premium overflow-hidden bg-white shadow-2xl border-slate-200/60 print:shadow-none print:border-none print:overflow-visible">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 print:hidden">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => changeTab(t)}
              className={cn(
                "flex-1 md:flex-none px-8 py-3 text-sm font-black uppercase tracking-wider transition-all duration-300 rounded-2xl",
                tab === t
                  ? "bg-white text-brand-blue shadow-lg ring-1 ring-slate-200 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/40",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {tab === "Students" && <OutstandingReport />}
          {tab === "Daily Receipts" && <DailyReceiptsReport />}
          {tab === "Accounts" && <AccountsReport />}
          {tab === "Staff" && <StaffReport />}
        </div>
      </div>
    </div>
  );
}

function StudentLedgerModal({
  studentId,
  onClose,
}: {
  studentId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["student-ledger", studentId],
    queryFn: () => reportsApi.studentLedger(studentId),
  });

  if (isLoading)
    return (
      <div className="p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const logs = data?.logs || [];
  const student = data?.student;

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Payable
          </p>
          <p className="text-lg font-black text-slate-900">
            PKR {formatCurrency(data?.totalRemaining || 0)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Received
          </p>
          <p className="text-lg font-black text-green-600">
            PKR {formatCurrency(data?.totalPaid || 0)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Roll Number
          </p>
          <p className="text-lg font-black text-slate-700">
            {student?.rollNo || "N/A"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Registration
          </p>
          <p className="text-lg font-black text-slate-700">
            {student?.registrationNo}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
          <ReceiptText className="w-3.5 h-3.5" /> Transaction History
        </h4>
        <div className="overflow-hidden rounded-3xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4 text-left">Date / Receipt</th>
                <th className="px-5 py-4 text-left">Channel / Account</th>
                <th className="px-5 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-slate-400 font-medium italic"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                logs.map((l: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {formatDateTime(l.date)}
                      </p>
                      <p className="text-[10px] font-black text-brand-blue uppercase">
                        {l.receiptNo || "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 uppercase text-[10px]">
                        {l.method}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {l.account}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-black text-green-600">
                        PKR {formatCurrency(l.amount)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OutstandingReport() {
  const [filters, setFilters] = useState({
    departmentId: "",
    sessionId: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  const { data: realDepts } = useQuery({
    queryKey: ["real-departments"],
    queryFn: departmentsApi.list,
  });
  const { data: sessions } = useQuery({
    queryKey: ["sessions", filters.departmentId],
    queryFn: () => sessionsApi.list(Number(filters.departmentId)),
    enabled: !!filters.departmentId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["outstanding-report", filters],
    queryFn: () =>
      reportsApi.outstanding({
        departmentId: filters.departmentId
          ? Number(filters.departmentId)
          : undefined,
        sessionId: filters.sessionId ? Number(filters.sessionId) : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
      }),
  });

  const rows = data?.rows || [];

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-hidden print:p-0 print:overflow-visible print:h-auto">
      {/* Filtering Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 print:hidden">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          <input
            type="text"
            placeholder="Search Students..."
            className="input-field !pl-12 bg-white shadow-sm border-slate-200"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="md:col-span-2 input-field bg-white shadow-sm border-slate-200 text-xs font-bold"
          value={filters.departmentId}
          onChange={(e) =>
            setFilters({
              ...filters,
              departmentId: e.target.value,
              sessionId: "",
            })
          }
        >
          <option value="">All Departments</option>
          {realDepts?.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="md:col-span-2 input-field bg-white shadow-sm border-slate-200 text-xs font-bold disabled:opacity-50 disabled:bg-slate-50"
          value={filters.sessionId}
          onChange={(e) =>
            setFilters({ ...filters, sessionId: e.target.value })
          }
          disabled={!filters.departmentId}
        >
          <option value="">All Sessions</option>
          {sessions?.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="md:col-span-3 flex gap-2">
          <input
            type="date"
            className="flex-1 input-field !py-2 !px-3 font-bold text-[10px] bg-white shadow-sm"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
          <input
            type="date"
            className="flex-1 input-field !py-2 !px-3 font-bold text-[10px] bg-white shadow-sm"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>
        <div className="md:col-span-3 flex gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/reports/outstanding/export?departmentId=${filters.departmentId}${filters.sessionId ? `&sessionId=${filters.sessionId}` : ""}`}
            download={`Students_${new Date().toISOString().split("T")[0]}.csv`}
            onClick={() => showBar()}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-[10px] px-3 py-2 shadow-lg shadow-brand-blue/20"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
          <button
            onClick={() => {
              showBar();
              exportToPDF({
                title: "STUDENT OUTSTANDING",
                filename: "Students",
                columns: [
                  "Reg No",
                  "Roll No",
                  "Name",
                  "CNIC",
                  "Dept/Session",
                  "Payable",
                  "Paid",
                  "Pending",
                ],
                data: rows.map((r: any) => [
                  r.registrationNo,
                  r.rollNo || "N/A",
                  r.name,
                  r.cnic,
                  `${r.department} / ${r.session}`,
                  formatCurrency(r.totalPayable),
                  formatCurrency(r.totalPaid),
                  formatCurrency(r.totalOutstanding),
                ]),
                summary: [
                  {
                    label: "Total Students",
                    value: String(data?.totalCount || 0),
                  },
                  {
                    label: "Total Payable",
                    value: `PKR ${formatCurrency(data?.grandTotalPayable || 0)}`,
                  },
                  {
                    label: "Total Received",
                    value: `PKR ${formatCurrency(data?.grandTotalPaid || 0)}`,
                  },
                  {
                    label: "Total Outstanding",
                    value: `PKR ${formatCurrency(data?.grandTotalOutstanding || 0)}`,
                  },
                ],
              });
              setTimeout(hideBar, 500);
            }}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-3 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-3 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Records"
          value={data?.totalCount || 0}
          icon={<User className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          label="Total Fee Receivable"
          value={`PKR ${formatCurrency(data?.grandTotalPayable || 0)}`}
          icon={<BookOpen className="w-5 h-5" />}
          color="indigo"
        />
        <SummaryCard
          label="Total Received"
          value={`PKR ${formatCurrency(data?.grandTotalPaid || 0)}`}
          icon={<GraduationCap className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          label="Receivable"
          value={`PKR ${formatCurrency(data?.grandTotalOutstanding || 0)}`}
          icon={<ReceiptText className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-slate-100 shadow-sm bg-white scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-20 shadow-sm transition-shadow">
            <tr>
              <th className="px-6 py-5 text-left">Reg / Roll No</th>
              <th className="px-6 py-5 text-left">Student Info</th>
              <th className="px-6 py-5 text-left">Dpt / Session / Year</th>
              <th className="px-6 py-5 text-left">Academic Performance</th>
              <th className="px-6 py-5 text-right">Payable</th>
              <th className="px-6 py-5 text-right">Received</th>
              <th className="px-6 py-5 text-right">Pending</th>
              <th className="px-6 py-5 text-center">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-5">
                      <div className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                    </td>
                  </tr>
                ))
              : rows.map((r: any) => (
                  <tr
                    key={r.studentId}
                    className="hover:bg-slate-50/50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 tracking-tighter">
                        {r.registrationNo}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {r.rollNo || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.name}</p>
                      <p className="text-[10px] font-black text-slate-900 uppercase">
                        {r.cnic}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-blue uppercase text-[10px] tracking-tight">
                        {r.department}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {r.session} • {r.currentSemester || 0}{" "}
                        {r.programMode === "semester" ? "sem" : "year"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {r.programMode === "semester" ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            CGPA:{" "}
                            <span className="text-brand-blue">
                              {r.cgpa ?? 0}
                            </span>
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            SGPA:{" "}
                            <span className="text-slate-600">
                              {r.sgpa ?? 0}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            OBT:{" "}
                            <span className="text-brand-blue">
                              {r.obtainedMarks ?? 0}
                            </span>
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            TOT:{" "}
                            <span className="text-slate-600">
                              {r.totalMarks ?? 0}
                            </span>
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-600 uppercase text-[10px]">
                      PKR {formatCurrency(r.totalPayable)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600 uppercase text-[10px]">
                      PKR {formatCurrency(r.totalPaid)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600 uppercase text-[10px]">
                      PKR {formatCurrency(r.totalOutstanding)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/reports/student-ledger/${r.studentId}`}
                        className="p-2.5 rounded-xl hover:bg-brand-blue/10 text-brand-blue transition-colors group flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <div
      className={`p-3 rounded-2xl border shadow-sm ${colors[color]} flex items-center gap-3`}
    >
      <div className="p-2 bg-white rounded-xl shadow-sm scale-90">{icon}</div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70">
          {label}
        </p>
        <p className="text-base font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DailyReceiptsReport() {
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    methodId: "",
    accountId: "",
    departmentId: "",
    sessionId: "",
  });

  const { data: realDepts } = useQuery({
    queryKey: ["real-departments"],
    queryFn: departmentsApi.list,
  });
  const { data: dailySessions } = useQuery({
    queryKey: ["sessions", filters.departmentId],
    queryFn: () => sessionsApi.list(Number(filters.departmentId)),
    enabled: !!filters.departmentId,
  });

  const { data: methods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => accountsApi.paymentMethods(),
  });
  const selectedMethod = methods?.find(
    (m: any) => m.id === Number(filters.methodId),
  );
  const accounts = selectedMethod?.accounts || [];

  const { data, isLoading } = useQuery({
    queryKey: ["daily-receipts", filters],
    queryFn: () =>
      reportsApi.dailyReceipts({
        date: filters.date,
        methodId: filters.methodId ? Number(filters.methodId) : undefined,
        accountId: filters.accountId ? Number(filters.accountId) : undefined,
        departmentId: filters.departmentId
          ? Number(filters.departmentId)
          : undefined,
        sessionId: filters.sessionId ? Number(filters.sessionId) : undefined,
      }),
  });

  const payments = data?.payments || [];

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-hidden">
      <div className="flex flex-wrap md:flex-nowrap gap-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Report Date
          </label>
          <input
            type="date"
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Payment Method
          </label>
          <select
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold"
            value={filters.methodId}
            onChange={(e) =>
              setFilters({
                ...filters,
                methodId: e.target.value,
                accountId: "",
              })
            }
          >
            <option value="">All Methods</option>
            {methods?.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Specific Account
          </label>
          <select
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold disabled:opacity-50"
            value={filters.accountId}
            onChange={(e) =>
              setFilters({ ...filters, accountId: e.target.value })
            }
            disabled={!filters.methodId || accounts.length === 0}
          >
            <option value="">All Accounts</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Department
          </label>
          <select
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold"
            value={filters.departmentId}
            onChange={(e) =>
              setFilters({
                ...filters,
                departmentId: e.target.value,
                sessionId: "",
              })
            }
          >
            <option value="">All Depts</option>
            {realDepts?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[0.7] min-w-[100px] flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Session
          </label>
          <select
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold disabled:opacity-50"
            value={filters.sessionId}
            onChange={(e) =>
              setFilters({ ...filters, sessionId: e.target.value })
            }
            disabled={!filters.departmentId}
          >
            <option value="">All Sessions</option>
            {dailySessions?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-none w-full md:w-auto flex items-end gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/reports/daily-receipts/export?date=${filters.date}${filters.methodId ? `&methodId=${filters.methodId}` : ""}${filters.accountId ? `&accountId=${filters.accountId}` : ""}${filters.departmentId ? `&departmentId=${filters.departmentId}` : ""}${filters.sessionId ? `&sessionId=${filters.sessionId}` : ""}`}
            download={`Daily Receipts_${filters.date}.csv`}
            onClick={() => showBar()}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-[10px] px-3 py-2 shadow-lg shadow-brand-blue/20"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
          <button
            onClick={() => {
              showBar();
              exportToPDF({
                title: "DAILY RECEIPTS",
                filename: "Daily Receipts",
                columns: [
                  "Receipt",
                  "Date",
                  "Student",
                  "Dept/Session",
                  "Method",
                  "Amount",
                  "Remaining",
                ],
                data: payments.map((p: any) => [
                  p.receiptNo,
                  formatDateTime(p.date),
                  p.student.name,
                  `${p.student.department?.code || ""} / ${p.student.session?.label || ""}`,
                  p.method.name,
                  formatCurrency(p.amount),
                  formatCurrency(p.totalRemaining),
                ]),
                summary: [
                  { label: "Report Date", value: filters.date },
                  {
                    label: "Total Collection",
                    value: `PKR ${formatCurrency(data?.total || 0)}`,
                  },
                  {
                    label: "Transaction Count",
                    value: String(payments.length),
                  },
                ],
              });
              setTimeout(hideBar, 500);
            }}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-3 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-3 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          label="Collection Total"
          value={`PKR ${formatCurrency(data?.total || 0)}`}
          icon={<ReceiptText className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          label="Transaction Count"
          value={payments.length}
          icon={<Filter className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-slate-100 shadow-sm bg-white scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-20 shadow-sm transition-shadow">
            <tr>
              <th className="px-6 py-5 text-left">Receipt / Date</th>
              <th className="px-6 py-5 text-left">Student Info</th>
              <th className="px-6 py-5 text-left">Dpt / Session / Sem</th>
              <th className="px-6 py-5 text-left">Method / Account</th>
              <th className="px-6 py-5 text-right">Amount</th>
              <th className="px-6 py-5 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                    </td>
                  </tr>
                ))
              : payments.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-blue tracking-tighter">
                        {p.receiptNo}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {formatDateTime(p.date)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">
                        {p.student?.name}
                      </p>
                      <p className="text-[10px] font-black text-slate-900 uppercase">
                        {p.student?.cnic}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-blue uppercase text-[10px] tracking-tight">
                        {p.student?.department?.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {p.student?.session?.label} •{" "}
                        {p.student?.currentSemester || 0}{" "}
                        {p.student?.programMode === "semester" ? "sem" : "year"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 uppercase text-[10px]">
                        {p.method?.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {p.account?.label || "Direct Cash"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-600 uppercase text-[10px]">
                      PKR {formatCurrency(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600 uppercase text-[10px]">
                      PKR {formatCurrency(p.totalRemaining)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountsReport() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.accounts,
  });

  const { data: dashboardRaw } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
  });

  const allAccounts = (accounts as any)?.data || accounts || [];
  const dashboard = dashboardRaw || {};
  const cashBalance = Number(dashboard.cashBalance || 0);
  const accountBalance = allAccounts.reduce(
    (s: any, a: any) => s + Number(a.currentBalance || 0),
    0,
  );
  const totalBalance = cashBalance + accountBalance;

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-hidden print:p-0 print:overflow-visible print:h-auto">
      <div className="flex items-center justify-between print:hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 mr-4">
          <SummaryCard
            label="Cash in Hand"
            value={`PKR ${formatCurrency(cashBalance)}`}
            icon={<Wallet className="w-5 h-5" />}
            color="green"
          />
          <SummaryCard
            label="Total Acc Balance"
            value={`PKR ${formatCurrency(accountBalance)}`}
            icon={<Landmark className="w-5 h-5" />}
            color="blue"
          />
          <SummaryCard
            label="Active Accounts"
            value={allAccounts.length}
            icon={<Filter className="w-5 h-5" />}
            color="indigo"
          />
          <SummaryCard
            label="Total Balance"
            value={`PKR ${formatCurrency(totalBalance)}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              showBar();
              const headers = ["Account", "Category", "Number", "Balance"];
              const rows = allAccounts.map((acc: any) => [
                acc.label,
                acc.category,
                acc.accountNumber || "N/A",
                acc.currentBalance,
              ]);
              const csvContent = [headers, ...rows]
                .map((e) => e.join(","))
                .join("\n");
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `Accounts_${new Date().toISOString().split("T")[0]}.csv`;
              link.click();
              setTimeout(hideBar, 500);
            }}
            className="bg-brand-blue text-white rounded-xl flex items-center justify-center gap-2 text-[10px] px-4 py-2 hover:bg-brand-blue/90 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => {
              showBar();
              exportToPDF({
                title: "FINANCIAL ACCOUNTS",
                filename: "Accounts",
                columns: ["Account", "Category", "Number", "Balance"],
                data: allAccounts.map((acc: any) => [
                  acc.label,
                  acc.category,
                  acc.accountNumber || "N/A",
                  formatCurrency(acc.currentBalance),
                ]),
                summary: [
                  {
                    label: "Cash in Hand",
                    value: `PKR ${formatCurrency(cashBalance)}`,
                  },
                  {
                    label: "Total Acc Balance",
                    value: `PKR ${formatCurrency(accountBalance)}`,
                  },
                  {
                    label: "Total Balance",
                    value: `PKR ${formatCurrency(totalBalance)}`,
                  },
                  {
                    label: "Active Accounts",
                    value: String(allAccounts.length),
                  },
                ],
              });
              setTimeout(hideBar, 500);
            }}
            className="bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-4 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
            className="bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-4 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-slate-100 shadow-sm bg-white scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-20 shadow-sm transition-shadow">
            <tr>
              <th className="px-6 py-5 text-left">Account</th>
              <th className="px-6 py-5 text-left">Type</th>
              <th className="px-6 py-5 text-left">Account Number</th>
              <th className="px-6 py-5 text-right">Opening</th>
              <th className="px-6 py-5 text-right">Current Balance</th>
              <th className="px-6 py-5 text-right">Net Change</th>
              <th className="px-6 py-5 text-center">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-5">
                      <div className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                    </td>
                  </tr>
                ))
              : allAccounts.map((acc: any) => {
                  const opening = Number(acc.openingBalance || 0);
                  const current = Number(acc.currentBalance || 0);
                  const diff = current - opening;
                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 group-hover:text-brand-blue transition-colors">
                              {acc.label}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {acc.branch || "Main Branch"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                          {acc.paymentMethod?.type || "cash"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {acc.accountNumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-500 uppercase text-[10px]">
                        PKR {formatCurrency(opening)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 uppercase text-[10px]">
                        PKR {formatCurrency(current)}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4 text-right font-black flex items-center justify-end gap-1 uppercase text-[10px]",
                          diff >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {diff >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        PKR {formatCurrency(Math.abs(diff))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/reports/account-ledger/${acc.id}`}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors mx-auto"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffReport() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ["staff-report", roleFilter],
    queryFn: () => staffApi.list({ role: roleFilter || undefined }),
  });

  const staff = useMemo(() => {
    const all = staffRes?.data || [];
    if (!search) return all;
    const s = search.toLowerCase();
    return all.filter(
      (st: any) =>
        st.name?.toLowerCase().includes(s) ||
        st.cnic?.includes(s) ||
        st.role?.toLowerCase().includes(s),
    );
  }, [staffRes?.data, search]);

  const totalSalary = staff.reduce(
    (sum: number, s: any) => sum + parseFloat(s.salary || 0),
    0,
  );
  const totalPaid = staff.reduce((sum: number, s: any) => {
    const paid =
      s.financeRecords?.reduce(
        (s: number, f: any) => s + parseFloat(f.salaryPaid || 0),
        0,
      ) || 0;
    return sum + paid;
  }, 0);
  const totalRemaining = staff.reduce((sum: number, s: any) => {
    const rem =
      s.financeRecords?.reduce(
        (s: number, f: any) => s + parseFloat(f.remaining || 0),
        0,
      ) || 0;
    return sum + rem;
  }, 0);

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 print:hidden">
        <div className="flex-1 flex gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff..."
              className="input-field !pl-12 bg-white shadow-sm border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field bg-white shadow-sm border-slate-200 text-xs font-bold w-48"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="principal">Principal</option>
            <option value="president">President</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="peon">Peon</option>
            <option value="guard">Guard</option>
            <option value="others">Others</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              showBar();
              exportToPDF({
                title: "STAFF SALARY REPORT",
                filename: "Staff_Report",
                columns: ["Name", "CNIC", "Role", "Basic Salary", "Paid", "Remaining"],
                data: staff.map((s: any) => {
                  const paid = s.financeRecords?.reduce((sum: number, f: any) => sum + parseFloat(f.salaryPaid || 0), 0) || 0;
                  const remaining = s.financeRecords?.reduce((sum: number, f: any) => sum + parseFloat(f.remaining || 0), 0) || 0;
                  return [
                    s.name,
                    s.cnic,
                    s.role,
                    formatCurrency(s.salary),
                    formatCurrency(paid),
                    formatCurrency(remaining),
                  ];
                }),
                summary: [
                  { label: "Total Staff", value: String(staff.length) },
                  { label: "Monthly Salary Base", value: `PKR ${formatCurrency(totalSalary)}` },
                  { label: "Total Paid", value: `PKR ${formatCurrency(totalPaid)}` },
                  { label: "Total Remaining", value: `PKR ${formatCurrency(totalRemaining)}` },
                ],
              });
              setTimeout(hideBar, 500);
            }}
            className="bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-[10px] px-4 py-2 hover:bg-slate-50 transition-colors shadow-sm font-black uppercase tracking-widest"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Staff"
          value={staff.length}
          icon={<User className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          label="Monthly Salary"
          value={`PKR ${formatCurrency(totalSalary)}`}
          icon={<Wallet className="w-5 h-5" />}
          color="indigo"
        />
        <SummaryCard
          label="Total Paid"
          value={`PKR ${formatCurrency(totalPaid)}`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          label="Remaining"
          value={`PKR ${formatCurrency(totalRemaining)}`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-slate-100 shadow-sm bg-white">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-20">
            <tr>
              <th className="px-6 py-5 text-left">Name / CNIC</th>
              <th className="px-6 py-5 text-left">Role</th>
              <th className="px-6 py-5 text-left">Contact</th>
              <th className="px-6 py-5 text-right">Salary</th>
              <th className="px-6 py-5 text-right">Paid</th>
              <th className="px-6 py-5 text-right">Remaining</th>
              <th className="px-6 py-5 text-center">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-5">
                      <div className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                    </td>
                  </tr>
                ))
              : staff.map((s: any) => {
                  const paid =
                    s.financeRecords?.reduce(
                      (sum: number, f: any) =>
                        sum + parseFloat(f.salaryPaid || 0),
                      0,
                    ) || 0;
                  const remaining =
                    s.financeRecords?.reduce(
                      (sum: number, f: any) =>
                        sum + parseFloat(f.remaining || 0),
                      0,
                    ) || 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase">
                          {s.cnic}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                        {s.contact}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600 uppercase text-[10px]">
                        PKR {formatCurrency(s.salary)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 uppercase text-[10px]">
                        PKR {formatCurrency(paid)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-red-600 uppercase text-[10px]">
                        PKR {formatCurrency(remaining)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/reports/staff-ledger/${s.id}`}
                          className="p-2.5 rounded-xl hover:bg-brand-blue/10 text-brand-blue transition-colors group flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
