
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Trash2, Check, Table as TableIcon, Layout, Settings2, BookOpen, Zap, RotateCcw, MousePointer2, Save, Combine, AlertTriangle, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCT, HeaderInfo, createInitialProductWithUniqueId, InvoiceProject, KnowledgeBase, CustomRule, DSPImportPacket, ProductPreset } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useProductHealthCheck } from '../hooks/useProductHealthCheck';
import { InboxModal } from './InboxModal';

interface Props {
  items: ProductItem[];
  header: HeaderInfo;
  onSave: (items: ProductItem[], customsKnowledge: string) => void;
  onClose: () => void;
  isNight: boolean;
  allProjects?: InvoiceProject[];
  knowledgeBase?: KnowledgeBase;
  customRules?: CustomRule[];
  savedPresets: ProductPreset[]; // Added prop
}

interface ColumnConfig {
  key: keyof ProductItem;
  label: string;
  width: string;
  visible: boolean;
  type: 'text' | 'number' | 'select';
  options?: string[];
  group: 'basic' | 'invoice' | 'packing' | 'customs';
}

const STORAGE_KEY = 'dsp_grid_columns_v2';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'remark', label: '备注', width: 'w-24', visible: true, type: 'text', group: 'basic' },
  { key: 'cnName', label: '中文品名', width: 'w-48', visible: true, type: 'text', group: 'customs' },
  { key: 'enName', label: '英文品名', width: 'w-56', visible: true, type: 'text', group: 'invoice' },
  { key: 'hsCode', label: 'HS 编码', width: 'w-32', visible: true, type: 'text', group: 'customs' },
  { key: 'quantity', label: '数量', width: 'w-20', visible: true, type: 'number', group: 'basic' },
  { key: 'unit', label: '单位', width: 'w-16', visible: true, type: 'text', group: 'basic' },
  { key: 'purchaseTotalPriceRMB', label: '采购额(¥)', width: 'w-28', visible: true, type: 'number', group: 'invoice' },
  { key: 'vatRate', label: '增值税%', width: 'w-16', visible: false, type: 'number', group: 'invoice' },
  { key: 'taxRefundRate', label: '退税%', width: 'w-16', visible: false, type: 'number', group: 'invoice' },
  { key: 'totalPrice', label: '出口额($)', width: 'w-28', visible: true, type: 'number', group: 'invoice' },
  { key: 'unitPrice', label: '单价', width: 'w-24', visible: false, type: 'number', group: 'invoice' },
  { key: 'cartonCount', label: '箱数', width: 'w-16', visible: true, type: 'number', group: 'packing' },
  { key: 'packageType', label: '包装', width: 'w-20', visible: true, type: 'select', options: ['CTNS', 'PLTS', 'PKGS', 'BALES'], group: 'packing' },
  { key: 'grossWeight', label: '毛重', width: 'w-20', visible: true, type: 'number', group: 'packing' },
  { key: 'netWeight', label: '净重', width: 'w-20', visible: true, type: 'number', group: 'packing' },
  { key: 'volume', label: '体积', width: 'w-20', visible: true, type: 'number', group: 'packing' },
  { key: 'declarationElements', label: '申报要素', width: 'w-64', visible: true, type: 'text', group: 'customs' },
  { key: 'origin', label: '境内货源', width: 'w-32', visible: false, type: 'text', group: 'customs' },
];

interface GridRowProps {
  item: ProductItem;
  idx: number;
  visibleColumns: ColumnConfig[];
  isNight: boolean;
  isAiProcessing: string | null;
  onUpdateCell: (index: number, field: keyof ProductItem, value: any) => void;
  onRemoveRow: (index: number) => void;
  onHandleGridPaste: (e: React.ClipboardEvent, startIndex: number, startColumnKey: keyof ProductItem) => void;
  onHandleSmartAiVerify: (index: number) => Promise<void>;
  checkItem: (item: ProductItem, isRmbMode: boolean) => any;
  isRmbMode: boolean;
}

