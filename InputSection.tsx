import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Users, Save, X, Building2, ChevronDown, ChevronUp, BadgeDollarSign, Database, NotebookText, Download, Import, ImageOff, Image as ImageIcon, Upload } from 'lucide-react';
import { HeaderInfo, ProductItem, Consignee, ProductPreset, Seller, INITIAL_PRODUCT } from './types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  setHeader: React.Dispatch<React.SetStateAction<HeaderInfo>>;
  setItems: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  themeMode?: 'classic' | 'vibrant' | 'night';
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  onCurrencyChange: (newCurrency: string) => void;
  isFetchingExchangeRate: boolean;
}

const ModalPortal = ({ children }: { children?: React.ReactNode }) => {
  if (typeof document === 'undefined' || !children) return null;
  return createPortal(children, document.body);
};

const titleCasePlaceholder = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => {
    if (word.length === 0) return '';
    const upperWord = word.toUpperCase();
    if (['USCC', 'HS', 'EN', 'CN', 'USA', 'PCS', 'CTNS', 'PKGS', 'PLTS', 'USD', 'EUR', 'KGS', 'CBM', 'FOB', 'CIF', 'T/T', 'L/C', 'SETS'].includes(upperWord) || /^\d+\-\S+$/.test(word)) {
      return upperWord;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const LineInput = ({ themeMode, className, uppercase, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { themeMode: string, uppercase?: boolean }) => {
  const isNight = themeMode === 'night';
  const inputThemeClass = isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-400'
          : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (uppercase) {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        if (start !== null && end !== null) {
            e.target.setSelectionRange(start, end);
        }
     }
     if (onChange) {
        onChange(e);
     }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (props.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
      }
      if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <input 
      {...props} 
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onWheel={(e) => e.currentTarget.blur()}
      className={`w-full border-b outline-none bg-transparent px-2 py-1.5 text-sm transition-colors h-[32px] ${inputThemeClass} ${uppercase ? 'uppercase' : ''} ${className || ''}`} 
    />
  );
};

const SelectInput = ({ themeMode, className, onChange, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { themeMode: string }) => {
  const isNight = themeMode === 'night';
  const selectThemeClass = isNight
          ? 'border-slate-600 bg-slate-700 text-slate-200'
          : 'border-gray-300 bg-blue-50 text-black';

  return (
    <select
      {...props}
      onChange={onChange}
      className={`w-full border-b outline-none px-2 py-1.5 text-sm transition-colors h-[32px] ${selectThemeClass} ${className || ''}`}
    >
      {children}
    </select>
  );
};

const ModalInput = ({ isNight, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { isNight?: boolean }) => {
  const inputThemeClass = isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-400'
          : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600';
  return (
    <input 
      {...props} 
      className={`w-full border-b outline-none bg-transparent px-2 py-1.5 text-sm transition-colors h-[32px] ${inputThemeClass} ${className || ''}`} 
    />
  );
};

const ModalTextarea = ({ isNight, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { isNight?: boolean }) => {
  const inputThemeClass = isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-400'
          : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600';
  return (
    <textarea 
      {...props} 
      className={`w-full border outline-none bg-transparent px-2 py-1.5 text-sm transition-colors rounded ${inputThemeClass} ${className || ''}`} 
    />
  );
};

export const InputSection: React.FC<Props> = ({ header, items, setHeader, setItems, themeMode = 'classic', setHasUnsavedChanges, onCurrencyChange }) => {
  const [isContractManual, setIsContractManual] = useState(false);
  const [showSellerInfo, setShowSellerInfo] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showSellerImportModal, setShowSellerImportModal] = useState(false);
  const [sellerImportText, setSellerImportText] = useState('');
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [savedSellers, setSavedSellers] = useState<Seller[]>(() => JSON.parse(localStorage.getItem('savedSellers') || '[]'));
  const [newSeller, setNewSeller] = useState<Seller>({ id: '', nameCn: '', nameEn: '', address: '', uscc: '', customsCode: '' });

  const [showConsigneeModal, setShowConsigneeModal] = useState(false);
  const [showConsigneeImportModal, setShowConsigneeImportModal] = useState(false);
  const [consigneeImportText, setConsigneeImportText] = useState('');
  const [savedConsignees, setSavedConsignees] = useState<Consignee[]>(() => JSON.parse(localStorage.getItem('savedConsignees') || '[]'));
  const [newConsignee, setNewConsignee] = useState({ name: '', address: '', country: '' });

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showPresetBatchMode, setShowPresetBatchMode] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetBatchText, setPresetBatchText] = useState('');
  const [savedPresets, setSavedPresets] = useState<ProductPreset[]>(() => JSON.parse(localStorage.getItem('savedProductPresets') || '[]'));
  const [newPreset, setNewPreset] = useState({ cnName: '', enName: '', hsCode: '', unit: '', remark: '', declarationElements: '' });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  const isNight = themeMode === 'night';
  const themeClasses = {
      sectionGeneralInfoContainer: isNight ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-blue-200 text-gray-800',
      sectionGeneralInfoTitle: isNight ? 'text-blue-300' : 'text-blue-800',
      sectionProductItemsContainer: isNight ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-blue-200 text-gray-800',
      sectionProductItemsTitle: isNight ? 'text-blue-300' : 'text-blue-800',
      productHeader: isNight ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-500',
      label: isNight ? 'text-slate-400' : 'text-gray-500',
      modalBg: isNight ? 'bg-slate-900/90' : 'bg-gray-900/90',
      modalContentBg: isNight ? 'bg-slate-800' : 'bg-white',
      modalBorder: isNight ? 'border-slate-700' : 'border-gray-200',
      modalText: isNight ? 'text-slate-100' : 'text-gray-800',
      modalButtonPrimary: isNight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white',
      modalButtonSecondary: isNight ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
        acc.quantity += Number(item.quantity) || 0;
        acc.totalPrice += Number(item.totalPrice) || 0;
        acc.cartonCount += Number(item.cartonCount) || 0;
        acc.grossWeight += Number(item.grossWeight) || 0;
        acc.volume += Number(item.volume) || 0;
        return acc;
    }, { quantity: 0, totalPrice: 0, cartonCount: 0, grossWeight: 0, volume: 0 });
  }, [items]);

  useEffect(() => { localStorage.setItem('savedSellers', JSON.stringify(savedSellers)); }, [savedSellers]);
  useEffect(() => { localStorage.setItem('savedConsignees', JSON.stringify(savedConsignees)); }, [savedConsignees]);
  useEffect(() => { localStorage.setItem('savedProductPresets', JSON.stringify(savedPresets)); }, [savedPresets]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setHasUnsavedChanges(true);
    const { name, value } = e.target;
    if (name === 'invoiceNo') {
      setHeader(prev => {
        const newState = { ...prev, [name]: value };
        if (!isContractManual) newState.contractNo = value;
        return newState;
      });
    } else if (name === 'currency') {
      onCurrencyChange(value);
    } else {
      setHeader(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculatePrices = (item: ProductItem, rate: number) => {
    const qty = parseFloat(String(item.quantity)) || 0;
    const rmbTotal = parseFloat(String(item.purchaseTotalPriceRMB)) || 0;
    const usdTotal = (rate > 0 && rmbTotal > 0) ? rmbTotal / 1.13 / rate : 0;
    return {
      totalPrice: usdTotal.toFixed(2),
      unitPrice: qty > 0 ? (usdTotal / qty).toFixed(4) : ''
    };
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setHasUnsavedChanges(true);
    const { name, value } = e.target;
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    // @ts-ignore
    item[name] = value;

    if (name === 'purchaseTotalPriceRMB' || name === 'quantity') {
      const rate = parseFloat(String(header.exchangeRateTargetToCny)) || 0;
      const prices = calculatePrices(item, rate);
      item.totalPrice = prices.totalPrice;
      item.unitPrice = prices.unitPrice;
    }

    // Automatic net weight calculation logic removed to allow manual input.

    newItems[index] = item;
    setItems(newItems);
  };

  const handleGridPaste = (e: React.ClipboardEvent, startIndex: number, startField: keyof ProductItem) => {
    setHasUnsavedChanges(true);
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;
    const rows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    if (rows.length === 0) return;
    e.preventDefault();
    const VISUAL_FIELD_ORDER: (keyof ProductItem)[] = ['remark', 'cnName', 'enName', 'hsCode', 'quantity', 'unit', 'purchaseTotalPriceRMB', 'unitPrice', 'totalPrice', 'declarationElements', 'cartonCount', 'packageType', 'grossWeight', 'netWeight', 'volume', 'origin', 'originCountry'];
    const startColIdx = VISUAL_FIELD_ORDER.indexOf(startField);
    if (startColIdx === -1) return;
    const newItems = [...items];
    rows.forEach((row, rIdx) => {
        const targetRowIdx = startIndex + rIdx;
        const cols = row.split('\t');
        if (!newItems[targetRowIdx]) newItems[targetRowIdx] = { ...INITIAL_PRODUCT, id: Date.now().toString() + Math.random().toString().slice(2,6) };
        
        cols.forEach((val, cIdx) => {
            const fieldIdx = startColIdx + cIdx;
            if (fieldIdx < VISUAL_FIELD_ORDER.length) {
                const field = VISUAL_FIELD_ORDER[fieldIdx];
                let cleanVal = val.trim();
                // @ts-ignore
                newItems[targetRowIdx][field] = cleanVal;
            }
        });
        
        const rate = parseFloat(String(header.exchangeRateTargetToCny)) || 1;
        const prices = calculatePrices(newItems[targetRowIdx], rate);
        newItems[targetRowIdx].totalPrice = prices.totalPrice;
        newItems[targetRowIdx].unitPrice = prices.unitPrice;
    });
    setItems(newItems);
  };

  const addItem = () => {
    setHasUnsavedChanges(true);
    setItems(prev => [...prev, { ...INITIAL_PRODUCT, id: Date.now().toString() }]);
  };

  const removeItem = (idx: number) => {
    setHasUnsavedChanges(true);
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const selectSeller = (s: Seller) => {
    setHeader(prev => ({ ...prev, sellerNameCn: s.nameCn, sellerName: s.nameEn, sellerAddress: s.address, sellerUscc: s.uscc, sellerCustomsCode: s.customsCode }));
    setShowSellerModal(false);
  };

  return (
    <div className={`p-6 rounded-lg shadow-md border space-y-8 no-print w-full mx-auto relative ${isNight ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'}`}>
      <div className={`p-4 rounded-lg shadow-md border space-y-8 no-print w-full mx-auto relative ${themeClasses.sectionGeneralInfoContainer}`}>
        <h2 className={`font-bold text-lg mb-2 ${themeClasses.sectionGeneralInfoTitle}`}>General Document Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div className="col-span-full border-b border-gray-200 pb-2 mb-2 flex justify-between items-center">
            <h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${isNight ? 'text-slate-400' : 'text-gray-600'}`}><Building2 size={16}/> Seller/Exporter Info</h3>
            <div className="flex gap-2 items-center">
               <button onClick={() => setShowSellerModal(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Users size={12}/> Select Seller</button>
               <button onClick={() => setShowSellerInfo(!showSellerInfo)} className="text-xs text-gray-500 hover:underline flex items-center gap-1">{showSellerInfo ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {showSellerInfo ? 'Details' : 'Details'}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 col-span-full">
            <LineInput themeMode={themeMode} placeholder="Company Name (CN)" name="sellerNameCn" value={header.sellerNameCn} onChange={handleHeaderChange} className="text-base font-bold"/>
            <LineInput themeMode={themeMode} placeholder="Company Name (EN)" name="sellerName" value={header.sellerName} onChange={handleHeaderChange} className="text-base font-bold"/>
          </div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Invoice No.</label><LineInput themeMode={themeMode} placeholder="Invoice No." name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} /></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Contract No.</label><LineInput themeMode={themeMode} placeholder="Contract No." name="contractNo" value={header.contractNo} onChange={handleHeaderChange} /></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Invoice Date</label><LineInput themeMode={themeMode} type="date" name="invoiceDate" value={header.invoiceDate} onChange={handleHeaderChange} /></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Currency</label><SelectInput themeMode={themeMode} name="currency" value={header.currency} onChange={handleHeaderChange}><option value="USD">USD</option><option value="CNY">CNY</option><option value="EUR">EUR</option></SelectInput></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Exchange Rate to CNY</label><LineInput themeMode={themeMode} type="number" step="0.0001" name="exchangeRateTargetToCny" value={header.exchangeRateTargetToCny} onChange={handleHeaderChange} /></div>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-md border space-y-4 ${themeClasses.sectionProductItemsContainer}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`font-bold text-lg ${themeClasses.sectionProductItemsTitle}`}>Product Items</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowBatchModal(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Upload size={16}/> Batch</button>
            <button onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Add Row</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1200px]">
            <thead>
              <tr className={themeClasses.productHeader}>
                <th className="p-3 text-center w-10 sticky left-0 z-10">#</th>
                <th className="p-3 text-left w-60">CN Name / EN Name</th>
                <th className="p-3 text-left">Details</th>
                <th className="p-3 text-right w-24">G.W.</th>
                <th className="p-3 text-right w-24">N.W.</th>
                <th className="p-3 text-right w-24">Vol</th>
                <th className="p-3 text-center w-10 sticky right-0 z-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 text-center font-bold">{index + 1}</td>
                  <td className="p-2">
                    <LineInput themeMode={themeMode} placeholder="CN Name" name="cnName" value={item.cnName} onChange={e => handleItemChange(index, e)} onPaste={e => handleGridPaste(e, index, 'cnName')} />
                    <LineInput themeMode={themeMode} placeholder="EN Name" name="enName" value={item.enName} onChange={e => handleItemChange(index, e)} />
                  </td>
                  <td className="p-2">
                    <div className="grid grid-cols-6 gap-2 mb-1">
                      <LineInput themeMode={themeMode} placeholder="HS Code" name="hsCode" value={item.hsCode} onChange={e => handleItemChange(index, e)} />
                      <LineInput themeMode={themeMode} placeholder="Qty" type="number" name="quantity" value={item.quantity} onChange={e => handleItemChange(index, e)} />
                      <LineInput themeMode={themeMode} placeholder="Unit" name="unit" value={item.unit} onChange={e => handleItemChange(index, e)} />
                      <LineInput themeMode={themeMode} placeholder="RMB Total" type="number" name="purchaseTotalPriceRMB" value={item.purchaseTotalPriceRMB} onChange={e => handleItemChange(index, e)} className="text-right text-blue-500 font-bold" />
                      <div className="flex items-center justify-end text-xs font-mono">{Number(item.totalPrice).toFixed(2)} USD</div>
                      <LineInput themeMode={themeMode} placeholder="Pkgs" type="number" name="cartonCount" value={item.cartonCount} onChange={e => handleItemChange(index, e)} />
                    </div>
                    <LineInput themeMode={themeMode} placeholder="Elements" name="declarationElements" value={item.declarationElements} onChange={e => handleItemChange(index, e)} className="text-xs" />
                  </td>
                  <td className="p-2"><LineInput themeMode={themeMode} type="number" name="grossWeight" value={item.grossWeight} onChange={e => handleItemChange(index, e)} className="text-right" /></td>
                  <td className="p-2 text-right font-mono px-2">{item.netWeight}</td>
                  <td className="p-2"><LineInput themeMode={themeMode} type="number" name="volume" value={item.volume} onChange={e => handleItemChange(index, e)} className="text-right" /></td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`whitespace-nowrap ${isNight ? 'bg-slate-800' : 'bg-blue-50'} font-bold`}>
                <td colSpan={3} className="p-3 text-right uppercase">Totals</td>
                <td className="p-3 text-right">{totals.grossWeight.toFixed(2)}</td>
                <td className="p-3 text-right">Qty: {totals.quantity}</td>
                <td className="p-3 text-right">Vol: {totals.volume.toFixed(3)}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showBatchModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]" onClick={() => setShowBatchModal(false)}>
            <div className={`w-full max-w-2xl p-6 rounded-lg ${themeClasses.modalContentBg}`} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Batch Import Products</h3>
                <p className="text-xs text-gray-500 mb-2">Tab Separated: Qty | RMB Total | Pkgs | PkgType | GW | NW | Vol</p>
                <ModalTextarea isNight={isNight} rows={15} value={batchText} onChange={e => setBatchText(e.target.value)} placeholder="Paste data from excel..." />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button onClick={() => {
                        const rows = batchText.trim().split('\n');
                        const rate = parseFloat(String(header.exchangeRateTargetToCny)) || 1;
                        const added = rows.map(r => {
                            const c = r.split('\t');
                            const q = parseFloat(c[0]) || 0;
                            const rmb = parseFloat(c[1]) || 0;
                            const usd = rmb / 1.13 / rate;
                            return { ...INITIAL_PRODUCT, id: Math.random().toString(), quantity: q, purchaseTotalPriceRMB: rmb, totalPrice: usd.toFixed(2), cartonCount: c[2] || '', packageType: c[3] || 'CTNS', grossWeight: c[4] || '', netWeight: c[5] || '', volume: c[6] || '' };
                        });
                        setItems(prev => [...prev, ...added]);
                        setShowBatchModal(false);
                    }} className="px-4 py-2 rounded bg-blue-600 text-white">Import</button>
                </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showSellerModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]" onClick={() => setShowSellerModal(false)}>
            <div className={`w-full max-w-xl p-6 rounded-lg ${themeClasses.modalContentBg}`} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Select Seller</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {savedSellers.map(s => (
                        <div key={s.id} onClick={() => selectSeller(s)} className={`p-3 border rounded cursor-pointer hover:bg-blue-500 hover:text-white ${themeClasses.modalBorder}`}>
                            <p className="font-bold">{s.nameCn}</p>
                            <p className="text-xs">{s.nameEn}</p>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};