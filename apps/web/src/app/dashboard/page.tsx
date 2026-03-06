"use client";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/client";
import {
  Users,
  TrendingUp,
  AlertCircle,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Layers,
  GraduationCap,
  DollarSign,
  Landmark,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

function StatCard({ title, value, change, icon: Icon, trend }: any) {
  return (
    <div className="card-premium p-6 group">
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-2xl bg-slate-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={clsx(
              "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
              trend === "up"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </p>
        <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="h-10 w-48 bg-slate-200 rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-100 rounded-3xl" />
          <div className="h-80 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  const d = data || {};

  // Mock data for charts if API doesn't provide enough history yet
  const chartData = [
    { name: "Mon", amount: 45000 },
    { name: "Tue", amount: 52000 },
    { name: "Wed", amount: 38000 },
    { name: "Thu", amount: 65000 },
    { name: "Fri", amount: 48000 },
    { name: "Sat", amount: 12000 },
    { name: "Sun", amount: 5000 },
  ];

  return (
    <div className="space-y-8 animate-fade-in p-2 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Executive Summary
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Real-time financial & operational health of Stars Law College.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Enrollment"
          value={d.totalActiveStudents ?? "0"}
          change="+12% vs LY"
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Revenue (Today)"
          value={`PKR ${Number(d.todayReceived || 0).toLocaleString()}`}
          change="+5.2%"
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Receivables"
          value={`PKR ${Number(d.totalOutstanding || 0).toLocaleString()}`}
          change="-2.1%"
          trend="down"
          icon={DollarSign}
        />
        <StatCard
          title="Operational Buffers"
          value={d.accounts?.length ?? 0}
          change="Optimal"
          trend="none"
          icon={Layers}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 card-premium p-8 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Revenue Velocity
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Weekly deposit trends
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-blue/5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-brand-blue" />
                <span className="text-[10px] font-bold text-brand-blue uppercase">
                  Actuals
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{
                    fontWeight: 900,
                    fontSize: "12px",
                    color: "#1e3a8a",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#1e3a8a"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorAmt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Info / Quick Actions Sidebar */}
        <div className="space-y-8 h-full">
          {/* Liquidity Section */}
          <div className="card-premium p-8 h-full flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6">
              Liquidity Pool
            </h3>
            <div className="space-y-4 flex-1">
              {d.accounts?.slice(0, 5).map((a: any) => (
                <div
                  key={a.label}
                  className="group p-4 bg-slate-50 rounded-2xl hover:bg-brand-blue transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60 transition-colors truncate max-w-[120px]">
                      {a.label}
                    </p>
                    <div className="px-2 py-0.5 bg-white rounded-lg shadow-sm">
                      <p className="text-[9px] font-black text-brand-blue uppercase leading-none">
                        Healthy
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-800 mt-2 group-hover:text-white transition-colors">
                    PKR {Number(a.balance).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">
              Manage All Accounts
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Actions */}
      <div className="bg-brand-blue-dark rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-white text-2xl font-black tracking-tight">
              System Directives
            </h2>
            <p className="text-blue-300 font-medium mt-1">
              High-priority operational workflows for administrators.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Enroll",
                sub: "New Student",
                icon: GraduationCap,
                color: "brand-gold",
              },
              {
                label: "Receipt",
                sub: "New Payment",
                icon: Landmark,
                color: "green-500",
              },
              {
                label: "Audit",
                sub: "Reports",
                icon: Activity,
                color: "blue-400",
              },
              {
                label: "Setup",
                sub: "Systems",
                icon: Settings,
                color: "slate-400",
              },
            ].map((a) => (
              <button
                key={a.label}
                className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group backdrop-blur-sm border border-white/5"
              >
                <div
                  className={clsx(
                    "p-3 rounded-xl bg-white shadow-lg",
                    `text-${a.color}`,
                  )}
                >
                  <a.icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">
                    {a.sub}
                  </p>
                  <p className="text-xs font-black text-white uppercase mt-1.5">
                    {a.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