const GridRow = React.memo((props: GridRowProps) => {
  const {
    item, idx, visibleColumns, isNight, isAiProcessing,
    onUpdateCell, onRemoveRow, onHandleGridPaste, onHandleSmartAiVerify,
    checkItem, isRmbMode
  } = props;

  // Run price check
  const healthReport = checkItem(item, isRmbMode);
  const statusColor = healthReport.status === 'critical' ? 'text-red-500' : (healthReport.status === 'warning' ? 'text-amber-500' : 'text-gray-600');
  const StatusIcon = healthReport.status === 'critical' ? AlertCircle : (healthReport.status === 'warning' ? AlertTriangle : CheckCircle2);

  return (
    <tr className={`h-10 border-b last:border-0 transition-colors ${isNight ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
      <td className={`text-center font-mono text-[10px] border-r border-white/5 ${isNight ? 'text-slate-600' : 'text-slate-400'}`}>
         {idx + 1}
      </td>
      
      {visibleColumns.map((col, cIdx) => {
        return (
        <td
          key={col.key}
          className="border-r border-white/5 p-0 relative group"
          onPaste={(e) => onHandleGridPaste(e, idx, col.key)}
        >
          {/* Inject Status Icon into the first column (usually Remark or CN Name) */}
          {cIdx === 0 && (
             <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 group/status">
                <StatusIcon size={12} className={`${statusColor} opacity-50 hover:opacity-100 cursor-help`} />
                {healthReport.status !== 'healthy' && (
                   <div className="absolute left-4 top-0 z-50 w-64 p-3 rounded-lg shadow-xl bg-slate-900 text-white text-xs hidden group-hover/status:block animate-in fade-in zoom-in-95 pointer-events-none">
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
          )}

          {col.key === 'hsCode' && (
            <button
              onClick={() => onHandleSmartAiVerify(idx)}
              disabled={!!isAiProcessing}
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${isAiProcessing === item.id ? 'text-indigo-500 animate-spin' : 'text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}
            >
              {isAiProcessing === item.id ? <RotateCcw size={10} /> : <Zap size={10} />}
            </button>
          )}
          {col.type === 'select' ? (
            <select
              value={item[col.key] as string || ''}
              onChange={e => onUpdateCell(idx, col.key, e.target.value)}
              className={`w-full h-10 px-3 bg-transparent outline-none border-none text-[11px] font-bold ${isNight ? 'text-slate-200' : 'text-slate-900'} placeholder:text-gray-400 ${cIdx === 0 ? 'pl-6' : ''}`}
            >
              <option value="">-</option>
              {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              value={item[col.key] || ''}
              onChange={e => onUpdateCell(idx, col.key, e.target.value)}
              placeholder="..."
              className={`w-full h-10 px-3 bg-transparent outline-none border-none text-[11px] font-bold transition-all focus:bg-indigo-600/5 ${isNight ? 'text-slate-200' : 'text-slate-900'} placeholder:text-gray-400 ${cIdx === 0 ? 'pl-6' : ''}`}
            />
          )}
        </td>
      )})}
      <td className="flex items-center justify-center h-10">
        <button onClick={() => onRemoveRow(idx)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
});

export const GridEditor: React.FC<Props> = ({ items, header, onSave, onClose, isNight, allProjects = [], knowledgeBase, customRules = [], savedPresets }) => {
  const [localItems, setLocalItems] = useState<ProductItem[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [knowledgeText, setKnowledgeText] = useState(header.customsKnowledge || '');
  const [currentView, setCurrentView] = useState<'all' | 'invoice' | 'packing' | 'customs'>('all');
  
  // AI States
  const [isAiProcessing, setIsAiProcessing] = useState<string | null>(null); 

  // Pass knowledgeBase and customRules to the hook
  const { checkItem } = useProductHealthCheck(allProjects, header.currency, knowledgeBase, customRules);

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnConfig[];
        // Merge defaults with saved to ensure new columns appear
        const merged = DEFAULT_COLUMNS.map(d => {
            const savedCol = parsed.find(p => p.key === d.key);
            return savedCol ? { ...d, ...savedCol } : d;
        });
        return merged;
      } catch (e) { return DEFAULT_COLUMNS; }
    }
    return DEFAULT_COLUMNS;
  });

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    if (items.length > 0) {
        setLocalItems(JSON.parse(JSON.stringify(items)));
    } else {
        // Default to CTNS for empty initial row
        setLocalItems([{
            ...createInitialProductWithUniqueId(),
            packageType: 'CTNS'
        }]);
    }
  }, [items]);

  const applyViewPreset = useCallback((view: 'all' | 'invoice' | 'packing' | 'customs') => {
    setCurrentView(view);
    setColumns(prev => prev.map(col => {
      if (view === 'all') return { ...col, visible: true };
      if (view === 'invoice') return { ...col, visible: ['basic', 'invoice'].includes(col.group) };
      if (view === 'packing') return { ...col, visible: ['basic', 'packing'].includes(col.group) };
      if (view === 'customs') return { ...col, visible: ['basic', 'customs'].includes(col.group) };
      return col;
    }));
  }, []);

  const handleUpdateCell = useCallback((index: number, field: keyof ProductItem, value: any) => {
    const newItems = [...localItems];
    const item = { ...newItems[index], [field]: value };
    
    const rate = parseFloat(String(header.exchangeRateTargetToCny)) || 0;
    const qty = parseFloat(String(item.quantity)) || 0;

    if (header.isRmbCalculation) {
        if (field === 'purchaseTotalPriceRMB' || field === 'quantity' || field === 'vatRate' || field === 'taxRefundRate') {
            const currentTotalPriceRMB = Math.floor(parseFloat(String(item.purchaseTotalPriceRMB)) || 0);
            item.purchaseTotalPriceRMB = currentTotalPriceRMB || '';
            
            if (field === 'purchaseTotalPriceRMB') {
              item.purchaseUnitPriceRMB = qty > 0 ? Number((currentTotalPriceRMB / qty).toFixed(4)) : 0;
            }

            if (rate > 0 && currentTotalPriceRMB > 0) {
                // New Calculation Logic
                const vat = typeof item.vatRate === 'number' ? item.vatRate : 13;
                const refund = typeof item.taxRefundRate === 'number' ? item.taxRefundRate : 13;
                
                const v = vat / 100;
                const r = refund / 100;
                // Cost = RMB * (1 + VAT - Refund) / (1 + VAT)
                const costRMB = currentTotalPriceRMB * (1 + v - r) / (1 + v);
                const calculatedTotalPrice = Math.floor(costRMB / rate);

                item.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                item.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
            } else if (!currentTotalPriceRMB) {
                item.totalPrice = '';
                item.unitPrice = '';
            }
        }
    } else {
        if (field === 'totalPrice' || field === 'quantity') {
            const currentForeignTotal = Math.floor(parseFloat(String(item.totalPrice)) || 0);
            item.totalPrice = currentForeignTotal || '';
            item.unitPrice = (qty > 0 && currentForeignTotal > 0) ? (currentForeignTotal / qty).toFixed(4) : '';
        }
    }
    
    newItems[index] = item;
    setLocalItems(newItems);
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, localItems]);

  const handleGridPaste = useCallback((e: React.ClipboardEvent, startIndex: number, startColumnKey: keyof ProductItem) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    if (rows.length === 0) return;

    const newItems = [...localItems];
    const visibleColumnKeys = visibleColumns.map(col => col.key);
    const startColIdx = visibleColumnKeys.indexOf(startColumnKey);

    if (startColIdx === -1) return;

    rows.forEach((row, rIdx) => {
        const targetRowIdx = startIndex + rIdx;
        if (!newItems[targetRowIdx]) {
            newItems.push({
                ...createInitialProductWithUniqueId(),
                packageType: 'CTNS' // Default for new rows from paste
            });
        }

        const cols = row.split('\t');
        cols.forEach((val, cIdx) => {
            const targetColKeyIdx = startColIdx + cIdx;
            if (targetColKeyIdx < visibleColumnKeys.length) {
                const field = visibleColumnKeys[targetColKeyIdx];
                let cleanVal: string | number = val.trim();

                if (['quantity', 'purchaseTotalPriceRMB', 'totalPrice', 'unitPrice', 'cartonCount', 'grossWeight', 'netWeight', 'volume', 'vatRate', 'taxRefundRate'].includes(field as string)) {
                    const numVal = parseFloat(cleanVal.toString().replace(/[^\d.-]/g, ''));
                    cleanVal = isNaN(numVal) ? '' : numVal;
                }
                
                // @ts-ignore
                newItems[targetRowIdx][field] = cleanVal;
            }
        });

        const updatedItem = newItems[targetRowIdx];
        const rate = parseFloat(String(header.exchangeRateTargetToCny)) || 0;
        const qty = parseFloat(String(updatedItem.quantity)) || 0;

        if (header.isRmbCalculation) {
            const currentTotalPriceRMB = Math.floor(parseFloat(String(updatedItem.purchaseTotalPriceRMB)) || 0);
            updatedItem.purchaseTotalPriceRMB = currentTotalPriceRMB || '';
            
            if (currentTotalPriceRMB > 0) {
              updatedItem.purchaseUnitPriceRMB = qty > 0 ? Number((currentTotalPriceRMB / qty).toFixed(4)) : 0;
              if (rate > 0) {
                  const vat = typeof updatedItem.vatRate === 'number' ? updatedItem.vatRate : 13;
                  const refund = typeof updatedItem.taxRefundRate === 'number' ? updatedItem.taxRefundRate : 13;
                  const v = vat / 100;
                  const r = refund / 100;
                  const costRMB = currentTotalPriceRMB * (1 + v - r) / (1 + v);
                  const calculatedTotalPrice = Math.floor(costRMB / rate);

                  updatedItem.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                  updatedItem.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
              }
            }
        } else {
            const currentForeignTotal = Math.floor(parseFloat(String(updatedItem.totalPrice)) || 0);
            updatedItem.totalPrice = currentForeignTotal || '';
            updatedItem.unitPrice = (qty > 0 && currentForeignTotal > 0) ? (currentForeignTotal / qty).toFixed(4) : '';
        }

        newItems[targetRowIdx] = updatedItem;
    });
    setLocalItems(newItems);
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, localItems, visibleColumns]);

  const onHandleSmartAiVerify = async (index: number) => {
    const item = localItems[index];
    if (!item.cnName) return;

    setIsAiProcessing(item.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `针对该报关产品，核对并生成补全信息：\n品名: ${item.cnName}\n当前HS: ${item.hsCode}\n\n要求返回：英文名、HS编码、标准申报要素字符串。JSON格式。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              enName: { type: Type.STRING },
              hsCode: { type: Type.STRING },
              declarationElements: { type: Type.STRING }
            }
          }
        }
      });
      const res = JSON.parse(response.text || '{}');
      handleUpdateCell(index, 'enName', res.enName || item.enName);
      handleUpdateCell(index, 'hsCode', res.hsCode || item.hsCode);
      handleUpdateCell(index, 'declarationElements', res.declarationElements || item.declarationElements);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(null);
    }
  };

  const processMergeAndSave = useCallback(() => {
    // 1. Grouping Logic
    const mergedMap = new Map<string, ProductItem>();
    const resultList: ProductItem[] = [];

    // Filter out completely empty rows to avoid processing junk
    const validItems = localItems.filter(i => i.cnName || i.enName || Number(i.quantity) > 0 || Number(i.totalPrice) > 0);

    // Helper to safely add strings/numbers
    const safeAdd = (a: any, b: any) => {
        const v1 = parseFloat(String(a).replace(/[^\d.-]/g, '')) || 0;
        const v2 = parseFloat(String(b).replace(/[^\d.-]/g, '')) || 0;
        return v1 + v2;
    };

    validItems.forEach(item => {
        const key = (item.cnName || '').trim();
        
        // If no Chinese name, we can't merge by it reliably, add to result directly
        if (!key) {
            resultList.push(item);
            return;
        }

        if (mergedMap.has(key)) {
            const existing = mergedMap.get(key)!;
            
            // Accumulate numeric fields
            existing.quantity = safeAdd(existing.quantity, item.quantity);
            existing.purchaseTotalPriceRMB = safeAdd(existing.purchaseTotalPriceRMB, item.purchaseTotalPriceRMB);
            existing.totalPrice = safeAdd(existing.totalPrice, item.totalPrice);
            existing.cartonCount = safeAdd(existing.cartonCount, item.cartonCount);
            existing.grossWeight = safeAdd(existing.grossWeight, item.grossWeight);
            existing.netWeight = safeAdd(existing.netWeight, item.netWeight);
            existing.volume = safeAdd(existing.volume, item.volume);

            // Note: We retain static fields (unit, hsCode, tax rates) from the first entry encountered
        } else {
            // Clone to avoid mutation issues
            mergedMap.set(key, { ...item });
        }
    });

    const mergedItems = [...Array.from(mergedMap.values()), ...resultList];

    // 2. Post-Merge Recalculation (Unit Prices)
    const finalItems = mergedItems.map(item => {
        const qty = parseFloat(String(item.quantity)) || 0;
        
        // Recalc Unit Price USD
        const totalUSD = parseFloat(String(item.totalPrice)) || 0;
        if (qty > 0 && totalUSD > 0) {
            item.unitPrice = (totalUSD / qty).toFixed(4);
        }

        // Recalc Unit Price RMB
        const totalRMB = parseFloat(String(item.purchaseTotalPriceRMB)) || 0;
        if (qty > 0 && totalRMB > 0) {
            item.purchaseUnitPriceRMB = Number((totalRMB / qty).toFixed(4));
        }
        
        // Ensure rounding for weights/measures
        if(typeof item.grossWeight === 'number') item.grossWeight = parseFloat(item.grossWeight.toFixed(2));
        if(typeof item.netWeight === 'number') item.netWeight = parseFloat(item.netWeight.toFixed(2));
        if(typeof item.volume === 'number') item.volume = parseFloat(item.volume.toFixed(3));

        return item;
    });

    // 3. Save
    // Ensure we pass at least one empty row if everything was deleted/filtered
    const itemsToSave = finalItems.length > 0 ? finalItems : [createInitialProductWithUniqueId()];
    onSave(itemsToSave, knowledgeText);
  }, [localItems, knowledgeText, onSave]);

  const removeRowInternal = useCallback((idx: number) => {
    if(window.confirm('确认删除？')) {
        setLocalItems(prev => prev.filter((_, i) => i !== idx));
    }
  }, []);

  const addRows = useCallback((count: number) => {
    const newItems = Array.from({ length: count }).map(() => ({
        ...createInitialProductWithUniqueId(),
        packageType: 'CTNS' // Default for new manually added rows
    }));
    setLocalItems(prev => [...prev, ...newItems]);
  }, []);

  const handleInboxImport = useCallback((packet: DSPImportPacket) => {
    if (!packet.payload || !Array.isArray(packet.payload.items)) {
        alert("无效的数据包格式");
        return;
    }

    const importedItems: ProductItem[] = packet.payload.items.map((rawItem: any, idx) => {
        const baseItem = createInitialProductWithUniqueId();
        
        // Basic mapping
        const mappedItem: ProductItem = {
            ...baseItem,
            cnName: rawItem.cnName || '',
            enName: rawItem.enName || '',
            hsCode: rawItem.hsCode || '',
            quantity: rawItem.quantity || '',
            unit: rawItem.unit || '',
            totalPrice: rawItem.totalPrice || '',
            grossWeight: rawItem.grossWeight || '',
            netWeight: rawItem.netWeight || '',
            cartonCount: rawItem.cartonCount || '',
            packageType: rawItem.packageType || 'CTNS',
            volume: rawItem.volume || '',
            remark: rawItem.remark || '',
            vatRate: 13,
            taxRefundRate: 13
        };

        // Enrichment via Presets
        const preset = savedPresets.find(p => p.cnName === mappedItem.cnName || (p.remark && p.remark === mappedItem.remark));
        if (preset) {
            if (!mappedItem.enName) mappedItem.enName = preset.enName;
            if (!mappedItem.hsCode) mappedItem.hsCode = preset.hsCode;
            if (!mappedItem.declarationElements) {
                // Handle newlines if needed, simple assignment for now
                const lines = (preset.declarationElements || '').split('\n').filter(l => l.trim());
                mappedItem.declarationElements = lines.length > 0 ? lines[0] : '';
            }
            if (!mappedItem.unit && preset.unit) mappedItem.unit = preset.unit;
            // Load tax rates
            if (preset.vatRate) mappedItem.vatRate = preset.vatRate;
            if (preset.taxRefundRate) mappedItem.taxRefundRate = preset.taxRefundRate;
        }

        return mappedItem;
    });

    // If imported list is valid, append to local items (removing empty placeholder if exists and is the only one)
    setLocalItems(prev => {
        // If current state only has one empty item, replace it
        if (prev.length === 1 && !prev[0].cnName && !prev[0].totalPrice) {
            return importedItems;
        }
        return [...prev, ...importedItems];
    });
    
    setShowInbox(false);
  }, [savedPresets]);

  return (
    <div className={`flex flex-col h-full w-full font-sans ${isNight ? 'bg-[#0a0a0a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`shrink-0 h-16 border-b px-6 flex items-center justify-between z-50 ${isNight ? 'bg-[#111] border-white/5 shadow-2xl shadow-black/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <TableIcon size={22}/>
             </div>
             <div>
                <h1 className="text-lg font-black tracking-tight leading-none">网格编辑器</h1>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>GRID DATA WORKSPACE</p>
             </div>
          </div>
          
          <div className={`h-8 w-px ${isNight ? 'bg-white/10' : 'bg-slate-200'}`} />

          <nav className={`flex p-1 rounded-xl border ${isNight ? 'bg-black/40 border-white/5' : 'bg-slate-100/50 border-slate-200'}`}>
             <button 
               onClick={() => applyViewPreset('all')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentView === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`}
             >
               <Layout size={14}/> 全部
             </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
           <button
             onClick={() => setShowInbox(true)}
             className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${isNight ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/40' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
             title="从 n8n 收件箱导入数据"
           >
              <Inbox size={16} /> 
              <span className="hidden sm:inline">收件箱</span>
           </button>

           <button 
             onClick={() => setShowConfig(true)}
             className={`p-2.5 rounded-xl border transition-all ${isNight ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
           >
              <Settings2 size={18}/>
           </button>
           <div className={`w-px h-6 mx-1 ${isNight ? 'bg-white/10' : 'bg-slate-200'}`} />
           <button 
             onClick={processMergeAndSave} 
             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
             title="自动合并相同中文品名的行并保存"
           >
              <Combine size={18}/> 保存并同步 (自动合并)
           </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative group/main">
        <div className={`flex-1 overflow-auto custom-scrollbar relative ${isNight ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
           <table className="w-full border-separate border-spacing-0 table-fixed">
              <thead className="sticky top-0 z-30">
                 <tr className={`h-12 border-b font-black uppercase tracking-widest text-[10px] shadow-sm ${isNight ? 'bg-[#151515] text-slate-500 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    <th className="w-12 text-center border-r border-white/5">#</th>
                    {visibleColumns.map(col => (
                       <th key={col.key} className={`${col.width} px-4 text-left border-r border-white/5 relative group/th`}>
                          <div className="flex items-center gap-2">
                             {col.label}
                          </div>
                       </th>
                    ))}
                    <th className="w-16"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {localItems.map((item, idx) => (
                    <GridRow 
                        key={item.id}
                        item={item}
                        idx={idx}
                        visibleColumns={visibleColumns}
                        isNight={isNight}
                        isAiProcessing={isAiProcessing}
                        onUpdateCell={handleUpdateCell}
                        onRemoveRow={removeRowInternal}
                        onHandleGridPaste={handleGridPaste}
                        onHandleSmartAiVerify={onHandleSmartAiVerify}
                        checkItem={checkItem}
                        isRmbMode={!!header.isRmbCalculation}
                    />
                 ))}
                 {/* Footer placeholder for adding rows */}
                 <tr className={`h-12 ${isNight ? 'bg-white/5' : 'bg-slate-50/50'}`}>
                    <td colSpan={visibleColumns.length + 2} className="p-0">
                       <button 
                         onClick={() => addRows(1)}
                         className={`w-full h-10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isNight ? 'text-slate-600 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                       >
                          <Plus size={16}/> 点击或粘贴以增加行
                       </button>
                    </td>
                 </tr>
              </tbody>
           </table>
        </div>
      </main>

      {/* Footer Info */}
      <footer className={`h-10 shrink-0 border-t flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest ${isNight ? 'bg-[#111] border-white/5 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><MousePointer2 size={12} className="text-indigo-500"/> 支持 Excel / 微信数据直接粘贴补全</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500"/> 智能 HS 编码纠错已开启</span>
         </div>
         <div className="flex items-center gap-4">
            <span>总计 {localItems.length} 条目</span>
            <span className="text-indigo-500">Docu.Station Pro Grid Core 3.0</span>
         </div>
      </footer>

      {/* Modals */}
      {showInbox && (
        <InboxModal 
            onClose={() => setShowInbox(false)} 
            onImport={handleInboxImport} 
            isNight={isNight} 
            showToast={(msg) => alert(msg)} // Simplified toast for grid editor context or pass props down
        />
      )}

      {showConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className={`w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 ${isNight ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black uppercase tracking-tight">列显示配置</h3>
                 <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                 {columns.map(col => (
                    <button 
                      key={col.key} 
                      onClick={() => setColumns(prev => prev.map(p => p.key === col.key ? { ...p, visible: !p.visible } : p))}
                      className={`flex items-center justify-between p-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${col.visible ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-indigo-500'}`}
                    >
                       {col.label}
                       {col.visible && <Check size={14}/>}
                    </button>
                 ))}
              </div>
              <button 
                onClick={() => setShowConfig(false)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
              >
                 确认配置
              </button>
           </div>
        </div>
      )}

      {showKnowledge && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-4xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300 ${isNight ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
               <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <BookOpen size={24}/>
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">产品知识库 / 历史记录</h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>Smart Knowledge Base Integration</p>
                     </div>
                  </div>
                  <button onClick={() => setShowKnowledge(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={32}/></button>
               </div>
               <div className="flex-1 p-10 flex flex-col gap-6 overflow-hidden">
                  <textarea 
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                    placeholder="在此输入或粘贴针对该单据的历史知识、特殊要求、海关查验记录等... AI 在进行自动补全时会参考此内容。"
                    className={`flex-1 p-6 rounded-3xl border text-sm font-bold leading-relaxed resize-none transition-all outline-none ${isNight ? 'bg-black/40 border-white/5 focus:border-indigo-500 text-slate-200' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'}`}
                  />
                  <div className="flex justify-between items-center bg-indigo-600/5 p-6 rounded-3xl border border-indigo-500/20">
                     <p className="text-xs text-indigo-500 font-bold max-w-lg">
                        提示：完善知识库可以帮助系统更准确地预测 HS 编码和申报要素。
                     </p>
                     <button 
                       onClick={() => setShowKnowledge(false)}
                       className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95"
                     >
                        保存并返回
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
