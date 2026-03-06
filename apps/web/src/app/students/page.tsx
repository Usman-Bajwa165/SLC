"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, departmentsApi } from "@/lib/api/client";
import {
  Plus,
  Search,
  Eye,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const STATUS_BADGES: Record<string, string> = {
  active: "badge-active",
  promoted: "badge-promoted",
  graduated: "badge-graduated",
  left: "badge-left",
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["students", { q: search, department: dept, status, page }],
    queryFn: () =>
      studentsApi.list({
        q: search || undefined,
        department: dept || undefined,
        status: status || undefined,
        page,
      }),
  });
  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const students = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Student Directory
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage enrollments, academic progress, and financial status.
          </p>
        </div>
        <Link
          href="/students/new"
          className="btn-primary flex items-center gap-2 group shadow-brand-gold/20"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Enroll New Student
        </Link>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue/5 rounded-xl flex items-center justify-center text-brand-blue">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Total Active
            </p>
            <p className="text-lg font-black text-slate-800">
              {meta?.total ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 transition-all font-medium"
            placeholder="Search by student name, roll no, or contact..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {depts?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="flex-1 md:w-36 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="promoted">Promoted</option>
            <option value="graduated">Graduated</option>
            <option value="left">Left</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Student Info
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Academic Track
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Financial Balance
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="h-4 w-32 bg-slate-100 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-24 bg-slate-100 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-20 bg-slate-100 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-16 bg-slate-100 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-12 ml-auto bg-slate-100 rounded" />
                      </td>
                    </tr>
                  ))
                : students.map((s: any) => {
                    const outstanding =
                      s.financeRecords?.reduce(
                        (sum: number, f: any) =>
                          sum + parseFloat(f.remaining || 0),
                        0,
                      ) ?? 0;
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all">
                              {s.registrationNo?.slice(-2) || "??"}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {s.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                                Reg: {s.registrationNo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-600 uppercase">
                            {s.department?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={clsx(
                                "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter",
                                s.programMode === "semester"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-orange-50 text-orange-600",
                              )}
                            >
                              {s.programMode}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Sem {s.currentSemester ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={clsx(
                              "flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl w-fit",
                              outstanding > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600",
                            )}
                          >
                            {outstanding > 0 ? (
                              <>PKR {outstanding.toLocaleString()}</>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Clear
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={clsx(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              s.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/students/${s.id}`}
                              className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/payments/new?studentId=${s.id}`}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            >
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
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Records found: {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                disabled={meta.page === meta.lastPage}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-brand-blue uppercase hover:text-brand-blue-light disabled:opacity-50 flex items-center gap-2"
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
