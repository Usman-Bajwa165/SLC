"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, departmentsApi, sessionsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import {
  Plus,
  Search,
  Eye,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

import AddStudentModal from "./AddStudentModal";
const STATUS_BADGES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  promoted: "bg-blue-100 text-blue-700",
  graduated: "bg-purple-100 text-purple-700",
  left: "bg-slate-100 text-slate-500",
};

export default function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const promoteMutation = useMutation({
    mutationFn: studentsApi.promote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      alert("Student successfully promoted to the next term!");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || String(err));
    },
  });

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Student Directory
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage enrollments, academic progress, and financial status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 group shadow-brand-gold/20 hover:scale-105 transition-all w-full md:w-auto"
          >
            <UserPlus className="w-5 h-5 group-hover:text-brand-gold transition-colors" />{" "}
            Enroll Quick (Modal)
          </button>
          <Link
            href="/enrollment"
            className="px-5 py-2.5 border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors w-full md:w-auto text-center"
          >
            Go to Full Page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue/5 rounded-xl flex items-center justify-center text-brand-blue">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Total
            </p>
            <p className="text-lg font-black text-slate-800">
              {meta?.total ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card-premium p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          <input
            className="input-field pl-11"
            placeholder="Search by name, roll no, or registration..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="input-field md:w-48"
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
            className="input-field md:w-36"
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

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Student Info",
                  "Academic Track",
                  "Outstanding",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100",
                      h === "Actions" && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(5)].map((__, j) => (
                      <td key={j} className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center opacity-50">
                      <Users className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
                        No students found
                      </p>
                      <Link
                        href="/enrollment"
                        className="mt-6 btn-primary text-xs"
                      >
                        Enroll First Student
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s: any) => {
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
                            `PKR ${outstanding.toLocaleString()}`
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
                            STATUS_BADGES[s.status] ||
                              "bg-slate-100 text-slate-500",
                          )}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.status === "active" && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to promote ${s.name} to the next term? Outstanding balances will carry over.`,
                                  )
                                ) {
                                  promoteMutation.mutate(s.id);
                                }
                              }}
                              disabled={promoteMutation.isPending}
                              title="Promote to Next Term"
                              className="p-2 text-slate-400 hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-all"
                            >
                              <ChevronRight className="w-4 h-4 text-brand-gold" />
                            </button>
                          )}
                          <Link
                            href={`/students/${s.id}`}
                            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                            title="View Student"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/payments/new?studentId=${s.id}`}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Add Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-brand-blue uppercase disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
