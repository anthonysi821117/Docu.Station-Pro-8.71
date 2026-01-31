
import React, { useCallback, memo } from 'react';
import { Database, Upload, Plus, Save, Trash2, Activity, AlertCircle, AlertTriangle, CheckCircle2, Table as TableIcon, Maximize2, Minimize2, Eraser } from 'lucide-react';
import { HeaderInfo, ProductItem, ProductPreset, CustomTheme, InvoiceProject, KnowledgeBase, CustomRule, createInitialProductWithUniqueId } from '../../types';
import { LineInput, SelectInput } from '../ui/SharedInputs';
import { useProductHealthCheck } from '../../hooks/useProductHealthCheck';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  themeMode: string;
  customTheme?: CustomTheme;
  handleHeaderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPresetModal: () => void;
  onOpenBatchModal: () => void;
  addItem: () => void;
  savedPresets: ProductPreset[];
  sortedPresets: ProductPreset[];
  handlePresetSelect: (index: number, e: React.ChangeEvent<HTMLSelectElement>) => void;
  saveItemAsPreset: (item: ProductItem) => void;
  handleItemChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleGridPaste: (e: React.ClipboardEvent, startIndex: number, startField: keyof ProductItem) => void;
  handleCurrencyBlur: (index: number, field: 'purchaseTotalPriceRMB' | 'totalPrice') => void;
  handleWeightBlur: (index: number, field: 'grossWeight' | 'netWeight') => void;
  removeItem: (index: number) => void;
  setItems: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  totals: any;
  allProjects: InvoiceProject[];
  knowledgeBase?: KnowledgeBase;
  customRules?: CustomRule[];
  onOpenGridEditor: () => void;
  
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

