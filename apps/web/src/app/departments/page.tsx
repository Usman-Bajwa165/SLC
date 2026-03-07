"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import {
  Plus,
  Search,
  Building2,
  Trash2,
  ChevronRight,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";

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
    programMode: editData?.offersSem ? "semester" : "annual",
    yearsDuration: editData?.yearsDuration?.toString() || "5",
    totalSemesters: editData?.semsPerYear && editData?.yearsDuration 
      ? (editData.semsPerYear * editData.yearsDuration).toString()
      : "10",
    semsPerYear: editData?.semsPerYear?.toString() || "2",
    semFee:
      editData?.feeStructures?.find((f: any) => f.programMode === "semester")
        ?.feeAmount || "",
    annFee:
      editData?.feeStructures?.find((f: any) => f.programMode === "annual")
        ?.feeAmount || "",
  });

  // Calculate duration if semesters change
  useEffect(() => {
    if (
      form.programMode === "semester" &&
      form.totalSemesters &&
      form.semsPerYear
    ) {
      const years = Number(form.totalSemesters) / Number(form.semsPerYear);
      if (!isNaN(years) && years > 0) {
        setForm((f) => ({ ...f, yearsDuration: years.toString() }));
      }
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
                    "Delete this department? This requires all its sessions to be deleted first.",
                  )
                ) {
                  deleteMutation.mutate();
                }
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
                    ? [
                        {
                          programMode: "semester",
                          feeAmount: form.semFee,
                        },
                      ]
                    : []),
                  ...(form.programMode === "annual" && form.annFee
                    ? [
                        {
                          programMode: "annual",
                          feeAmount: form.annFee,
                        },
                      ]
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
        {/* Program Mode Slider */}
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
              Dpt. Code
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
            placeholder="Brief description of the department (optional)"
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {form.programMode === "semester" ? (
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                Years (Auto)
              </label>
              <div className="input-field bg-slate-50 !text-slate-900 font-black flex items-center">
                {form.yearsDuration}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
          <p className="text-red-500 text-xs font-bold mt-2 pb-2">
            {String(mutation.error)}
          </p>
        )}
        {deleteMutation.error && (
          <p className="text-red-500 text-xs font-bold mt-2 pb-2">
            {String(deleteMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function DepartmentsPage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({
    isOpen: false,
    data: null,
  });

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

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
      {modalState.isOpen && (
        <DepartmentModal
          editData={modalState.data}
          onClose={() => setModalState({ isOpen: false, data: null })}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic Departments
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage institutional divisions and fee structures.
          </p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, data: null })}
          className="btn-primary flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Departments",
            value: departments?.length ?? 0,
            icon: Building2,
            color: "text-brand-blue",
          },
          {
            label: "Total Students",
            value:
              departments?.reduce(
                (s: number, d: any) => s + (d._count?.students ?? 0),
                0,
              ) ?? 0,
            icon: Users,
            color: "text-brand-gold",
          },
          {
            label: "Programs",
            value:
              departments?.reduce(
                (s: number, d: any) => s + (d.feeStructures?.length ?? 0),
                0,
              ) ?? 0,
            icon: GraduationCap,
            color: "text-green-600",
          },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-6 flex items-center gap-4">
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
            onClick={() => setModalState({ isOpen: true, data: null })}
            className="btn-primary mt-8"
          >
            Create First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((dept: any) => (
            <div
              key={dept.id}
              className="card-premium p-6 group hover:border-brand-blue/20 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                  <Building2 className="w-7 h-7" />
                </div>
                {dept.code && (
                  <div className="px-2.5 py-1 bg-blue-50 text-brand-blue rounded-lg text-[9px] font-black uppercase">
                    {dept.code}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 group-hover:text-brand-blue transition-colors">
                  {dept.name}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {dept.description || "No description provided."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {dept.offersSem && (
                    <div className="px-3 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase">
                      {dept.semsPerYear * dept.yearsDuration} Semesters
                    </div>
                  )}
                  {dept.offersAnn && (
                    <div className="px-3 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-600 uppercase">
                      Annual
                    </div>
                  )}
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                    {dept.yearsDuration}y Duration
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {dept._count?.students ?? 0} Students
                </div>
                <button
                  onClick={() => setModalState({ isOpen: true, data: dept })}
                  className="flex items-center gap-1 text-xs font-black text-brand-blue uppercase tracking-wider group/link hover:text-brand-gold transition-colors"
                >
                  Manage{" "}
                  <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setModalState({ isOpen: true, data: null })}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[300px]"
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
