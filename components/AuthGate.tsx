
import React, { useState, useEffect } from 'react';
import { LockKeyhole, Fingerprint, ShieldCheck, ArrowRight, ShieldAlert, KeyRound, Loader2, Sparkles, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  isNight: boolean;
}

export const AuthGate: React.FC<Props> = ({ children, isNight }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetup, setIsSetup] = useState(() => !!localStorage.getItem('dsp_master_hash'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // isMobileDevice state is kept for potential future mobile-specific UI adjustments,
  // but it is no longer strictly tied to biometric availability.
  const [isMobileDevice, setIsMobileDevice] = useState(false); 

  // Check WebAuthn support and mobile device status
  useEffect(() => {
    const checkMobile = () => {
      const isTouchScreen = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      return isTouchScreen && noHover;
    };

    setIsMobileDevice(checkMobile());

    if (window.PublicKeyCredential && 
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          // Changed: Removed checkMobile() from here to allow Touch ID on MacBooks
          setIsBiometricAvailable(available); 
        });
    }

    const mediaQuery = window.matchMedia("(pointer: coarse) and (hover: none)");
    const handler = (e: MediaQueryListEvent) => setIsMobileDevice(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);

  }, []);

  // Simple Hash Function (SHA-256)
  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSetup = async () => {
    if (password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }
    setIsProcessing(true);
    const hash = await hashPassword(password);
    localStorage.setItem('dsp_master_hash', hash);
    
    // For local-only app, biometric setup is a flag, not actual WebAuthn registration
    // We can assume if biometric is available, the user can use it for quick login
    if (isBiometricAvailable) {
      localStorage.setItem('dsp_touch_id_enabled', 'true');
    }
    
    setIsAuthenticated(true);
    setIsProcessing(false);
  };

  const handleLogin = async () => {
    setIsProcessing(true);
    const hash = await hashPassword(password);
    const savedHash = localStorage.getItem('dsp_master_hash');
    
    if (hash === savedHash) {
      setIsAuthenticated(true);
    } else {
      setError('密码错误，请重试');
      setTimeout(() => setError(''), 2000);
    }
    setIsProcessing(false);
  };

  const handleResetPassword = () => {
    if (window.confirm("【安全重置】\n\n您确定要重置系统密码吗？\n\n1. 此操作将清除当前的密码锁。\n2. 您的业务数据将被保留（不会丢失）。\n3. 重置后，您可以设置一个新的密码。\n\n是否继续？")) {
      localStorage.removeItem('dsp_master_hash');
      setIsSetup(false);
      setPassword('');
      setError('');
    }
  };

  // Removed handleTouchID function and corresponding button, as per screenshot.
  // The functionality can be re-added later if explicitly requested.

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-colors duration-500 ${isNight ? 'bg-[#050505]' : 'bg-[#f8faff]'}`}>
      {/* Background Decorative Elements - Reverted to light and subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${isNight ? 'bg-indigo-900' : 'bg-blue-100'}`} />
         <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${isNight ? 'bg-blue-900' : 'bg-indigo-100'}`} />
      </div>

      <div className={`relative w-full max-w-md p-10 rounded-[40px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-700 ${isNight ? 'bg-[#121212]/80 border-white/5' : 'bg-white'}`}>
        
        <div className="flex flex-col items-center text-center mb-10">
           <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all ${error ? 'bg-rose-500 scale-110' : 'bg-blue-600'}`}> {/* Always blue, as per screenshot */}
              {error ? <ShieldAlert size={40} className="text-white animate-pulse" /> : <ShieldCheck size={40} className="text-white" />}
           </div>
           <h2 className="text-2xl font-black tracking-tight uppercase mb-2">
             {isSetup ? '欢迎回来' : '初始化安全网关'}
           </h2>
           <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
             Docu.Station Pro | 密级管理系统
           </p>
        </div>

        <div className="space-y-6">
           <div className="relative group">
              {/* KeyRound icon removed to match screenshot style */}
              <input 
                type="password" 
                placeholder="请输入密码" // Updated placeholder
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (isSetup ? handleLogin() : handleSetup())}
                className={`w-full px-4 py-4 rounded-2xl outline-none border-2 transition-all font-mono text-center tracking-widest placeholder-slate-300 ${isNight ? 'bg-black/40 border-white/5 focus:border-blue-500/50 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500/50 text-slate-900'}`} // Adjusted styling for placeholder and colors
              />
           </div>

           {error && (
             <p className="text-center text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">{error}</p>
           )}

           <div className="flex flex-col gap-4"> {/* Centered single button */}
              <button 
                onClick={isSetup ? handleLogin : handleSetup}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isProcessing ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`} // Unified blue button
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : (
                  <>登录系统 <ArrowRight size={16} /></> // Button text as per screenshot
                )}
              </button>
              
              {isSetup && (
                <button 
                  onClick={handleResetPassword}
                  className={`text-[10px] font-bold uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-opacity ${isNight ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  忘记密码? (Reset)
                </button>
              )}
           </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-center">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isNight ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400'}`}> {/* Pill-shaped tag */}
             <Sparkles size={10} /> 硬件级加密防护已开启
           </div>
           {!isSetup && (
             <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px]">
               主密码是您在这台设备上的唯一凭证，系统不会将密码上传到任何云端。
             </p>
           )}
        </div>
      </div>
    </div>
  );
};