// Extracted Row Component for Virtualization/Performance
const ProductRow = memo(({ 
  item, 
  index, 
  themeMode, 
  customTheme, 
  isRmbCalculation,
  currency,
  savedPresets, 
  handlePresetSelect, 
  sortedPresets,
  saveItemAsPreset, 
  handleItemChange, 
  handleGridPaste, 
  handleCurrencyBlur, 
  handleWeightBlur, 
  removeItem,
  healthReport
}: any) => {
  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const currentPreset = savedPresets.find((p: any) => p.remark === item.remark);
  const declOptions = currentPreset?.declarationElements ? currentPreset.declarationElements.split('\n').filter((line: string) => line.trim()) : [];
  
  const statusColor = healthReport.status === 'critical' ? 'text-red-500' : (healthReport.status === 'warning' ? 'text-amber-500' : 'text-gray-200');
  const StatusIcon = healthReport.status === 'critical' ? AlertCircle : (healthReport.status === 'warning' ? AlertTriangle : CheckCircle2);

  return (
    <tr className="border-b">
      <td className={`p-2 text-center sticky left-0 z-10 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : (isNight ? 'bg-slate-800' : 'bg-white'))} shadow-[1px_0_0_rgba(0,0,0,0.05)]`}>
         <div className="flex items-center justify-center group/status relative">
            <StatusIcon size={16} className={statusColor} />
            {healthReport.status !== 'healthy' && (
               <div className="absolute left-full top-0 ml-2 z-50 w-64 p-3 rounded-lg shadow-xl bg-slate-900 text-white text-xs hidden group-hover/status:block animate-in fade-in zoom-in-95">
                  <p className="font-black border-b border-white/20 pb-1 mb-2 uppercase tracking-widest text-[10px]">数据健康诊断</p>
                  <ul className="space-y-1.5 list-disc pl-3">
                     {healthReport.issues.map((issue: any, i: number) => (
                        <li key={i} className={`${issue.type === 'critical' ? 'text-red-400 font-bold' : 'text-amber-300'}`}>
                           {issue.message}
                        </li>
                     ))}
                  </ul>
               </div>
            )}
         </div>
      </td>
      <td className={`p-2 text-center font-bold ${isCustom ? 'bg-[var(--theme-surface)] text-[var(--theme-text)]' : (isVibrant ? 'bg-white text-gray-800' : (isNight ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-800'))}`}>{index + 1}</td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}><SelectInput themeMode={themeMode} customTheme={customTheme} value={item.remark || ''} onChange={(e) => handlePresetSelect(index, e)} className={`w-full border-b outline-none bg-transparent px-2 py-1.5 text-sm transition-colors h-[32px] text-left ${isCustom ? 'border-[var(--theme-border)] text-[var(--theme-text)]' : (isVibrant ? 'border-[#00A8E9] text-black' : (isNight ? 'border-slate-600 text-slate-200' : 'border-gray-300 text-black'))}`}><option value="">-- 选择预设 --</option>{sortedPresets.map((preset: any) => (<option key={preset.id} value={preset.remark}>{preset.remark}</option>))}</SelectInput><button onClick={() => saveItemAsPreset(item)} title="Quick Save as Preset" className={`w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-sm mt-1 transition-colors ${isCustom ? 'bg-black/5 text-[var(--theme-text-secondary)] hover:bg-black/10' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] hover:bg-[#00A8E9] hover:text-white' : (isNight ? 'bg-slate-700 text-blue-300 hover:bg-slate-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'))}`}><Save size={14}/> 存为预设</button></td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}>
        <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="中文品名" name="cnName" value={item.cnName} onChange={(e) => handleItemChange(index, e)} onPaste={(e) => handleGridPaste(e, index, 'cnName')} className="text-left text-sm font-bold flex-1"/>
        <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="英文品名" name="enName" value={item.enName} onChange={(e) => handleItemChange(index, e)} className="text-left text-sm font-bold" />
      </td>
      <td className={`p-2 flex flex-col justify-start ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`} style={{ minWidth: '500px' }}>
        <div className="w-max">
          <div className="grid grid-cols-[120px_100px_80px_180px] gap-x-2 mb-1">
            <div><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="海关编码" name="hsCode" value={item.hsCode} onChange={(e) => handleItemChange(index, e)} className="text-left text-sm font-bold" maxLength={10} /></div>
            <div><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="数量" type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="text-right text-sm font-bold" onPaste={(e) => handleGridPaste(e, index, 'quantity')}/></div>
            <div><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="单位" name="unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} className="text-left text-sm font-bold" onPaste={(e) => handleGridPaste(e, index, 'unit')} maxLength={5} /></div>
            <div className="min-w-[180px] relative">
              {isRmbCalculation ? (
                <LineInput 
                  themeMode={themeMode}
                  customTheme={customTheme} 
                  placeholder="采购总价 (RMB)" 
                  type="number" 
                  name="purchaseTotalPriceRMB" 
                  value={item.purchaseTotalPriceRMB} 
                  onChange={(e) => handleItemChange(index, e)} 
                  onBlur={() => handleCurrencyBlur(index, 'purchaseTotalPriceRMB')}
                  className="text-right text-sm font-bold text-blue-500" 
                  onPaste={(e) => handleGridPaste(e, index, 'purchaseTotalPriceRMB')}
                />
              ) : (
                <LineInput 
                  themeMode={themeMode} 
                  customTheme={customTheme}
                  placeholder="外币总价 (Total)" 
                  type="number" 
                  name="totalPrice" 
                  value={item.totalPrice} 
                  onChange={(e) => handleItemChange(index, e)} 
                  onBlur={() => handleCurrencyBlur(index, 'totalPrice')}
                  className="text-right text-sm font-bold text-emerald-600" 
                  onPaste={(e) => handleGridPaste(e, index, 'totalPrice')}
                />
              )}
            </div>
          </div>
          {isRmbCalculation && (
             <div className="px-2 mb-1 text-[10px] text-gray-400 font-mono text-right italic">
                折算外币 (Est.): {currency} {item.totalPrice || '0'}
             </div>
          )}
          <div className="w-[492px]">
            {declOptions.length > 1 ? (
              <SelectInput themeMode={themeMode} customTheme={customTheme} name="declarationElements" value={item.declarationElements} onChange={(e) => handleItemChange(index, e)}>
                <option value="">-- 选择申报要素 --</option>
                {declOptions.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
              </SelectInput>
            ) : (
              <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="申报要素 (规格型号)" name="declarationElements" value={item.declarationElements} onChange={(e) => handleItemChange(index, e)} onPaste={(e) => handleGridPaste(e, index, 'declarationElements')} className="text-left text-sm font-bold w-full"/>
            )}
          </div>
        </div>
      </td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}>
        <div className="flex gap-2">
          <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="箱数" type="number" name="cartonCount" value={item.cartonCount} onChange={(e) => handleItemChange(index, e)} className="w-[100px] text-right text-xs font-bold" onPaste={(e) => handleGridPaste(e, index, 'cartonCount')}/>
          <SelectInput themeMode={themeMode} customTheme={customTheme} placeholderOptionText="类型" name="packageType" value={item.packageType} onChange={(e) => handleItemChange(index, e)} className="w-24 text-left text-xs font-bold">
            <option value="CTNS">CTNS</option>
            <option value="PLTS">PLTS</option>
            <option value="PKGS">PKGS</option>
            <option value="BALES">BALES</option>
          </SelectInput>
        </div>
      </td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}>
        <LineInput 
          themeMode={themeMode}
          customTheme={customTheme} 
          placeholder="毛重" 
          type="number" 
          name="grossWeight" 
          value={item.grossWeight} 
          onChange={(e) => handleItemChange(index, e)} 
          onBlur={() => handleWeightBlur(index, 'grossWeight')}
          className="text-right text-sm font-bold" 
          onPaste={(e) => handleGridPaste(e, index, 'grossWeight')}
        />
      </td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}>
        <LineInput 
          themeMode={themeMode} 
          customTheme={customTheme}
          placeholder="净重" 
          type="number" 
          name="netWeight" 
          value={item.netWeight} 
          onChange={(e) => handleItemChange(index, e)} 
          onBlur={() => handleWeightBlur(index, 'netWeight')}
          className="text-right text-sm font-bold" 
          onPaste={(e) => handleGridPaste(e, index, 'netWeight')}
        />
      </td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="体积" type="number" name="volume" value={item.volume} onChange={(e) => handleItemChange(index, e)} className="text-right text-sm font-bold" onPaste={(e) => handleGridPaste(e, index, 'volume')}/></td>
      <td className={`p-2 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : '')}`}><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="境内货源地" name="origin" value={item.origin} onChange={(e) => handleItemChange(index, e)} className="text-left text-sm font-bold" onPaste={(e) => handleGridPaste(e, index, 'origin')}/></td>
      <td className={`p-2 text-center sticky right-0 z-0 ${isCustom ? 'bg-[var(--theme-surface)]' : (isVibrant ? 'bg-white' : (isNight ? 'bg-slate-800' : 'bg-white'))}`}><button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button></td>
    </tr>
  );
});

