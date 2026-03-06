"use client";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

export default function ImportExportPage() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-center md:text-left">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Data Migration Hub
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Bulk manage student records and financial history via Excel/CSV.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="card-premium p-8 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Bulk Import</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Upload student records
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            className={clsx(
              "flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 gap-4",
              isDragging
                ? "border-brand-blue bg-brand-blue/5 scale-[0.98]"
                : "border-slate-200 bg-slate-50",
            )}
          >
            <div className="w-20 h-20 bg-white rounded-full shadow-premium flex items-center justify-center text-slate-300">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">
                Drag & Drop Excel File
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports .xlsx, .xls, and .csv formats
              </p>
            </div>
            <button className="mt-4 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Browse Files
            </button>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-gold shrink-0" />
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              Please ensure your Excel file follows the{" "}
              <span className="text-brand-blue font-bold cursor-pointer hover:underline">
                approved template
              </span>
              . Columns must exactly match the system specification to avoid
              processing errors.
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="space-y-8 flex flex-col">
          <div className="card-premium p-8 h-full bg-brand-blue-dark text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black tracking-tight">
                System Export
              </h3>
              <p className="text-blue-300 font-medium text-sm mt-2">
                Generate a full institutional backup or filtered report for
                external audit.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                <button className="px-5 py-2.5 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ledger PDF
                </button>
                <button className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Student Data
                </button>
              </div>
            </div>
          </div>

          <div className="card-premium p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-slate-800 mb-6">
              Task History
            </h3>
            <div className="space-y-4">
              {[
                {
                  task: "Students Import",
                  date: "2h ago",
                  status: "completed",
                  icon: CheckCircle2,
                  color: "text-green-500",
                },
                {
                  task: "Session Fee Export",
                  date: "Yesterday",
                  status: "completed",
                  icon: CheckCircle2,
                  color: "text-green-500",
                },
              ].map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <log.icon className={clsx("w-5 h-5", log.color)} />
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {log.task}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {log.date} • Admin User
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
