"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "@/lib/api/client";
import { formatCNIC, formatContact, formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  User,
  Edit,
  Trash2,
  Briefcase,
  Wallet,
  FileText,
  Printer,
  Download,
  Eye,
} from "lucide-react";
import { exportToPDF } from "@/lib/report-utils";
import { clsx } from "clsx";
import { toast } from "sonner";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

const ROLES = [
  "principal",
  "president",
  "manager",
  "admin",
  "teacher",
  "peon",
  "guard",
  "others",
];

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("true"); // Default to Active
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ["staff", roleFilter, statusFilter, monthFilter],
    queryFn: () =>
      staffApi.list({
        role: roleFilter || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter,
        month: monthFilter,
      }),
  });

  const staff = useMemo(() => {
    const all = staffRes?.data || [];
    if (!search) return all;
    const s = search.toLowerCase();
    return all.filter(
      (st: any) =>
        st.name?.toLowerCase().includes(s) ||
        st.cnic?.includes(s) ||
        st.contact?.includes(s) ||
        st.role?.toLowerCase().includes(s),
    );
  }, [staffRes?.data, search]);

  const handleExport = () => {
    const columns = [
      "Name",
      "CNIC",
      "Contact",
      "Role",
      "Salary",
      "Joined Date",
      "Status",
    ];
    const exportData = staff.map((s: any) => [
      s.name,
      formatCNIC(s.cnic),
      formatContact(s.contact),
      s.role.toUpperCase(),
      `PKR ${Number(s.salary).toLocaleString()}`,
      formatDate(s.joinedDate),
      s.isActive ? "ACTIVE" : "INACTIVE",
    ]);

    exportToPDF({
      title: "Staff Directory",
      filename: "staff_report",
      columns,
      data: exportData,
      summary: [
        { label: "Total Staff", value: staff.length.toString() },
        { label: "Filter", value: roleFilter || "All Staff" },
      ],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Staff Management
          </h2>
          <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest opacity-60">
            Manage all staff members and their details
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2 shadow-lg shadow-slate-200/20"
            title="Print Page"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2 shadow-lg shadow-slate-200/20"
            title="Export to PDF"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => {
              setEditingStaff(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-blue/20"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="card-premium p-1.5 flex-[2] flex items-center gap-4 bg-white border-slate-100 shadow-xl shadow-slate-200/40 focus-within:ring-2 ring-brand-blue/10 transition-all">
          <Search className="w-5 h-5 text-slate-400 ml-4" />
          <input
            type="text"
            placeholder="Search staff members by name, CNIC, contact or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none py-3 text-[15px] focus:outline-none font-bold text-slate-800 placeholder:text-slate-300"
          />
        </div>

        <div className="flex flex-1 gap-2">
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-1.5 flex items-center gap-2 group focus-within:ring-2 ring-brand-blue/10 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-transparent border-none py-2 text-xs font-black uppercase text-slate-700 outline-none cursor-pointer"
            >
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="all">Every Record</option>
            </select>
          </div>

          <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-1.5 flex items-center gap-2 group focus-within:ring-2 ring-brand-blue/10 transition-all">
            <Briefcase className="w-4 h-4 text-brand-blue ml-3" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="flex-1 bg-transparent border-none py-2 text-xs font-black uppercase text-slate-700 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 py-2">
        <button
          onClick={() => setRoleFilter("")}
          className={clsx(
            "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            roleFilter === ""
              ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/30"
              : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100",
          )}
        >
          All Staff
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={clsx(
              "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              roleFilter === r
                ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/30"
                : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="card-premium overflow-hidden border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Name
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  CNIC / Contact
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Role
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Salary
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Paid
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Remaining
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Joined
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-5">
                      <div className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : staff.length > 0 ? (
                staff.map((s: any) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/staff/${s.id}`}
                        className="text-xs font-black text-slate-800 uppercase tracking-tight hover:text-brand-blue"
                      >
                        {s.name}
                      </Link>
                      {s.subject && (
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          Subject: {s.subject}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-600">
                        {formatCNIC(s.cnic)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {formatContact(s.contact)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest w-fit">
                        {s.role}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-900">
                        PKR {s.financeRecords?.[0] ? Number(s.financeRecords[0].salaryDue).toLocaleString() : Number(s.salary).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const fin = s.financeRecords?.[0];
                        const sPaid = Number(fin?.salaryPaid || 0);
                        const sAdv = Number(fin?.advanceTaken || 0);
                        const sLoan = Number(fin?.loanTaken || 0);
                        const pureSal = sPaid - sAdv - sLoan;
                        if (!fin && !sPaid && !sAdv && !sLoan)
                          return (
                            <span className="text-[10px] font-bold text-slate-300">
                              —
                            </span>
                          );
                        return (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-900 border-b border-slate-100 pb-1 mb-1">
                              Paid: {sPaid.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">
                              <span
                                className={clsx(
                                  pureSal > 0
                                    ? "text-green-600"
                                    : "text-slate-300",
                                )}
                              >
                                Sal: {pureSal.toLocaleString()}
                              </span>
                              <span className="text-slate-200">|</span>
                              <span
                                className={clsx(
                                  sAdv > 0
                                    ? "text-brand-gold"
                                    : "text-slate-300",
                                )}
                              >
                                Adv: {sAdv.toLocaleString()}
                              </span>
                              <span className="text-slate-200">|</span>
                              <span
                                className={clsx(
                                  sLoan > 0 ? "text-red-500" : "text-slate-300",
                                )}
                              >
                                Loan: {sLoan.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const fin = s.financeRecords?.[0];
                        const rem = fin
                          ? Number(fin.remaining)
                          : s.financeRecords?.[0] ? Number(s.financeRecords[0].salaryDue) : Number(s.salary);
                        return (
                          <p
                            className={clsx(
                              "text-xs font-black",
                              rem > 0 ? "text-red-600" : "text-green-600",
                            )}
                          >
                            PKR {rem.toLocaleString()}
                          </p>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-500">
                      {formatDate(s.joinedDate)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                          s.isActive
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600",
                        )}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/staff/${s.id}`}
                          className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-brand-blue transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/payments?tab=staff&staffId=${s.id}&returnUrl=/staff`}
                          className="p-2 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                          title="Pay Salary"
                        >
                          <Wallet className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/reports/staff-ledger/${s.id}`}
                          className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="View Ledger"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingStaff(s);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-xl hover:bg-brand-blue/10 text-brand-blue transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <User className="w-16 h-16 mb-4 text-slate-300" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
                        No Staff Found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StaffModal
          staff={editingStaff}
          currentMonthFilter={monthFilter}
          onClose={() => {
            setShowModal(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
}

function StaffModal({ staff, currentMonthFilter, onClose }: { staff: any; currentMonthFilter: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    cnic: staff ? formatCNIC(staff.cnic) : "",
    contact: staff ? formatContact(staff.contact) : "",
    role: staff?.role || "teacher",
    subject: staff?.subject || "",
    address: staff?.address || "",
    joinedDate: staff?.joinedDate
      ? new Date(staff.joinedDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    salary: staff?.salary || "",
    isActive: staff?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      staff ? staffApi.update(staff.id, { ...data, effectiveMonth: currentMonthFilter }) : staffApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success(staff ? "Staff updated!" : "Staff added!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={staff ? "Edit Staff Member" : "Add Staff Member"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              CNIC (13 digits) *
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="12345-6789012-3"
              value={formData.cnic}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                let formatted = val;
                if (val.length > 5 && val.length <= 12) {
                  formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
                } else if (val.length > 12) {
                  formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
                }
                setFormData({ ...formData, cnic: formatted });
              }}
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Contact *
            </label>
            <input
              type="text"
              required
              placeholder="92 300 1234567"
              value={formData.contact}
              onKeyDown={(e) => {
                if (
                  (e.key === "Backspace" || e.key === "Delete") &&
                  (formData.contact === "92 " ||
                    (formData.contact.length === 3 &&
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
                setFormData({ ...formData, contact: formatted });
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="input-field"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.role === "teacher" && (
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="input-field"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Joined Date *
            </label>
            <input
              type="date"
              required
              value={formData.joinedDate}
              onChange={(e) =>
                setFormData({ ...formData, joinedDate: e.target.value })
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
              Monthly Salary (PKR) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.salary}
              onChange={(e) =>
                setFormData({ ...formData, salary: e.target.value })
              }
              className="input-field"
            />
          </div>
        </div>

        {staff && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="isActive"
              className="text-xs font-bold text-slate-600 uppercase tracking-widest"
            >
              Active Status
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 btn-primary"
          >
            {mutation.isPending
              ? "Saving..."
              : staff
                ? "Update Staff"
                : "Add Staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
