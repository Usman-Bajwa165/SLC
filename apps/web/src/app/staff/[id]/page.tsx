"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/api/client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Briefcase,
  Calendar,
  MapPin,
  Wallet,
  History,
  DollarSign,
  Printer,
  Download,
} from "lucide-react";
import { exportToPDF } from "@/lib/report-utils";
import Link from "next/link";
import { clsx } from "clsx";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatContact,
  formatCNIC,
} from "@/lib/utils";

const TABS = ["Details", "Finance", "Payments"];

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("Details");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => staffApi.get(parseInt(id)),
  });

  const handleExport = () => {
    if (!staff) return;

    const summary = [
      { label: "Role", value: staff.role.toUpperCase() },
      { label: "Phone", value: formatContact(staff.contact) },
      { label: "CNIC", value: formatCNIC(staff.cnic) },
      {
        label: "Monthly Salary",
        value: `PKR ${Number(staff.salary).toLocaleString()}`,
      },
      {
        label: "Joined Date",
        value: new Date(staff.joinedDate).toLocaleDateString(),
      },
      { label: "Status", value: staff.isActive ? "ACTIVE" : "INACTIVE" },
    ];

    const financeColumns = [
      "Month",
      "Salary Due",
      "Paid",
      "Advance",
      "Loan",
      "Remaining",
    ];
    const financeData = (staff.financeRecords || []).map((f: any) => [
      f.month,
      `PKR ${Number(f.salaryDue).toLocaleString()}`,
      `PKR ${Number(f.salaryPaid).toLocaleString()}`,
      `PKR ${Number(f.advanceTaken).toLocaleString()}`,
      `PKR ${Number(f.loanTaken).toLocaleString()}`,
      `PKR ${Number(f.remaining).toLocaleString()}`,
    ]);

    exportToPDF({
      title: `Staff Profile - ${staff.name}`,
      filename: `staff_${staff.name.toLowerCase().replace(/\s+/g, "_")}`,
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
      </div>
    );

  if (!staff)
    return (
      <div className="card-premium p-12 text-center">
        <h3 className="text-xl font-black text-slate-800 uppercase">
          Staff Not Found
        </h3>
        <button onClick={() => router.back()} className="btn-secondary mt-6">
          Go Back
        </button>
      </div>
    );

  const totalPaid =
    staff.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.salaryPaid),
      0,
    ) ?? 0;
  const totalAdvance =
    staff.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.advanceTaken),
      0,
    ) ?? 0;
  const totalLoan =
    staff.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.loanTaken),
      0,
    ) ?? 0;
  const totalRemaining =
    staff.financeRecords?.reduce(
      (s: number, f: any) => s + parseFloat(f.remaining),
      0,
    ) ?? 0;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                {staff.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-md uppercase tracking-widest">
                  {staff.role}
                </span>
                {staff.subject && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {staff.subject}
                  </span>
                )}
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
            href={`/payments?tab=staff&staffId=${id}&returnUrl=/staff/${id}`}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-blue/20"
          >
            <Wallet className="w-4 h-4" /> Record Payment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Monthly Salary"
          value={`PKR ${Number(staff.salary).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          label="Total Paid"
          value={`PKR ${totalPaid.toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          label="Sal | Adv | Loan"
          value={
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                <span>Total Breakdown:</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-black">
                  {(totalPaid - totalAdvance - totalLoan).toLocaleString()}
                </span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-brand-gold font-black">
                  {totalAdvance.toLocaleString()}
                </span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-red-500 font-black">
                  {totalLoan.toLocaleString()}
                </span>
              </div>
            </div>
          }
          icon={<History className="w-5 h-5" />}
          color="indigo"
        />
        <SummaryCard
          label="Net Remaining"
          value={`PKR ${totalRemaining.toLocaleString()}`}
          icon={<CreditCard className="w-5 h-5" />}
          color={totalRemaining > 0 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-2 sticky top-4">
          <div className="card-premium p-2 flex flex-col gap-1 bg-slate-50/50">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all",
                  tab === t
                    ? "bg-white text-brand-blue shadow-lg ring-1 ring-slate-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/60",
                )}
              >
                {t === "Details" && <User className="w-4 h-4" />}
                {t === "Finance" && <Wallet className="w-4 h-4" />}
                {t === "Payments" && <History className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>

          <div className="card-premium p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Contact Info
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">
                  {formatContact(staff.contact)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold tracking-widest">
                  {formatCNIC(staff.cnic)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="card-premium bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-brand-gold rounded-full" />
              {tab} Overview
            </h3>

            {tab === "Details" && <DetailsTab staff={staff} />}
            {tab === "Finance" && <FinanceTab records={staff.financeRecords} />}
            {tab === "Payments" && <PaymentsTab payments={staff.payments} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <div
      className={`p-5 rounded-[2rem] border shadow-sm ${colors[color]} flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300 bg-white`}
    >
      <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
          {label}
        </p>
        <div className="text-lg font-black tracking-tight leading-none text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ staff }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoItem label="Full Name" value={staff.name} icon={<User />} />
        <InfoItem label="Role" value={staff.role} icon={<Briefcase />} />
        {staff.subject && (
          <InfoItem
            label="Subject"
            value={staff.subject}
            icon={<Briefcase />}
          />
        )}
        <InfoItem
          label="CNIC"
          value={formatCNIC(staff.cnic)}
          icon={<CreditCard />}
        />
        <InfoItem
          label="Contact"
          value={formatContact(staff.contact)}
          icon={<Phone />}
        />
        <InfoItem
          label="Joined Date"
          value={new Date(staff.joinedDate).toLocaleDateString()}
          icon={<Calendar />}
        />
        <InfoItem
          label="Monthly Salary"
          value={`PKR ${Number(staff.salary).toLocaleString()}`}
          icon={<DollarSign />}
        />
        <InfoItem
          label="Status"
          value={staff.isActive ? "Active" : "Inactive"}
          icon={<User />}
        />
      </div>
      {staff.address && (
        <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Address
              </p>
              <p className="text-sm font-bold text-slate-800">
                {staff.address}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-brand-blue/20 transition-all group">
      <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-brand-blue transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function FinanceTab({ records }: any) {
  if (!records?.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40">
        <Wallet className="w-12 h-12 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">
          No financial records
        </p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Month
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Salary Due
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-green-600 uppercase tracking-widest border-b border-slate-100">
              Paid
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100">
              Advance
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100">
              Loan
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-red-600 uppercase tracking-widest border-b border-slate-100">
              Remaining
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {records.map((f: any) => (
            <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5 font-black text-slate-800 uppercase text-xs">
                {f.month}
              </td>
              <td className="px-6 py-5 text-right font-bold text-slate-600">
                PKR {Number(f.salaryDue).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-right font-black text-green-600">
                PKR {Number(f.salaryPaid).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-right font-bold text-indigo-600">
                PKR {Number(f.advanceTaken).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-right font-bold text-orange-500">
                PKR {Number(f.loanTaken).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-right font-black text-red-600">
                PKR {Number(f.remaining).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab({ payments }: any) {
  if (!payments?.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40">
        <History className="w-12 h-12 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest">
          No payment history
        </p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Date
            </th>
            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Type
            </th>
            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Month
            </th>
            <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Method
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5 font-bold text-slate-700">
                {formatDate(p.date)}
              </td>
              <td className="px-6 py-5">
                <span
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                    p.type === "salary"
                      ? "bg-green-50 text-green-600"
                      : p.type === "advance"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-orange-50 text-orange-600",
                  )}
                >
                  {p.type}
                </span>
              </td>
              <td className="px-6 py-5 font-bold text-slate-600 uppercase text-xs">
                {p.month}
              </td>
              <td className="px-6 py-5 font-bold text-slate-600 uppercase text-xs">
                {p.method?.name}
              </td>
              <td className="px-6 py-5 text-right font-black text-green-600">
                PKR {Number(p.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
