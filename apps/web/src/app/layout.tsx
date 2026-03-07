import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import QueryProvider from "@/components/QueryProvider";
import TopLoader, { GlobalProgressBar } from "@/components/layout/TopLoader";
import { Toaster } from "sonner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Stars Law College — Finance & Student Management",
  description: "SLC Finance & Student Lifecycle Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster richColors position="top-right" closeButton />
        <QueryProvider>
          {/* Navigation loading bar (route changes) */}
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {/* Query loading bar (all fetches & mutations) */}
          <GlobalProgressBar />
          <div className="flex h-screen bg-surface overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
                {children}
              </main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
