
import React from 'react';
import { Cloud, ArrowDownCircle, AlertCircle, HardDrive, CheckCircle2, Clock } from 'lucide-react';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  cloudDate: string;
  localDate: string;
  onConfirmRestore: () => void;
  onIgnore: () => void;
  isNight: boolean;
}

export const CloudRestoreModal: React.FC<Props> = ({ cloudDate, localDate, onConfirmRestore, onIgnore, isNight }) => {
  const formatDate = (iso: string) => {
    if (!iso) return '从未 (Never)';
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  };

  const themeClasses = {
    bg: isNight ? 'bg-slate-900' : 'bg-white',
    text: isNight ? 'text-slate-100' : 'text-gray-800',
    border: isNight ? 'border-slate-700' : 'border-gray-200',
    subText: isNight ? 'text-slate-400' : 'text-gray-500',
    card: isNight ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200',
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-6 border ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
               <Cloud size={32} />
            </div>
            <div>
               <h2 className="text-xl font-black tracking-tight uppercase">发现云端数据备份</h2>
               <p className={`text-xs font-bold uppercase tracking-widest ${themeClasses.subText}`}>Cloud Sync & Recovery</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border-l-4 border-indigo-500 ${isNight ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
             <p className="text-sm font-bold leading-relaxed">
                系统检测到 WebDAV 云端存在比本地更新的数据备份。这通常发生在您更换了电脑或重装了应用之后。
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className={`p-4 rounded-xl border flex flex-col gap-2 opacity-60 ${themeClasses.card}`}>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
                   <HardDrive size={14}/> 本地数据 (Local)
                </div>
                <div className="text-sm font-mono font-bold truncate">
                   {formatDate(localDate)}
                </div>
             </div>

             <div className={`p-4 rounded-xl border-2 border-indigo-500 relative flex flex-col gap-2 overflow-hidden ${isNight ? 'bg-indigo-900/10' : 'bg-indigo-50'}`}>
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg">RECOMMENDED</div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                   <Cloud size={14}/> 云端备份 (Cloud)
                </div>
                <div className="text-sm font-mono font-bold truncate text-indigo-700 dark:text-indigo-300">
                   {formatDate(cloudDate)}
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
             <button 
               onClick={onConfirmRestore}
               className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
             >
                <ArrowDownCircle size={20} /> 立即恢复云端数据
             </button>
             <button 
               onClick={onIgnore}
               className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-opacity-80 ${isNight ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
             >
                忽略 (使用当前本地数据)
             </button>
          </div>

          <p className="text-[10px] text-center opacity-40 font-bold uppercase tracking-widest">
             提示: 恢复操作将覆盖当前本地的所有数据。
          </p>

        </div>
      </div>
    </ModalPortal>
  );
};
