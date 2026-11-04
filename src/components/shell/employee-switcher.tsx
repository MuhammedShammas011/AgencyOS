'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ChevronDown, Check } from 'lucide-react';

export function EmployeeSwitcher() {
  const { users, currentUser, activeUserId, setActiveUserId } = useAgencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-xs text-gray-900 cursor-pointer"
        aria-label="Switch user profile"
      >
        <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold leading-tight text-gray-900">{currentUser.name}</div>
          <div className="text-[10px] text-gray-400 leading-none">{currentUser.title}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1.5 overflow-hidden animate-fade-in">
          <div className="px-3 py-1.5 border-b border-gray-50 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            Switch Employee Profile
          </div>
          <div className="max-h-60 overflow-y-auto">
            {users.map((u) => {
              const isSelected = u.id === (activeUserId || currentUser.id);
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setActiveUserId(u.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-700 shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="truncate">{u.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{u.title}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-gray-900 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
