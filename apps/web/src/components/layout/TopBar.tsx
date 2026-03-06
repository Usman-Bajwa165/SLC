"use client";
import { Bell, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/departments": "Department Management",
  "/sessions": "Academic Sessions",
  "/students": "Student Directory",
  "/payments": "Financial Records",
  "/accounts": "Ledger Accounts",
  "/reports": "Analytics & Reports",
  "/import-export": "Data Migration",
};

export default function TopBar() {
  const path = usePathname();
  const title =
    Object.entries(titles).find(([k]) => path.startsWith(k))?.[1] ||
    "Stars Law College";

  return (
    <header className="h-20 flex items-center justify-between px-8 relative z-10 shrink-0">
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-brand-blue tracking-tight">
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            Command Center
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-blue/5 focus-within:border-brand-blue/20 transition-all group">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-blue" />
          <input
            type="text"
            placeholder="Global Search..."
            className="bg-transparent border-none text-xs focus:outline-none w-48 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-brand-blue transition-all relative group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-gold-light rounded-full border-2 border-white ring-2 ring-transparent group-hover:ring-brand-gold-light/20 transition-all" />
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all active:scale-95 group">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-brand-blue/5 group-hover:text-brand-blue transition-colors">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-black text-slate-800 leading-tight uppercase">
                Administrator
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                Management Access
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
