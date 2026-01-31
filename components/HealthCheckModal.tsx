
import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ItemHealthReport } from '../hooks/useProductHealthCheck';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  issues: ItemHealthReport[];
  onConfirm: () => void;
  onCancel: () => void;
  isNight: boolean;
}

export const HealthCheckModal: React.FC<Props> = ({ issues, onConfirm, onCancel, isNight }) => {
  const criticalCount = issues.reduce((acc, item) => acc + item.issues.filter(i => i.type === 'critical').length, 0);
  const warningCount = issues.reduce((acc, item) => acc + item.issues.filter(i => i.type === 'warning').length, 0);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${isNight ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
          
          {/* Header */}
          <div className={`px-8 py-6 border-b shrink-0 flex items-start gap-4 ${isNight ? 'bg-red-900/10 border-red-500/20' : 'bg-orange-50 border-orange-100'}`}>
             <div className={`p-3 rounded-2xl shrink-0 ${isNight ? 'bg-red-500/20 text-red-400' : 'bg-orange-100 text-orange-600'}`}>
                <ShieldAlert size={32} />
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">数据健康监测警报</h3>
                <p className={`text-sm font-medium leading-snug ${isNight ? 'text-slate-400' : 'text-gray-600'}`}>
                   系统检测到 <strong>{issues.length}</strong> 行数据存在潜在风险。请仔细核对后再继续。
                </p>
             </div>
          </div>

          {/* Body: List */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
             {issues.map((report) => (
                <div key={report.index} className={`rounded-xl border p-4 ${isNight ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex justify-between items-baseline mb-3 border-b border-dashed pb-2 opacity-80 border-gray-300 dark:border-gray-600">
                      <div className="flex gap-2 font-black text-sm uppercase tracking-wider">
                         <span className="opacity-50">Row {report.index + 1}</span>
                         <span>{report.item.cnName || report.item.enName || 'Unnamed Product'}</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      {report.issues.map((issue, i) => (
                         <div key={i} className="flex gap-3 items-start">
                            {issue.type === 'critical' 
                               ? <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                               : <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            }
                            <span className={`text-xs font-bold leading-relaxed ${issue.type === 'critical' ? 'text-red-500' : (isNight ? 'text-amber-400' : 'text-amber-700')}`}>
                               {issue.message}
                            </span>
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>

          {/* Footer: Actions */}
          <div className={`p-6 border-t shrink-0 flex gap-4 ${isNight ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
             <button 
               onClick={onCancel}
               className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${isNight ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'}`}
             >
                返回修改 (Cancel)
             </button>
             
             <button 
               onClick={onConfirm}
               className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${criticalCount > 0 ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-500/30' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
             >
                {criticalCount > 0 ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
                <span>忽略风险并继续 (Proceed Anyway)</span>
             </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
