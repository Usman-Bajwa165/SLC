"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, departmentsApi } from "@/lib/api/client";
import Modal from "@/components/ui/Modal";
import { clsx } from "clsx";
import {
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Trash2,
  Settings,
} from "lucide-react";

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

  const [deptId, setDeptId] = useState(
    editData?.departmentId?.toString() || preselectedDept?.id?.toString() || "",
  );
  const [form, setForm] = useState({
    startYear:
      editData?.startYear?.toString() || new Date().getFullYear().toString(),
    endYear: editData?.endYear?.toString() || "",
    label: editData?.label || "",
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const selectedDept = departments?.find(
    (d: any) => d.id.toString() === deptId,
  );

  // Automate End Year and Label
  useEffect(() => {
    if (selectedDept && form.startYear && !isEdit) {
      const duration = Number(selectedDept.yearsDuration) || 5;
      const end = Number(form.startYear) + duration;
      setForm((f) => ({
        ...f,
        endYear: end.toString(),
        label: `${f.startYear}–${end}`,
      }));
    }
  }, [selectedDept, form.startYear, isEdit]);

  const mutation = useMutation({
    mutationFn: isEdit
      ? (dto: any) => sessionsApi.update(editData.id, dto)
      : (dto: any) => sessionsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sessionsApi.delete(editData.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      onClose();
    },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Edit Session" : "Create Session"}
      subtitle={
        isEdit ? `Managing ${editData.label}` : "Define a new academic period"
      }
      icon={Calendar}
      iconColor="text-brand-gold"
      footer={
        <div className="flex gap-3 w-full">
          {isEdit && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this session? This action cannot be undone.",
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="p-4 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center group"
              title="Delete Session"
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
              !deptId ||
              !form.startYear ||
              !form.endYear ||
              mutation.isPending ||
              deleteMutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                departmentId: Number(deptId),
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
        <div>
          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">
            Target Department *
          </label>
          <select
            className="input-field !text-slate-900 font-bold"
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            disabled={isEdit || !!preselectedDept}
          >
            <option value="">Select Department</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {selectedDept && (
            <p className="text-[10px] text-brand-blue font-bold mt-1.5 uppercase tracking-wider">
              Program Duration: {selectedDept.yearsDuration} Years
            </p>
          )}
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
            Session Label (Display Name)
          </label>
          <input
            className="input-field !text-slate-900 font-bold"
            placeholder="e.g. 2024–2029"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
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

export default function SessionsPage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({
    isOpen: false,
    data: null,
  });

  const [activeTab, setActiveTab] = useState<number | null>(null);

  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  // Set the first department as active tab initially
  useEffect(() => {
    if (departments?.length && activeTab === null) {
      setActiveTab(departments[0].id);
    }
  }, [departments, activeTab]);

  const { data: allSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list(),
  });

  const currentYear = new Date().getFullYear();

  if (deptsLoading || sessionsLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="flex justify-between items-end mb-8">
          <div className="h-10 w-64 bg-slate-100 rounded-lg" />
          <div className="h-12 w-40 bg-slate-100 rounded-xl" />
        </div>
        <div className="flex gap-4 mb-6">
          <div className="h-12 w-32 bg-slate-100 rounded-xl" />
          <div className="h-12 w-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const preselectedDept = departments?.find((d: any) => d.id === activeTab);

  // Filter sessions for the active tab
  const activeSessions =
    allSessions?.filter((s: any) => s.departmentId === activeTab) || [];

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {modalState.isOpen && (
        <SessionModal
          editData={modalState.data}
          onClose={() => setModalState({ isOpen: false, data: null })}
          preselectedDept={preselectedDept}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic Sessions
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage intake periods and graduation cycles.
          </p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, data: null })}
          className="btn-primary flex items-center gap-2 group"
          disabled={!activeTab}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
          Add Session to {preselectedDept?.code || "Department"}
        </button>
      </div>

      {departments && departments.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {departments.map((dept: any) => (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={clsx(
                "px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                activeTab === dept.id
                  ? "bg-brand-gold text-slate-900 shadow-md shadow-brand-gold/20 scale-105"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-brand-gold hover:text-brand-gold",
              )}
            >
              {dept.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
          Please create a department first before adding sessions.
        </div>
      )}

      {!activeSessions || activeSessions.length === 0 ? (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <Calendar className="w-16 h-16 text-slate-200 mb-6" />
          <h3 className="text-xl font-black text-slate-700">
            No Sessions Found
          </h3>
          <p className="text-slate-400 mt-2 max-w-xs text-sm">
            Define academic periods for{" "}
            {preselectedDept?.name || "this department"}.
          </p>
          <button
            onClick={() => setModalState({ isOpen: true, data: null })}
            className="btn-primary mt-8"
            disabled={!activeTab}
          >
            Create First Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeSessions.map((session: any) => {
            const isPassedOut = currentYear > session.endYear;
            const isRunning =
              currentYear >= session.startYear &&
              currentYear <= session.endYear;
            const admissionClosed = currentYear >= session.startYear;

            return (
              <div
                key={session.id}
                className="card-premium p-6 group hover:border-brand-gold/20 transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      isRunning
                        ? "bg-green-50 text-green-600"
                        : isPassedOut
                          ? "bg-slate-100 text-slate-400"
                          : "bg-blue-50 text-brand-blue",
                    )}
                  >
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {isPassedOut ? (
                      <div className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Passed Out
                      </div>
                    ) : isRunning ? (
                      <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3 animate-pulse" /> Running
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 bg-blue-50 text-brand-blue rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        Upcoming
                      </div>
                    )}

                    {admissionClosed && !isPassedOut && (
                      <div className="px-2 py-0.5 bg-red-50 text-red-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-red-100">
                        Admissions Closed
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-black text-slate-800">
                    {session.label}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {session.startYear} — {session.endYear}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {session._count?.students || 0} Enrolled
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setModalState({ isOpen: true, data: session })
                    }
                    className="p-2 text-slate-400 hover:text-brand-gold hover:bg-brand-gold/5 rounded-xl transition-all"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
