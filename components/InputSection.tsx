import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Building2, ChevronDown, ChevronUp, BadgeDollarSign, NotebookText, Plus, Trash2, Users, Image as ImageIcon, RefreshCw, Loader2, ExternalLink, Cloud, Upload } from 'lucide-react';
import { HeaderInfo, ProductItem, Consignee, ProductPreset, Seller, INITIAL_PRODUCT, ProjectStatus, CustomTheme, InvoiceProject, KnowledgeBase, CustomRule } from '../types';
import { WebDavFileBrowser } from './WebDavFileBrowser';
import { GeneralInfoForm } from './forms/GeneralInfoForm';
import { ProductTable } from './tables/ProductTable';
import { SellerModal, ConsigneeModal, PresetModal, BatchModal } from './InputSectionModals';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  setHeader: React.Dispatch<React.SetStateAction<HeaderInfo>>;
  setItems: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  themeMode?: 'classic' | 'vibrant' | 'night' | 'custom';
  customTheme?: CustomTheme; 
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>; 
  status: ProjectStatus;
  onStatusChange: (status: ProjectStatus) => void;
  statusLabels: Record<ProjectStatus, string>;
  showToast: (msg: string) => void;
  allProjects: InvoiceProject[];
  knowledgeBase?: KnowledgeBase;
  customRules?: CustomRule[];
  onOpenGridEditor: () => void;
  
  isFocusMode: boolean;
  onToggleFocus: () => void;

  // Global Data Props
  savedSellers: Seller[];
  onUpdateSellers: (sellers: Seller[]) => void;
  savedConsignees: Consignee[];
  onUpdateConsignees: (consignees: Consignee[]) => void;
  savedPresets: ProductPreset[];
  onUpdatePresets: (presets: ProductPreset[]) => void;
}

