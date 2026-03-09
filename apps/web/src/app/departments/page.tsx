"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, sessionsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import {
  Plus,
  Building2,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";

// ─────────────────────────────── Department Modal ──────────────────────────
function DepartmentModal({
  onClose,
  editData = null,
}: {
  onClose: () => void;
  editData?: any;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [form, setForm] = useState({
    name: editData?.name || "",
    code: editData?.code || "",
    description: editData?.description || "",
    programMode: editData?.offersSem ? "semester" : editData?.offersAnn ? "annual" : "semester",
    yearsDuration: editData?.yearsDuration?.toString() || "4",
    totalSemesters:
      editData?.semsPerYear && editData?.yearsDuration
        ? (editData.semsPerYear * editData.yearsDuration).toString()
        : "8",
    semsPerYear: editData?.semsPerYear?.toString() || "2",
    semFee:
      editData?.feeStructures?.find((f: any) => f.programMode === "semester")
        ?.feeAmount || "",
    annFee:
      editData?.feeStructures?.find((f: any) => f.programMode === "annual")
        ?.feeAmount || "",
  });

  useEffect(() => {
    if (
      form.programMode === "semester" &&
      form.totalSemesters &&
      form.semsPerYear
    ) {
      const years = Number(form.totalSemesters) / Number(form.semsPerYear);
      if (!isNaN(years) && years > 0)
        setForm((f) => ({ ...f, yearsDuration: years.toString() }));
    }
  }, [form.totalSemesters, form.semsPerYear, form.programMode]);

  const mutation = useMutation({
    mutationFn: isEdit
      ? (dto: any) => departmentsApi.update(editData.id, dto)
      : departmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => departmentsApi.delete(editData.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Manage Department" : "New Department"}
      subtitle={
        isEdit ? `Editing ${editData.name}` : "Add an academic division"
      }
      icon={isEdit ? Settings : Building2}
      iconColor="text-brand-blue"
      maxWidth="max-w-lg"
      footer={
        <div className="flex gap-3 w-full">
          {isEdit && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this department? All sessions must be deleted first.",
                  )
                )
                  deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="p-4 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center group"
              title="Delete Department"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button onClick={onClose} className="btn-secondary px-6">
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            disabled={
              !form.name || mutation.isPending || deleteMutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                name: form.name,
                code: form.code || undefined,
                description: form.description || undefined,
                yearsDuration: Number(form.yearsDuration),
                offersSem: form.programMode === "semester",
                offersAnn: form.programMode === "annual",
                semsPerYear:
                  form.programMode === "semester"
                    ? Number(form.semsPerYear)
                    : null,
                feeStructures: [
                  ...(form.programMode === "semester" && form.semFee
                    ? [{ programMode: "semester", feeAmount: form.semFee }]
                    : []),
                  ...(form.programMode === "annual" && form.annFee
                    ? [{ programMode: "annual", feeAmount: form.annFee }]
                    : []),
                ],
              })
            }
          >
            {mutation.isPending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Department"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 text-center">
            Program Structure
          </label>
          <div className="bg-slate-100 p-1.5 rounded-2xl flex relative h-14">
            <div
              className={clsx(
                "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                form.programMode === "semester"
                  ? "left-1.5"
                  : "left-[calc(50%+1.5px)]",
              )}
            />
            <button
              type="button"
              onClick={() => set("programMode", "semester")}
              className={clsx(
                "flex-1 relative z-10 text-sm font-black uppercase tracking-wider transition-colors",
                form.programMode === "semester"
                  ? "text-brand-blue"
                  : "text-slate-400",
              )}
            >
              Semester
            </button>
            <button
              type="button"
              onClick={() => set("programMode", "annual")}
              className={clsx(
                "flex-1 relative z-10 text-sm font-black uppercase tracking-wider transition-colors",
                form.programMode === "annual"
                  ? "text-brand-blue"
                  : "text-slate-400",
              )}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Department Name *
            </label>
            <input
              className="input-field !text-slate-900 font-bold"
              placeholder="e.g. Faculty of Law"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Dept. Code
            </label>
            <input
              className="input-field !text-slate-900 font-bold"
              placeholder="e.g. LAW"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Description
          </label>
          <textarea
            className="input-field !text-slate-900 font-bold resize-none"
            placeholder="Brief description (optional)"
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {form.programMode === "semester" ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
                Total Sems *
              </label>
              <input
                type="number"
                className="input-field !text-slate-900 font-bold"
                value={form.totalSemesters}
                onChange={(e) => set("totalSemesters", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
                Sems / Year *
              </label>
              <input
                type="number"
                className="input-field !text-slate-900 font-bold"
                value={form.semsPerYear}
                onChange={(e) => set("semsPerYear", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
                Years
              </label>
              <input
                type="number"
                className="input-field !text-slate-900 font-bold"
                value={form.yearsDuration}
                onChange={(e) => set("yearsDuration", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Duration in Years *
            </label>
            <input
              type="number"
              className="input-field !text-slate-900 font-bold"
              value={form.yearsDuration}
              onChange={(e) => set("yearsDuration", e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            {form.programMode === "semester"
              ? "Semester Fee (PKR)"
              : "Annual Fee (PKR)"}
          </label>
          <input
            type="number"
            className="input-field !text-slate-900 font-bold"
            placeholder={
              form.programMode === "semester" ? "e.g. 25000" : "e.g. 60000"
            }
            value={form.programMode === "semester" ? form.semFee : form.annFee}
            onChange={(e) =>
              set(
                form.programMode === "semester" ? "semFee" : "annFee",
                e.target.value,
              )
            }
          />
        </div>

        {mutation.error && (
          <p className="text-red-500 text-xs font-bold pb-2">
            {String(mutation.error)}
          </p>
        )}
        {deleteMutation.error && (
          <p className="text-red-500 text-xs font-bold pb-2">
            {String(deleteMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────── Session Modal ─────────────────────────
function SessionModal({
  onClose,
  editData = null,
  preselectedDept = null,
}: {
  onClose: () => void;
  editData?: any;
  preselectedDept?: any;
}) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [form, setForm] = useState({
    startYear:
      editData?.startYear?.toString() || new Date().getFullYear().toString(),
    endYear: editData?.endYear?.toString() || "",
    label: editData?.label || "",
  });

  useEffect(() => {
    if (preselectedDept && form.startYear && !isEdit) {
      const duration = Number(preselectedDept.yearsDuration) || 5;
      const end = Number(form.startYear) + duration;
      setForm((f) => ({
        ...f,
        endYear: end.toString(),
        label: `${f.startYear}–${end}`,
      }));
    }
  }, [preselectedDept, form.startYear, isEdit]);

  const mutation = useMutation({
    mutationFn: isEdit
      ? (dto: any) => sessionsApi.update(editData.id, dto)
      : (dto: any) => sessionsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sessionsApi.delete(editData.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Edit Session" : "Add Session"}
      subtitle={
        isEdit
          ? `Managing ${editData.label}`
          : `New session for ${preselectedDept?.name}`
      }
      icon={Calendar}
      iconColor="text-brand-gold"
      footer={
        <div className="flex gap-3 w-full">
          {isEdit && (
            <button
              onClick={() => {
                if (window.confirm("Delete this session?"))
                  deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="p-4 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center group"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button onClick={onClose} className="btn-secondary px-6">
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            disabled={
              !form.startYear ||
              !form.endYear ||
              mutation.isPending ||
              deleteMutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                departmentId: Number(
                  preselectedDept?.id || editData?.departmentId,
                ),
                startYear: Number(form.startYear),
                endYear: Number(form.endYear),
                label: form.label,
              })
            }
          >
            {mutation.isPending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Session"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
          <Building2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
          <span className="text-sm font-black text-slate-700">
            {preselectedDept?.name || editData?.department?.name}
          </span>
          <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {preselectedDept?.yearsDuration ||
              editData?.department?.yearsDuration}
            y program
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              Start Year *
            </label>
            <input
              type="number"
              className="input-field !text-slate-900 font-bold"
              value={form.startYear}
              onChange={(e) => set("startYear", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
              End Year *
            </label>
            <input
              type="number"
              className="input-field !text-slate-900 font-bold"
              value={form.endYear}
              onChange={(e) => set("endYear", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Session Label
          </label>
          <input
            className="input-field !text-slate-900 font-bold"
            placeholder="e.g. 2024–2029"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
          />
        </div>

        {mutation.error && (
          <p className="text-red-500 text-xs font-bold pb-2">
            {String(mutation.error)}
          </p>
        )}
        {deleteMutation.error && (
          <p className="text-red-500 text-xs font-bold pb-2">
            {String(deleteMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────── Department Card ───────────────────────────
function DepartmentCard({
  dept,
  sessions,
  onManageDept,
  onAddSession,
  onManageSession,
}: {
  dept: any;
  sessions: any[];
  onManageDept: () => void;
  onAddSession: () => void;
  onManageSession: (s: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentYear = new Date().getFullYear();

  const totalStudents = dept._count?.students ?? 0;
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(
    (s) => currentYear >= s.startYear && currentYear <= s.endYear,
  ).length;

  return (
    <div className="card-premium overflow-hidden transition-all duration-300">
      {/* Dept Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">{dept.name}</h3>
              {dept.code && (
                <span className="text-[9px] font-black text-brand-blue bg-blue-50 px-2 py-0.5 rounded uppercase">
                  {dept.code}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onManageDept}
            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-all"
            title="Manage Department"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {dept.description && (
          <p className="text-sm font-medium text-slate-500 mb-4">
            {dept.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {dept.offersSem && (
            <div className="px-2.5 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase">
              {dept.semsPerYear * dept.yearsDuration} Semesters
            </div>
          )}
          {dept.offersAnn && (
            <div className="px-2.5 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-600 uppercase">
              Annual
            </div>
          )}
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
            {dept.yearsDuration}y Duration
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Users className="w-3.5 h-3.5" /> {totalStudents} Students
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" /> {totalSessions} Sessions
            </div>
            {activeSessions > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                {activeSessions} Active
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-[10px] font-black text-brand-blue uppercase tracking-wider hover:text-brand-gold transition-colors"
          >
            Sessions{" "}
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Sessions Panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sessions for {dept.name}
            </p>
            <button
              onClick={onAddSession}
              className="flex items-center gap-1 text-[10px] font-black text-brand-blue uppercase tracking-wider hover:text-brand-gold transition-colors px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-brand-gold"
            >
              <Plus className="w-3 h-3" /> Add Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No sessions yet
              </p>
              <button
                onClick={onAddSession}
                className="mt-3 text-xs font-black text-brand-blue hover:text-brand-gold uppercase tracking-wider"
              >
                Create First Session →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((session) => {
                const isPassedOut = currentYear > session.endYear;
                const isRunning =
                  currentYear >= session.startYear &&
                  currentYear <= session.endYear;

                // Get unique active semesters/years
                const activeLevels = new Set<number>();
                if (session.students) {
                  session.students.forEach((s: any) => {
                    if (s.currentSemester) {
                      if (dept.offersSem) {
                        activeLevels.add(s.currentSemester);
                      } else {
                        const year = Math.ceil(s.currentSemester / (dept.semsPerYear || 1));
                        activeLevels.add(year);
                      }
                    }
                  });
                }
                const sortedLevels = Array.from(activeLevels).sort((a, b) => a - b);

                return (
                  <div
                    key={session.id}
                    className={clsx(
                      "bg-white rounded-2xl p-4 border transition-all",
                      isRunning
                        ? "border-green-200"
                        : isPassedOut
                          ? "border-slate-100"
                          : "border-blue-100",
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-black text-slate-800 text-sm">
                          {session.label}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {session.startYear} — {session.endYear}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPassedOut ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Passed Out
                          </span>
                        ) : isRunning ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" /> Running
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-brand-blue rounded-md text-[9px] font-black uppercase">
                            Upcoming
                          </span>
                        )}
                        <button
                          onClick={() => onManageSession(session)}
                          className="p-1.5 text-slate-400 hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Student Count + Active Levels */}
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                        <Users className="w-3 h-3" />{" "}
                        {session._count?.students || 0} Enrolled
                      </div>
                      {sortedLevels.length > 0 && (
                        <div className="text-[10px] font-black text-brand-blue uppercase">
                          {dept.offersSem ? "Sems" : "Years"}: {sortedLevels.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────── Main Page ──────────────────────────────────
export default function DepartmentsPage() {
  const [deptModal, setDeptModal] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({ isOpen: false, data: null });
  const [sessionModal, setSessionModal] = useState<{
    isOpen: boolean;
    data: any | null;
    dept: any | null;
  }>({ isOpen: false, data: null, dept: null });

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const { data: allSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
  });

  const getSessionsForDept = (deptId: number) =>
    (allSessions || []).filter((s: any) => s.departmentId === deptId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="flex justify-between items-end mb-8">
          <div className="h-10 w-64 bg-slate-100 rounded-lg" />
          <div className="h-12 w-40 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {deptModal.isOpen && (
        <DepartmentModal
          editData={deptModal.data}
          onClose={() => setDeptModal({ isOpen: false, data: null })}
        />
      )}
      {sessionModal.isOpen && (
        <SessionModal
          editData={sessionModal.data}
          preselectedDept={sessionModal.dept}
          onClose={() =>
            setSessionModal({ isOpen: false, data: null, dept: null })
          }
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic Departments
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage institutional divisions, fee structures, and academic
            sessions.
          </p>
        </div>
        <button
          onClick={() => setDeptModal({ isOpen: true, data: null })}
          className="btn-primary flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
          Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Departments",
            value: departments?.length ?? 0,
            icon: Building2,
            color: "text-brand-blue",
          },
          {
            label: "Sessions",
            value: allSessions?.length ?? 0,
            icon: Calendar,
            color: "text-brand-gold",
          },
          {
            label: "Students",
            value:
              departments?.reduce(
                (s: number, d: any) => s + (d._count?.students ?? 0),
                0,
              ) ?? 0,
            icon: Users,
            color: "text-green-600",
          },
          {
            label: "Programs",
            value:
              departments?.reduce(
                (s: number, d: any) => s + (d.feeStructures?.length ?? 0),
                0,
              ) ?? 0,
            icon: GraduationCap,
            color: "text-purple-600",
          },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-5 flex items-center gap-4">
            <div className={clsx("p-3 rounded-2xl bg-slate-50", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Department Cards */}
      {departments && departments.length === 0 ? (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-700">
            No Departments Yet
          </h3>
          <p className="text-slate-400 mt-2 max-w-xs text-sm">
            Create your first academic department to get started.
          </p>
          <button
            onClick={() => setDeptModal({ isOpen: true, data: null })}
            className="btn-primary mt-8"
          >
            Create First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments?.map((dept: any) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              sessions={getSessionsForDept(dept.id)}
              onManageDept={() => setDeptModal({ isOpen: true, data: dept })}
              onAddSession={() =>
                setSessionModal({ isOpen: true, data: null, dept })
              }
              onManageSession={(s) =>
                setSessionModal({
                  isOpen: true,
                  data: s,
                  dept:
                    departments.find((d: any) => d.id === s.departmentId) ||
                    dept,
                })
              }
            />
          ))}
          <button
            onClick={() => setDeptModal({ isOpen: true, data: null })}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[200px]"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand-gold group-hover:text-white transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-sm font-black text-slate-400 group-hover:text-brand-gold uppercase tracking-widest">
              New Department
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
