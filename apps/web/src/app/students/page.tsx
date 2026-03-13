"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, departmentsApi, sessionsApi } from "@/lib/api/client";
import {
  Plus,
  Search,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  FileText,
  UserPlus,
  Printer,
  Download,
  Bell,
  Send,
} from "lucide-react";
import { exportToPDF } from "@/lib/report-utils";
import Link from "next/link";
import { clsx } from "clsx";
import { showBar, hideBar } from "@/lib/progress";
import { toast } from "sonner";
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
  const [sessionId, setSessionId] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const promoteMutation = useMutation({
    mutationFn: (id: number) => {
      showBar();
      return studentsApi.promote(id);
    },
    onSuccess: () => {
      hideBar();
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student successfully promoted to the next term!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.response?.data?.message || String(err));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      outstanding,
    }: {
      id: number;
      status: string;
      outstanding: number;
    }) => {
      if (status === "graduated" && outstanding > 0) {
        throw new Error(
          `Cannot graduate: Outstanding dues of PKR ${outstanding.toLocaleString()} must be cleared first.`,
        );
      }
      showBar();
      return studentsApi.update(id, { status });
    },
    onSuccess: () => {
      hideBar();
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student status updated successfully!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  const graduateMutation = useMutation({
    mutationFn: ({ id, outstanding }: { id: number; outstanding: number }) => {
      if (outstanding > 0) {
        throw new Error(
          `Cannot graduate: Outstanding dues of PKR ${outstanding.toLocaleString()} must be cleared first.`,
        );
      }
      showBar();
      return studentsApi.update(id, { status: "graduated" });
    },
    onSuccess: () => {
      hideBar();
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student marked as graduated!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "students",
      {
        q: search,
        department: dept,
        session: sessionId,
        currentLevel,
        status,
        page,
      },
    ],
    queryFn: () =>
      studentsApi.list({
        q: search || undefined,
        department: dept ? Number(dept) : undefined,
        session: sessionId ? Number(sessionId) : undefined,
        currentSemester: currentLevel ? Number(currentLevel) : undefined,
        status: status || undefined,
        page,
      }),
  });
  const { data: depts } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });
  const { data: sessions } = useQuery({
    queryKey: ["sessions", dept],
    queryFn: () => sessionsApi.list(Number(dept)),
    enabled: !!dept,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["students-session", { department: dept, session: sessionId }],
    queryFn: () =>
      studentsApi.list({
        department: dept ? Number(dept) : undefined,
        session: sessionId ? Number(sessionId) : undefined,
        limit: 1000,
      }),
    enabled: !!dept && !!sessionId,
  });

  const students = data?.data || [];
  const meta = data?.meta;

  const showBulkActions = dept && sessionId && currentLevel;

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s: any) => s.id));
    }
  };

  const bulkPromoteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      showBar();
      const results = await Promise.allSettled(
        ids.map((id) => studentsApi.promote(id)),
      );
      return results;
    },
    onSuccess: () => {
      hideBar();
      qc.invalidateQueries({ queryKey: ["students"] });
      setSelectedIds([]);
      toast.success("Students promoted successfully!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  const bulkGraduateMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      showBar();
      const results = await Promise.allSettled(
        ids.map((id) => studentsApi.update(id, { status: "graduated" })),
      );
      return results;
    },
    onSuccess: () => {
      hideBar();
      qc.invalidateQueries({ queryKey: ["students"] });
      setSelectedIds([]);
      toast.success("Students graduated successfully!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (id: number) => {
      showBar();
      return studentsApi.notify(id);
    },
    onSuccess: () => {
      hideBar();
      toast.success("Notification sent successfully!");
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  const notifyAllMutation = useMutation({
    mutationFn: async (studentIds: number[]) => {
      showBar();
      return studentsApi.notifyAll(studentIds);
    },
    onSuccess: (result: any) => {
      hideBar();
      if (result.success > 0) {
        toast.success(`Sent ${result.success} notifications successfully!`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to send ${result.failed} notifications. ${result.errors.slice(0, 3).join(', ')}`);
      }
    },
    onError: (err: any) => {
      hideBar();
      toast.error(err?.message || String(err));
    },
  });

  // Get active levels from current students list when session is selected
  const selectedDept = depts?.find((d: any) => d.id === Number(dept));
  const activeLevels = new Set<number>();

  if (sessionData?.data) {
    sessionData.data.forEach((s: any) => {
      if (s.currentSemester) {
        activeLevels.add(s.currentSemester);
      }
    });
  }

  const sortedLevels = Array.from(activeLevels).sort((a, b) => a - b);

  const handleExport = () => {
    const columns = [
      "Roll No",
      "Registration",
      "Full Name",
      "Department",
      "Level",
      "Status",
      "Outstanding",
    ];
    const exportData = students.map((s: any) => {
      const outstanding =
        s.financeRecords?.reduce(
          (sum: number, f: any) => sum + parseFloat(f.remaining || 0),
          0,
        ) ?? 0;
      return [
        s.rollNo || "N/A",
        s.registrationNo,
        s.name,
        s.department?.code || s.department?.name,
        s.currentSemester
          ? `${s.programMode === "semester" ? "Sem" : "Year"} ${s.currentSemester}`
          : "N/A",
        s.status.toUpperCase(),
        `PKR ${outstanding.toLocaleString()}`,
      ];
    });

    exportToPDF({
      title: "Student Enrollment Directory",
      filename: "students_report",
      columns,
      data: exportData,
      summary: [
        { label: "Total Students", value: students.length.toString() },
        {
          label: "Department",
          value: dept
            ? depts?.find((d: any) => d.id === Number(dept))?.name
            : "All Departments",
        },
      ],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in p-2 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Student Directory
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage enrollments, academic progress, and financial status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => {
                  const idsWithDues = students
                    .filter((s: any) => {
                      if (!selectedIds.includes(s.id)) return false;
                      const outstanding =
                        s.financeRecords?.reduce(
                          (sum: number, f: any) =>
                            sum + parseFloat(f.remaining || 0),
                          0,
                        ) ?? 0;
                      return outstanding > 0;
                    })
                    .map((s: any) => s.id);

                  setSelectedIds((prev) =>
                    prev.filter((id) => !idsWithDues.includes(id)),
                  );
                  toast.success(
                    `Unchecked ${idsWithDues.length} students with outstanding dues`,
                  );
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Uncheck Dues
              </button>
              {(() => {
                const selectedStudents = students.filter((s: any) =>
                  selectedIds.includes(s.id),
                );
                const allAtFinalTerm = selectedStudents.every((s: any) => {
                  const totalTerms =
                    s.programMode === "semester"
                      ? (s.department?.semsPerYear || 2) *
                        (s.department?.yearsDuration || 4)
                      : s.department?.yearsDuration || 4;
                  return (s.currentSemester || 0) >= totalTerms;
                });

                if (allAtFinalTerm) {
                  return (
                    <button
                      onClick={() => {
                        const withDues = selectedStudents.filter((s: any) => {
                          const outstanding =
                            s.financeRecords?.reduce(
                              (sum: number, f: any) =>
                                sum + parseFloat(f.remaining || 0),
                              0,
                            ) ?? 0;
                          return outstanding > 0;
                        });

                        if (withDues.length > 0) {
                          toast.error(
                            `Cannot graduate: ${withDues.length} students have outstanding dues. Please uncheck them first.`,
                          );
                          return;
                        }

                        if (
                          window.confirm(
                            `Graduate ${selectedIds.length} selected students?`,
                          )
                        ) {
                          bulkGraduateMutation.mutate(selectedIds);
                        }
                      }}
                      className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <GraduationCap className="w-4 h-4" /> Graduate All (
                      {selectedIds.length})
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={() => {
                        const withDues = selectedStudents.filter((s: any) => {
                          const outstanding =
                            s.financeRecords?.reduce(
                              (sum: number, f: any) =>
                                sum + parseFloat(f.remaining || 0),
                              0,
                            ) ?? 0;
                          return outstanding > 0;
                        });

                        if (withDues.length > 0) {
                          if (
                            window.confirm(
                              `${selectedIds.length} selected. ${withDues.length} students have outstanding dues. Still want to promote them?`,
                            )
                          ) {
                            bulkPromoteMutation.mutate(selectedIds);
                          }
                        } else {
                          if (
                            window.confirm(
                              `Promote ${selectedIds.length} selected students?`,
                            )
                          ) {
                            bulkPromoteMutation.mutate(selectedIds);
                          }
                        }
                      }}
                      className="btn-primary flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90"
                    >
                      <TrendingUp className="w-4 h-4" /> Promote All (
                      {selectedIds.length})
                    </button>
                  );
                }
              })()}
            </>
          )}
          {(() => {
            const studentsWithDues = students.filter((s: any) => {
              const outstanding =
                s.financeRecords?.reduce(
                  (sum: number, f: any) => sum + parseFloat(f.remaining || 0),
                  0,
                ) ?? 0;
              return outstanding > 0;
            });
            
            if (studentsWithDues.length > 0) {
              return (
                <button
                  onClick={() => {
                    if (window.confirm(`Send fee reminder to ${studentsWithDues.length} students with outstanding dues?`)) {
                      notifyAllMutation.mutate(studentsWithDues.map((s: any) => s.id));
                    }
                  }}
                  className="btn-secondary flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  title="Notify all students with outstanding dues"
                >
                  <Bell className="w-4 h-4" /> Notify All ({studentsWithDues.length})
                </button>
              );
            }
            return null;
          })()}
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2"
            title="Print Page"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
            title="Export to PDF"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <Link
            href="/enrollment"
            className="btn-primary flex items-center gap-2 group shadow-brand-gold/20 hover:scale-105 transition-all w-full md:w-auto"
          >
            <UserPlus className="w-5 h-5 group-hover:text-brand-gold transition-colors" />{" "}
            Enroll New Student
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>

      <div className="card-premium p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-blue/5 rounded-xl">
          <Users className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-black text-brand-blue uppercase tracking-widest">
            {meta?.total ?? 0} Students
          </span>
        </div>
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
            className="input-field md:w-36"
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              setSessionId("");
              setPage(1);
            }}
          >
            <option value="">All Depts</option>
            {depts?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.code || d.name}
              </option>
            ))}
          </select>
          <select
            className="input-field md:w-36 disabled:opacity-50 disabled:bg-slate-50"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setCurrentLevel("");
              setPage(1);
            }}
            disabled={!dept}
          >
            <option value="">All Sessions</option>
            {sessions?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="input-field md:w-28 disabled:opacity-50 disabled:bg-slate-50"
            value={currentLevel}
            onChange={(e) => {
              setCurrentLevel(e.target.value);
              setPage(1);
            }}
            disabled={!sessionId}
          >
            <option value="">
              {!dept
                ? "Level"
                : selectedDept?.offersSem
                  ? "All Sems"
                  : "All Years"}
            </option>
            {sortedLevels.map((level) => (
              <option key={level} value={level}>
                {selectedDept?.offersSem ? `Sem ${level}` : `Year ${level}`}
              </option>
            ))}
          </select>
          <select
            className="input-field md:w-32"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="left">Left</option>
            <option value="deactive">Deactive</option>
          </select>
        </div>
      </div>

      <div className="card-premium overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 h-full scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm transition-shadow">
              <tr className="bg-slate-50">
                {showBulkActions && (
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === students.length &&
                        students.length > 0
                      }
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                    />
                  </th>
                )}
                {[
                  "Student Info",
                  "Academic Track",
                  "Academic Score",
                  "Financials",
                  "Status",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={clsx(
                      "px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100",
                      h === "Actions" && "text-right",
                      h === "Financials" && "text-center",
                      h === "Academic Score" && "text-center",
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
                  const totalPaid =
                    s.financeRecords?.reduce(
                      (sum: number, f: any) => sum + parseFloat(f.feePaid || 0),
                      0,
                    ) ?? 0;
                  const totalDue =
                    s.financeRecords?.reduce(
                      (sum: number, f: any) => sum + parseFloat(f.feeDue || 0),
                      0,
                    ) ?? 0;
                  const outstanding =
                    s.financeRecords?.reduce(
                      (sum: number, f: any) =>
                        sum + parseFloat(f.remaining || 0),
                      0,
                    ) ?? 0;

                  const totalTerms =
                    s.programMode === "semester"
                      ? (s.department?.semsPerYear || 2) *
                        (s.department?.yearsDuration || 4)
                      : s.department?.yearsDuration || 4;
                  const isFinalTerm = (s.currentSemester || 0) >= totalTerms;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {showBulkActions && (
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSelection(s.id)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all">
                            <GraduationCap className="w-5 h-5" />
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
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-tight">
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
                            {s.programMode === "semester"
                              ? "Semester"
                              : "Annual"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {s.programMode === "semester" ? "Sem" : "Year"}{" "}
                            {s.currentSemester !== null &&
                            s.currentSemester !== undefined
                              ? s.currentSemester
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-1">
                          {(s.cgpa || s.sgpa) &&
                          (s.obtainedMarks || s.totalMarks) ? (
                            <div className="flex flex-col items-center">
                              {s.cgpa && (
                                <p className="text-[10px] font-black text-slate-700">
                                  CGPA:{" "}
                                  <span className="text-brand-blue">
                                    {s.cgpa}
                                  </span>
                                </p>
                              )}
                              {s.sgpa && (
                                <p className="text-[9px] font-bold text-slate-400">
                                  SGPA: {s.sgpa}
                                </p>
                              )}
                              <p className="text-[10px] font-black text-slate-700 mt-1">
                                {s.obtainedMarks || 0} / {s.totalMarks || 0}
                              </p>
                            </div>
                          ) : s.cgpa || s.sgpa ? (
                            <div className="flex flex-col items-center">
                              {s.cgpa && (
                                <p className="text-[10px] font-black text-slate-700">
                                  CGPA:{" "}
                                  <span className="text-brand-blue">
                                    {s.cgpa}
                                  </span>
                                </p>
                              )}
                              {s.sgpa && (
                                <p className="text-[9px] font-bold text-slate-400">
                                  SGPA: {s.sgpa}
                                </p>
                              )}
                            </div>
                          ) : s.obtainedMarks || s.totalMarks ? (
                            <div className="flex flex-col items-center">
                              <p className="text-[10px] font-black text-slate-700">
                                {s.obtainedMarks || 0} / {s.totalMarks || 0}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Total Marks
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-800">
                                PKR {totalPaid.toLocaleString()}
                              </p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">
                                Paid / Total
                              </p>
                            </div>
                            <div className="h-6 w-[1px] bg-slate-100" />
                            <div className="text-left">
                              <p className="text-[10px] font-black text-slate-400">
                                {totalDue.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div
                            className={clsx(
                              "flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-lg w-fit uppercase tracking-wider",
                              outstanding > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600",
                            )}
                          >
                            {outstanding > 0 ? (
                              `Outstanding: PKR ${outstanding.toLocaleString()}`
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Fees
                                Cleared
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          className={clsx(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer outline-none appearance-none text-center bg-transparent",
                            STATUS_BADGES[s.status] ||
                              "bg-slate-100 text-slate-500",
                          )}
                          value={s.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === "graduated" && outstanding > 0) {
                              toast.error(
                                `Cannot graduate: Outstanding dues of PKR ${outstanding.toLocaleString()} must be cleared first.`,
                              );
                              return;
                            }
                            if (
                              window.confirm(`Change status to ${newStatus}?`)
                            ) {
                              updateStatusMutation.mutate({
                                id: s.id,
                                status: newStatus,
                                outstanding,
                              });
                            }
                          }}
                        >
                          <option
                            value="active"
                            className="text-slate-900 bg-white"
                          >
                            ACTIVE
                          </option>
                          <option
                            value="deactive"
                            className="text-slate-900 bg-white"
                          >
                            DEACTIVE
                          </option>
                          <option
                            value="left"
                            className="text-slate-900 bg-white"
                          >
                            LEFT
                          </option>
                          <option
                            value="graduated"
                            className="text-slate-900 bg-white"
                          >
                            GRADUATED
                          </option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {outstanding > 0 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Send fee reminder to ${s.name}?`)) {
                                  notifyMutation.mutate(s.id);
                                }
                              }}
                              disabled={notifyMutation.isPending}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Send Fee Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {s.status === "active" && !isFinalTerm && (
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
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold text-[9px] hover:text-white rounded-lg font-black uppercase tracking-widest transition-all"
                            >
                              <TrendingUp className="w-3 h-3" />
                              Promote
                            </button>
                          )}
                          {s.status === "active" && isFinalTerm && (
                            <button
                              onClick={() => {
                                if (outstanding > 0) {
                                  toast.error(
                                    `Cannot graduate: Outstanding dues of PKR ${outstanding.toLocaleString()} must be cleared first.`,
                                  );
                                  return;
                                }
                                if (
                                  window.confirm(`Mark ${s.name} as Graduated?`)
                                ) {
                                  graduateMutation.mutate({
                                    id: s.id,
                                    outstanding,
                                  });
                                }
                              }}
                              disabled={graduateMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-600 text-[9px] hover:text-white rounded-lg font-black uppercase tracking-widest transition-all"
                            >
                              <GraduationCap className="w-3 h-3" />
                              Graduate
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
                            href={`/reports/student-ledger/${s.id}`}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Student Ledger"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/payments?tab=portal&studentId=${s.id}&returnUrl=/students`}
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
    </div>
  );
}