export const InputSection: React.FC<Props> = memo(({ 
  header, items, setHeader, setItems, themeMode = 'classic', customTheme, setHasUnsavedChanges,
  status, onStatusChange, statusLabels, showToast, allProjects, knowledgeBase, customRules = [],
  onOpenGridEditor, isFocusMode, onToggleFocus,
  savedSellers, onUpdateSellers, savedConsignees, onUpdateConsignees, savedPresets, onUpdatePresets
}) => {
  const [isContractManual, setIsContractManual] = useState(false);
  const [showSellerInfo, setShowSellerInfo] = useState(false);
  const [showBLInfo, setShowBLInfo] = useState(false);

  // Exchange Rate States
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateSource, setRateSource] = useState<string | null>(null);

  // Modal Visibility States
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showConsigneeModal, setShowConsigneeModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);

  // Local state for exchange rate input
  const [localExchangeRate, setLocalExchangeRate] = useState<string>(String(header.exchangeRateTargetToCny));

  useEffect(() => {
    setLocalExchangeRate(String(header.exchangeRateTargetToCny));
  }, [header.exchangeRateTargetToCny]);

  const sortedConsignees = useMemo(() => {
    return [...savedConsignees].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
  }, [savedConsignees]);

  const sortedPresets = useMemo(() => {
    return [...savedPresets].sort((a, b) => (a.remark || '').localeCompare(b.remark || '', 'zh-CN'));
  }, [savedPresets]);

  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const themeClasses = useMemo(() => ({
      sectionGeneralInfoContainer: isCustom
          ? 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
          : isVibrant
          ? 'bg-white border-[#00A8E9] text-gray-800'
          : isNight
          ? 'bg-slate-900 border-slate-700 text-slate-200'
          : 'bg-white border-blue-200 text-gray-800', 
      label: isCustom
          ? 'text-[var(--theme-text-secondary)]'
          : isVibrant
          ? 'text-[#0068BA]'
          : isNight ? 'text-slate-400' : 'text-gray-500',
      modalBg: isCustom ? 'bg-black/50' : (isVibrant ? 'bg-[#91D5F1]/90' : (isNight ? 'bg-slate-900/90' : 'bg-gray-900/90')),
      modalContentBg: isCustom ? 'bg-[var(--theme-surface)] text-[var(--theme-text)]' : (isVibrant ? 'bg-[#CFDFEF]' : (isNight ? 'bg-slate-800' : 'bg-white')),
      modalBorder: isCustom ? 'border-[var(--theme-border)]' : (isVibrant ? 'border-[#00A8E9]' : (isNight ? 'border-slate-700' : 'border-gray-200')),
      modalText: isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-gray-800' : (isNight ? 'text-slate-100' : 'text-gray-800')),
      modalButtonPrimary: isCustom
          ? 'bg-[var(--theme-accent)] text-white hover:opacity-90'
          : (isVibrant 
          ? 'bg-[#0068BA] hover:bg-[#00A8E9] text-white' 
          : (isNight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')),
      modalButtonSecondary: isCustom
          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          : (isVibrant 
          ? 'bg-[#91D5F1] hover:bg-[#00A8E9] text-[#0068BA]' 
          : (isNight ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')),
  }), [isCustom, isVibrant, isNight]);

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
        acc.quantity += Number(item.quantity) || 0;
        acc.totalPrice += Math.floor(Number(item.totalPrice) || 0); 
        acc.cartonCount += Number(item.cartonCount) || 0;
        acc.grossWeight += Number(item.grossWeight) || 0;
        acc.netWeight += Number(item.netWeight) || 0;
        acc.volume += Number(item.volume) || 0;
        return acc;
    }, { quantity: 0, totalPrice: 0, cartonCount: 0, grossWeight: 0, netWeight: 0, volume: 0 });
  }, [items]);

  // Helper Calculation Function
  const calculateUSD = useCallback((rmbTotal: number, rate: number, vat: number, refund: number) => {
      if (rate <= 0 || rmbTotal <= 0) return 0;
      const v = vat / 100;
      const r = refund / 100;
      const costRMB = rmbTotal * (1 + v - r) / (1 + v);
      return Math.floor(costRMB / rate);
  }, []);

  const handleHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setHasUnsavedChanges(true);
    const { name, value, type } = e.target as any;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setHeader(prev => {
      const newState = { ...prev, [name]: finalValue };
      if (name === 'invoiceNo') {
        if (!isContractManual) newState.contractNo = finalValue as string;
      } else if (name === 'contractNo') {
        setIsContractManual(true);
      } else if (name === 'incoterms') {
        // Logic suggest: CIF/CFR/DDP -> PREPAID, FOB/EXW -> COLLECT
        if (['CIF', 'CFR', 'DDP'].includes(finalValue)) newState.freightType = 'PREPAID';
        else if (['FOB', 'EXW'].includes(finalValue)) newState.freightType = 'COLLECT';
      } else if (name === 'dischargePort') {
        let destCountry = header.destinationCountry;
        const parts = (finalValue as string).split(/,|，/);
        if (parts.length > 1) destCountry = parts[parts.length - 1].trim();
        else if((finalValue as string).trim() === '') destCountry = '';
        newState.destinationCountry = destCountry;
      } else if (name === 'currency') {
        if (finalValue === 'CNY') {
          newState.isRmbCalculation = true;
          newState.exchangeRateTargetToCny = "1";
        }
        setRateSource(null);
      }
      return newState;
    });
  }, [header.destinationCountry, header.currency, isContractManual, setHasUnsavedChanges, setHeader]);

  const handleFetchRate = useCallback(async () => {
    if (header.currency === 'CNY') return;
    setIsFetchingRate(true);
    setRateSource(null);
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${header.currency}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const rate = data.rates['CNY'];

        if (rate && !isNaN(rate) && rate > 0) {
            const precision = header.currency === 'JPY' ? 6 : 4;
            const formattedRate = Number(rate).toFixed(precision);
            setLocalExchangeRate(formattedRate);
            setHeader(prev => ({ ...prev, exchangeRateTargetToCny: formattedRate }));
            
            setItems(prevItems => {
                const newHeader = { ...header, exchangeRateTargetToCny: formattedRate };
                const exchangeRate = parseFloat(formattedRate) || 0;
                return prevItems.map(item => {
                    const qty = parseFloat(String(item.quantity)) || 0;
                    const newItem = { ...item };
                    if (newHeader.isRmbCalculation) {
                        const purchaseTotalPriceRMB = parseFloat(String(item.purchaseTotalPriceRMB)) || 0;
                        if (exchangeRate > 0 && purchaseTotalPriceRMB > 0) {
                            const vat = typeof item.vatRate === 'number' ? item.vatRate : 13;
                            const refund = typeof item.taxRefundRate === 'number' ? item.taxRefundRate : 13;
                            const calculatedTotalPrice = calculateUSD(purchaseTotalPriceRMB, exchangeRate, vat, refund);
                            newItem.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                            newItem.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
                        }
                    }
                    return newItem;
                });
            });

            setRateSource("https://api.exchangerate-api.com");
            showToast(`汇率已更新: ${formattedRate}`);
        } else {
            showToast("未能获取有效汇率");
        }
    } catch (e) {
        showToast("汇率获取失败，请检查网络");
    } finally {
        setIsFetchingRate(false);
    }
  }, [header.currency, header, setItems, setHeader, setIsFetchingRate, showToast, calculateUSD]);

  const handleItemChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setHasUnsavedChanges(true);
    const { name, value } = e.target;
    
    setItems(prevItems => {
        const newItems = [...prevItems];
        const item = { ...newItems[index] };
        // @ts-ignore
        item[name] = value;

        const qty = parseFloat(String(item.quantity)) || 0;
        const exchangeRateStr = String(header.exchangeRateTargetToCny);
        const rate = parseFloat(exchangeRateStr) || 0;

        if (header.isRmbCalculation) {
            if (name === 'purchaseTotalPriceRMB' || name === 'quantity') {
                const currentTotalPriceRMBVal = parseFloat(String(item.purchaseTotalPriceRMB)) || 0;
                if (name === 'purchaseTotalPriceRMB') {
                  item.purchaseUnitPriceRMB = qty > 0 ? Number((currentTotalPriceRMBVal / qty).toFixed(4)) : 0;
                }
                if (rate > 0 && currentTotalPriceRMBVal > 0) {
                    const vat = typeof item.vatRate === 'number' ? item.vatRate : 13;
                    const refund = typeof item.taxRefundRate === 'number' ? item.taxRefundRate : 13;
                    const calculatedTotalPrice = calculateUSD(currentTotalPriceRMBVal, rate, vat, refund);
                    item.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                    item.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
                } else if (!item.purchaseTotalPriceRMB) {
                    item.totalPrice = '';
                    item.unitPrice = '';
                }
            }
        } else {
            if (name === 'totalPrice' || name === 'quantity') {
                const currentForeignTotalVal = parseFloat(String(item.totalPrice)) || 0;
                item.unitPrice = (qty > 0 && currentForeignTotalVal > 0) ? (currentForeignTotalVal / qty).toFixed(4) : '';
            }
        }

        // Automatic net weight calculation logic removed to allow manual input.

        newItems[index] = item;
        return newItems;
    });
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, setItems, setHasUnsavedChanges, calculateUSD]);

  const handleCurrencyBlur = useCallback((index: number, field: 'purchaseTotalPriceRMB' | 'totalPrice') => {
    setItems(prevItems => {
        const newItems = [...prevItems];
        const val = parseFloat(String(newItems[index][field]));
        if (!isNaN(val)) newItems[index][field] = Math.floor(val) || ''; 
        return newItems;
    });
  }, [setItems]);

  const handleWeightBlur = useCallback((index: number, field: 'grossWeight' | 'netWeight') => {
    setItems(prevItems => {
        const newItems = [...prevItems];
        const val = parseFloat(String(newItems[index][field]));
        if (!isNaN(val)) newItems[index][field] = val.toFixed(2);
        return newItems;
    });
  }, [setItems]);

  const handlePresetSelect = useCallback((index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasUnsavedChanges(true);
    const selectedRemark = e.target.value;
    const preset = savedPresets.find(p => p.remark === selectedRemark);
    
    setItems(prevItems => {
        const newItems = [...prevItems];
        const item = { ...newItems[index], remark: selectedRemark };

        if (preset) {
          item.cnName = preset.cnName;
          item.enName = preset.enName;
          item.hsCode = preset.hsCode;
          if (preset.unit) item.unit = preset.unit;
          if (preset.declarationElements) {
             const lines = preset.declarationElements.split('\n').filter(line => line.trim());
             item.declarationElements = lines.length > 0 ? lines[0] : '';
          } else item.declarationElements = '';
          item.vatRate = typeof preset.vatRate === 'number' ? preset.vatRate : 13;
          item.taxRefundRate = typeof preset.taxRefundRate === 'number' ? preset.taxRefundRate : 13;
        }
        
        const qty = parseFloat(String(item.quantity)) || 0;
        const exchangeRateStr = String(header.exchangeRateTargetToCny);
        const rate = parseFloat(exchangeRateStr) || 0;

        if (header.isRmbCalculation) {
            const currentTotalPriceRMBVal = parseFloat(String(item.purchaseTotalPriceRMB)) || 0;
            if (currentTotalPriceRMBVal > 0) {
              item.purchaseUnitPriceRMB = qty > 0 ? Number((currentTotalPriceRMBVal / qty).toFixed(4)) : 0;
              if (rate > 0) {
                  const vat = item.vatRate ?? 13;
                  const refund = item.taxRefundRate ?? 13;
                  const calculatedTotalPrice = calculateUSD(currentTotalPriceRMBVal, rate, vat, refund);
                  item.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                  item.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
              }
            }
        }
        
        newItems[index] = item;
        return newItems;
    });
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, savedPresets, setItems, setHasUnsavedChanges, calculateUSD]);

  const addItem = useCallback(() => {
    setHasUnsavedChanges(true);
    setItems(prev => [...prev, { ...INITIAL_PRODUCT, id: Date.now().toString() }]);
  }, [setItems, setHasUnsavedChanges]);

  const removeItem = useCallback((index: number) => {
    if (window.confirm("确定要删除这一行产品吗？")) {
        setHasUnsavedChanges(true);
        setItems(prev => prev.filter((_, i) => i !== index));
    }
  }, [setItems, setHasUnsavedChanges]);

  const handleGridPaste = useCallback((e: React.ClipboardEvent, startIndex: number, startField: keyof ProductItem) => {
    setHasUnsavedChanges(true);
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;
    const rows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    if (rows.length === 0 || (!rows.length && !rows[0].includes('\t'))) return;
    e.preventDefault();
    const VISUAL_FIELD_ORDER: (keyof ProductItem)[] = ['remark', 'cnName', 'enName', 'hsCode', 'quantity', 'unit', 'purchaseTotalPriceRMB', 'unitPrice', 'totalPrice', 'declarationElements', 'cartonCount', 'packageType', 'grossWeight', 'netWeight', 'volume', 'origin', 'originCountry'];
    const startColIdx = VISUAL_FIELD_ORDER.indexOf(startField);
    if (startColIdx === -1) return;
    
    setItems(prevItems => {
        const newItems = [...prevItems];
        rows.forEach((row, rIdx) => {
            const targetRowIdx = startIndex + rIdx;
            if (!newItems[targetRowIdx]) newItems[targetRowIdx] = { ...INITIAL_PRODUCT, id: Date.now().toString() + Math.random().toString().slice(2, 6) };
            const cols = row.split('\t');
            cols.forEach((val, cIdx) => {
                const fieldIdx = startColIdx + cIdx;
                if (fieldIdx < VISUAL_FIELD_ORDER.length) {
                    const field = VISUAL_FIELD_ORDER[fieldIdx];
                    let cleanVal = val.trim();
                    if (['quantity', 'totalPrice', 'grossWeight', 'netWeight', 'volume', 'cartonCount', 'unitPrice', 'purchaseTotalPriceRMB'].includes(field)) cleanVal = cleanVal.replace(/[^\d.-]/g, '');
                    // @ts-ignore
                    newItems[targetRowIdx][field] = cleanVal;
                }
            });
            
            let item = newItems[targetRowIdx];
            const exchangeRate = parseFloat(String(header.exchangeRateTargetToCny)) || 0;
            const qty = parseFloat(String(item.quantity)) || 0;
            
            if (header.isRmbCalculation) {
                const purchaseTotalPriceRMB = Math.floor(parseFloat(String(item.purchaseTotalPriceRMB)) || 0);
                item.purchaseTotalPriceRMB = purchaseTotalPriceRMB || '';
                if (purchaseTotalPriceRMB > 0) {
                    item.purchaseUnitPriceRMB = qty > 0 ? Number((purchaseTotalPriceRMB / qty).toFixed(4)) : 0;
                    if (exchangeRate > 0) {
                        const vat = typeof item.vatRate === 'number' ? item.vatRate : 13;
                        const refund = typeof item.taxRefundRate === 'number' ? item.taxRefundRate : 13;
                        const costRMB = purchaseTotalPriceRMB * (1 + vat/100 - refund/100) / (1 + vat/100);
                        const calculatedTotalPrice = Math.floor(costRMB / exchangeRate);
                        item.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                        item.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
                    }
                }
            } else {
                const totalPrice = Math.floor(parseFloat(String(item.totalPrice)) || 0);
                item.totalPrice = totalPrice || '';
                if (totalPrice > 0) item.unitPrice = qty > 0 ? (totalPrice / qty).toFixed(4) : '';
            }

            // Automatic net weight calculation logic removed for pasting.
        });
        return newItems;
    });
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, setItems, setHasUnsavedChanges]);

  const saveItemAsPreset = useCallback((item: ProductItem) => {
    if (!item.cnName) { alert("请先输入中文品名作为预设的键。"); return; }
    const key = item.cnName.trim();
    if (!window.confirm(`确定要将 "${key}" 保存到商品预设数据库吗？`)) return;

    const presetData: ProductPreset = { 
        id: Date.now().toString(), cnName: item.cnName, enName: item.enName, hsCode: item.hsCode, unit: item.unit as string, 
        remark: key, declarationElements: item.declarationElements, vatRate: item.vatRate ?? 13, taxRefundRate: item.taxRefundRate ?? 13
    };
    const updatedPresets = [...savedPresets];
    const existsIndex = updatedPresets.findIndex(p => p.remark === key);
    
    if (existsIndex !== -1) {
        if (!window.confirm(`预设 "${key}" 已存在。是否覆盖保存？`)) return;
        updatedPresets[existsIndex] = { ...presetData, id: updatedPresets[existsIndex].id };
    } else {
        updatedPresets.push(presetData);
    }
    onUpdatePresets(updatedPresets);
  }, [savedPresets, onUpdatePresets]);

  const downloadFile = useCallback((filename: string, text: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, []);

  const handleSelectSeller = useCallback((s: Seller) => {
    setHeader(prev => ({ ...prev, sellerNameCn: s.nameCn, sellerName: s.nameEn, sellerAddress: s.address, sellerUscc: s.uscc, sellerCustomsCode: s.customsCode }));
    setShowSellerModal(false);
    setHasUnsavedChanges(true);
  }, [setHeader, setHasUnsavedChanges]);

  const handleSelectConsignee = useCallback((c: Consignee) => {
    setHeader(prev => ({ ...prev, buyerName: c.name, buyerAddress: c.address, tradeCountry: c.country || '' }));
    setShowConsigneeModal(false);
    setHasUnsavedChanges(true);
  }, [setHeader, setHasUnsavedChanges]);

  const handleBatchImport = useCallback((text: string) => {
    const rows = text.trim().split('\n').filter(row => row.trim() !== '');
    if (rows.length === 0) return;

    const newProducts: ProductItem[] = rows.map((row, idx) => {
      const cols = row.split('\t').map(s => s.trim());
      const getNum = (i: number) => parseFloat(cols[i]?.replace(/[^\d.-]/g, '') || '0') || 0;
      
      const quantity_col = getNum(0);
      const price_col = Math.floor(getNum(1)); 
      const cartonCount_col = getNum(2);
      const packageType_col = cols[3] || '';
      const grossWeight_col = getNum(4);
      const netWeight_col = getNum(5);
      const volume_col = getNum(6);

      let item: ProductItem = { 
        ...INITIAL_PRODUCT,
        id: Date.now().toString() + idx + Math.random().toString().slice(2,5), 
        quantity: quantity_col,
        purchaseTotalPriceRMB: header.isRmbCalculation ? price_col : "",
        totalPrice: !header.isRmbCalculation ? price_col : "",
        purchaseUnitPriceRMB: (header.isRmbCalculation && quantity_col > 0) ? price_col / quantity_col : 0,
        cartonCount: cartonCount_col,
        packageType: packageType_col,
        grossWeight: grossWeight_col,
        netWeight: netWeight_col, 
        volume: volume_col,
        vatRate: 13,
        taxRefundRate: 13
      };

      const exchangeRate = parseFloat(String(header.exchangeRateTargetToCny)) || 0;
      if (header.isRmbCalculation && exchangeRate > 0 && item.purchaseTotalPriceRMB && Number(item.purchaseTotalPriceRMB) > 0) {
        const calculatedTotalPrice = calculateUSD(Number(item.purchaseTotalPriceRMB), exchangeRate, 13, 13);
        item.totalPrice = calculatedTotalPrice || '';
        item.unitPrice = quantity_col > 0 ? (calculatedTotalPrice / quantity_col).toFixed(4) : '';
      } else if (!header.isRmbCalculation && item.totalPrice) {
        item.unitPrice = quantity_col > 0 ? (Number(item.totalPrice) / quantity_col).toFixed(4) : '';
      }

      // Automatic net weight calculation logic removed for batch importing.

      return item;
    });
    
    if (newProducts.length > 0) { setItems(prev => [...prev, ...newProducts]); setHasUnsavedChanges(true); }
  }, [header.exchangeRateTargetToCny, header.isRmbCalculation, setItems, setHasUnsavedChanges, calculateUSD]);

  const addRemarkItem = useCallback(() => { setHeader(prev => ({ ...prev, remarks: [...(prev.remarks || []), { id: Date.now().toString(), text: '' }] })); setHasUnsavedChanges(true); }, [setHasUnsavedChanges, setHeader]);
  const handleRemarkChange = useCallback((index: number, value: string) => { setHasUnsavedChanges(true); setHeader(prev => { const newRemarks = [...(prev.remarks || [])]; if (newRemarks[index]) newRemarks[index] = { ...newRemarks[index], text: value }; return { ...prev, remarks: newRemarks }; }); }, [setHasUnsavedChanges, setHeader]);
  const removeRemarkItem = useCallback((index: number) => { if (window.confirm("确定要删除这条备注吗？")) { setHasUnsavedChanges(true); setHeader(prev => { const newRemarks = [...(prev.remarks || [])]; if (newRemarks.length > 0) newRemarks.splice(index, 1); return { ...prev, remarks: newRemarks }; }); } }, [setHasUnsavedChanges, setHeader]);

  const handleLocalExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setLocalExchangeRate(e.target.value); }, []);
  const handleExchangeRateBlur = useCallback(() => {
    setHasUnsavedChanges(true);
    setHeader(prev => {
      const newState = { ...prev, exchangeRateTargetToCny: localExchangeRate };
      setItems(prevItems => {
          const exchangeRate = parseFloat(localExchangeRate) || 0;
          return prevItems.map(item => {
              const qty = parseFloat(String(item.quantity)) || 0;
              const newItem = { ...item };
              if (newState.isRmbCalculation) {
                  const purchaseTotalPriceRMB = Math.floor(parseFloat(String(item.purchaseTotalPriceRMB)) || 0);
                  if (exchangeRate > 0 && purchaseTotalPriceRMB > 0) {
                      const vat = newItem.vatRate ?? 13;
                      const refund = newItem.taxRefundRate ?? 13;
                      const calculatedTotalPrice = calculateUSD(purchaseTotalPriceRMB, exchangeRate, vat, refund);
                      newItem.totalPrice = calculatedTotalPrice === 0 ? '' : calculatedTotalPrice;
                      newItem.unitPrice = qty > 0 ? (calculatedTotalPrice / qty).toFixed(4) : '';
                  }
              }
              return newItem;
          });
      });
      return newState;
    });
  }, [localExchangeRate, setItems, setHasUnsavedChanges, setHeader, calculateUSD]);

  const currentSeller = useMemo(() => savedSellers.find(s => s.nameCn === header.sellerNameCn), [header.sellerNameCn, savedSellers]);

  return (
    <div className={`p-6 rounded-lg shadow-md border space-y-8 no-print w-full mx-auto relative ${themeClasses.sectionGeneralInfoContainer}`} style={{ borderRadius: isCustom ? 'var(--theme-radius)' : undefined }}>
      
      {showSellerModal && (
        <SellerModal
          onClose={() => setShowSellerModal(false)}
          isNight={isNight}
          themeMode={themeMode}
          customTheme={customTheme}
          themeClasses={themeClasses}
          savedSellers={savedSellers}
          onUpdateSellers={onUpdateSellers}
          onSelect={handleSelectSeller}
          downloadFile={downloadFile}
        />
      )}

      {showConsigneeModal && (
        <ConsigneeModal 
          onClose={() => setShowConsigneeModal(false)}
          isNight={isNight}
          themeMode={themeMode}
          customTheme={customTheme}
          themeClasses={themeClasses}
          savedConsignees={sortedConsignees}
          onUpdateConsignees={onUpdateConsignees}
          onSelect={handleSelectConsignee}
          downloadFile={downloadFile}
        />
      )}

      {showPresetModal && (
        <PresetModal 
          onClose={() => setShowPresetModal(false)}
          isNight={isNight}
          themeMode={themeMode}
          customTheme={customTheme}
          themeClasses={themeClasses}
          savedPresets={sortedPresets}
          onUpdatePresets={onUpdatePresets}
          downloadFile={downloadFile}
        />
      )}

      {showBatchModal && (
        <BatchModal 
          onClose={() => setShowBatchModal(false)}
          onImport={handleBatchImport}
          isNight={isNight}
          themeMode={themeMode}
          customTheme={customTheme}
          themeClasses={themeClasses}
          header={header}
        />
      )}

      {showFileBrowser && (
        <WebDavFileBrowser 
          invoiceNo={header.invoiceNo || 'DRAFT'} 
          isNight={isNight} 
          onClose={() => setShowFileBrowser(false)} 
          showToast={showToast} 
        />
      )}

      {!isFocusMode && (
        <GeneralInfoForm 
          header={header}
          items={items}
          themeMode={themeMode}
          customTheme={customTheme}
          handleHeaderChange={handleHeaderChange}
          showSellerInfo={showSellerInfo}
          setShowSellerInfo={setShowSellerInfo}
          currentSeller={currentSeller}
          onOpenSellerModal={() => setShowSellerModal(true)}
          onOpenConsigneeModal={() => setShowConsigneeModal(true)}
          onOpenWebDavBrowser={() => setShowFileBrowser(true)}
          isFetchingRate={isFetchingRate}
          handleFetchRate={handleFetchRate}
          localExchangeRate={localExchangeRate}
          handleLocalExchangeRateChange={handleLocalExchangeRateChange}
          handleExchangeRateBlur={handleExchangeRateBlur}
          rateSource={rateSource}
          addRemarkItem={addRemarkItem}
          handleRemarkChange={handleRemarkChange}
          removeRemarkItem={removeRemarkItem}
          showBLInfo={showBLInfo} 
          setShowBLInfo={setShowBLInfo}
          setHasUnsavedChanges={setHasUnsavedChanges}
          setHeader={setHeader}
        />
      )}

      <ProductTable 
        header={header}
        items={items}
        themeMode={themeMode}
        customTheme={customTheme}
        handleHeaderChange={handleHeaderChange}
        onOpenPresetModal={() => setShowPresetModal(true)}
        onOpenBatchModal={() => setShowBatchModal(true)}
        addItem={addItem}
        savedPresets={savedPresets}
        sortedPresets={sortedPresets}
        handlePresetSelect={handlePresetSelect}
        saveItemAsPreset={saveItemAsPreset}
        handleItemChange={handleItemChange}
        handleGridPaste={handleGridPaste}
        handleCurrencyBlur={handleCurrencyBlur}
        handleWeightBlur={handleWeightBlur}
        removeItem={removeItem}
        setItems={setItems}
        totals={totals}
        allProjects={allProjects}
        knowledgeBase={knowledgeBase}
        customRules={customRules}
        onOpenGridEditor={onOpenGridEditor}
        isFocusMode={isFocusMode}
        onToggleFocus={onToggleFocus}
      />
    </div>
  );
});