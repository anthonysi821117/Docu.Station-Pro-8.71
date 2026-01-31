
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle, AlertCircle, Play, Check } from 'lucide-react';
import { CustomRule, ProductItem } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  rules: CustomRule[];
  onUpdate: (rules: CustomRule[]) => void;
  onClose: () => void;
  isNight: boolean;
}

const FIELD_OPTIONS: { value: keyof ProductItem; label: string }[] = [
  { value: 'cnName', label: '中文品名' },
  { value: 'enName', label: '英文品名' },
  { value: 'hsCode', label: 'HS编码' },
  { value: 'grossWeight', label: '毛重' },
  { value: 'netWeight', label: '净重' },
  { value: 'cartonCount', label: '箱数' },
  { value: 'volume', label: '体积' },
  { value: 'quantity', label: '数量' },
  { value: 'unitPrice', label: '单价 (USD)' },
  { value: 'totalPrice', label: '总价 (USD)' },
  { value: 'declarationElements', label: '申报要素' },
  { value: 'packageType', label: '包装类型' },
];

const OPERATORS = [
  { value: 'gt', label: '大于 (>)' },
  { value: 'gte', label: '大于等于 (>=)' },
  { value: 'lt', label: '小于 (<)' },
  { value: 'lte', label: '小于等于 (<=)' },
  { value: 'eq', label: '等于 (==)' },
  { value: 'neq', label: '不等于 (!=)' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' },
  { value: 'empty', label: '为空' },
  { value: 'not_empty', label: '不为空' },
];

const DEFAULT_RULE: CustomRule = {
  id: '',
  name: '',
  targetField: 'grossWeight',
  operator: 'lt',
  compareMode: 'field',
  compareValue: 'netWeight',
  severity: 'warning',
  message: '数据校验失败',
  enabled: true
};

export const RuleEditor: React.FC<Props> = ({ rules, onUpdate, onClose, isNight }) => {
  const [editingRules, setEditingRules] = useState<CustomRule[]>(JSON.parse(JSON.stringify(rules)));
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  const handleAdd = () => {
    const newRule: CustomRule = {
      ...DEFAULT_RULE,
      id: Date.now().toString(),
      name: `新建规则 ${editingRules.length + 1}`
    };
    setEditingRules([...editingRules, newRule]);
    setActiveRuleId(newRule.id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条规则吗？')) {
      setEditingRules(prev => prev.filter(r => r.id !== id));
      if (activeRuleId === id) setActiveRuleId(null);
    }
  };

  const handleUpdateActive = (field: keyof CustomRule, value: any) => {
    setEditingRules(prev => prev.map(r => r.id === activeRuleId ? { ...r, [field]: value } : r));
  };

  const handleSaveAll = () => {
    onUpdate(editingRules);
    onClose();
  };

  const activeRule = editingRules.find(r => r.id === activeRuleId);

  const themeClasses = {
    bg: isNight ? 'bg-slate-900' : 'bg-white',
    text: isNight ? 'text-slate-100' : 'text-gray-800',
    border: isNight ? 'border-slate-700' : 'border-gray-200',
    card: isNight ? 'bg-slate-800' : 'bg-gray-50',
    input: isNight ? 'bg-slate-900 border-slate-600 text-white focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col border overflow-hidden ${themeClasses.bg} ${themeClasses.text} ${themeClasses.border}`}>
          
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-5 border-b shrink-0 bg-indigo-600 text-white">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                   <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tight">自定义数据校验器</h2>
                   <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Custom Logic Engine</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button onClick={handleSaveAll} className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2">
                   <Save size={16}/> 保存规则
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-100 hover:text-white">
                   <X size={24} />
                </button>
             </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
             {/* Sidebar: Rule List */}
             <div className={`w-1/3 border-r flex flex-col ${themeClasses.border} ${isNight ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                <div className="p-4 flex justify-between items-center border-b shrink-0 border-gray-200 dark:border-slate-700">
                   <span className="text-xs font-bold uppercase text-gray-500">已配置规则 ({editingRules.length})</span>
                   <button onClick={handleAdd} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      <Plus size={16} />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                   {editingRules.map(rule => (
                      <div 
                        key={rule.id}
                        onClick={() => setActiveRuleId(rule.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${rule.id === activeRuleId ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg relative z-10' : `${themeClasses.border} ${isNight ? 'hover:bg-slate-800' : 'hover:bg-white'}`} ${!rule.enabled ? 'opacity-50' : ''}`}
                      >
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm truncate pr-2">{rule.name}</span>
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rule.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                         </div>
                         <p className="text-[10px] opacity-60 truncate font-mono">
                            {rule.targetField} {rule.operator} {rule.compareMode === 'field' ? `[${rule.compareValue}]` : rule.compareValue}
                         </p>
                      </div>
                   ))}
                   {editingRules.length === 0 && (
                      <div className="text-center py-10 opacity-40">
                         <Play size={32} className="mx-auto mb-2" />
                         <p className="text-xs font-bold">暂无规则，请点击右上角添加</p>
                      </div>
                   )}
                </div>
             </div>

             {/* Main: Rule Editor */}
             <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black/20">
                {activeRule ? (
                   <div className="p-8 max-w-3xl mx-auto w-full space-y-8">
                      {/* Name & Toggle */}
                      <div className="flex gap-4 items-center">
                         <div className="flex-1">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">规则名称</label>
                            <input 
                               type="text" 
                               value={activeRule.name}
                               onChange={e => handleUpdateActive('name', e.target.value)}
                               className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${themeClasses.input}`}
                               placeholder="例如: 毛重校验"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">启用状态</label>
                            <button 
                               onClick={() => handleUpdateActive('enabled', !activeRule.enabled)}
                               className={`h-[46px] px-6 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${activeRule.enabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-gray-400 border-gray-300 dark:border-slate-600'}`}
                            >
                               {activeRule.enabled ? <Check size={16} /> : <X size={16} />}
                               {activeRule.enabled ? '已启用' : '已禁用'}
                            </button>
                         </div>
                      </div>

                      {/* Logic Builder */}
                      <div className={`p-6 rounded-2xl border ${themeClasses.border} ${themeClasses.card}`}>
                         <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-indigo-500">
                            <Play size={16} /> 逻辑定义 (If...)
                         </h3>
                         
                         <div className="grid grid-cols-3 gap-4 items-end">
                            <div>
                               <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">检查字段</label>
                               <select 
                                  value={activeRule.targetField}
                                  onChange={e => handleUpdateActive('targetField', e.target.value)}
                                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${themeClasses.input}`}
                               >
                                  {FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                               </select>
                            </div>

                            <div>
                               <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">条件 (Operator)</label>
                               <select 
                                  value={activeRule.operator}
                                  onChange={e => handleUpdateActive('operator', e.target.value)}
                                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${themeClasses.input}`}
                               >
                                  {OPERATORS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                               </select>
                            </div>

                            {!['empty', 'not_empty'].includes(activeRule.operator) && (
                               <div className="flex gap-2">
                                  <div className="flex-1">
                                     <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">比对模式</label>
                                     <select 
                                        value={activeRule.compareMode}
                                        onChange={e => handleUpdateActive('compareMode', e.target.value)}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold outline-none ${themeClasses.input}`}
                                     >
                                        <option value="value">固定值</option>
                                        <option value="field">另一字段</option>
                                     </select>
                                  </div>
                                  <div className="flex-[2]">
                                     <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">比对内容</label>
                                     {activeRule.compareMode === 'field' ? (
                                        <select 
                                           value={activeRule.compareValue}
                                           onChange={e => handleUpdateActive('compareValue', e.target.value)}
                                           className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${themeClasses.input}`}
                                        >
                                           {FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                     ) : (
                                        <input 
                                           type="text" 
                                           value={activeRule.compareValue}
                                           onChange={e => handleUpdateActive('compareValue', e.target.value)}
                                           className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none ${themeClasses.input}`}
                                           placeholder="输入值..."
                                        />
                                     )}
                                  </div>
                               </div>
                            )}
                         </div>
                         <p className="mt-4 text-xs opacity-60 font-mono bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                            预览: 当 <strong>{FIELD_OPTIONS.find(f => f.value === activeRule.targetField)?.label}</strong> {OPERATORS.find(o => o.value === activeRule.operator)?.label} {['empty', 'not_empty'].includes(activeRule.operator) ? '' : (activeRule.compareMode === 'field' ? `[${FIELD_OPTIONS.find(f => f.value === activeRule.compareValue)?.label}]` : `"${activeRule.compareValue}"`)} 时...
                         </p>
                      </div>

                      {/* Result Definition */}
                      <div className={`p-6 rounded-2xl border ${themeClasses.border} ${themeClasses.card}`}>
                         <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-red-500">
                            <AlertCircle size={16} /> 触发结果 (Then...)
                         </h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                               <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">警报级别</label>
                               <div className="flex gap-2">
                                  <button 
                                     onClick={() => handleUpdateActive('severity', 'warning')}
                                     className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${activeRule.severity === 'warning' ? 'bg-amber-100 border-amber-500 text-amber-700' : `${themeClasses.input} opacity-60`}`}
                                  >
                                     警告 (Warning)
                                  </button>
                                  <button 
                                     onClick={() => handleUpdateActive('severity', 'critical')}
                                     className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${activeRule.severity === 'critical' ? 'bg-red-100 border-red-500 text-red-700' : `${themeClasses.input} opacity-60`}`}
                                  >
                                     严重 (Critical)
                                  </button>
                               </div>
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">错误提示消息</label>
                               <input 
                                  type="text" 
                                  value={activeRule.message}
                                  onChange={e => handleUpdateActive('message', e.target.value)}
                                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none ${themeClasses.input} ${activeRule.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}
                                  placeholder="例如: 毛重必须大于净重！"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-end pt-4">
                         <button 
                           onClick={() => handleDelete(activeRule.id)}
                           className="px-6 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                         >
                            <Trash2 size={16} /> 删除此规则
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                         <Play size={40} className="ml-1.5 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="font-bold text-sm">请从左侧选择一个规则或新建</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
