'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={cn(
          'relative w-full bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xl p-6 overflow-hidden z-10 animate-fade-in max-h-[92vh] flex flex-col',
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#E6E4DE]">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-[#171717] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#777777] mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">{children}</div>
      </div>
    </div>
  );
}
