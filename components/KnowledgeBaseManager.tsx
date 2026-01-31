
import React, { useState, useMemo } from 'react';
import { X, Search, ShieldAlert, FileSpreadsheet, Save, Plus, Trash2, Import, AlertTriangle, BookOpen } from 'lucide-react';
import { KnowledgeBase, ComplianceRule } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  knowledgeBase: KnowledgeBase;
  onUpdate: (kb: KnowledgeBase) => void;
  onClose: () => void;
  isNight: boolean;
}

export const KnowledgeBaseManager: React.FC<Props> = ({ knowledgeBase, onUpdate, onClose, isNight }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'import'>('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [importText, setImportText] = useState('');
  const [newRule, setNewRule] = useState<Partial<ComplianceRule>>({ status: 'normal' });

  // Filter Rules
  const filteredRules = useMemo(() => {
    const term = searchTerm.toLowerCase().replace(/\./g, '');
    return Object.entries(knowledgeBase.complianceRules)
      .filter(([hs, rule]) => {
        const r = rule as ComplianceRule;
        return hs.includes(term) || r.note.toLowerCase().includes(term);
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [knowledgeBase.complianceRules, searchTerm]);

  // Actions
  const handleAddRule = () => {
    if (!newRule.hsCode || newRule.taxRefundRate === undefined) {
      alert("HS编码和退税率是必填项");
      return;
    }
    const cleanHs = newRule.hsCode.replace(/[^\d]/g, '');
    const updatedRules = {
      ...knowledgeBase.complianceRules,
      [cleanHs]: {
        hsCode: cleanHs,
        taxRefundRate: Number(newRule.taxRefundRate),
        status: newRule.status || 'normal',
        note: newRule.note || '',
        lastUpdated: new Date().toISOString()
      } as ComplianceRule
    };
    onUpdate({ ...knowledgeBase, complianceRules: updatedRules });
    setNewRule({ status: 'normal', hsCode: '', taxRefundRate: undefined, note: '' });
  };

  const handleDeleteRule = (hsKey: string) => {
    if (!window.confirm("确定删除这条规则吗？")) return;
    const updatedRules = { ...knowledgeBase.complianceRules };
    delete updatedRules[hsKey];
    onUpdate({ ...knowledgeBase, complianceRules: updatedRules });
  };

  const handleBatchImport = () => {
    if (!importText.trim()) return;
    
    const rows = importText.trim().split('\n');
    let addedCount = 0;
    const updatedRules = { ...knowledgeBase.complianceRules };

    rows.forEach(row => {
      // Expected Format: HSCode [tab] Rate [tab] Note
      const cols = row.split('\t').map(c => c.trim());
      if (cols.length >= 2) {
        const hsRaw = cols[0];
        const rateRaw = cols[1];
        const note = cols[2] || '';
        
        const cleanHs = hsRaw.replace(/[^\d]/g, '');
        const rate = parseFloat(rateRaw.replace('%', '')); // Handle "13%" or "13"

        if (cleanHs.length >= 4 && !isNaN(rate)) {
          updatedRules[cleanHs] = {
            hsCode: cleanHs,
            taxRefundRate: rate,
            status: rate === 0 ? 'warning' : 'normal',
            note: note,
            lastUpdated: new Date().toISOString()
          };
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      onUpdate({ ...knowledgeBase, complianceRules: updatedRules });
      setImportText('');
      alert(`成功导入/更新了 ${addedCount} 条规则！`);
      setActiveTab('rules');
    } else {
      alert("未识别到有效数据。请检查格式：HS编码(Tab)退税率(Tab)备注");
    }
  };

  const themeClasses = {
    bg: isNight ? 'bg-slate-900' : 'bg-white',
    text: isNight ? 'text-slate-100' : 'text-gray-800',
    border: isNight ? 'border-slate-700' : 'border-gray-200',
    inputBg: isNight ? 'bg-slate-800 text-white' : 'bg-white text-gray-900',
    hoverBg: isNight ? 'hover:bg-white/5' : 'hover:bg-gray-50',
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
        <div className={`w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`}>
          
          {/* Header */}
          <div className="px-8 py-6 border-b shrink-0 flex justify-between items-center bg-indigo-600 text-white">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                 <ShieldAlert size={24} className="text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-black tracking-tight uppercase">合规规则引擎</h2>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Compliance & Tax Rules Database</p>
               </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
               <X size={24} />
             </button>
          </div>

          {/* Navigation */}
          <div className={`flex border-b ${themeClasses.border}`}>
             <button 
               onClick={() => setActiveTab('rules')}
               className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'rules' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
             >
               规则列表 ({Object.keys(knowledgeBase.complianceRules).length})
             </button>
             <button 
               onClick={() => setActiveTab('import')}
               className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'import' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
             >
               <Import size={16} /> 批量导入 / 粘贴
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
             
             {/* Tab: Rules List */}
             {activeTab === 'rules' && (
               <>
                 {/* Toolbar */}
                 <div className={`p-4 border-b flex gap-4 ${themeClasses.border} bg-gray-50/50 dark:bg-black/20`}>
                    <div className="relative flex-1">
                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                       <input 
                         type="text" 
                         placeholder="搜索 HS 编码或备注..." 
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm font-bold outline-none border ${themeClasses.border} ${themeClasses.inputBg}`}
                       />
                    </div>
                    
                    {/* Add Rule Form (Inline) */}
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                       <input 
                         placeholder="HS Code" 
                         className={`w-32 px-3 py-1.5 rounded-lg text-sm font-mono font-bold outline-none bg-transparent`}
                         value={newRule.hsCode || ''}
                         onChange={e => setNewRule({...newRule, hsCode: e.target.value})}
                       />
                       <div className="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>
                       <input 
                         placeholder="退税%" 
                         type="number"
                         className={`w-20 px-3 py-1.5 rounded-lg text-sm font-bold outline-none bg-transparent`}
                         value={newRule.taxRefundRate ?? ''}
                         onChange={e => setNewRule({...newRule, taxRefundRate: parseFloat(e.target.value)})}
                       />
                       <div className="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>
                       <input 
                         placeholder="备注/法规..." 
                         className={`w-48 px-3 py-1.5 rounded-lg text-sm font-bold outline-none bg-transparent`}
                         value={newRule.note || ''}
                         onChange={e => setNewRule({...newRule, note: e.target.value})}
                       />
                       <button 
                         onClick={handleAddRule}
                         className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                       >
                         <Plus size={16} />
                       </button>
                    </div>
                 </div>

                 {/* List */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {filteredRules.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                         <BookOpen size={48} className="mb-4"/>
                         <p className="text-sm font-bold uppercase tracking-widest">暂无匹配规则</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {filteredRules.map(([key, rule]) => {
                           const r = rule as ComplianceRule;
                           return (
                           <div key={key} className={`p-4 rounded-2xl border transition-all group ${themeClasses.border} ${themeClasses.hoverBg} ${r.taxRefundRate === 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
                              <div className="flex justify-between items-start mb-2">
                                 <span className="font-mono text-lg font-black tracking-tight">{r.hsCode}</span>
                                 <button onClick={() => handleDeleteRule(key)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                              <div className="flex items-center gap-3 mb-2">
                                 <span className={`px-2 py-1 rounded text-xs font-black ${r.taxRefundRate === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                    退税率: {r.taxRefundRate}%
                                 </span>
                                 {r.status === 'banned' && <span className="px-2 py-1 rounded text-xs font-black bg-black text-white">禁止出口</span>}
                              </div>
                              {r.note && (
                                <p className="text-xs opacity-60 font-medium leading-relaxed">{r.note}</p>
                              )}
                           </div>
                         )})}
                      </div>
                    )}
                 </div>
               </>
             )}

             {/* Tab: Import */}
             {activeTab === 'import' && (
               <div className="flex-1 p-8 flex flex-col items-center">
                  <div className={`w-full max-w-3xl flex-1 flex flex-col gap-4`}>
                     <div className={`p-6 rounded-2xl border-2 border-dashed ${isNight ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex items-start gap-4 mb-4">
                           <FileSpreadsheet size={32} className="text-indigo-500 shrink-0" />
                           <div>
                              <h3 className="font-bold text-lg mb-1">从 Excel / 表格快速导入</h3>
                              <p className="text-sm opacity-70">请复制 Excel 中的列并粘贴到下方。系统会自动识别并更新现有的 HS 编码规则。</p>
                              <div className="mt-2 text-xs font-mono bg-black/5 p-2 rounded inline-block">
                                 格式要求: HS编码(必填) &nbsp;|&nbsp; 退税率(必填) &nbsp;|&nbsp; 备注说明(选填)
                              </div>
                           </div>
                        </div>
                        <textarea 
                          value={importText}
                          onChange={e => setImportText(e.target.value)}
                          placeholder={`例如:\n7318151090\t13\t普通螺栓\n8541402000\t0\t2024年起取消退税`}
                          className={`w-full h-64 p-4 rounded-xl border font-mono text-xs outline-none focus:ring-2 ring-indigo-500/50 ${themeClasses.inputBg} ${themeClasses.border}`}
                        />
                     </div>
                     <div className="flex justify-end">
                        <button 
                          onClick={handleBatchImport}
                          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2"
                        >
                           <Import size={18} /> 确认并导入
                        </button>
                     </div>
                  </div>
               </div>
             )}

          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
