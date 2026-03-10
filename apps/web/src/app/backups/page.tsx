"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backupsApi } from "@/lib/api/client";
import { 
  HardDriveDownload, 
  FolderOpen, 
  FileText, 
  Database, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

export default function BackupsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["backups-info"],
    queryFn: backupsApi.info,
    refetchInterval: 10000,
  });

  const triggerMutation = useMutation({
    mutationFn: backupsApi.trigger,
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success("Backup sequence completed!");
        qc.invalidateQueries({ queryKey: ["backups-info"] });
      } else {
        toast.error("Backup failed: " + res.error);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to trigger backup");
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 h-full">
        <div className="animate-pulse flex flex-col items-center opacity-50">
           <HardDriveDownload className="w-12 h-12 text-brand-blue mb-4 animate-bounce" />
           <p className="text-xs font-black uppercase tracking-widest text-brand-blue">Reading File System...</p>
        </div>
      </div>
    );
  }

  const files = data?.files || [];
  const dailyDb = files.find((f: any) => f.name === 'slc_db.sql');
  const dailyPdf = files.find((f: any) => f.name === 'slc.pdf');
  const monthlyFiles = files.filter((f: any) => f.name !== 'slc_db.sql' && f.name !== 'slc.pdf');

  return (
    <div className="space-y-6 animate-fade-in p-2 max-w-[1200px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <HardDriveDownload className="w-8 h-8 text-brand-blue" />
             Automated Backups
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
             System State & Offline Storage Management
          </p>
        </div>
        <button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCcw className={clsx("w-4 h-4", triggerMutation.isPending && "animate-spin")} />
          {triggerMutation.isPending ? "Generating..." : "Force Backup Now"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Storage Location Card */}
        <div className="card-premium p-6 bg-slate-900 text-white shadow-2xl shadow-slate-900/20 md:col-span-3 lg:col-span-1 rounded-3xl flex flex-col border-4 border-slate-800">
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
             <FolderOpen className="w-6 h-6 text-brand-gold" />
           </div>
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Storage Location</h3>
           <p className="text-sm font-mono text-slate-200 mb-auto break-all bg-black/30 p-3 rounded-lg border border-white/5">
             {data?.folderPath || "Unknown"}
           </p>
           
           <div className="mt-6 pt-6 border-t border-white/10">
             <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Cron Active (Midnight)</span>
             </div>
           </div>
        </div>

        {/* Daily SQL Card */}
        <div className="card-premium p-6 bg-white border border-slate-100 shadow-xl lg:col-span-1 rounded-3xl flex flex-col">
           <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
             <Database className="w-6 h-6 text-blue-600" />
           </div>
           <div className="flex-1">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Raw Database</h3>
             <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">slc_db.sql</h4>
             {dailyDb ? (
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="font-bold text-slate-500">Size:</span>
                   <span className="font-bold text-slate-900">{(dailyDb.size / 1024 / 1024).toFixed(2)} MB</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="font-bold text-slate-500">Last Synced:</span>
                   <span className="font-bold text-slate-900">{new Date(dailyDb.modifiedAt).toLocaleString()}</span>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-amber-500 p-3 bg-amber-50 rounded-lg">
                 <AlertTriangle className="w-5 h-5" />
                 <span className="text-xs font-bold">Never exported</span>
               </div>
             )}
           </div>
        </div>

        {/* Daily PDF Card */}
        <div className="card-premium p-6 bg-white border border-slate-100 shadow-xl lg:col-span-1 rounded-3xl flex flex-col">
           <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
             <FileText className="w-6 h-6 text-red-600" />
           </div>
           <div className="flex-1">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Printable Report</h3>
             <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">slc.pdf</h4>
             {dailyPdf ? (
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="font-bold text-slate-500">Size:</span>
                   <span className="font-bold text-slate-900">{(dailyPdf.size / 1024 / 1024).toFixed(2)} MB</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="font-bold text-slate-500">Last Synced:</span>
                   <span className="font-bold text-slate-900">{new Date(dailyPdf.modifiedAt).toLocaleString()}</span>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-amber-500 p-3 bg-amber-50 rounded-lg">
                 <AlertTriangle className="w-5 h-5" />
                 <span className="text-xs font-bold">Never exported</span>
               </div>
             )}
           </div>
        </div>

      </div>

      {/* Historical Backups */}
      <div className="card-premium bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">System Snapshots</h3>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {monthlyFiles.length} Archives
          </span>
        </div>
        
        {monthlyFiles.length === 0 ? (
           <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
             No historical snapshots recorded yet. (Generated on 1st of every month)
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Filename</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Archive Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlyFiles.map((f: any) => (
                  <tr key={f.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{f.name}</td>
                    <td className="px-6 py-4">
                      {f.name.endsWith('.sql') ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-md">SQL Dump</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-md">PDF Doc</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-6 py-4 font-bold text-slate-600">{new Date(f.modifiedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
