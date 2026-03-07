"use client";
import { ReactNode, useEffect } from "react";
import { X, LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
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
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            {Icon && (
              <div
                className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  iconColor.replace("text-", "bg-").concat("/10"),
                  iconColor,
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-1.5 opacity-60">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
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
