
import React, { useEffect, useCallback, memo } from 'react';
import { HeaderInfo, FXItem, ExtraExpense, CostItem, CustomTheme } from '../types'; 
import { Plus, Trash2, Eye } from 'lucide-react'; 
import { useSettlementCalculations, sNum } from '../hooks/useSettlementCalculations';

interface Props {
  header: HeaderInfo;
  setHeader: React.Dispatch<React.SetStateAction<HeaderInfo>>;
  themeMode?: 'classic' | 'night' | 'vibrant' | 'custom';
  onOpenSettlementPreview: () => void;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

// ----------------------------------------------------------------------
// Reusable Form Components
// ----------------------------------------------------------------------

interface SectionHeaderProps {
  title: React.ReactNode; 
  rightContent?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = memo(({ title, rightContent, className = "bg-blue-50 border-blue-200", textClassName = "text-blue-900" }) => (
  <div className={`border-y px-4 py-2 flex justify-between items-center mt-6 first:mt-0 ${className}`}>
    <h3 className={`font-bold text-sm flex items-center gap-2 ${textClassName}`}>
      {title}
    </h3>
    <div className={`text-xs font-medium flex items-center gap-2 ${textClassName}`}>
      {rightContent}
    </div>
  </div>
));

interface FormRowProps {
  children?: React.ReactNode;
  className?: string;
}

const FormRow: React.FC<FormRowProps> = memo(({ children, className = "" }) => (
  <div className={`flex border-b last:border-b-0 ${className}`}>
    {children}
  </div>
));

interface FormFieldProps {
  label?: string;
  children?: React.ReactNode;
  width?: string;
  className?: string;
  noBorderR?: boolean;
  labelClass?: string;
  borderColorClass?: string;
}

const FormField: React.FC<FormFieldProps> = memo(({ 
  label, 
  children, 
  width = "flex-1", 
  className = "",
  noBorderR = false,
  labelClass = "text-slate-600",
  borderColorClass = "border-gray-200"
}) => (
  <div className={`${width} ${!noBorderR ? `border-r ${borderColorClass}` : ''} p-2 flex flex-col justify-center relative ${className}`}>
    {label && <span className={`text-[11px] font-bold mb-1 block ${labelClass}`}><span>{label}</span></span>}
    <div className="w-full">
      {children}
    </div>
  </div>
));

const DynamicExpenseField: React.FC<{
    name: string;
    amount: string;
    onNameChange: (v: string) => void;
    onAmountChange: (v: string) => void;
    onDelete: () => void;
    index: number;
    width?: string;
    noBorderR?: boolean;
    borderColorClass?: string;
    labelClass?: string;
    inputClass?: string;
    isNight?: boolean;
    isVibrant?: boolean;
    isCustom?: boolean;
}> = memo(({ name, amount, onNameChange, onAmountChange, onDelete, index, width = "flex-1", noBorderR = false, borderColorClass = "border-gray-200", labelClass = "text-slate-600", inputClass="", isNight = false, isVibrant = false, isCustom = false }) => (
    <div className={`${width} ${!noBorderR ? `border-r ${borderColorClass}` : ''} p-2 flex flex-col justify-center relative group`}>
        <div className="flex items-center gap-1 mb-0.5">
            <span className={`text-[11px] font-bold ${labelClass}`}>{index}.</span>
            <BareInput 
                className={`text-[11px] font-bold bg-transparent border-b border-dotted outline-none w-full transition-colors px-1 rounded-sm ${labelClass} ${
                    isCustom 
                    ? 'border-[var(--theme-border)] focus:border-[var(--theme-accent)] placeholder-[var(--theme-text-secondary)]'
                    : (isNight ? 'border-slate-600 focus:border-blue-500 focus:bg-slate-800 placeholder-slate-600' : (isVibrant ? 'border-gray-300 focus:border-blue-600 focus:bg-blue-50 placeholder-gray-400' : 'border-gray-300 focus:border-blue-600 focus:bg-blue-50 placeholder-gray-300'))
                }`}
                value={name}
                onChange={e => onNameChange(e.target.value)}
                placeholder="输入费用名称"
                isNight={isNight}
                isVibrant={isVibrant}
                isCustom={isCustom}
            />
        </div>
        <div className="w-full relative">
            <BareInput type="number" value={amount} onChange={e => onAmountChange(e.target.value)} className={`text-right ${inputClass}`} placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
            <button 
                onClick={onDelete} 
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="删除费用项"
            >
                <Trash2 size={12}/>
            </button>
        </div>
    </div>
));

const BareInput = memo((props: React.InputHTMLAttributes<HTMLInputElement> & { isNight?: boolean, isVibrant?: boolean, isCustom?: boolean }) => {
    const { isNight, isVibrant, isCustom, ...rest } = props;
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (props.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
        }
        if (props.onKeyDown) props.onKeyDown(e);
    }, [props.type, props.onKeyDown]);

