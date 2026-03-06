"use client";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi, departmentsApi } from "@/lib/api/client";
import {
  Calendar,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

export default function SessionsPage() {
  const [selectedDept, setSelectedDept] = useState<number | null>(null);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", selectedDept],
    queryFn: () => sessionsApi.list(selectedDept!),
    enabled: !!selectedDept,
  });

  // Set initial department if not set
  if (!selectedDept && departments && departments.length > 0) {
    setSelectedDept(departments[0].id);
  }

  if (isLoading && selectedDept) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 w-64 bg-slate-100 rounded-lg mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const deptName =
    departments?.find((d) => d.id === selectedDept)?.name ||
    "Select Department";

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic Sessions
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Timeline and enrollment periods for {deptName}.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 group shadow-brand-gold/20">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Create Session
        </button>
      </div>

      {/* Dept Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit overflow-x-auto">
        {departments?.map((dept: any) => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={clsx(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              selectedDept === dept.id
                ? "bg-white text-brand-blue shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Sessions List / Timeline */}
      <div className="space-y-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session: any) => (
            <div
              key={session.id}
              className="card-premium p-6 group hover:translate-x-1 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className={clsx(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                      session.active
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-50 text-slate-400",
                    )}
                  >
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(session.startDate).getFullYear()} -{" "}
                        {new Date(session.endDate).getFullYear()}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <div
                        className={clsx(
                          "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                          session.active ? "text-green-600" : "text-slate-400",
                        )}
                      >
                        {session.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                            Enrollment
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" /> Closed
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Enrollment Cap
                    </p>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      120 / 150
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-100 hidden sm:block" />
                  <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-50 text-brand-blue font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all">
                    Configure
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card-premium p-12 flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-800">
              No Sessions Found
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">
              There are no academic sessions registered for this department yet.
            </p>
            <button className="mt-8 btn-secondary">Create First Session</button>
          </div>
        )}
      </div>
    </div>
  );
}
