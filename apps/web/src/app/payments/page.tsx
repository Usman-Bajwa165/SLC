"use client";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi, studentsApi } from "@/lib/api/client";
import { showBar, hideBar } from "@/lib/progress";
import { formatContact, formatCNIC, formatDateTime } from "@/lib/utils";
import {
  CreditCard,
  Search,
  Filter,
  Printer,
  FileText,
  Download,
  CheckCircle,
  User,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") as "history" | "portal" | null;
  const [tab, setTab] = useState<"history" | "portal">(
    initialTab === "portal" ? "portal" : "history",
  );
  const [searchHistory, setSearchHistory] = useState("");
  const [searchPortal, setSearchPortal] = useState("");

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Financial Ecosystem
          </h2>
          <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest opacity-60">
            Real-time audit of all student receipts and fiscal movements.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => {
              setTab("history");
            }}
            className={clsx(
              "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
              tab === "history"
                ? "bg-white text-brand-blue shadow-md scale-[1.02]"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Transaction History
          </button>
          <button
            onClick={() => {
              setTab("portal");
            }}
            className={clsx(
              "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
              tab === "portal"
                ? "bg-brand-gold text-white shadow-md scale-[1.02]"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Student Portal
          </button>
        </div>
      </div>

      {tab === "history" ? (
        <TransactionHistory search={searchHistory} setSearch={setSearchHistory} />
      ) : (
        <StudentPortal search={searchPortal} setSearch={setSearchPortal} />
      )}
    </div>
  );
}

function TransactionHistory({ search, setSearch }: any) {
  const { data: paymentsRes, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list({}),
  });

  const payments = useMemo(() => {
    const allPayments = paymentsRes?.data || [];
    if (!search) return allPayments;
    const searchLower = search.toLowerCase();
    return allPayments.filter((p: any) => 
      p.student?.name?.toLowerCase().includes(searchLower) ||
      p.student?.rollNo?.toLowerCase().includes(searchLower) ||
      p.student?.registrationNo?.toLowerCase().includes(searchLower) ||
      p.receiptNo?.toLowerCase().includes(searchLower)
    );
  }, [paymentsRes?.data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="card-premium p-2 flex-1 w-full flex items-center gap-3 bg-white border-slate-100">
          <Search className="w-4 h-4 text-slate-400 ml-3" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or receipt ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none font-bold text-slate-800 placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex items-center gap-2 group px-6"
            onClick={async () => {
              showBar();
              await new Promise((r) => setTimeout(r, 800));
              hideBar();
            }}
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            className="btn-primary flex items-center gap-2 group px-6 shadow-lg shadow-brand-blue/20"
            onClick={() => {
              showBar();
              setTimeout(() => {
                hideBar();
                window.print();
              }, 400);
            }}
          >
            <Printer className="w-4 h-4" />
            Print List
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Receipt
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Student / Payer
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Reg / Roll
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  On
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Method
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Amount
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Account
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {payments.length > 0 ? (
                payments.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-black text-brand-blue text-xs tracking-tighter uppercase whitespace-nowrap">
                        #{p.receiptNo}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {p.student?.name || "Manual Deposit"}
                      </p>
                      {p.senderName && (
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          From: {p.senderName}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                        {p.student?.registrationNo || "—"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {p.student?.rollNo || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-500">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest w-fit">
                        {p.method?.name ||
                          (p.accountId ? "Electronic" : "Cash")}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-900 leading-none">
                        PKR {Number(p.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase truncate max-w-[120px]">
                      {p.account?.label || "—"}
                    </td>
                    <td className="px-6 py-5 text-right space-x-1">
                      <button
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        title="View Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <CreditCard className="w-16 h-16 mb-4 text-slate-300" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
                        Empty Ledger
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StudentPortal({ search, setSearch }: any) {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const returnUrlParam = searchParams.get("returnUrl");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    studentIdParam ? Number(studentIdParam) : null
  );
  
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ["students-portal"],
    queryFn: () => studentsApi.list({ limit: 50 }),
  });

  const students = useMemo(() => {
    const allStudents = studentsRes?.data || [];
    if (!search) return allStudents;
    const searchLower = search.toLowerCase();
    return allStudents.filter((s: any) => 
      s.name?.toLowerCase().includes(searchLower) ||
      s.rollNo?.toLowerCase().includes(searchLower) ||
      s.registrationNo?.toLowerCase().includes(searchLower)
    );
  }, [studentsRes?.data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="card-premium p-2 w-full flex items-center gap-3 bg-white border-brand-gold/20 shadow-xl shadow-brand-gold/5 focus-within:ring-2 ring-brand-gold/20 transition-all">
        <Search className="w-4 h-4 text-brand-gold ml-3" />
        <input
          type="text"
          placeholder="Lookup student by ID, Name or Roll Number for quick billing..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none py-3 text-sm focus:outline-none font-bold text-slate-800 placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((s: any) => {
          const outstanding =
            s.financeRecords
              ?.filter((f: any) => !f.isSnapshot)
              .reduce(
                (sum: number, f: any) => sum + parseFloat(f.remaining || 0),
                0,
              ) ?? 0;

          return (
            <div
              key={s.id}
              className="card-premium p-6 bg-white hover:border-brand-gold transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />

              <div className="flex items-start gap-4 relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-gold group-hover:text-white transition-all shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1 group-hover:text-brand-gold transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    {s.registrationNo} • {s.department?.code}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Arrears Due
                  </span>
                  <span
                    className={clsx(
                      "text-sm font-black tracking-tight",
                      outstanding > 0 ? "text-red-600" : "text-green-600",
                    )}
                  >
                    PKR {outstanding.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudentId(s.id)}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-brand-gold hover:bg-brand-gold-dark shadow-lg shadow-brand-gold/20"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Pay Now
                  </button>
                  <Link
                    href={`/students/${s.id}`}
                    className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-brand-blue hover:bg-slate-50 transition-all"
                  >
                    <GraduationCap className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {students.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Search className="w-12 h-12 mb-4 mx-auto text-slate-300" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              No matching students
            </p>
          </div>
        )}
      </div>

      {selectedStudentId && (
        <PaymentModal
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          studentId={selectedStudentId}
          returnUrl={returnUrlParam || "/payments?tab=portal"}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-10 w-full bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-slate-50 rounded-2xl border border-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