    const placeholderColorClass = isCustom ? 'placeholder-[var(--theme-text-secondary)]' : (isVibrant ? 'placeholder-gray-400' : 'placeholder-gray-300');

    return (
        <input 
            {...rest} 
            onKeyDown={handleKeyDown}
            onWheel={(e) => e.currentTarget.blur()}
            className={`w-full text-sm outline-none bg-transparent transition-colors rounded px-1 py-1 font-bold ${
                isCustom 
                ? 'text-[var(--theme-text)] focus:bg-[var(--theme-input-bg)]' 
                : (isNight ? 'text-slate-200 placeholder-slate-700 focus:bg-slate-800 focus:text-blue-300' : `text-black ${placeholderColorClass} focus:bg-blue-50 focus:text-blue-900`)
            } ${props.className || ''}`} 
        />
    );
});

const BareTextarea = memo((props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { isNight?: boolean, isVibrant?: boolean, isCustom?: boolean }) => {
    const { isNight, isVibrant, isCustom, ...rest } = props;
    const placeholderColorClass = isCustom ? 'placeholder-[var(--theme-text-secondary)]' : (isVibrant ? 'placeholder-gray-400' : 'placeholder-gray-300');

    return (
        <textarea 
            {...rest} 
            className={`w-full text-sm outline-none bg-transparent transition-colors rounded px-2 py-1 font-bold resize-none leading-relaxed min-h-[56px] ${
                isCustom 
                ? 'text-[var(--theme-text)] focus:bg-[var(--theme-input-bg)]' 
                : (isNight ? 'text-slate-200 placeholder-slate-700 focus:bg-slate-800 focus:text-blue-300' : `text-black ${placeholderColorClass} focus:bg-blue-50 focus:text-blue-900`)
            } ${props.className || ''}`} 
        />
    );
});

