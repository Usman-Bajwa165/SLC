"use client";
import { useQuery } from "@tanstack/react-query";
import { departmentsApi } from "@/lib/api/client";
import {
  Building2,
  Plus,
  Users,
  GraduationCap,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { clsx } from "clsx";

export default function DepartmentsPage() {
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic Departments
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Manage institutional divisions and fee structures.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add Department
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Departments",
            value: departments?.length || 0,
            icon: Building2,
            color: "text-brand-blue",
          },
          {
            label: "Active Students",
            value: "450+",
            icon: Users,
            color: "text-brand-gold",
          },
          {
            label: "Programs Offered",
            value: "8",
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

      {/* Grid */}
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
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-800 group-hover:text-brand-blue transition-colors">
                {dept.name}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-2">
                {dept.description || "No description provided."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                  Active
                </div>
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                  {dept.code || "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"
                  />
                ))}
              </div>
              <button className="flex items-center gap-1 text-xs font-black text-brand-blue uppercase tracking-wider group/link">
                View Details
                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add New Placeholder */}
        <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-all group min-h-[300px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand-gold group-hover:text-white transition-all">
            <Plus className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-400 group-hover:text-brand-gold uppercase tracking-widest">
              New Department
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add a new academic division
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