export const ProductTable: React.FC<Props> = ({
  header, items, themeMode, customTheme,
  handleHeaderChange, onOpenPresetModal, onOpenBatchModal, addItem,
  savedPresets, sortedPresets, handlePresetSelect, saveItemAsPreset,
  handleItemChange, handleGridPaste, handleCurrencyBlur, handleWeightBlur, removeItem, setItems, totals, allProjects,
  knowledgeBase, customRules = [], onOpenGridEditor,
  isFocusMode, onToggleFocus
}) => {
  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  // Use the new comprehensive health check with custom rules and knowledge base
  const { checkItem } = useProductHealthCheck(allProjects, header.currency, knowledgeBase, customRules);

  const handleClearItems = useCallback(() => {
    if (window.confirm("确定要清空所有产品行吗？此操作将重置表格为初始状态。")) {
        setItems([createInitialProductWithUniqueId()]);
    }
  }, [setItems]);

  const themeClasses = {
      sectionProductItemsContainer: isCustom
          ? 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
          : isVibrant
          ? 'bg-white border-[#00A8E9] text-gray-800'
          : isNight
          ? 'bg-slate-900 border-slate-700 text-slate-200'
          : 'bg-white border-blue-200 text-gray-800', 
      sectionProductItemsTitle: isCustom
          ? 'text-[var(--theme-text)]'
          : isVibrant
          ? 'text-[#0068BA]'
          : isNight
          ? 'text-blue-300'
          : 'text-blue-800',
      productHeader: isCustom
          ? 'bg-[var(--theme-bg)] text-[var(--theme-text-secondary)]'
          : isVibrant
          ? 'bg-[#00A8E9] text-white' 
          : (isNight
          ? 'bg-slate-900 text-slate-300'
          : 'bg-gray-100 text-gray-700'),
  };

  return (
    <div className={`p-4 rounded-lg shadow-md border space-y-4 transition-all duration-300 ${themeClasses.sectionProductItemsContainer} ${isFocusMode ? 'min-h-[80vh]' : ''}`} style={{ borderRadius: isCustom ? 'var(--theme-radius)' : undefined }}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className={`font-bold text-lg ${themeClasses.sectionProductItemsTitle} flex items-center gap-2`}>
                Product Items 
                {isFocusMode && <span className="text-xs font-normal opacity-60 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">Focus Mode Active</span>}
            </h2>
            <label className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold cursor-pointer transition-all ${header.isRmbCalculation 
              ? (isCustom ? 'bg-[var(--theme-accent)]/20 border-[var(--theme-accent)] text-[var(--theme-accent)]' : (isVibrant ? 'bg-[#00A8E9]/20 border-[#00A8E9]/50 text-[#0068BA]' : (isNight ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'))) 
              : (isCustom ? 'bg-black/5 border-[var(--theme-border)] text-[var(--theme-text-secondary)]' : (isVibrant ? 'bg-[#91D5F1]/30 border-[#91D5F1] text-gray-600' : (isNight ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-gray-100 border-gray-200 text-gray-400')))}`}>
              <input type="checkbox" name="isRmbCalculation" checked={!!header.isRmbCalculation} onChange={handleHeaderChange} className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
              <span>人民币计算模式 (RMB Calc)</span>
            </label>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button 
                onClick={onToggleFocus} 
                className={`p-2 rounded-lg transition-all ${isFocusMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                title={isFocusMode ? "退出专注模式 (Exit Focus)" : "进入表格专注模式 (Focus Mode)"}
            >
                {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button onClick={onOpenGridEditor} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow ${isCustom ? 'bg-[var(--theme-accent)] text-white hover:opacity-90' : (isVibrant ? 'bg-[#0068BA] hover:bg-[#00A8E9] text-white' : (isNight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'))}`}><TableIcon size={16} /> Grid Table Mode</button>
            <button onClick={onOpenPresetModal} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow ${isCustom ? 'bg-[var(--theme-accent)] text-white hover:opacity-90' : (isVibrant ? 'bg-[#0068BA] hover:bg-[#00A8E9] text-white' : (isNight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'))}`}><Database size={16} /> Manage Presets</button>
            <button onClick={onOpenBatchModal} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow ${isCustom ? 'bg-[var(--theme-accent)] text-white hover:opacity-90' : (isVibrant ? 'bg-[#0068BA] hover:bg-[#00A8E9] text-white' : (isNight ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'))}`}><Upload size={16} /> Batch Import</button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button onClick={handleClearItems} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${isNight ? 'border-red-500/50 text-red-400 hover:bg-red-900/30' : 'border-red-200 text-red-500 hover:bg-red-50'}`} title="清空表格"><Eraser size={16} /></button>
            <button onClick={addItem} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow ${isCustom ? 'bg-[var(--theme-accent)] text-white hover:opacity-90' : (isVibrant ? 'bg-[#0068BA] hover:bg-[#00A8E9] text-white' : (isNight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'))}`}><Plus size={16} /> Add Item</button>
          </div>
        </div>
        <div className={`overflow-x-auto no-scrollbar ${isFocusMode ? 'h-[calc(100vh-200px)]' : ''}`}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={`whitespace-nowrap ${themeClasses.productHeader} sticky top-0 z-30 shadow-sm`}>
                <th className="p-3 text-center w-10 sticky left-0 z-40 bg-inherit shadow-[1px_0_0_rgba(0,0,0,0.05)]">状态</th>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 text-left w-40 min-w-[150px]">预设快捷键</th>
                <th className="p-3 text-left w-60 min-w-[200px]">中文/英文品名</th>
                <th className="p-3 text-left min-w-[500px]">明细、总价与申报要素</th>
                <th className="p-3 text-left w-[200px] min-w-[200px]">箱数 / 包装</th>
                <th className="p-3 text-left w-28 min-w-[120px]">毛重 (KGS)</th>
                <th className="p-3 text-left w-28 min-w-[120px]">净重 (KGS)</th>
                <th className="p-3 text-left w-24 min-w-[100px]">体积 (CBM)</th>
                <th className="p-3 text-left w-36 min-w-[120px]">货源地</th>
                <th className={`p-3 text-center w-16 sticky right-0 z-20 ${isCustom ? 'bg-[var(--theme-bg)] text-[var(--theme-text-secondary)]' : (isVibrant ? 'bg-[#00A8E9]' : (isNight ? 'bg-slate-900' : 'bg-gray-100'))}`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <ProductRow 
                  key={item.id}
                  item={item}
                  index={index}
                  themeMode={themeMode}
                  customTheme={customTheme}
                  isRmbCalculation={!!header.isRmbCalculation}
                  currency={header.currency}
                  savedPresets={savedPresets}
                  handlePresetSelect={handlePresetSelect}
                  sortedPresets={sortedPresets}
                  saveItemAsPreset={saveItemAsPreset}
                  handleItemChange={handleItemChange}
                  handleGridPaste={handleGridPaste}
                  handleCurrencyBlur={handleCurrencyBlur}
                  handleWeightBlur={handleWeightBlur}
                  removeItem={removeItem}
                  healthReport={checkItem(item, !!header.isRmbCalculation)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className={`whitespace-nowrap border-t-2 ${isNight ? 'border-slate-700 bg-slate-800/50 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'} font-bold text-sm`}>
                <td className={`p-3 sticky left-0 z-10 ${isNight ? 'bg-slate-800' : 'bg-gray-50'}`}></td>
                <td colSpan={3} className={`p-3 text-right ${isNight ? 'bg-slate-800' : 'bg-gray-50'} min-w-[360px]`}>
                   <span className="text-xs font-black uppercase tracking-widest opacity-40 mr-4">Totals</span>
                </td>
                <td className="p-2">
                  <div className="w-max">
                    <div className="grid grid-cols-[120px_100px_80px_180px] gap-x-2">
                      <div className="w-[120px]"></div> 
                      <div className="w-[100px] flex items-center justify-end pr-2">
                        <div className="font-mono text-xs whitespace-nowrap font-black opacity-80">
                          {totals.quantity.toLocaleString()}
                        </div>
                      </div> 
                      <div className="w-[80px]"></div> 
                      <div className="w-[180px] flex items-center justify-end pr-2">
                         <div className={`font-mono text-xs whitespace-nowrap font-black ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
                           {header.currency} {Math.floor(totals.totalPrice).toLocaleString()}
                         </div>
                      </div> 
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <div className="w-[100px] flex items-center justify-end pr-2">
                      <div className="font-mono text-xs whitespace-nowrap font-black opacity-80">
                        {totals.cartonCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-[70px]"></div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-end pr-2">
                    <div className="font-mono text-xs whitespace-nowrap font-black opacity-80">
                      {totals.grossWeight.toFixed(2)}
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-end pr-2">
                    <div className="font-mono text-xs whitespace-nowrap font-black opacity-80">
                      {totals.netWeight.toFixed(2)}
                    </div>
                  </div>
                </td> 
                <td className="p-2">
                  <div className="flex items-center justify-end pr-2">
                    <div className="font-mono text-xs whitespace-nowrap font-black opacity-80">
                      {totals.volume.toFixed(3)}
                    </div>
                  </div>
                </td>
                <td className="p-2"></td> 
                <td className={`p-3 text-center sticky right-0 z-20 ${isNight ? 'bg-slate-800' : 'bg-gray-50'}`}></td>
              </tr>
            </tfoot>
          </table>
        </div>
    </div>
  );
};
