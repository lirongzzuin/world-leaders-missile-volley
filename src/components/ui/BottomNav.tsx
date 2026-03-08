'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { label: '작전실', icon: 'hub', href: '/lobby' },
  { label: '랭킹', icon: 'assessment', href: '/ranking' },
  { label: '내 정보', icon: 'account_circle', href: '/profile' },
  { label: '설정', icon: 'tune', href: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto border-t border-white/10 bg-card-dark/95 backdrop-blur-xl z-50">
      <div className="flex items-end justify-between px-6 pb-6 pt-3">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 transition-colors ${active ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
            >
              <span
                className="material-symbols-outlined text-[28px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
