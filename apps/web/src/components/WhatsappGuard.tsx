"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { whatsappApi } from "@/lib/api/client";
import { usePathname, useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";

export default function WhatsappGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't block the actual whatsapp page or the backups page perhaps, actually let's block everything except WhatsApp page
  const isWhatsappRoute = pathname === "/whatsapp";

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: whatsappApi.status,
    refetchInterval: 5000,
    notifyOnChangeProps: ['data', 'error'],
  });

  useEffect(() => {
    if (!isLoading && data) {
      // If we are NOT connected, and NOT on the whatsapp route -> redirect to whatsapp
      if (!data.connected && !isWhatsappRoute) {
        router.push("/whatsapp");
      }
      // Don't auto-redirect away from whatsapp page if connected
      // Let user stay on whatsapp page if they explicitly navigated there
    }
  }, [data, isLoading, isWhatsappRoute, router, pathname]);

  // If loading and not on the whatsapp route, maybe show a tiny loader or just render children
  // It's better to render children and then rapidly redirect so there's no blank screen hold
  if (!isLoading && data && !data.connected && !isWhatsappRoute) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
        <div className="animate-pulse flex flex-col items-center opacity-50">
           <Smartphone className="w-12 h-12 text-slate-300 mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400">Restricting Access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
