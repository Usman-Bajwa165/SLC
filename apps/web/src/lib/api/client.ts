import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || "An unexpected error occurred";
    return Promise.reject(new Error(msg));
  },
);

// ── Helper to unwrap { data } wrapper ────────────────────────────────────────
const get = async <T>(url: string, params?: any): Promise<T> => {
  const res = await api.get(url, { params });
  return res.data?.data ?? res.data;
};
const post = async <T>(url: string, body: any): Promise<T> => {
  const res = await api.post(url, body);
  return res.data?.data ?? res.data;
};
const put = async <T>(url: string, body: any): Promise<T> => {
  const res = await api.put(url, body);
  return res.data?.data ?? res.data;
};
const del = async <T>(url: string): Promise<T> => {
  const res = await api.delete(url);
  return res.data?.data ?? res.data;
};

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: () => get<any[]>("/departments"),
  get: (id: number) => get<any>(`/departments/${id}`),
  create: (dto: any) => post<any>("/departments", dto),
  update: (id: number, dto: any) => put<any>(`/departments/${id}`, dto),
  delete: (id: number) => del<any>(`/departments/${id}`),
  feeStructures: (id: number) =>
    get<any[]>(`/departments/${id}/fee-structures`),
  createFeeStructure: (dto: any) =>
    post<any>("/departments/fee-structures", dto),
  migrationPreview: (id: number) =>
    get<any>(`/departments/${id}/migration-preview`),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionsApi = {
  list: (deptId?: number) =>
    get<any[]>(deptId ? `/departments/${deptId}/sessions` : "/sessions"),
  create: (dto: any) =>
    post<any>(`/departments/${dto.departmentId}/sessions`, dto),
  update: (id: number, dto: any) => put<any>(`/sessions/${id}`, dto),
  delete: (id: number) => del<any>(`/sessions/${id}`),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: (params?: {
    q?: string;
    department?: number;
    session?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => get<any>("/students", params),
  get: (id: number) => get<any>(`/students/${id}`),
  create: (dto: any) => post<any>("/students", dto),
  update: (id: number, dto: any) => put<any>(`/students/${id}`, dto),
  promote: (id: number) => post<any>(`/students/${id}/promote`, {}),
  delete: (id: number) => del<any>(`/students/${id}`),
  finance: (id: number) => get<any>(`/students/${id}/finance`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params?: any) => get<any>("/payments", params),
  get: (id: number) => get<any>(`/payments/${id}`),
  create: (dto: any) => post<any>("/payments", dto),
  receipt: (id: number) => get<any>(`/payments/${id}/receipt`),
};

// ── Accounts ──────────────────────────────────────────────────────────────────
export const accountsApi = {
  paymentMethods: () => get<any[]>("/payment-methods"),
  createMethod: (dto: any) => post<any>("/payment-methods", dto),
  accounts: () => get<any[]>("/accounts"),
  getAccount: (id: number) => get<any>(`/accounts/${id}`),
  createAccount: (dto: any) => post<any>("/accounts", dto),
  updateAccount: (id: number, dto: any) => put<any>(`/accounts/${id}`, dto),
  deleteAccount: (id: number) => del<any>(`/accounts/${id}`),
  ledger: (id: number, from?: string, to?: string) =>
    get<any>(`/accounts/${id}/ledger`, { from, to }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => get<any>("/reports/dashboard"),
  outstanding: (params?: {
    departmentId?: number;
    sessionId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => get<any>("/reports/outstanding", params),
  dailyReceipts: (params: {
    date: string;
    methodId?: number;
    accountId?: number;
    departmentId?: number;
    sessionId?: number;
  }) => get<any>("/reports/daily-receipts", params),
  studentLedger: (id: number) => get<any>(`/reports/student-ledger/${id}`),
  accountLedger: (id: number) => get<any>(`/reports/account-ledger/${id}`),
  advanceSummary: (params?: any) =>
    get<any>("/reports/advance-summary", params),
};

// ── Finance (Other) ──────────────────────────────────────────────────────────
export const financeApi = {
  list: (params?: any) => get<any>("/finance/other", params),
  create: (dto: any) => post<any>("/finance/other", dto),
  categories: () => get<string[]>("/finance/other/categories"),
};
