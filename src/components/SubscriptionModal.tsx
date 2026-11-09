import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, Wallet, User, Check, X, Loader2, Camera, UploadCloud } from 'lucide-react';

interface SubscriptionModalProps {
  userEmail: string;
  onSuccess: (type: string) => void;
  playTabSound: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  userEmail, 
  onSuccess, 
  playTabSound 
}) => {
  const [step, setStep] = useState<number>(0); // 0: choice, 1: selfie, 2: ID, 3: PoP
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selfie, setSelfie] = useState<boolean>(false);
  const [idDoc, setIdDoc] = useState<boolean>(false);
  const [popDoc, setPopDoc] = useState<boolean>(false);

  const handleStartActivation = (type: string) => {
    playTabSound();
    setSelectedPlan(type);
    setStep(1);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    playTabSound();

    setTimeout(() => {
      // Save application
      const apps = JSON.parse(localStorage.getItem('timegig_applications') || '[]');
      const users = JSON.parse(localStorage.getItem('timegig_users') || '[]');
      const user = users.find((u: any) => u.email === userEmail);
      
      const application = {
        id: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
        userEmail,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
        plan: selectedPlan,
        timestamp: new Date().toISOString(),
        status: 'pending',
        referrerEmail: 'timegig2026@gmail.com' // Default to main account for now
      };
      
      apps.push(application);
      localStorage.setItem('timegig_applications', JSON.stringify(apps));

      // Update user status
      if (user) {
        const userIdx = users.findIndex((u: any) => u.email === userEmail);
        users[userIdx].subscriptionStatus = 'pending';
        users[userIdx].subscriptionType = selectedPlan;
        localStorage.setItem('timegig_users', JSON.stringify(users));
      }

      setIsSubmitting(false);
      onSuccess(selectedPlan!);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {isSubmitting ? (
          <div className="p-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Processing...</h2>
              <p className="text-slate-400 text-xs px-4">Securely uploading your verification documents</p>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Choose Plan</h2>
                  <p className="text-slate-400 text-xs font-medium px-4">Activate to unlock mapping and earnings</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleStartActivation('tenant')}
                    className="group relative p-4 rounded-[24px] bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all text-left overflow-hidden active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-white block">R299,99</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Monthly</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-none">Tenant Plan</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1.5">Earn passive monthly income from referred user subs.</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleStartActivation('user')}
                    className="group relative p-4 rounded-[24px] bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all text-left overflow-hidden active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-white block">R29,99</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Monthly</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-none">User Plan</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1.5">Full mapping feature access and basic reward system.</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step > 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Identity Check</h2>
                   <div className="flex justify-center gap-1">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-cyan-500' : 'w-3 bg-slate-800'}`} />
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                       <div className="p-6 rounded-[24px] bg-white/5 border border-dashed border-white/20 flex flex-col items-center text-center space-y-4">
                          <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                             <Camera className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-white leading-none">Step 1: Selfie</h3>
                             <p className="text-[11px] text-slate-400 mt-2">Capture a live photo of your face</p>
                          </div>
                          <input type="file" accept="image/*" capture="user" className="hidden" id="modal-selfie" onChange={() => setSelfie(true)} />
                          <label htmlFor="modal-selfie" className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20">
                             {selfie ? 'Retake Photo' : 'Capture Selfie'}
                          </label>
                       </div>
                       <button 
                        disabled={!selfie} 
                        onClick={() => setStep(2)}
                        className="w-full py-3 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 hover:bg-white/20 transition-all"
                       >
                         Continue
                       </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                       <div className="p-6 rounded-[24px] bg-white/5 border border-dashed border-white/20 flex flex-col items-center text-center space-y-4">
                          <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                             <UploadCloud className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-white leading-none">Step 2: ID Docs</h3>
                             <p className="text-[11px] text-slate-400 mt-2">Upload a photo of your Identity Document</p>
                          </div>
                          <input type="file" className="hidden" id="modal-id" onChange={() => setIdDoc(true)} />
                          <label htmlFor="modal-id" className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-purple-400 transition-all active:scale-95 shadow-lg shadow-purple-500/20">
                             {idDoc ? 'Document Ready' : 'Upload ID'}
                          </label>
                       </div>
                       <button 
                        disabled={!idDoc} 
                        onClick={() => setStep(3)}
                        className="w-full py-3 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 hover:bg-white/20 transition-all"
                       >
                         Continue
                       </button>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                       <div className="p-6 rounded-[24px] bg-white/5 border border-dashed border-white/20 flex flex-col items-center text-center space-y-4">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                             <Wallet className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-white leading-none">Step 3: Payment</h3>
                             <p className="text-[11px] text-slate-400 mt-2">Upload deposit slip (R{selectedPlan === 'tenant' ? '299,99' : '29,99'})</p>
                          </div>
                          <input type="file" className="hidden" id="modal-pop" onChange={() => setPopDoc(true)} />
                          <label htmlFor="modal-pop" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                             {popDoc ? 'Payment Ready' : 'Upload Receipt'}
                          </label>
                       </div>
                       <button 
                        disabled={!popDoc} 
                        onClick={handleSubmit}
                        className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-black uppercase tracking-widest text-[10px] disabled:opacity-50 hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20"
                       >
                         Finalize Activation
                       </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