export const SettlementWorkspace = memo<Props>(({ header, setHeader, themeMode = 'classic', onOpenSettlementPreview, setHasUnsavedChanges }) => { 
  const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    if (!header.fxItems || header.fxItems.length === 0) {
      setHeader(prev => ({ ...prev, fxItems: [{ id: Date.now().toString(), amount: '', rate: '' }] }));
    }
    if (!header.costItems || header.costItems.length === 0) {
      setHeader(prev => ({ ...prev, costItems: [{ id: Date.now().toString(), supplierName: '', amount: '', taxRefundRate: 13, vatRate: 13 }] }));
    }
    if (!header.extraExpenses) {
        setHeader(prev => ({ ...prev, extraExpenses: [] }));
    }
  }, [header.costItems, header.extraExpenses, header.fxItems, setHeader]);

  const handleHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHasUnsavedChanges(true);
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  }, [setHasUnsavedChanges, setHeader]);

  const handleFXChange = useCallback((index: number, field: keyof FXItem, value: string) => {
    setHasUnsavedChanges(true);
    const newFX = [...(header.fxItems || [])];
    // @ts-ignore
    newFX[index] = { ...newFX[index], [field]: value };
    setHeader(prev => ({ ...prev, fxItems: newFX }));
  }, [header.fxItems, setHasUnsavedChanges, setHeader]);

  const addFXItem = useCallback(() => {
    setHasUnsavedChanges(true);
    setHeader(prev => ({ ...prev, fxItems: [...(prev.fxItems || []), { id: Date.now().toString(), amount: '', rate: '' }] }));
  }, [header.fxItems, setHasUnsavedChanges, setHeader]);

  const removeFXItem = useCallback((index: number) => {
    setHasUnsavedChanges(true);
    const newFX = [...(header.fxItems || [])];
    if (newFX.length > 1) {
      newFX.splice(index, 1);
      setHeader(prev => ({ ...prev, fxItems: newFX }));
    } else {
        newFX[0] = { ...newFX[0], amount: '', rate: '' };
        setHeader(prev => ({ ...prev, fxItems: newFX }));
    }
  }, [header.fxItems, setHasUnsavedChanges, setHeader]);

  const handleCostItemChange = useCallback((index: number, field: keyof CostItem, value: string) => {
    setHasUnsavedChanges(true);
    const newCosts = [...(header.costItems || [])];
    // @ts-ignore
    newCosts[index] = { ...newCosts[index], [field]: value };
    setHeader(prev => ({ ...prev, costItems: newCosts }));
  }, [header.costItems, setHasUnsavedChanges, setHeader]);

  const addCostItem = useCallback(() => {
      setHasUnsavedChanges(true);
      setHeader(prev => ({ ...prev, costItems: [...(prev.costItems || []), { id: Date.now().toString(), supplierName: '', amount: '', taxRefundRate: 13, vatRate: 13 }] }));
  }, [header.costItems, setHasUnsavedChanges, setHeader]);

  const removeCostItem = useCallback((index: number) => {
      setHasUnsavedChanges(true);
      const newCosts = [...(header.costItems || [])];
      if (newCosts.length > 1) {
          newCosts.splice(index, 1);
          setHeader(prev => ({ ...prev, costItems: newCosts }));
      } else {
           newCosts[0] = { ...newCosts[0], supplierName: '', amount: '', taxRefundRate: 13, vatRate: 13 };
           setHeader(prev => ({ ...prev, costItems: newCosts }));
      }
  }, [header.costItems, setHasUnsavedChanges, setHeader]);

  const addExtraExpense = useCallback(() => {
      setHasUnsavedChanges(true);
      setHeader(prev => ({ ...prev, extraExpenses: [...(prev.extraExpenses || []), { id: Date.now().toString(), name: '', amount: '' }] }));
  }, [header.extraExpenses, setHasUnsavedChanges, setHeader]);

  const updateExtraExpense = useCallback((index: number, field: keyof ExtraExpense, value: string) => {
      setHasUnsavedChanges(true);
      const newEx = [...(header.extraExpenses || [])];
      // @ts-ignore
      newEx[index] = { ...newEx[index], [field]: value };
      setHeader(prev => ({ ...prev, extraExpenses: newEx }));
  }, [header.extraExpenses, setHasUnsavedChanges, setHeader]);

  const removeExtraExpense = useCallback((index: number) => {
      setHasUnsavedChanges(true);
      const newEx = [...(header.extraExpenses || [])];
      newEx.splice(index, 1);
      setHeader(prev => ({ ...prev, extraExpenses: newEx }));
  }, [header.extraExpenses, setHasUnsavedChanges, setHeader]);

  const { totalFXRevenue, totalPurchaseCost, totalTaxRefund, finalAgencyFee, stampDuty, totalExpenses, grossProfit } = useSettlementCalculations(header);

  const extraExpensesPairs = [];
  const extrasForRendering = header.extraExpenses || [];
  for (let i = 0; i < extrasForRendering.length; i += 2) {
      extraExpensesPairs.push(extrasForRendering.slice(i, i + 2));
  }

  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const themeClasses = {
     header1: isCustom ? "bg-[var(--theme-surface)] border-[var(--theme-border)]" : (isVibrant ? "bg-[#CFDFEF] border-[#00A8E9]" : (isNight ? "bg-slate-800 border-slate-700" : "bg-white border-blue-200")),
     text1: isCustom ? "text-[var(--theme-accent)]" : (isVibrant ? "text-[#0068BA]" : (isNight ? "text-slate-200" : "text-blue-900")),
     header2: isCustom ? "bg-[var(--theme-surface)] border-[var(--theme-border)]" : (isVibrant ? "bg-[#CFDFEF] border-[#00A8E9]" : (isNight ? "bg-slate-800 border-slate-700" : "bg-emerald-50 border-emerald-100")),
     text2: isCustom ? "text-[var(--theme-accent)]" : (isVibrant ? "text-[#0068BA]" : (isNight ? "text-green-400" : "text-emerald-700")),
     header3: isCustom ? "bg-[var(--theme-surface)] border-[var(--theme-border)]" : (isVibrant ? "bg-[#CFDFEF] border-[#00A8E9]" : (isNight ? "bg-slate-800 border-slate-700" : "bg-orange-50 border-orange-100")),
     text3: isCustom ? "text-[var(--theme-accent)]" : (isVibrant ? "text-[#0068BA]" : (isNight ? "text-orange-400" : "text-orange-700")),
     header4: isCustom ? "bg-[var(--theme-surface)] border-[var(--theme-border)]" : (isVibrant ? "bg-[#CFDFEF] border-[#00A8E9]" : (isNight ? "bg-slate-800 border-slate-700" : "bg-purple-50 border-purple-100")),
     text4: isCustom ? "text-[var(--theme-accent)]" : (isVibrant ? "text-[#0068BA]" : (isNight ? "text-purple-400" : "text-purple-700")),
     border: isCustom ? "border-[var(--theme-border)]" : (isVibrant ? "border-[#CFDFEF]" : (isNight ? "border-slate-700" : "border-gray-200")),
     label: isCustom ? "text-[var(--theme-text-secondary)]" : (isVibrant ? "text-[#0068BA]" : (isNight ? "text-slate-400" : "text-slate-600")),
     tableHeaderBg: isCustom ? "bg-black/5 text-[var(--theme-text-secondary)]" : (isVibrant ? "bg-[#91D5F1]/30 text-[#0068BA]" : (isNight ? "bg-slate-800 text-slate-400" : "bg-gray-50 text-slate-600")),
     sectionContainer: isCustom ? 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]' : (isVibrant ? 'bg-white border-[#00A8E9] text-gray-800' : (isNight ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-blue-200 text-gray-800')),
     sectionTitle: isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-[#0068BA]' : (isNight ? 'text-blue-300' : 'text-blue-800')),
  }

  return (
    <div className={`p-4 rounded-lg shadow-md border space-y-4 ${themeClasses.sectionContainer}`} style={{ borderRadius: isCustom ? 'var(--theme-radius)' : undefined }}>
             <h2 className={`font-bold text-lg ${themeClasses.sectionTitle}`}>结算单工作区</h2>

             {/* 1. Summary */}
             <SectionHeader title="1. 业务信息" className={themeClasses.header1} textClassName={themeClasses.text1} /> 
             <div className={`border-b ${themeClasses.border}`}>
                <FormRow className={themeClasses.border}>
                    <FormField label="结算日期" width="w-1/4" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="date" name="invoiceDate" value={header.invoiceDate || ''} onChange={handleHeaderChange} isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="发票号码" width="w-1/4" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput name="invoiceNo" value={header.invoiceNo || ''} onChange={handleHeaderChange} isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="合同/订单号" width="w-1/4" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput name="contractNo" value={header.contractNo || ''} onChange={handleHeaderChange} isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="买方摘要" width="w-1/4" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput name="buyerName" value={header.buyerName || ''} onChange={handleHeaderChange} isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                </FormRow>
                <FormRow className={themeClasses.border}>
                    <FormField label="结算单专用备注 (2行高度)" width="w-full" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareTextarea 
                         name="settlementRemark" 
                         rows={2}
                         value={header.settlementRemark || ''} 
                         onChange={handleHeaderChange} 
                         placeholder="输入仅在结算单中显示的备注信息... (回车可换行)" 
                         isNight={isNight} 
                         isVibrant={isVibrant} 
                         isCustom={isCustom} 
                       />
                    </FormField>
                </FormRow>
             </div>

             {/* 2. FX */}
             <SectionHeader 
                title={ 
                    <>
                        <span>2. 外汇收入</span> 
                        <span className="text-[10px] opacity-70 font-normal ml-2">公式: Σ(外汇金额 × 汇率)</span>
                    </>
                } 
                className={themeClasses.header2} 
                textClassName={themeClasses.text2} 
                rightContent={
                 <>
                    <span className="mr-2">人民币小计: ¥ {totalFXRevenue.toFixed(2)}</span>
                    <button onClick={addFXItem} className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded border hover:bg-opacity-80 ${isCustom ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] border-[#00A8E9]' : (isNight ? 'bg-slate-700 text-green-400 border-slate-600' : 'bg-emerald-100/50 text-emerald-600 border-emerald-200'))}`}>
                        <Plus size={12}/> 添加外汇记录
                    </button>
                 </>
             } />
             <div className={`border-b ${themeClasses.border}`}>
                 <div className={`flex text-[11px] font-bold py-1 border-b ${themeClasses.tableHeaderBg} ${themeClasses.border}`}>
                    <div className="w-12 text-center">序号</div>
                    <div className="flex-1 px-2">结算金额</div>
                    <div className="w-8"></div>
                    <div className="flex-1 px-2">汇率</div>
                    <div className="w-8"></div>
                    <div className="flex-1 px-2">人民币金额</div>
                    <div className="w-10"></div>
                 </div>
                 {(header.fxItems || []).map((fx, idx) => (
                    <FormRow key={fx.id} className={`${themeClasses.border}`}>
                        <div className="w-12 flex items-center justify-center text-xs font-bold opacity-50">{idx + 1}</div>
                        <FormField width="flex-1" noBorderR>
                            <BareInput type="number" value={fx.amount || ''} onChange={e => handleFXChange(idx, 'amount', e.target.value)} placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <div className="w-8 flex items-center justify-center opacity-50">×</div>
                        <FormField width="flex-1" noBorderR>
                            <BareInput type="number" value={fx.rate || ''} onChange={e => handleFXChange(idx, 'rate', e.target.value)} placeholder="Rate" step="0.0001" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <div className="w-8 flex items-center justify-center opacity-50">=</div>
                        <FormField width="flex-1" noBorderR>
                            <div className={`px-1 py-0.5 text-sm font-bold ${isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-slate-200' : 'text-black'))}`}>
                               {fx.amount && fx.rate ? (sNum(fx.amount) * sNum(fx.rate)).toFixed(2) : '-'}
                            </div>
                        </FormField>
                        <div className="w-10 flex items-center justify-center">
                            <button onClick={() => removeFXItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    </FormRow>
                 ))}
             </div>

             {/* 3. Cost */}
             <SectionHeader 
                title={ 
                    <>
                        <span>3. 货款支付与退税</span> 
                        <span className="text-[10px] opacity-70 font-normal ml-2">退税 = 发票金额 ÷ (1 + 增值税率) × 退税率</span>
                    </>
                } 
                className={themeClasses.header3} 
                textClassName={themeClasses.text3} 
                rightContent={
                 <div className="flex items-center gap-4">
                     <div className="flex gap-4 text-xs font-medium">
                        <span>成本: ¥{totalPurchaseCost.toFixed(2)}</span>
                        <span>退税: ¥{totalTaxRefund.toFixed(2)}</span>
                     </div>
                     <button onClick={addCostItem} className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded border hover:bg-opacity-80 ${isCustom ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] border-[#00A8E9]' : (isNight ? 'bg-slate-700 text-orange-400 border-slate-600' : 'bg-orange-100/50 text-orange-600 border-orange-200'))}`}>
                         <Plus size={12}/> 添加货款记录
                     </button>
                 </div>
             } />
             <div className={`border-b ${themeClasses.border}`}>
                 <div className={`flex text-[11px] font-bold py-1 border-b ${themeClasses.tableHeaderBg} ${themeClasses.border}`}>
                    <div className="w-12 text-center">序号</div>
                    <div className="flex-[2] px-2">供应商名称</div>
                    <div className="flex-1 px-2">发票金额 (RMB)</div>
                    <div className="w-24 px-2 text-center">增值税 (%)</div>
                    <div className="w-24 px-2 text-center">退税率 (%)</div>
                    <div className="flex-1 px-2">预计退税 (RMB)</div>
                    <div className="w-10"></div>
                 </div>
                 {(header.costItems || []).map((cost, idx) => {
                    const vatRate = cost.vatRate !== undefined && cost.vatRate !== '' ? sNum(cost.vatRate) : 13;
                    const refundRate = sNum(cost.taxRefundRate);
                    const estimatedRefund = sNum(cost.amount) / (1 + vatRate / 100) * (refundRate / 100);

                    return (
                    <FormRow key={cost.id} className={`${themeClasses.border}`}>
                        <div className="w-12 flex items-center justify-center text-xs font-bold opacity-50">{idx + 1}</div>
                        <FormField width="flex-[2]" noBorderR>
                            <BareInput value={cost.supplierName || ''} onChange={e => handleCostItemChange(idx, 'supplierName', e.target.value)} placeholder="供应商名称" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <FormField width="flex-1" noBorderR>
                            <BareInput type="number" value={cost.amount || ''} onChange={e => handleCostItemChange(idx, 'amount', e.target.value)} placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <FormField width="w-24" noBorderR>
                            <BareInput type="number" value={cost.vatRate ?? 13} onChange={e => handleCostItemChange(idx, 'vatRate', e.target.value)} placeholder="13" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <FormField width="w-24" noBorderR>
                            <BareInput type="number" value={cost.taxRefundRate ?? ''} onChange={e => handleCostItemChange(idx, 'taxRefundRate', e.target.value)} placeholder="13" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                        </FormField>
                        <FormField width="flex-1" noBorderR>
                            <div className={`px-1 py-0.5 text-sm font-bold ${isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-slate-200' : 'text-black'))}`}>
                               {estimatedRefund.toFixed(2)}
                            </div>
                        </FormField>
                        <div className="w-10 flex items-center justify-center">
                            <button onClick={() => removeCostItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    </FormRow>
                 )})}
             </div>

             {/* 4. Expenses */}
             <SectionHeader title="4. 费用明细" className={themeClasses.header4} textClassName={themeClasses.text4} rightContent={
                 <>
                    <span className="mr-2">总计: ¥ {totalExpenses.toFixed(2)}</span>
                    <button onClick={addExtraExpense} className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded border hover:bg-opacity-80 ${isCustom ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] border-[#00A8E9]' : (isNight ? 'bg-slate-700 text-purple-400 border-slate-600' : 'bg-purple-100/50 text-purple-600 border-purple-200'))}`}>
                        <Plus size={12}/> 添加费用项
                    </button>
                 </>
             } />
             <div className={`border-b ${themeClasses.border}`}>
                <FormRow className={themeClasses.border}>
                    <FormField label="1. 出口代理费 (自动计算)" width="w-1/2" labelClass={isCustom ? "text-[var(--theme-accent)]" : "text-purple-500"} borderColorClass={themeClasses.border}>
                        <div className="flex items-center justify-between h-full py-1">
                            <div className="flex items-center text-xs">
                                <span className={`${themeClasses.label} text-[11px]`}>费率:</span>
                                <BareInput 
                                    type="number" 
                                    name="agencyFeeRate" 
                                    value={header.agencyFeeRate || ''} 
                                    onChange={handleHeaderChange} 
                                    className="w-12 text-center ml-1" 
                                    placeholder="0.01" 
                                    step="0.0001" 
                                    isNight={isNight} 
                                    isVibrant={isVibrant}
                                    isCustom={isCustom}
                                />
                                <span className={`${themeClasses.label} text-[11px] ml-3`}>最低:</span>
                                <BareInput 
                                    type="number" 
                                    name="minAgencyFee" 
                                    value={header.minAgencyFee || ''} 
                                    onChange={handleHeaderChange} 
                                    className="w-12 text-center ml-1" 
                                    placeholder="500" 
                                    isNight={isNight} 
                                    isVibrant={isVibrant}
                                    isCustom={isCustom}
                                />
                                <span className="opacity-50 ml-1 text-lg font-bold">→</span>
                            </div>
                            <div className="text-right pr-1">
                                <span className={`font-bold text-sm font-mono ${isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-slate-200' : 'text-black'))}`}>
                                    {finalAgencyFee.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </FormField>
                    <FormField label="2. 货运公司包干费 (RMB)" width="w-1/2" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exLumpSum" value={header.exLumpSum || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                </FormRow>
                <FormRow className={themeClasses.border}>
                    <FormField label="3. 货运公司海运费 (RMB)" width="w-1/2" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exOceanRMB" value={header.exOceanRMB || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="4. 证书/产地证费 (RMB)" width="w-1/2" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exCertFee" value={header.exCertFee || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                </FormRow>
                <FormRow className={themeClasses.border}>
                    <FormField label="5. 国内快递费 (RMB)" width="w-1/2" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exDomesticExpress" value={header.exDomesticExpress || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="6. 国际快递费 (RMB)" width="w-1/2" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exIntlExpress" value={header.exIntlExpress || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                </FormRow>
                <FormRow className={themeClasses.border}>
                    <FormField label="7. 保险费 (RMB)" width="w-1/2" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exInsuranceRMB" value={header.exInsuranceRMB || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="8. 佣金及手续费 (RMB)" width="w-1/2" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exCommissionRMB" value={header.exCommissionRMB || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                </FormRow>
                <FormRow className={themeClasses.border}>
                    <FormField label="9. 买单费 (RMB)" width="w-1/2" labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <BareInput type="number" name="exBuyingDocs" value={header.exBuyingDocs || ''} onChange={handleHeaderChange} className="text-right" placeholder="0.00" isNight={isNight} isVibrant={isVibrant} isCustom={isCustom} />
                    </FormField>
                    <FormField label="10. 印花税 (RMB)" width="w-1/2" noBorderR labelClass={themeClasses.label} borderColorClass={themeClasses.border}>
                       <span className={`block px-1 py-0.5 text-right font-bold ${isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-slate-200' : 'text-black'))}`}>{stampDuty.toFixed(2)} <span className={`text-[10px] ${themeClasses.label}`}>(自动)</span></span>
                    </FormField>
                </FormRow>
                
                {extraExpensesPairs.map((pair, pairIndex) => (
                    <FormRow key={pairIndex} className={themeClasses.border}>
                        {pair[0] && (
                            <DynamicExpenseField 
                                name={pair[0].name} 
                                amount={String(pair[0].amount || '')} 
                                onNameChange={v => updateExtraExpense(pairIndex * 2, 'name', v)}
                                onAmountChange={v => updateExtraExpense(pairIndex * 2, 'amount', v)}
                                onDelete={() => removeExtraExpense(pairIndex * 2)}
                                index={11 + pairIndex * 2}
                                width="w-1/2"
                                isNight={isNight}
                                isVibrant={isVibrant}
                                isCustom={isCustom}
                                labelClass={isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : (isNight ? 'text-blue-300' : 'text-blue-800'))}
                                inputClass={isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-blue-300' : 'text-blue-800'))}
                                borderColorClass={themeClasses.border}
                            />
                        )}
                        {pair[1] && (
                            <DynamicExpenseField 
                                name={pair[1].name} 
                                amount={String(pair[1].amount || '')} 
                                onNameChange={v => updateExtraExpense(pairIndex * 2 + 1, 'name', v)}
                                onAmountChange={v => updateExtraExpense(pairIndex * 2 + 1, 'amount', v)}
                                onDelete={() => removeExtraExpense(pairIndex * 2 + 1)}
                                index={12 + pairIndex * 2}
                                width="w-1/2"
                                noBorderR
                                isNight={isNight}
                                isVibrant={isVibrant}
                                isCustom={isCustom}
                                labelClass={isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : (isNight ? 'text-blue-300' : 'text-blue-800'))}
                                inputClass={isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-black' : (isNight ? 'text-blue-300' : 'text-blue-800'))}
                                borderColorClass={themeClasses.border}
                            />
                        )}
                        {!pair[1] && <div className="w-1/2"></div>} 
                    </FormRow>
                ))}
             </div>

             {/* 5. Profit */}
             <SectionHeader title="5. 预计利润计算" className={themeClasses.header1} textClassName={themeClasses.text1} rightContent={
                 <div className="flex items-center gap-4">
                     <span className={`text-xl font-bold ${themeClasses.text1}`}>总利润: ¥ {grossProfit.toFixed(2)}</span>
                     <button onClick={onOpenSettlementPreview} className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded border hover:bg-opacity-80 ${isCustom ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] border-[#00A8E9]' : (isNight ? 'bg-slate-700 text-blue-300 border-slate-600' : 'bg-blue-100/50 text-blue-600 border-blue-200'))}`}>
                         <Eye size={12}/> 预览结算单
                     </button>
                 </div>
             } />
             <div className={`p-4 border rounded-lg text-sm ${themeClasses.sectionContainer} ${isCustom ? '' : (isVibrant ? 'bg-white border-[#00A8E9]' : (isNight ? 'bg-slate-900/50 border-slate-700' : 'bg-white'))}`}> 
                <div className={`flex justify-between items-center text-xs mb-2 ${isCustom ? 'text-[var(--theme-text-secondary)]' : (isVibrant ? 'text-gray-600' : (isNight ? 'text-slate-400' : 'text-gray-600'))}`}>
                    <span>公式: 外汇收入 + 退税 - 成本 - 费用 = 利润</span>
                </div>
                <div className={`flex items-center justify-between border rounded shadow-sm p-3 ${isCustom ? 'bg-[var(--theme-surface)] border-[var(--theme-border)]' : (isVibrant ? 'bg-white border-blue-100' : (isNight ? 'bg-slate-950 border-slate-800' : 'bg-white border-blue-100'))}`}>
                    <div className={`grid grid-cols-4 gap-4 text-center divide-x flex-1 ${isCustom ? 'divide-[var(--theme-border)]' : (isVibrant ? 'divide-gray-100' : (isNight ? 'divide-slate-800' : 'divide-gray-100'))}`}>
                        <div><div className={`text-[10px] ${isCustom ? 'text-[var(--theme-text-secondary)] font-bold' : (isVibrant ? 'text-gray-400 font-bold' : (isNight ? 'text-slate-500 font-bold' : 'text-gray-400 font-bold'))}`}>外汇收入</div><div className={`${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-blue-600' : (isNight ? 'text-blue-400' : 'text-blue-600'))} font-bold`}>¥{fmt(totalFXRevenue)}</div></div>
                        <div><div className={`text-[10px] ${isCustom ? 'text-[var(--theme-text-secondary)] font-bold' : (isVibrant ? 'text-gray-400 font-bold' : (isNight ? 'text-slate-500 font-bold' : 'text-gray-400 font-bold'))}`}>退税</div><div className={`${isCustom ? 'text-green-500' : (isVibrant ? 'text-green-600' : (isNight ? 'text-green-400' : 'text-green-600'))} font-bold`}>¥{fmt(totalTaxRefund)}</div></div>
                        <div><div className={`text-[10px] ${isCustom ? 'text-[var(--theme-text-secondary)] font-bold' : (isVibrant ? 'text-gray-400 font-bold' : (isNight ? 'text-slate-500 font-bold' : 'text-gray-400 font-bold'))}`}>成本</div><div className={`${isCustom ? 'text-red-500' : (isVibrant ? 'text-red-600' : (isNight ? 'text-red-400' : 'text-red-600'))} font-bold`}>¥{fmt(totalPurchaseCost)}</div></div>
                        <div><div className={`text-[10px] ${isCustom ? 'text-[var(--theme-text-secondary)] font-bold' : (isVibrant ? 'text-gray-400 font-bold' : (isNight ? 'text-slate-500 font-bold' : 'text-gray-400 font-bold'))}`}>费用</div><div className={`${isCustom ? 'text-red-500' : (isVibrant ? 'text-red-600' : (isNight ? 'text-red-400' : 'text-red-600'))} font-bold`}>¥{fmt(totalExpenses)}</div></div>
                    </div>
                    <div className={`w-px h-8 mx-4 ${isCustom ? 'bg-[var(--theme-border)]' : (isVibrant ? 'bg-gray-200' : (isNight ? 'bg-slate-800' : 'bg-gray-200'))}`}></div>
                    <div className="text-right">
                        <div className={`text-[10px] ${isCustom ? 'text-[var(--theme-text-secondary)] font-bold' : (isVibrant ? 'text-gray-400 font-bold' : (isNight ? 'text-slate-500 font-bold' : 'text-gray-400 font-bold'))}`}>结算利润</div>
                        <div className={`text-xl font-bold font-mono ${grossProfit >= 0 ? (isCustom ? 'text-green-500' : (isVibrant ? 'text-emerald-600' : (isNight ? 'text-emerald-400' : 'text-emerald-600'))) : 'text-red-600'}`}>
                            ¥ {fmt(grossProfit)}
                        </div>
                    </div>
                </div>
             </div>
    </div>
  );
});
