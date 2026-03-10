"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappApi } from "@/lib/api/client";
import { Smartphone, CheckCircle2, ShieldAlert, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

export default function WhatsappPage() {
  const qc = useQueryClient();
  
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: whatsappApi.status,
    refetchInterval: (query) => (query.state.data?.connected ? 10000 : 3000), // Poll faster when waiting for QR scan
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: whatsappApi.settings,
    enabled: status?.connected,
  });

  const logoutMutation = useMutation({
    mutationFn: whatsappApi.logout,
    onSuccess: () => {
      toast.success("Disconnected from WhatsApp");
      qc.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });

  if (statusLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 h-full">
        <div className="animate-pulse flex flex-col items-center opacity-50">
           <Smartphone className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400">Connecting to Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-2 max-w-[1000px] mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center">
      
      {!status?.connected ? (
        <div className="card-premium p-10 flex flex-col items-center justify-center text-center bg-white border-brand-blue/10 shadow-2xl shadow-brand-blue/10">
          <div className="w-20 h-20 bg-brand-blue/5 rounded-full flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-brand-blue" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">
            Link WhatsApp
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 max-w-md">
            Scan the QR code below using the WhatsApp app on your administration phone to enable automated reports and backups.
          </p>

          <div className="relative w-64 h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden">
            {status?.connecting ? (
              <div className="flex flex-col items-center justify-center opacity-80 h-full">
                <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[12px] font-black uppercase tracking-widest text-brand-blue">Connecting...</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase text-center px-4">Synchronizing messages<br/>with device</p>
              </div>
            ) : status?.qrCode ? (
              <img src={status.qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center opacity-50">
                <ShieldAlert className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generating QR...</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
               {status?.connecting ? "Authenticating with Device..." : "Waiting for scan..."}
             </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-premium p-8 bg-white border-green-500/20 shadow-2xl shadow-green-500/10 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
               <CheckCircle2 className="w-12 h-12 text-green-500" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">
               System Connected
             </h2>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
               Your WhatsApp is successfully linked and active.
             </p>
             {status?.connectedNumber && (
               <div className="mb-6 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                 <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Linked Number</p>
                 <p className="text-sm font-mono font-bold text-green-700">+{status.connectedNumber}</p>
               </div>
             )}
             <button 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="btn-secondary flex items-center gap-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
             >
               <LogOut className="w-4 h-4" />
               Disconnect Session
             </button>
          </div>

          <div className="card-premium p-8 bg-white border-slate-100 shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase border-b border-slate-100 pb-4 mb-6">
              Notification Routing
            </h3>
            {settingsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                 <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <SettingsForm initialData={settings} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsForm({ initialData }: { initialData: any }) {
  const qc = useQueryClient();
  
  // Get connected number from status
  const { data: status } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: whatsappApi.status,
  });
  
  // Prefill with connected number if available and toNumber is default
  const defaultToNumber = status?.connectedNumber && (!initialData?.toNumber || initialData.toNumber === "92 ")
    ? `92 ${status.connectedNumber.slice(2)}`
    : initialData?.toNumber || "92 ";
  
  const [formData, setFormData] = useState({
    toNumber: defaultToNumber,
    notifyStudentPayments: initialData?.notifyStudentPayments ?? true,
    notifyStaffPayments: initialData?.notifyStaffPayments ?? true,
    notifyFinance: initialData?.notifyFinance ?? true,
    notifyAccounts: initialData?.notifyAccounts ?? true,
    notifyEnrollment: initialData?.notifyEnrollment ?? true,
    notifyDeactivation: initialData?.notifyDeactivation ?? true,
  });

  const mutation = useMutation({
    mutationFn: whatsappApi.updateSettings,
    onSuccess: () => {
      toast.success("Routing settings saved!");
      qc.invalidateQueries({ queryKey: ["whatsapp-settings"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-6">
      <div>
        <label className="block text-[10px] font-black text-brand-blue mb-2 uppercase tracking-widest">
          Target WhatsApp Number
        </label>
        <div className="flex">
          <input
            type="text"
            required
            placeholder="92 300 1234567"
            value={formData.toNumber}
            onKeyDown={(e) => {
              if (
                (e.key === "Backspace" || e.key === "Delete") &&
                (formData.toNumber === "92 " ||
                  (formData.toNumber.length === 3 &&
                    e.currentTarget.selectionStart! <= 3))
              ) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith("92 ")) {
                val = "92 " + val.replace(/^92\s*/, "");
              }
              const digits = val.substring(3).replace(/\D/g, "");
              let formatted = "92 ";
              if (digits.length > 0) {
                if (digits.length <= 3) {
                  formatted += digits;
                } else {
                  formatted += `${digits.substring(0, 3)} ${digits.substring(3, 10)}`;
                }
              }
              setFormData({ ...formData, toNumber: formatted });
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-brand-blue/20 transition-all font-mono"
          />
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
          All system reports and automated messages will be sent to this number.
        </p>
      </div>

      <div className="space-y-3 flex-1">
        <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
          Trigger Preferences
        </label>
        
        <ToggleRow 
          label="Student Fee Receipts" 
          checked={formData.notifyStudentPayments} 
          onChange={(v) => setFormData(f => ({ ...f, notifyStudentPayments: v }))} 
        />
        <ToggleRow 
          label="Staff Salary & Advances" 
          checked={formData.notifyStaffPayments} 
          onChange={(v) => setFormData(f => ({ ...f, notifyStaffPayments: v }))} 
        />
        <ToggleRow 
          label="Other Income & Expenses" 
          checked={formData.notifyFinance} 
          onChange={(v) => setFormData(f => ({ ...f, notifyFinance: v }))} 
        />
        <ToggleRow 
          label="Account Balance Changes" 
          checked={formData.notifyAccounts} 
          onChange={(v) => setFormData(f => ({ ...f, notifyAccounts: v }))} 
        />
        <ToggleRow 
          label="Student/Staff Enrollment" 
          checked={formData.notifyEnrollment} 
          onChange={(v) => setFormData(f => ({ ...f, notifyEnrollment: v }))} 
        />
        <ToggleRow 
          label="Student/Staff Deactivation" 
          checked={formData.notifyDeactivation} 
          onChange={(v) => setFormData(f => ({ ...f, notifyDeactivation: v }))} 
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full btn-primary flex items-center justify-center gap-2 mt-auto"
      >
        <Save className="w-4 h-4" />
        {mutation.isPending ? "Saving..." : "Save Preferences"}
      </button>
    </form>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
      <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-brand-blue transition-colors">
        {label}
      </span>
      <div className={clsx(
        "w-10 h-5 rounded-full p-1 transition-colors relative",
        checked ? "bg-brand-blue" : "bg-slate-200"
      )}>
        <div className={clsx(
          "w-3 h-3 bg-white rounded-full transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </div>
    </label>
  );
}
