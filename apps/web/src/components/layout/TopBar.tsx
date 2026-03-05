'use client';
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/departments': 'Departments',
  '/sessions': 'Sessions',
  '/students': 'Students',
  '/payments': 'Payments',
  '/accounts': 'Accounts',
  '/reports': 'Reports',
  '/import-export': 'Import / Export',
};

export default function TopBar() {
  const path = usePathname();
  const title = Object.entries(titles).find(([k]) => path.startsWith(k))?.[1] || 'SLC System';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AD</span>
          </div>
          <span className="text-sm text-gray-700 font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
