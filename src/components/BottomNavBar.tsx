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
      <nav className="max-w-3xl mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
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
