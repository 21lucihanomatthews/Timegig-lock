import React, { useState, useEffect } from 'react';
import { Search, X, User, Settings, TrendingUp, Wallet, ArrowUpRight, Copy, Check, Share2, Volume2, VolumeX, Mail, Lock, ShieldCheck, Eye, EyeOff, LogOut, Users, Briefcase, Loader2 } from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, updateDoc, getDocs, query, where } from 'firebase/firestore';

interface FeatureSearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
}

export const FeatureSearchBar: React.FC<FeatureSearchBarProps> = ({ placeholder, onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-11/12 max-w-xl pointer-events-auto">
      <form 
        onSubmit={handleSubmit} 
        className="relative flex items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 px-4 py-2.5 transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20"
      >
        <Search className="w-4 h-4 text-cyan-400 mr-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
};

interface FeatureViewProps {
  activeTab: string | null;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAuthSuccess: (email: string, redirectTab: string | null) => void;
  onLogout: () => void;
  userEmail: string;
  playTabSound: () => void;
  isLoggedIn: boolean;
}

export const FeatureView: React.FC<FeatureViewProps> = ({ 
  activeTab, 
  onClose,
  soundEnabled, 
  onToggleSound, 
  onAuthSuccess, 
  onLogout,
  userEmail,
  playTabSound,
  isLoggedIn
}) => {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Auth Form State - Default to signup screen when opening Sign In / Auth
  const [isSignup, setIsSignup] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [currentUserData, setCurrentUserData] = useState<any | null>(null);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const isReferrals = activeTab === 'referrals';
  const isTenant = activeTab === 'tenant';
  const isAuth = activeTab === 'auth';
  const isProfile = activeTab === 'profile';
  const isSeekers = activeTab === 'seekers';

  // Ensure Signup screen is shown by default whenever Auth tab is opened
  useEffect(() => {
    if (activeTab === 'auth') {
      setIsSignup(true);
      setAuthMessage(null);
      setIsError(false);
    }
  }, [activeTab]);

  // Load current user data from Firestore or Auth state
  useEffect(() => {
    async function fetchUserData() {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setCurrentUserData(userDoc.data());
          } else {
            setCurrentUserData({ email: auth.currentUser.email });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setCurrentUserData({ email: auth.currentUser.email });
        }
      } else {
        setCurrentUserData(null);
      }
    }
    fetchUserData();
  }, [userEmail, activeTab]);

  const isTenantUser = (currentUserData && currentUserData.subscriptionType === 'tenant') || userEmail === 'timegig2026@gmail.com';
  const userStatus = userEmail === 'timegig2026@gmail.com' ? 'active' : (currentUserData ? currentUserData.subscriptionStatus || 'none' : 'none');

  // Load pending applications for Referrals tab
  useEffect(() => {
    async function fetchPendingApps() {
      if (!isReferrals || !isTenantUser) return;
      
      try {
        let q;
        if (userEmail === 'timegig2026@gmail.com') {
           q = query(collection(db, 'applications'), where('status', '==', 'pending'));
        } else {
           q = query(collection(db, 'applications'), where('status', '==', 'pending'), where('referrerEmail', '==', userEmail));
        }
        
        const querySnapshot = await getDocs(q);
        const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingApplications(apps);
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
    }
    fetchPendingApps();
  }, [activeTab, isReferrals, isTenantUser, userEmail]);

  if (!activeTab || activeTab === 'gigs') return null;

  const handleAppAction = async (appId: string, action: 'approved' | 'rejected') => {
    playTabSound();
    try {
      await updateDoc(doc(db, 'applications', appId), { status: action });

      const appDoc = await getDoc(doc(db, 'applications', appId));
      if (appDoc.exists()) {
        const targetEmail = appDoc.data().userEmail;
        const q = query(collection(db, 'users'), where('email', '==', targetEmail));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(async (uDoc) => {
          await updateDoc(uDoc.ref, {
            subscriptionStatus: action === 'approved' ? 'active' : 'rejected',
            hasSubscribed: action === 'approved'
          });
        });
      }
      setPendingApplications(prev => prev.filter(app => app.id !== appId));
    } catch (err) {
      console.error("Error updating app action:", err);
    }
  };

  const getPlaceholder = () => {
    if (activeTab === 'referrals') return "Search referrals by name or email...";
    if (activeTab === 'seekers') return "Search seekers by name, role or budget...";
    return "Search...";
  };

  const showSearchBar = activeTab === 'referrals' || activeTab === 'seekers';

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://timegig.app/ref/TG9921');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please log in instead.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return error?.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.';
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsError(false);

    try {
      if (isSignup) {
        if (!acceptedTerms) {
          setIsError(true);
          setAuthMessage("Please accept the terms and conditions.");
          return;
        }

        if (password.length < 6) {
          setIsError(true);
          setAuthMessage("Password must be at least 6 characters long.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const isMainAccount = email === 'timegig2026@gmail.com';

        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          email,
          hasSubscribed: isMainAccount,
          subscriptionStatus: isMainAccount ? 'active' : 'none',
          subscriptionType: isMainAccount ? 'tenant' : null,
          registrationDate: new Date().toISOString()
        });

        setAuthMessage(`Account created successfully for ${email}.`);
        setTimeout(() => {
          setAuthMessage(null);
          onAuthSuccess(email, isMainAccount ? 'gigs' : 'tenant');
        }, 1500);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthMessage(`Welcome back!`);
        setTimeout(() => {
          onAuthSuccess(email, null);
          setAuthMessage(null);
        }, 1200);
      }
    } catch (error: any) {
      setIsError(true);
      setAuthMessage(getFriendlyErrorMessage(error));
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/20 backdrop-blur-xl animate-fade-in pointer-events-none">
      <div className="w-full h-full bg-white/5 dark:bg-slate-900/10 backdrop-blur-2xl flex flex-col relative overflow-hidden">
        
        {showSearchBar && userStatus === 'active' && (
          <FeatureSearchBar 
            placeholder={getPlaceholder()} 
            onSearch={(q) => console.log(`Searching ${activeTab} for: ${q}`)} 
          />
        )}

        {isProfile && (
          <button 
            onClick={() => {
              playTabSound();
              setShowSettings(!showSettings);
            }}
            className="absolute top-6 right-8 z-[70] p-3 rounded-2xl bg-white/10 dark:bg-slate-800/40 text-slate-900 dark:text-white hover:bg-white/20 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg border border-white/20 pointer-events-auto"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}

        {showSettings && isProfile && (
          <div className="absolute top-20 right-8 z-[70] w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 animate-in fade-in zoom-in-95 pointer-events-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> App Settings
            </h3>
            <div className="space-y-2">
              <button 
                onClick={onToggleSound}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tap Sounds</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${soundEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </button>

              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => {
                    onLogout();
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto pt-16 pb-20">
             
             {/* PROFILE TAB */}
             {isProfile && (
               <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-2xl ring-4 ring-white/20 overflow-hidden">
                   {currentUserData?.selfieUrl ? (
                     <img src={currentUserData.selfieUrl} alt="Profile Logo" className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-20 h-20 text-white" />
                   )}
                 </div>
                 <div className="space-y-2 px-6">
                   <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                     {currentUserData ? `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || userEmail : "Guest User"}
                   </h1>
                   <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                     {currentUserData ? currentUserData.email : "Connect your account to start"}
                   </p>
                 </div>
                 {currentUserData && (
                    <div className="flex gap-4 pt-2">
                      <div className="px-4 py-2 rounded-2xl bg-white/40 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rank</p>
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">Pioneer</p>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white/40 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 backdrop-blur-md">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Points</p>
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">100 XP</p>
                      </div>
                    </div>
                 )}
               </div>
             )}

             {/* TENANT TAB */}
             {isTenant && (
               <div className="w-full max-w-lg flex flex-col space-y-4 animate-fade-in px-6 max-h-full overflow-hidden">
                 {(userStatus === 'none' || userStatus === 'rejected') && (
                    <div className="text-center space-y-4 py-12">
                       <ShieldCheck className="w-16 h-16 text-cyan-500/40 mx-auto" />
                       <h2 className="text-xl font-black text-white uppercase">
                         {userStatus === 'rejected' ? 'Application Declined' : 'Activation Required'}
                       </h2>
                       <p className="text-slate-400 text-sm px-8">
                         {userStatus === 'rejected' 
                           ? 'Your previous application was declined. Please use the pop-up to resubmit your details.' 
                           : 'Please complete the activation pop-up to access your dashboard.'}
                       </p>
                    </div>
                 )}

                 {userStatus === 'pending' && (
                    <div className="w-full flex flex-col items-center text-center space-y-6 py-6">
                       <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
                          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review in Progress</h2>
                          <p className="text-slate-400 text-sm leading-relaxed">
                             Your application is being verified by a Tenant. You will be notified once access is granted.
                          </p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-full">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Status</p>
                          <p className="text-amber-500 font-bold uppercase tracking-widest text-xs">Verification Pending</p>
                       </div>
                    </div>
                 )}

                 {userStatus === 'active' && (
                   <>
                    <div className="p-5 rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl relative overflow-hidden group shrink-0">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                      <div className="relative z-10 text-center">
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-0.5 block">Total Profit Balance</span>
                        <div className="text-3xl font-black text-white tracking-tighter flex items-baseline justify-center gap-1">
                          <span className="text-lg text-slate-500">R</span>
                          0.00
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="p-4 rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-md shadow-lg text-center">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-2 mx-auto">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tenant Sub</span>
                        <div className="text-lg font-bold text-white">R0.00</div>
                      </div>
                      <div className="p-4 rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-md shadow-lg text-center">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2 mx-auto">
                          <User className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">User Sub</span>
                        <div className="text-lg font-bold text-white">R0.00</div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1 shrink-0">
                        <div className="flex items-center gap-2 px-2">
                          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                          <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Tenant Referral Link</h3>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm group transition-all">
                          <input 
                            type="text" 
                            readOnly 
                            value="https://timegig.app/ref/TG9921"
                            className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                          />
                          <button 
                            onClick={handleCopyLink}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] transition-all active:scale-95 ${
                              copied 
                                ? 'bg-emerald-500 text-white shadow-lg' 
                                : 'bg-white text-slate-950 hover:bg-cyan-50'
                            }`}
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="px-4 text-[9px] text-slate-500 text-center leading-tight">
                          Earn 5% commission on referred tenant activity.
                        </p>
                    </div>
                   </>
                 )}
               </div>
             )}

             {/* REFERRALS TAB */}
             {isReferrals && (
               <div className="w-full max-w-xl px-6 space-y-4 animate-fade-in overflow-y-auto max-h-[75vh]">
                 <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">Referrals & Apps</h2>
                    </div>
                 </div>

                 {isTenantUser ? (
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Pending Applications</h3>
                        {pendingApplications.length > 0 ? (
                           pendingApplications.map((app: any) => (
                             <div key={app.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 overflow-hidden">
                                     {app.selfieUrl ? (
                                       <img src={app.selfieUrl} alt="Applicant Selfie" className="w-full h-full object-cover" />
                                     ) : (
                                       app.userName ? app.userName.charAt(0) : 'U'
                                     )}
                                   </div>
                                   <div>
                                     <p className="text-sm font-bold text-white">{app.userName}</p>
                                     <p className="text-[10px] text-slate-400 uppercase tracking-widest">{app.plan === 'tenant' ? 'Tenant Plan' : 'User Plan'}</p>
                                   </div>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-[10px] text-slate-500 font-mono">{app.id}</p>
                                 </div>
                               </div>
                               <div className="grid grid-cols-3 gap-2">
                                  <button onClick={() => { playTabSound(); setFullScreenImage(app.selfieUrl || 'selfie'); }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-center text-slate-400 hover:border-cyan-500 transition-colors">Selfie 📷</button>
                                  <button onClick={() => { playTabSound(); setFullScreenImage(app.idUrl || 'id'); }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-center text-slate-400 hover:border-purple-500 transition-colors">ID Doc 📄</button>
                                  <button onClick={() => { playTabSound(); setFullScreenImage(app.popUrl || 'pop'); }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-center text-slate-400 hover:border-emerald-500 transition-colors">PoP 💰</button>
                               </div>
                               <div className="flex gap-2">
                                 <button onClick={() => handleAppAction(app.id, 'approved')} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-400">Approve</button>
                                 <button onClick={() => handleAppAction(app.id, 'rejected')} className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500/30">Reject</button>
                               </div>
                             </div>
                           ))
                        ) : (
                          <div className="py-12 text-center space-y-3">
                             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-30">
                                <Search className="w-6 h-6 text-white" />
                             </div>
                             <p className="text-xs text-slate-500 font-medium">No pending applications found.</p>
                          </div>
                       )}
                    </div>
                 ) : (
                   <div className="flex flex-col items-center text-center space-y-6 py-12 px-8">
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                          <Users className="w-10 h-10 text-cyan-400/50" />
                      </div>
                      <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white uppercase tracking-tight">No Referrals Yet</h2>
                          <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            Only active Tenants can manage referral applications and earn passive income.
                          </p>
                      </div>
                      <button 
                          onClick={() => onAuthSuccess(userEmail, 'tenant')}
                          className="px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                 )}
               </div>
             )}

             {/* SEEKERS TAB */}
             {isSeekers && (
               <div className="w-full max-w-xl px-6 space-y-6 animate-fade-in flex flex-col items-center text-center">
                 <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    <Briefcase className="w-10 h-10 text-purple-400/50" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Searching for Gigs?</h2>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                      There are currently no active seekers in your immediate vicinity. Try searching other areas on the map.
                    </p>
                 </div>
                 <button 
                    onClick={() => onClose()}
                    className="px-6 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest hover:bg-purple-500/20 transition-all"
                 >
                   Return to Map
                 </button>
               </div>
             )}

             {/* AUTH TAB - Default to Signup Screen when clicked on Sign In */}
             {isAuth && (
               <div className="w-full max-w-md flex flex-col space-y-6 animate-fade-in px-8">
                  {authMessage ? (
                    <div className={`p-8 rounded-[32px] bg-white/10 border backdrop-blur-xl text-center space-y-4 shadow-2xl transition-colors ${isError ? 'border-rose-500/50' : 'border-cyan-500/30'}`}>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isError ? 'bg-rose-500/20' : 'bg-cyan-500/20'}`}>
                        {isError ? <X className="w-10 h-10 text-rose-500" /> : <ShieldCheck className="w-10 h-10 text-cyan-400" />}
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{isError ? "Error" : "Success"}</h2>
                      <p className="text-slate-200 font-medium leading-relaxed">{authMessage}</p>
                      {isError && (
                         <button 
                          onClick={() => setAuthMessage(null)}
                          className="mt-4 text-xs font-bold text-cyan-400 uppercase tracking-widest hover:underline"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                          {isSignup ? "Join TimeGiG" : "Welcome Back"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                          {isSignup ? "Create your global account" : "Log in to access your dashboard"}
                        </p>
                      </div>

                      <form onSubmit={handleAuthSubmit} className="space-y-3">
                        {isSignup && (
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              required
                              placeholder="Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-sm text-sm"
                            />
                            <input 
                              type="text" 
                              required
                              placeholder="Surname"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-sm text-sm"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                              type="email" 
                              required
                              placeholder="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-sm text-sm"
                            />
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                              type={showPassword ? "text" : "password"} 
                              required
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-sm text-sm"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {isSignup && (
                          <label className="flex items-start gap-3 px-1 cursor-pointer group py-1">
                            <div className="relative flex items-center pt-0.5">
                              <input 
                                type="checkbox" 
                                required
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                              I accept the <span className="text-cyan-400 underline font-semibold">Terms & Conditions</span>.
                            </span>
                          </label>
                        )}

                        <button 
                          type="submit"
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] uppercase tracking-widest text-sm shadow-cyan-500/20 mt-2"
                        >
                          {isSignup ? "Sign Up" : "Log In"}
                        </button>
                      </form>

                      <div className="text-center pt-2">
                        <button 
                          onClick={() => {
                            setIsSignup(!isSignup);
                            setAuthMessage(null);
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                        >
                          {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
                        </button>
                      </div>
                    </>
                  )}
               </div>
             )}

             {/* FULL SCREEN IMAGE VIEWER */}
             {fullScreenImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
                    <button onClick={() => setFullScreenImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-white text-center flex flex-col items-center">
                        <div className="max-w-md max-h-[70vh] bg-slate-800 rounded-3xl overflow-hidden flex items-center justify-center mb-4 border border-white/10 p-2">
                            {fullScreenImage.startsWith('http') || fullScreenImage.startsWith('data:') ? (
                              <img src={fullScreenImage} alt="Document" className="max-w-full max-h-[65vh] object-contain rounded-2xl" />
                            ) : (
                              <div className="w-64 h-64 flex flex-col items-center justify-center">
                                {fullScreenImage === 'selfie' && <User className="w-24 h-24 text-cyan-400" />}
                                {fullScreenImage === 'id' && <ShieldCheck className="w-24 h-24 text-purple-400" />}
                                {fullScreenImage === 'pop' && <Wallet className="w-24 h-24 text-emerald-400" />}
                              </div>
                            )}
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-widest">DOCUMENT VIEW</h2>
                    </div>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};
