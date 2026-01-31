
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Search, ShieldAlert, Save, Plus, Trash2, Import, AlertTriangle, BookOpen, Gavel, Play, Check, AlertCircle, FileSpreadsheet, ChevronRight, Loader2 } from 'lucide-react';
import { KnowledgeBase, ComplianceRule, CustomRule, ProductItem } from '../types';
import { ModalPortal } from './ui/ModalPortal';
import { LineInput, SelectInput, ModalInput, ModalTextarea } from './ui/SharedInputs';

interface Props {
  initialTab: 'rules' | 'kb';
  knowledgeBase: KnowledgeBase;
  onUpdateKB: (kb: KnowledgeBase) => void;
  rules: CustomRule[];
  onUpdateRules: (rules: CustomRule[]) => void;
  onClose: () => void;
  isNight: boolean;
}

const FIELD_OPTIONS: { value: keyof ProductItem; label: string }[] = [
  { value: 'hsCode', label: 'HS编码 (HS Code)' },
  { value: 'grossWeight', label: '毛重 (G.W)' },
  { value: 'netWeight', label: '净重 (N.W)' },
  { value: 'unitPrice', label: '单价 (Unit Price)' },
  { value: 'totalPrice', label: '总价 (Total Price)' },
  { value: 'cnName', label: '中文品名' },
  { value: 'enName', label: '英文品名' },
  { value: 'cartonCount', label: '箱数 (Pkgs)' },
  { value: 'volume', label: '体积 (CBM)' },
  { value: 'quantity', label: '数量 (Qty)' },
  { value: 'declarationElements', label: '申报要素' },
  { value: 'packageType', label: '包装单位' },
];

const OPERATORS = [
  { value: 'gt', label: '大于 (>)' },
  { value: 'lt', label: '小于 (<)' },
  { value: 'eq', label: '等于 (==)' },
  { value: 'neq', label: '不等于 (!=)' },
  { value: 'contains', label: '包含 (Contains)' },
  { value: 'not_contains', label: '不包含 (Not Contains)' },
  { value: 'empty', label: '为空 (Is Empty)' },
  { value: 'not_empty', label: '不为空 (Has Value)' },
];

const DEFAULT_RULE: CustomRule = {
  id: '', name: '新建校验规则', targetField: 'grossWeight', operator: 'gt',
  compareMode: 'value', compareValue: '0', severity: 'warning', message: '数据校验未通过', enabled: true
};

const EMPTY_KB_RULE: ComplianceRule = {
  hsCode: '', taxRefundRate: 13, status: 'normal', note: '', lastUpdated: ''
};

