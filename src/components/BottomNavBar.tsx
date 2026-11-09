import React from 'react';
import { Home, Share2, Zap, Search, User, LogIn } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string | null) => void;
  isLoggedIn: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange, isLoggedIn }) => {
  const navItems = [
    { id: 'tenant', label: 'Tenant', icon: Home },
    { id: 'referrals', label: 'Referrals', icon: Share2 },
    { id: 'gigs', label: 'GiGs', icon: Zap },
    { id: 'seekers', label: 'Seekers', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'auth', label: 'Sign In', icon: LogIn },
  ].filter(item => item.id !== 'auth' || !isLoggedIn);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pointer-events-auto">
      <nav className="max-w-3xl mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isGigs = item.id === 'gigs';

          if (isGigs) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(isActive ? null : item.id)}
                className={`flex flex-col items-center justify-center -mt-4 py-2 px-3.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-xl shadow-cyan-500/40 scale-110'
                    : 'bg-slate-900 text-cyan-400 hover:bg-slate-800 shadow-lg'
                }`}
              >
                <Icon className="w-8 h-8 stroke-[2.5]" />
                <span className={`text-[11px] font-black tracking-wider uppercase ${isActive ? 'text-slate-950' : 'text-cyan-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(isActive ? null : item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-cyan-50 text-cyan-600 font-semibold'
                  : 'text-black hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-cyan-600' : 'text-black'}`} />
              <span className={`text-[10px] tracking-tight ${isActive ? 'text-cyan-600 font-semibold' : 'text-black'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
