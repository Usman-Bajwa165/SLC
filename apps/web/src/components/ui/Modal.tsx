"use client";
import { ReactNode, useEffect } from "react";
import { X, LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  headerContent?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-brand-blue",
  children,
  footer,
  maxWidth = "max-w-md",
  headerContent,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={clsx(
          "bg-white rounded-[2rem] shadow-2xl w-full flex flex-col overflow-hidden animate-scale-up",
          maxWidth,
        )}
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shrink-0">
              <span className="text-2xl font-black">{headerContent}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-2">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                {subtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-all shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