export const ComplianceManager: React.FC<Props> = ({ 
  initialTab, knowledgeBase, onUpdateKB, rules, onUpdateRules, onClose, isNight 
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'kb'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local master copies to prevent lag on every keystroke
  const [localRules, setLocalRules] = useState<CustomRule[]>(() => JSON.parse(JSON.stringify(rules)));
  const [localKB, setLocalKB] = useState<KnowledgeBase>(() => JSON.parse(JSON.stringify(knowledgeBase)));

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [selectedHsCode, setSelectedHsCode] = useState<string | null>(null);

  // Buffer state for the item currently being edited
  const [editingKBRule, setEditingKBRule] = useState<ComplianceRule | null>(null);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);

  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Sync buffer when selection changes
  useEffect(() => {
    if (activeTab === 'kb') {
      if (selectedHsCode === '__NEW__') {
        setEditingKBRule({ ...EMPTY_KB_RULE });
      } else if (selectedHsCode) {
        const rule = localKB.complianceRules[selectedHsCode];
        setEditingKBRule(rule ? { ...rule } : null);
      } else {
        setEditingKBRule(null);
      }
    } else {
      const rule = localRules.find(r => r.id === selectedRuleId);
      setEditingRule(rule ? { ...rule } : null);
    }
  }, [selectedHsCode, selectedRuleId, activeTab, localKB, localRules]);

  const filteredRules = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return localRules.filter(r => r.name.toLowerCase().includes(term));
  }, [localRules, searchTerm]);

  const filteredKB = useMemo(() => {
    const term = searchTerm.toLowerCase().replace(/\./g, '');
    return Object.entries(localKB.complianceRules)
      .filter(([hs, rule]) => hs.includes(term) || (rule as ComplianceRule).note.toLowerCase().includes(term))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [localKB.complianceRules, searchTerm]);

  const handleAddRule = () => {
    const newR = { ...DEFAULT_RULE, id: Date.now().toString(), name: '新规则' };
    setLocalRules([...localRules, newR]);
    setSelectedRuleId(newR.id);
  };

  const handleUpdateRuleBuffer = (field: keyof CustomRule, value: any) => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, [field]: value });
  };

  const commitRuleChange = () => {
    if (!editingRule) return;
    setLocalRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
    showToast('规则已暂存');
  };

  const handleDeleteRule = (id: string) => {
    if(confirm('确定删除此规则？')) {
      setLocalRules(prev => prev.filter(r => r.id !== id));
      if (selectedRuleId === id) setSelectedRuleId(null);
    }
  };

  const handleAddKB = () => {
    setSelectedHsCode('__NEW__');
    setEditingKBRule({ ...EMPTY_KB_RULE });
  };

  const handleKBBufferChange = (field: keyof ComplianceRule, value: any) => {
    if (!editingKBRule) return;
    setEditingKBRule({ ...editingKBRule, [field]: value });
  };

  const handleSaveKBItem = () => {
    if (!editingKBRule || !editingKBRule.hsCode) {
      alert("HS 编码是必填项");
      return;
    }
    const cleanHs = editingKBRule.hsCode.replace(/[^\d]/g, '');
    if (cleanHs.length < 4) return alert("HS 编码过短");

    const updatedKB = { 
      ...localKB, 
      complianceRules: { 
        ...localKB.complianceRules, 
        [cleanHs]: { ...editingKBRule, hsCode: cleanHs, lastUpdated: new Date().toISOString() } 
      } 
    };
    
    setLocalKB(updatedKB);
    setSelectedHsCode(cleanHs);
    showToast('记录已暂存');
  };

  const showToast = (msg: string) => {
      const btn = document.getElementById('save-btn');
      if (btn) {
          const original = btn.innerText;
          btn.innerText = msg;
          btn.classList.add('bg-green-600');
          setTimeout(() => {
              btn.innerText = original;
              btn.classList.remove('bg-green-600');
          }, 1500);
      }
  };

  const handleSaveAll = () => {
    if (activeTab === 'rules') onUpdateRules(localRules);
    else onUpdateKB(localKB);
    onClose();
  };

  const themeClasses = {
    bg: isNight ? 'bg-[#0f172a]' : 'bg-white', 
    contentArea: isNight ? 'bg-[#1e293b]' : 'bg-slate-50',
    text: isNight ? 'text-slate-100' : 'text-gray-900',
    border: isNight ? 'border-slate-700' : 'border-gray-200',
    sidebar: isNight ? 'bg-[#0f172a]' : 'bg-gray-50',
    itemActive: isNight ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-l-4 border-l-blue-600 shadow-sm text-blue-700',
    itemInactive: isNight ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-slate-600',
    input: isNight ? 'bg-slate-900 border-slate-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-slate-900 focus:border-blue-500',
    card: isNight ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-gray-200 shadow-sm',
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div 
          className={`w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`} 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${isNight ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-gray-200'}`}>
             <div className="flex gap-6 items-center">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${activeTab === 'rules' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {activeTab === 'rules' ? <Gavel size={22}/> : <ShieldAlert size={22}/>}
                   </div>
                   <h2 className="text-xl font-black tracking-tight">合规与校验中心</h2>
                </div>
                
                <div className={`flex p-1 rounded-xl border ${themeClasses.border} ${isNight ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
                   <button 
                     onClick={() => { setActiveTab('rules'); setSearchTerm(''); }}
                     className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'rules' ? (isNight ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-500 hover:text-slate-600'}`}
                   >
                      <Gavel size={14}/> 自动化校验规则
                   </button>
                   <button 
                     onClick={() => { setActiveTab('kb'); setSearchTerm(''); }}
                     className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'kb' ? (isNight ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-800 shadow') : 'text-slate-500 hover:text-slate-600'}`}
                   >
                      <ShieldAlert size={14}/> 合规知识库 (HS)
                   </button>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <button 
                  id="save-btn"
                  onClick={handleSaveAll}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-transparent ${isNight ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                >
                   <Save size={18}/> 确认并保存
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                   <X size={24}/>
                </button>
             </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
             
             {/* Sidebar */}
             <div className={`w-80 border-r flex flex-col shrink-0 ${themeClasses.sidebar} ${themeClasses.border}`}>
                <div className={`p-4 border-b ${themeClasses.border}`}>
                   <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={activeTab === 'rules' ? "搜索规则..." : "搜索 HS 或备注..."}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-[11px] font-bold outline-none border transition-all ${themeClasses.input}`}
                      />
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                   {activeTab === 'rules' ? (
                      <>
                        <button onClick={handleAddRule} className={`w-full py-2.5 mb-2 border border-dashed rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${isNight ? 'border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'border-gray-300 text-gray-500 hover:bg-white hover:text-blue-600'}`}>
                           <Plus size={14}/> 新建规则
                        </button>
                        {filteredRules.map(rule => (
                           <div 
                             key={rule.id}
                             onClick={() => setSelectedRuleId(rule.id)}
                             className={`px-4 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${selectedRuleId === rule.id ? themeClasses.itemActive : themeClasses.itemInactive}`}
                           >
                              <div className="flex justify-between items-center mb-1">
                                 <span className="font-bold text-sm truncate">{rule.name}</span>
                                 <div className={`w-2 h-2 rounded-full ${rule.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                              </div>
                              <p className="text-[10px] uppercase font-black opacity-50 font-mono truncate">{rule.targetField} {rule.operator}</p>
                           </div>
                        ))}
                      </>
                   ) : (
                      <>
                        <button onClick={handleAddKB} className={`w-full py-2.5 mb-2 border border-dashed rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${isNight ? 'border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'border-gray-300 text-gray-500 hover:bg-white hover:text-indigo-600'}`}>
                           <Plus size={14}/> 新增 HS 记录
                        </button>
                        {filteredKB.map(([hs, rule]) => {
                           const r = rule as ComplianceRule;
                           return (
                           <div 
                             key={hs}
                             onClick={() => setSelectedHsCode(hs)}
                             className={`px-4 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${selectedHsCode === hs ? themeClasses.itemActive : themeClasses.itemInactive}`}
                           >
                              <div className="flex justify-between items-center mb-1">
                                 <span className="font-mono font-black text-sm tracking-tight">{hs}</span>
                                 <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${r.taxRefundRate === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{r.taxRefundRate}%</span>
                              </div>
                              {r.note && <p className="text-[10px] font-bold opacity-60 truncate">{r.note}</p>}
                           </div>
                        )})}
                      </>
                   )}
                </div>
             </div>

             {/* Content Area */}
             <div className={`flex-1 flex flex-col ${themeClasses.contentArea} overflow-hidden relative`}>
                {activeTab === 'rules' && editingRule ? (
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className={`max-w-3xl mx-auto rounded-2xl border p-8 ${themeClasses.card}`}>
                         <div className="flex justify-between items-start mb-8 border-b border-gray-100 dark:border-slate-700 pb-6">
                            <div>
                               <h3 className="text-xl font-black flex items-center gap-2">
                                  <Gavel size={22} className="text-amber-500"/>
                                  规则逻辑编辑器
                               </h3>
                               <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1.5">Condition & Logic Definition</p>
                            </div>
                            <button onClick={() => handleDeleteRule(editingRule.id)} className="p-3 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"><Trash2 size={20}/></button>
                         </div>
                         <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                               <div>
                                  <label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">规则展示名称</label>
                                  <ModalInput isNight={isNight} themeMode={isNight ? 'night' : 'classic'} value={editingRule.name} onChange={e => handleUpdateRuleBuffer('name', e.target.value)} onBlur={commitRuleChange} />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">启用状态</label>
                                  <button onClick={() => { const v = !editingRule.enabled; handleUpdateRuleBuffer('enabled', v); setLocalRules(prev => prev.map(r => r.id === editingRule.id ? {...r, enabled: v} : r)); }} className={`w-full text-left border-b h-[36px] flex items-center gap-2 text-sm font-black transition-all ${isNight ? 'border-slate-600' : 'border-gray-300'} ${editingRule.enabled ? 'text-green-500' : 'text-gray-400 opacity-50'}`}>{editingRule.enabled ? <Check size={16}/> : <X size={16}/>} {editingRule.enabled ? '已激活' : '已禁用'}</button>
                               </div>
                            </div>
                            <div className={`p-6 rounded-2xl border border-dashed ${isNight ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                               <h4 className="text-xs font-black uppercase tracking-wider mb-6 text-indigo-500 flex items-center gap-2"><Play size={14}/> 1. 触发逻辑 (IF)</h4>
                               <div className="flex gap-4 items-center mb-6">
                                  <div className="flex-1 min-w-[200px]"><SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingRule.targetField} onChange={e => { handleUpdateRuleBuffer('targetField', e.target.value); commitRuleChange(); }}>{FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</SelectInput></div>
                                  <div className="w-48"><SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingRule.operator} onChange={e => { handleUpdateRuleBuffer('operator', e.target.value); commitRuleChange(); }}>{OPERATORS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</SelectInput></div>
                               </div>
                               {!['empty', 'not_empty'].includes(editingRule.operator) && (
                                  <div className="flex gap-4 items-center">
                                     <div className="w-32"><SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingRule.compareMode} onChange={e => { handleUpdateRuleBuffer('compareMode', e.target.value); commitRuleChange(); }}><option value="value">输入值</option><option value="field">引用字段</option></SelectInput></div>
                                     <div className="flex-1">
                                        {editingRule.compareMode === 'field' ? (<SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingRule.compareValue} onChange={e => { handleUpdateRuleBuffer('compareValue', e.target.value); commitRuleChange(); }}>{FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</SelectInput>) : (<ModalInput isNight={isNight} themeMode={isNight ? 'night' : 'classic'} value={editingRule.compareValue} onChange={e => handleUpdateRuleBuffer('compareValue', e.target.value)} onBlur={commitRuleChange} placeholder="输入值..." />)}
                                     </div>
                                  </div>
                               )}
                            </div>
                            <div className={`p-6 rounded-2xl border border-dashed ${isNight ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50/50 border-red-100'}`}>
                               <h4 className="text-xs font-black uppercase tracking-wider mb-6 text-red-500 flex items-center gap-2"><AlertCircle size={14}/> 2. 警报行为 (THEN)</h4>
                               <div className="grid grid-cols-3 gap-6">
                                  <div><label className="block text-[10px] font-black uppercase opacity-60 mb-2">严重级别</label><SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingRule.severity} onChange={e => { handleUpdateRuleBuffer('severity', e.target.value); commitRuleChange(); }}><option value="warning">警告 (Warning)</option><option value="critical">阻断 (Critical)</option></SelectInput></div>
                                  <div className="col-span-2"><label className="block text-[10px] font-black uppercase opacity-60 mb-2">反馈消息内容</label><ModalInput isNight={isNight} themeMode={isNight ? 'night' : 'classic'} value={editingRule.message} onChange={e => handleUpdateRuleBuffer('message', e.target.value)} onBlur={commitRuleChange} placeholder="如：净重不能大于毛重！" /></div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : activeTab === 'kb' && editingKBRule ? (
                   <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className={`max-w-3xl mx-auto rounded-2xl border p-8 ${themeClasses.card}`}>
                         <div className="flex justify-between items-start mb-8 border-b border-gray-100 dark:border-slate-700 pb-6">
                            <div>
                               <h3 className="text-xl font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><ShieldAlert size={22}/> HS 合规详情编辑</h3>
                               <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1.5">{selectedHsCode === '__NEW__' ? 'CREATING NEW ENTRY' : `EDITING HS: ${selectedHsCode}`}</p>
                            </div>
                            {selectedHsCode !== '__NEW__' && (<button onClick={() => { if(confirm('确定删除?')){ const updated = {...localKB.complianceRules}; delete updated[selectedHsCode!]; setLocalKB({...localKB, complianceRules: updated}); setSelectedHsCode(null); } }} className="p-3 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={20}/></button>)}
                         </div>
                         <div className="space-y-8">
                            <div>
                               <label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">HS 编码</label>
                               <input className={`w-full border-b outline-none bg-transparent px-2 py-2 text-lg font-mono font-black tracking-widest transition-all ${isNight ? 'text-white border-slate-600 focus:border-indigo-500' : 'text-slate-900 border-gray-300 focus:border-indigo-600'} ${selectedHsCode !== '__NEW__' ? 'opacity-50' : ''}`} placeholder="e.g. 7318151090" value={editingKBRule.hsCode} onChange={(e) => handleKBBufferChange('hsCode', e.target.value)} disabled={selectedHsCode !== '__NEW__'}/>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                               <div><label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">出口退税率 (%)</label><div className="relative"><input type="number" value={editingKBRule.taxRefundRate} onChange={(e) => handleKBBufferChange('taxRefundRate', parseFloat(e.target.value) || 0)} className={`w-full border-b outline-none bg-transparent px-2 py-2 text-base font-black transition-all ${isNight ? 'border-slate-600 text-white focus:border-blue-500' : 'border-gray-300 text-black focus:border-blue-600'}`}/><span className="absolute right-2 top-2 text-xs font-bold opacity-30">%</span></div></div>
                               <div><label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">管控状态</label><SelectInput themeMode={isNight ? 'night' : 'classic'} value={editingKBRule.status} onChange={e => handleKBBufferChange('status', e.target.value)}><option value="normal">正常 (Normal)</option><option value="warning">重点 (Warning)</option><option value="banned">禁止 (Banned)</option></SelectInput></div>
                            </div>
                            <div><label className="block text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">备注说明</label><ModalTextarea isNight={isNight} themeMode={isNight ? 'night' : 'classic'} value={editingKBRule.note} onChange={e => handleKBBufferChange('note', e.target.value)} placeholder="法规变动、反倾销预警等..." rows={4} className="font-bold leading-relaxed"/></div>
                            <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex justify-end"><button onClick={handleSaveKBItem} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"><Check size={18}/> 暂存单项配置</button></div>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full opacity-20 text-center"><div className="p-8 bg-gray-100 dark:bg-slate-800 rounded-full mb-6 border-4 border-white dark:border-slate-700 shadow-inner">{activeTab === 'rules' ? <Gavel size={64} className="text-slate-400" /> : <ShieldAlert size={64} className="text-slate-400" />}</div><h4 className="text-xl font-black uppercase tracking-widest mb-2">未选择项目</h4><p className="text-sm font-bold max-w-xs mx-auto">请从左侧列表选择项目进行编辑</p></div>
                )}
             </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
