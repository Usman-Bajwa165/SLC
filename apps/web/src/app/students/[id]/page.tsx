"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, departmentsApi } from "@/lib/api/client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  Users,
  GraduationCap,
  Calendar,
  Phone,
  CreditCard,
  BookOpen,
  Mail,
  MapPin,
  Hash,
  Wallet,
  History,
  Printer,
  Download,
} from "lucide-react";
import { exportToPDF } from "@/lib/report-utils";
import Link from "next/link";
import { clsx } from "clsx";
import { showBar, hideBar } from "@/lib/progress";
import {
  formatCurrency,
  formatDateTime,
  formatContact,
  formatCNIC,
} from "@/lib/utils";
import { toast } from "sonner";

const TABS = ["Details", "Finance", "Payments", "Academic"];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState("Details");
  const [promoting, setPromoting] = useState(false);
  const changeTab = (t: string) => {
    showBar();
    setTab(t);
  };

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentsApi.get(parseInt(id)),
  });

  const promoteMutation = useMutation({
    mutationFn: () => studentsApi.promote(parseInt(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", id] });
      setPromoting(false);
      toast.success("Student promoted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message);
      setPromoting(false);
    },
  });

  const handleExport = () => {
    if (!student) return;

    const summary = [
      { label: "Registration", value: student.registrationNo },
      { label: "Roll No", value: student.rollNo || "N/A" },
      { label: "Department", value: student.department?.name },
      { label: "Session", value: student.session?.label || "N/A" },
      { label: "Program Mode", value: student.programMode.toUpperCase() },
      {
        label: "Current Level",
        value: (student.currentSemester || "N/A").toString(),
      },
      { label: "Status", value: student.status.toUpperCase() },
    ];

    const financeColumns = ["Term", "Fee Due", "Paid", "Arrears", "Remaining"];
    const financeData = (student.financeRecords || []).map((f: any) => [
      f.termLabel,
      `PKR ${Number(f.feeDue).toLocaleString()}`,
      `PKR ${Number(f.feePaid).toLocaleString()}`,
      `PKR ${Number(f.carryOver).toLocaleString()}`,
      `PKR ${Number(f.remaining).toLocaleString()}`,
    ]);

    exportToPDF({
      title: `Student Profile - ${student.name}`,
      filename: `student_${student.registrationNo}`,
      columns: financeColumns,
      data: financeData,
      summary,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-slate-100 rounded-full" />
        <div className="h-6 w-48 bg-slate-100 rounded-lg" />
        <div className="h-4 w-32 bg-slate-50 rounded-lg" />
      </div>
    );

  if (!student)
    return (
      <div className="card-premium p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          Student Not Found
        </h3>
        <button onClick={() => router.back()} className="btn-secondary mt-6">
          Go Back
        </button>
      </div>
    );

  const totalPaid =
    student.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.feePaid),
      0,
    ) ?? 0;
  const totalDue =
    student.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.feeDue),
      0,
    ) ?? 0;
  const totalOutstanding =
    student.financeRecords
      ?.filter((f: any) => !f.isSnapshot)
      .reduce((s: number, f: any) => s + parseFloat(f.remaining), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in relative">
      {/* Aesthetic Background Decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-400 hover:text-brand-blue cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-blue/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                {student.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-md uppercase tracking-widest">
                  {student.registrationNo}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {student.department?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-slate-400 hover:text-brand-blue"
            title="Print Profile"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-slate-400 hover:text-brand-blue"
            title="Export Profile to PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <Link
            href={`/enrollment?tab=existing&studentId=${id}`}
            className="px-5 py-2.5 border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" /> Edit Student
          </Link>
          <Link
            href={`/payments?tab=portal&studentId=${id}`}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-blue/20 px-8"
          >
            <Wallet className="w-4 h-4" /> Record Payment
          </Link>
        </div>
      </div>

      {/* High-Level Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryItem
          label="Academic Track"
          value={`${student.programMode === "semester" ? "Semester" : "Annual"} ${student.currentSemester || "—"}`}
          subValue={student.session?.label}
          icon={<BookOpen className="w-5 h-5" />}
          color="blue"
        />
        <SummaryItem
          label="Outstanding Balance"
          value={`PKR ${totalOutstanding.toLocaleString()}`}
          subValue={totalOutstanding > 0 ? "Action Required" : "Account Clear"}
          icon={<AlertCircle className="w-5 h-5" />}
          color={totalOutstanding > 0 ? "red" : "green"}
        />
        <SummaryItem
          label="Total Paid"
          value={`PKR ${totalPaid.toLocaleString()}`}
          subValue={`Out of PKR ${totalDue.toLocaleString()}`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="indigo"
        />
        <SummaryItem
          label="Current Status"
          value={student.status}
          subValue="Student Lifetime"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2 sticky top-4">
          <div className="card-premium p-2 flex flex-col gap-1 bg-slate-50/50">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => changeTab(t)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300",
                  tab === t
                    ? "bg-white text-brand-blue shadow-lg ring-1 ring-slate-200 scale-[1.03]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/60",
                )}
              >
                {t === "Details" && <User className="w-4 h-4" />}
                {t === "Finance" && <Wallet className="w-4 h-4" />}
                {t === "Payments" && <History className="w-4 h-4" />}
                {t === "Academic" && <TrendingUp className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>

          {/* Quick Info Card */}
          <div className="card-premium p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Contact Gateway
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">
                  {formatContact(student.contact)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold tracking-widest">
                  {formatCNIC(student.cnic)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-9 min-h-[600px]">
          <div className="card-premium bg-white p-8 shadow-2xl shadow-slate-200/50 border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-brand-gold rounded-full" />
              {tab} Overview
            </h3>

            {tab === "Details" && <DetailsTab student={student} />}
            {tab === "Finance" && (
              <FinanceTab records={student.financeRecords} />
            )}
            {tab === "Payments" && <PaymentsTab payments={student.payments} />}
            {tab === "Academic" && (
              <AcademicTab
                student={student}
                onPromote={() => {
                  if (
                    confirm(
                      `Promote ${student.name} to ${student.programMode === "semester" ? "semester" : "year"} ${(student.currentSemester || 0) + 1}?`,
                    )
                  ) {
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
    </div>
  );
}

function SummaryItem({ label, value, subValue, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  return (
    <div
      className={clsx(
        "p-5 rounded-[2rem] border shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300 bg-white",
        colors[color],
      )}
    >
      <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
          {label}
        </p>
        <p className="text-lg font-black tracking-tight leading-none mb-1 text-slate-900 capitalize">
          {value}
        </p>
        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
          {subValue}
        </p>
      </div>
    </div>
  );
}

function DetailsTab({ student }: any) {
  const infoGroups = [
    {
      title: "Personal Profile",
      items: [
        {
          label: "Full Official Name",
          value: student.name,
          icon: <User className="w-4 h-4" />,
        },
        {
          label: "Parent / Guardian",
          value: student.parentGuardian,
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: "Identification (CNIC)",
          value: formatCNIC(student.cnic),
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          label: "Student Contact",
          value: formatContact(student.contact),
          icon: <Phone className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Academic Identity",
      items: [
        {
          label: "Registration Identifier",
          value: student.registrationNo,
          icon: <Hash className="w-4 h-4" />,
        },
        {
          label: "Assigned Roll Number",
          value: student.rollNo || "—",
          icon: <Hash className="w-4 h-4" />,
        },
        {
          label: "Department / Program",
          value: student.department?.name,
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          label: "Admission Session",
          value: student.session?.label || "—",
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          label: "Program Mode",
          value: student.programMode,
          icon: <BookOpen className="w-4 h-4" />,
          highlight: true,
        },
        {
          label: "Enrollment Date",
          value: student.enrolledAt
            ? new Date(student.enrolledAt).toLocaleDateString(undefined, {
                dateStyle: "long",
              })
            : "—",
          icon: <Calendar className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      {infoGroups.map((group, idx) => (
        <div key={idx} className="space-y-4">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
            {group.title}
            <div className="flex-1 h-[1px] bg-slate-100" />
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-brand-blue/20 transition-all group"
              >
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-brand-blue transition-colors">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {item.label}
                  </p>
                  <p
                    className={clsx(
                      "text-sm font-bold text-slate-800",
                      item.highlight && "text-brand-blue uppercase",
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceTab({ records }: any) {
  if (!records?.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40">
        <Wallet className="w-12 h-12 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">
          No financial history detected
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-slate-50/30">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Billing Term
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Base Fee
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-green-600">
                Total Paid
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Arrears
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-red-600">
                Net Due
              </th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.map((f: any) => (
              <tr
                key={f.id}
                className={clsx(
                  "hover:bg-slate-50/50 transition-colors",
                  f.isSnapshot && "opacity-60 grayscale-[0.5]",
                )}
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 uppercase text-xs tracking-tight">
                        {f.termLabel}
                      </p>
                      {f.isSnapshot && (
                        <p className="text-[8px] font-black text-brand-gold uppercase tracking-[0.2em] mt-0.5">
                          Archived Ledger
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-bold text-slate-600">
                  PKR {Number(f.feeDue).toLocaleString()}
                </td>
                <td className="px-6 py-5 text-right font-black text-green-600">
                  PKR {Number(f.feePaid).toLocaleString()}
                </td>
                <td className="px-6 py-5 text-right font-bold text-orange-500">
                  {Number(f.carryOver) > 0
                    ? `PKR ${Number(f.carryOver).toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-6 py-5 text-right font-black">
                  <span
                    className={
                      Number(f.remaining) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    PKR {Number(f.remaining).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <div
                      className={clsx(
                        "p-2 rounded-full shadow-sm",
                        Number(f.remaining) <= 0
                          ? "bg-green-50 text-green-600 shadow-green-100"
                          : "bg-red-50 text-red-500 shadow-red-100",
                      )}
                    >
                      {Number(f.remaining) <= 0 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({ payments }: any) {
  if (!payments?.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 text-center">
        <History className="w-12 h-12 mb-4 mx-auto" />
        <p className="text-sm font-black uppercase tracking-widest">
          No transaction logs available
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Receipt Gateway
              </th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Timestamp
              </th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Instrument
              </th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Amount Received
              </th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Notes / Remarks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {payments.map((p: any) => (
              <tr
                key={p.id}
                className="hover:bg-slate-50/50 transition-all duration-300"
              >
                <td className="px-6 py-5 font-black text-brand-blue uppercase tracking-tighter text-xs">
                  #{p.receiptNo}
                </td>
                <td className="px-6 py-5">
                  <p className="font-bold text-slate-700">
                    {new Date(p.date).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {new Date(p.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest w-fit">
                    {p.method?.name || "Standard"}
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-black text-green-600 text-base">
                  PKR {Number(p.amount).toLocaleString()}
                </td>
                <td className="px-6 py-5 text-slate-500 font-medium italic text-xs">
                  {p.notes || "No remarks provided."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AcademicTab({ student, onPromote, promoting }: any) {
  const { data: dept } = useQuery({
    queryKey: ["department", student.departmentId],
    queryFn: () => departmentsApi.get(student.departmentId),
  });

  const totalTerms =
    student.programMode === "semester"
      ? (dept?.yearsDuration || 0) * (dept?.semsPerYear || 0)
      : dept?.yearsDuration || 0;
  const currentTerm = student.currentSemester || 0;
  const isLastTerm = currentTerm >= totalTerms;

  const totalOutstanding =
    student.financeRecords
      ?.filter((f: any) => !f.isSnapshot)
      .reduce((s: number, f: any) => s + parseFloat(f.remaining), 0) ?? 0;
  const hasDues = totalOutstanding > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-blue/5 to-white border border-brand-blue/10 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="p-4 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Academic Standings
              </p>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Performance Index
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Program Format
              </span>
              <span className="text-xs font-black text-brand-blue uppercase bg-brand-blue/5 px-3 py-1 rounded-lg">
                {student.programMode}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Active Enrollment
              </span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {student.programMode === "semester" ? "Semester" : "Annual"}{" "}
                {student.currentSemester ?? "—"}
              </span>
            </div>

            {student.cgpa || student.sgpa ? (
              <>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-8 -mt-8 rounded-full" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Cumulative GPA
                  </span>
                  <span className="text-xl font-black text-brand-blue tracking-[0.1em]">
                    {student.cgpa ?? "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Semester GPA
                  </span>
                  <span className="text-base font-black text-slate-800 tracking-[0.1em]">
                    {student.sgpa ?? "0.00"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-8 -mt-8 rounded-full" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Obtained Marks
                  </span>
                  <span className="text-xl font-black text-brand-blue tracking-[0.1em]">
                    {student.obtainedMarks ?? "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Total Possible
                  </span>
                  <span className="text-base font-black text-slate-800 tracking-[0.1em]">
                    {student.totalMarks ?? "0"}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Global Status
              </span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.15em] bg-green-50 px-3 py-1 rounded-lg">
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {student.status !== "graduated" && (
          <div className="card-premium p-8 border-brand-blue/20 bg-brand-blue/5 overflow-hidden relative group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-blue/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white text-brand-blue rounded-xl shadow-md transition-transform group-hover:rotate-12 duration-500">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    Promote Enrollment
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2 uppercase tracking-wide">
                    Initiating promotion will snapshot the current ledger, carry
                    over remaining PKR arrears, and activate the next academic
                    installment frame.
                  </p>
                </div>
              </div>

              <button
                onClick={onPromote}
                disabled={promoting || (isLastTerm && hasDues)}
                className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : isLastTerm ? (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    {hasDues ? "Clear Dues to Graduate" : "Mark as Graduated"}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Promote to{" "}
                    {student.programMode === "semester"
                      ? "Semester"
                      : "Year"}{" "}
                    {(student.currentSemester || 0) + 1}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="card-premium p-6 border-slate-100 bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            <span className="text-brand-gold font-black">Note:</span> Promotion
            is irreversible once the financial snapshot is created. Ensure all
            base grades and attendance requirements are verified for the current
            cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
