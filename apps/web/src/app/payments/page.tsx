"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentsApi,
  studentsApi,
  staffApi,
  accountsApi,
} from "@/lib/api/client";
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
  Briefcase,
  Calendar,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") as
    | "history"
    | "portal"
    | "staff"
    | null;
  const [tab, setTab] = useState<"history" | "portal" | "staff">(
    initialTab === "portal"
      ? "portal"
      : initialTab === "staff"
        ? "staff"
        : "history",
  );

  // Sync tab state with URL for persistence on reload
  useEffect(() => {
    const currentTabInUrl = searchParams.get("tab");
    if (currentTabInUrl !== tab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [tab, searchParams, router]);

  const [searchHistory, setSearchHistory] = useState("");
  const [searchPortal, setSearchPortal] = useState("");
  const [searchStaff, setSearchStaff] = useState("");

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
          <button
            onClick={() => {
              setTab("staff");
            }}
            className={clsx(
              "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
              tab === "staff"
                ? "bg-green-600 text-white shadow-md scale-[1.02]"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Staff Portal
          </button>
        </div>
      </div>

      {tab === "history" ? (
        <TransactionHistory
          search={searchHistory}
          setSearch={setSearchHistory}
        />
      ) : tab === "portal" ? (
        <StudentPortal search={searchPortal} setSearch={setSearchPortal} />
      ) : (
        <StaffPortal search={searchStaff} setSearch={setSearchStaff} />
      )}
    </div>
  );
}

function TransactionHistory({ search, setSearch }: any) {
  const [source, setSource] = useState("all");
  const [staffType, setStaffType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: paymentsRes, isLoading } = useQuery({
    queryKey: ["payments", source, dateFrom, dateTo],
    queryFn: () =>
      paymentsApi.list({
        source,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const payments = useMemo(() => {
    let allPayments = paymentsRes?.data || [];
    
    if (source === "staff" && staffType !== "all") {
      allPayments = allPayments.filter((p: any) => p.type?.toLowerCase() === staffType);
    }

    if (!search) return allPayments;
    const searchLower = search.toLowerCase();
    return allPayments.filter(
      (p: any) =>
        p.label?.toLowerCase().includes(searchLower) ||
        (p.student?.rollNo || p.month)?.toLowerCase().includes(searchLower) ||
        (p.student?.registrationNo || p.type)
          ?.toLowerCase()
          .includes(searchLower) ||
        (p.receiptNo || p.reference)?.toLowerCase().includes(searchLower),
    );
  }, [paymentsRes?.data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full flex-wrap">
          <div className="card-premium p-2 flex-1 min-w-[300px] flex items-center gap-3 bg-white border-slate-100">
            <Search className="w-4 h-4 text-slate-400 ml-3" />
            <input
              type="text"
              placeholder="Search by name, roll number, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none font-bold text-slate-800 placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
                title="Start Date"
              />
            </div>
            <span className="text-[10px] font-black text-slate-300">TO</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-600 focus:text-brand-blue transition-colors"
                title="End Date"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors ml-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm ml-auto">
            {[
              { id: "all", label: "All" },
              { id: "student", label: "Students" },
              { id: "staff", label: "Staff" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={clsx(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  source === s.id
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        
        {source === "staff" && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm ml-0 lg:ml-auto w-fit">
            {[
              { id: "all", label: "All Types" },
              { id: "salary", label: "Salary" },
              { id: "advance", label: "Advance" },
              { id: "loan", label: "Loan" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStaffType(s.id)}
                className={clsx(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  staffType === s.id
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

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

      <div className="card-premium overflow-hidden border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col h-[calc(145vh-600px)]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Ref / ID
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Payee / Staff Member
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Type
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Date
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Method
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Amount
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Account / Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {payments.length > 0 ? (
                payments.map((p: any) => (
                  <tr
                    key={`${p.source}-${p.id}`}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-black text-brand-blue text-xs tracking-tighter uppercase whitespace-nowrap">
                        #{p.reference}
                      </span>
                      <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">
                        {p.source}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {p.label}
                      </p>
                      {(p.student?.cnic || p.staff?.cnic) && (
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {p.student?.cnic || p.staff?.cnic}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest w-fit",
                          p.source === "staff"
                            ? "bg-green-50 text-green-600"
                            : "bg-brand-blue/10 text-brand-blue",
                        )}
                      >
                        {p.type}
                      </div>
                      {p.source === "student" && p.student?.rollNo && (
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                          {p.student.rollNo}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      {formatDateTime(p.date)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest w-fit">
                        {p.method?.name || "Cash"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p
                        className={clsx(
                          "text-xs font-black leading-none",
                          p.source === "staff"
                            ? "text-red-600"
                            : "text-green-600",
                        )}
                      >
                        {p.source === "staff" ? "-" : "+"} PKR{" "}
                        {Number(p.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                          {p.account?.label || "Cash"}
                          {p.account?.accountNumber && (
                            <span className="text-slate-400 font-bold ml-1">
                              - {p.account.accountNumber}
                            </span>
                          )}
                        </p>
                        {(p.senderName || p.payerName) && (
                          <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest">
                            <span className="text-slate-400 mr-1 italic">
                              By:
                            </span>{" "}
                            {p.senderName || p.payerName}
                          </p>
                        )}
                        {p.notes && (
                          <p className="text-[9px] font-bold text-slate-400 line-clamp-1 italic">
                            "{p.notes}"
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
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
    studentIdParam ? Number(studentIdParam) : null,
  );

  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ["students-portal"],
    queryFn: () => studentsApi.list({ limit: 50 }),
  });

  const students = useMemo(() => {
    const allStudents = studentsRes?.data || [];
    if (!search) return allStudents;
    const searchLower = search.toLowerCase();
    return allStudents.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.rollNo?.toLowerCase().includes(searchLower) ||
        s.registrationNo?.toLowerCase().includes(searchLower),
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

function StaffPortal({ search, setSearch }: any) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const staffIdParam = searchParams.get("staffId");
  const returnUrlParam = searchParams.get("returnUrl");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(
    staffIdParam ? Number(staffIdParam) : null,
  );

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ["staff-portal"],
    queryFn: () => staffApi.list({ limit: 50 }),
  });

  const staff = useMemo(() => {
    const allStaff = staffRes?.data || [];
    if (!search) return allStaff;
    const searchLower = search.toLowerCase();
    return allStaff.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.cnic?.includes(searchLower) ||
        s.role?.toLowerCase().includes(searchLower),
    );
  }, [staffRes?.data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="card-premium p-2 w-full flex items-center gap-3 bg-white border-green-600/20 shadow-xl shadow-green-600/5 focus-within:ring-2 ring-green-600/20 transition-all">
        <Search className="w-4 h-4 text-green-600 ml-3" />
        <input
          type="text"
          placeholder="Lookup staff by name, CNIC, or role for salary payment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none py-3 text-sm focus:outline-none font-bold text-slate-800 placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s: any) => {
          const remaining = s.financeRecords?.[0]?.remaining
            ? parseFloat(s.financeRecords[0].remaining)
            : 0;
          const advance = s.financeRecords?.[0]?.advanceTaken
            ? parseFloat(s.financeRecords[0].advanceTaken)
            : 0;
          const loan = s.financeRecords?.[0]?.loanTaken
            ? parseFloat(s.financeRecords[0].loanTaken)
            : 0;

          return (
            <div
              key={s.id}
              className="card-premium p-6 bg-white hover:border-green-600 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-600/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />

              <div className="flex items-start gap-4 relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1 group-hover:text-green-600 transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    {s.role} • PKR {Number(s.salary).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Advance
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      PKR {advance.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Loan
                    </span>
                    <span className="text-xs font-black text-orange-600">
                      PKR {loan.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Remaining
                  </span>
                  <span
                    className={clsx(
                      "text-sm font-black tracking-tight",
                      remaining > 0 ? "text-red-600" : "text-green-600",
                    )}
                  >
                    PKR {remaining.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStaffId(s.id)}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Pay Salary
                  </button>
                  <Link
                    href={`/staff/${s.id}`}
                    className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-green-600 hover:bg-slate-50 transition-all"
                  >
                    <Briefcase className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {staff.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Search className="w-12 h-12 mb-4 mx-auto text-slate-300" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              No matching staff
            </p>
          </div>
        )}
      </div>

      {selectedStaffId && (
        <StaffPaymentModal
          isOpen={!!selectedStaffId}
          onClose={() => {
            if (returnUrlParam) {
              router.push(returnUrlParam);
            } else {
              setSelectedStaffId(null);
            }
          }}
          staffId={selectedStaffId}
          returnUrl={returnUrlParam || undefined}
        />
      )}
    </div>
  );
}

function StaffPaymentModal({
  isOpen,
  onClose,
  staffId,
  returnUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  staffId: number;
  returnUrl?: string;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "salary",
    month: new Date().toISOString().slice(0, 7),
    methodId: "",
    accountId: "",
    payerName: "",
    receiverName: "",
    notes: "",
  });

  const handleKeyDown = (
    e: React.KeyboardEvent,
    isLastField: boolean = false,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLastField) {
        submitBtnRef.current?.click();
      } else {
        const inputs = Array.from(
          document.querySelectorAll(
            'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
          ),
        );
        const currentIndex = inputs.indexOf(e.currentTarget as any);
        const nextInput = inputs[currentIndex + 1] as HTMLElement;
        nextInput?.focus();
      }
    }
  };

  useEffect(() => {
    if (isOpen && amountRef.current) {
      setTimeout(() => {
        amountRef.current?.focus();
        amountRef.current?.select();
      }, 200);
    }
  }, [isOpen]);

  const { data: staff } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.get(staffId),
  });

  const { data: methods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: accountsApi.paymentMethods,
  });

  const selectedMethod = methods?.find(
    (m: any) => m.id === Number(formData.methodId),
  );
  const accounts = selectedMethod?.accounts || [];

  const mutation = useMutation({
    mutationFn: (data: any) => staffApi.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staff-portal"] });
      toast.success("Payment recorded successfully!");
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        onClose();
      }
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      staffId,
      methodId: Number(formData.methodId),
      accountId: formData.accountId ? Number(formData.accountId) : undefined,
    });
  };

  if (!staff) return null;

  const currentFinance = staff.financeRecords?.[0] || {};
  const loanBalance = Number(currentFinance.loanTaken || 0);
  const advanceBalance = Number(currentFinance.advanceTaken || 0);

  // Enrollment Month check
  const joinedDate = new Date(staff.joinedDate);
  const joinedMonth = joinedDate.toISOString().slice(0, 7);
  const isBeforeJoining = formData.month < joinedMonth;

  // Monthly matching finance
  const monthlyFinance = staff.financeRecords?.find(
    (f: any) => f.month === formData.month,
  );
  const remainingSalary = isBeforeJoining
    ? 0
    : Number(monthlyFinance?.remaining ?? staff.salary);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isFutureMonth = formData.month > currentMonth;
  const isFullyPaid = !isBeforeJoining && remainingSalary <= 0;

  const isInvalidMonth =
    isBeforeJoining || (formData.type === "salary" && isFutureMonth);
  const canSubmit =
    !isBeforeJoining &&
    !(formData.type === "salary" && isFutureMonth) &&
    !(formData.type === "salary" && isFullyPaid);

  const isCash = selectedMethod?.name?.toLowerCase().includes("cash");
  const showPayerReceiver = !!formData.accountId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staff.name}
      headerContent={staff.name.charAt(0).toUpperCase()}
      subtitle={
        <>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Role: {staff.role}
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Salary: PKR {Number(staff.salary).toLocaleString()}
          </span>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <span className="text-white/60">Balance:</span>
            <span
              className={clsx(
                "font-black",
                isInvalidMonth
                  ? "text-red-400"
                  : isFullyPaid && formData.type === "salary"
                    ? "text-green-400"
                    : "text-brand-gold",
              )}
            >
              {isBeforeJoining
                ? "MONTH PRE-DATED"
                : formData.type === "salary" && isFutureMonth
                  ? "FUTURE SALARY BLOCKED"
                  : isFullyPaid && formData.type === "salary"
                    ? "FULLY PAID"
                    : `PKR ${remainingSalary.toLocaleString()}`}
            </span>
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <span>Loan: PKR {loanBalance.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <span>Advance: PKR {advanceBalance.toLocaleString()}</span>
          </div>
        </>
      }
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              onKeyDown={(e) => handleKeyDown(e)}
              className="input-field"
            >
              <option value="salary">Salary</option>
              <option value="advance">Advance</option>
              <option value="loan">Loan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Month *
            </label>
            <input
              type="month"
              required
              value={formData.month}
              onChange={(e) =>
                setFormData({ ...formData, month: e.target.value })
              }
              onKeyDown={(e) => handleKeyDown(e)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Amount (PKR) *
            </label>
            <input
              ref={amountRef}
              type="number"
              required
              min="0"
              max={formData.type === "salary" ? remainingSalary : undefined}
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (
                  formData.type === "salary" &&
                  val > remainingSalary &&
                  !isBeforeJoining
                ) {
                  setFormData({
                    ...formData,
                    amount: remainingSalary.toString(),
                  });
                } else {
                  setFormData({ ...formData, amount: e.target.value });
                }
              }}
              onKeyDown={(e) => handleKeyDown(e)}
              className={clsx(
                "input-field",
                formData.type === "salary" &&
                  remainingSalary > 0 &&
                  "!text-brand-blue font-black border-brand-blue/30",
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Payment Method *
            </label>
            <select
              required
              value={formData.methodId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  methodId: e.target.value,
                  accountId: "",
                })
              }
              onKeyDown={(e) => handleKeyDown(e, false)}
              className="input-field"
            >
              <option value="">Select Method</option>
              {methods?.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {isCash && (
            <div className="col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
                Payer Name *
              </label>
              <input
                type="text"
                required={isCash}
                value={formData.payerName}
                onChange={(e) =>
                  setFormData({ ...formData, payerName: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, false)}
                className="input-field"
                placeholder="Payer name..."
              />
            </div>
          )}
          {!isCash && formData.methodId && (
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
                Target Account
              </label>
              <select
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, !showPayerReceiver)}
                className="input-field"
                disabled={accounts.length === 0}
              >
                <option value="">Select Account</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                    {a.accountNumber ? ` - ${a.accountNumber}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {showPayerReceiver && !isCash && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
                Payer Name
              </label>
              <input
                type="text"
                value={formData.payerName}
                onChange={(e) =>
                  setFormData({ ...formData, payerName: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, false)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
                Receiver Name
              </label>
              <input
                type="text"
                value={formData.receiverName}
                onChange={(e) =>
                  setFormData({ ...formData, receiverName: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, false)}
                className="input-field"
              />
            </div>
          </div>
        )}

        {(isCash || showPayerReceiver) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              onKeyDown={(e) => handleKeyDown(e, true)}
              className="input-field"
              rows={2}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            ref={submitBtnRef}
            type="submit"
            disabled={mutation.isPending || !canSubmit}
            className={clsx(
              "flex-1 btn-primary transition-all duration-300",
              !canSubmit
                ? "bg-slate-300 cursor-not-allowed opacity-50"
                : "bg-green-600 hover:bg-green-700",
            )}
          >
            {mutation.isPending
              ? "Processing..."
              : isBeforeJoining
                ? "Invalid Month"
                : formData.type === "salary" && isFutureMonth
                  ? "Future Month"
                  : formData.type === "salary" && isFullyPaid
                    ? "Already Paid"
                    : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
