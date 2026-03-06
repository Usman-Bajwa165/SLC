"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  CreditCard,
  Landmark,
  BarChart3,
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/students", label: "Students", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/import-export", label: "Import / Export", icon: Upload },
];

export default function Sidebar() {
  const path = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "bg-brand-blue-dark flex flex-col h-full relative z-20 shadow-2xl transition-all duration-300 ease-in-out overflow-visible",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center text-white border-2 border-brand-blue-dark shadow-lg z-30 hover:scale-110 transition-transform"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Decorative gradient overlay */}
      {!isCollapsed && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
      )}

      {/* Logo */}
      <div className={clsx("py-8 relative", isCollapsed ? "px-4" : "px-8")}>
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              "bg-gold-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-brand-gold/20 transform transition-all duration-300",
              isCollapsed
                ? "w-12 h-12 rotate-0"
                : "w-12 h-12 rotate-3 hover:rotate-0",
            )}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <div className="text-white font-black text-lg tracking-tight leading-none uppercase">
                Stars Law
              </div>
              <div className="text-blue-400 font-medium text-[10px] tracking-[0.2em] uppercase mt-1">
                College Management
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav
        className={clsx(
          "flex-1 py-6 space-y-1.5 overflow-y-auto relative scrollbar-hide",
          isCollapsed ? "px-2" : "px-4",
        )}
      >
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3",
                active
                  ? "bg-white/10 text-brand-gold-light"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
              title={isCollapsed ? label : ""}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gold-light rounded-r-lg" />
              )}
              <Icon
                className={clsx(
                  "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  active ? "text-brand-gold-light" : "text-slate-50",
                )}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={clsx(
          "py-6 border-t border-white/5 bg-black/20",
          isCollapsed ? "px-2 text-center" : "px-8",
        )}
      >
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              v1.0 Pro
            </p>
          )}
          <div
            className={clsx(
              "w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50",
              isCollapsed && "mx-auto",
            )}
          />
        </div>
      </div>
    </aside>
  );
}
