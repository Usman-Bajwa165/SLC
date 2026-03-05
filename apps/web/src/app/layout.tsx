import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'Stars Law College — Finance & Student Management',
  description: 'SLC Finance & Student Lifecycle Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <div className="flex h-screen bg-surface overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
