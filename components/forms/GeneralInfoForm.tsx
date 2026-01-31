
import React, { memo, useState, useCallback } from 'react';
import { Building2, ChevronDown, ChevronUp, BadgeDollarSign, NotebookText, Plus, Trash2, Users, Image as ImageIcon, RefreshCw, Loader2, ExternalLink, Cloud, Ship, MapPin, Sparkles, FileStack } from 'lucide-react';
import { HeaderInfo, ProductItem, Seller, CustomTheme } from '../../types';
import { LineInput, SelectInput, titleCasePlaceholder } from '../ui/SharedInputs';
import { ContainerTrackingModal } from '../InputSectionModals';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  themeMode: string;
  customTheme?: CustomTheme;
  handleHeaderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  showSellerInfo: boolean;
  setShowSellerInfo: (show: boolean) => void;
  currentSeller?: Seller;
  onOpenSellerModal: () => void;
  onOpenConsigneeModal: () => void;
  onOpenWebDavBrowser: () => void;
  isFetchingRate: boolean;
  handleFetchRate: () => void;
  localExchangeRate: string;
  handleLocalExchangeRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExchangeRateBlur: () => void;
  rateSource: string | null;
  addRemarkItem: () => void;
  handleRemarkChange: (index: number, value: string) => void;
  removeRemarkItem: (index: number) => void;
  showBLInfo: boolean;
  setShowBLInfo: (show: boolean) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  setHeader: React.Dispatch<React.SetStateAction<HeaderInfo>>;
}

export const GeneralInfoForm = memo<Props>(({
  header, items, themeMode, customTheme, handleHeaderChange,
  showSellerInfo, setShowSellerInfo, currentSeller,
  onOpenSellerModal, onOpenConsigneeModal, onOpenWebDavBrowser,
  isFetchingRate, handleFetchRate, localExchangeRate,
  handleLocalExchangeRateChange, handleExchangeRateBlur, rateSource,
  addRemarkItem, handleRemarkChange, removeRemarkItem,
  showBLInfo, setShowBLInfo, setHasUnsavedChanges, setHeader
}) => {
  const [showTracking, setShowTracking] = useState(false);
  const [isSummarizingCargo, setIsSummarizingCargo] = useState(false);

  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const showOceanFreight = ['CFR', 'CIF', 'DDP'].includes(header.incoterms);
  const showInsurance = ['CIF', 'DDP'].includes(header.incoterms);
  
  const shouldHideOtherCharges = ['FOB', 'EXW'].includes(header.incoterms);

  const handleAiSummarizeCargo = useCallback(async () => {
    const validItems = items.filter(i => i.enName || i.cnName);
    if (validItems.length === 0) return;
    
    setIsSummarizingCargo(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `基于以下商品列表，生成一个精简专业的英文货物总称（用于提单 Description of Goods）。
      只需返回总称，不要包含多余文字。
      列表：${validItems.map(i => `${i.enName} (${i.quantity} ${i.unit})`).join(', ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const summary = response.text?.trim() || "";
      if (summary) {
        setHeader(prev => ({ ...prev, customsMarks: summary }));
        setHasUnsavedChanges(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizingCargo(false);
    }
  }, [items, setHeader, setHasUnsavedChanges]);

  const themeClasses = {
      sectionGeneralInfoContainer: isCustom
          ? 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
          : isVibrant
          ? 'bg-white border-[#00A8E9] text-gray-800'
          : isNight
          ? 'bg-slate-900 border-slate-700 text-slate-200'
          : 'bg-white border-blue-200 text-gray-800', 
      sectionGeneralInfoTitle: isCustom
          ? 'text-[var(--theme-text)]'
          : isVibrant
          ? 'text-[#0068BA]'
          : isNight
          ? 'text-blue-300'
          : 'text-blue-800',
      label: isCustom
          ? 'text-[var(--theme-text-secondary)]'
          : isVibrant
          ? 'text-[#0068BA]'
          : isNight ? 'text-slate-400' : 'text-gray-500',
      modalContentBg: isCustom ? 'bg-[var(--theme-surface)] text-[var(--theme-text)]' : (isVibrant ? 'bg-[#CFDFEF]' : (isNight ? 'bg-slate-800' : 'bg-white')),
      modalBorder: isCustom ? 'border-[var(--theme-border)]' : (isVibrant ? 'border-[#00A8E9]' : (isNight ? 'border-slate-700' : 'border-gray-200')),
      modalText: isCustom ? 'text-[var(--theme-text)]' : (isVibrant ? 'text-gray-800' : (isNight ? 'text-slate-100' : 'text-gray-800')),
  };

  return (
    <div className={`p-4 rounded-lg shadow-md border space-y-8 no-print w-full mx-auto relative ${themeClasses.sectionGeneralInfoContainer}`} style={{ borderRadius: isCustom ? 'var(--theme-radius)' : undefined }}>
        {showTracking && (
          <ContainerTrackingModal 
            containerNo={header.containerNo || ''} 
            onClose={() => setShowTracking(false)} 
            isNight={isNight} 
            themeMode={themeMode} 
            customTheme={customTheme} 
            themeClasses={themeClasses} 
          />
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
             <h2 className={`font-bold text-lg ${themeClasses.sectionGeneralInfoTitle}`}>General Document Info</h2>
             <button 
               onClick={onOpenWebDavBrowser}
               className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded border hover:bg-opacity-80 transition-colors ${isCustom ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]' : (isVibrant ? 'bg-[#91D5F1] text-[#0068BA] border-[#00A8E9]' : (isNight ? 'bg-slate-700 text-indigo-400 border-slate-600' : 'bg-indigo-50 text-indigo-600 border-indigo-200'))}`}
             >
                <Cloud size={12}/> Cloud Docs
             </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          
          {/* Seller Section */}
          <div className="col-span-full border-b border-gray-200 pb-2 mb-2 flex justify-between items-center">
            <h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${themeClasses.label}`}><Building2 size={16}/> Seller/Exporter Info</h3>
            <div className="flex gap-2 items-center">
               {currentSeller?.invoiceSealBase64 && <span title="Invoice Seal Uploaded"><ImageIcon size={16} className="text-blue-500" /></span>}
               {currentSeller?.customsSealBase64 && <span title="Customs Seal Uploaded"><ImageIcon size={16} className="text-green-500" /></span>}
               <button onClick={onOpenSellerModal} className={`text-xs hover:underline flex items-center gap-1 ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : 'text-blue-600')}`}><Users size={12}/> Select Seller</button>
               <button onClick={() => setShowSellerInfo(!showSellerInfo)} className={`text-xs hover:underline flex items-center gap-1 ${isCustom ? 'text-[var(--theme-text-secondary)]' : (isVibrant ? 'text-gray-500' : 'text-gray-500')}`}>{showSellerInfo ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {showSellerInfo ? 'Hide Details' : 'Show Details'}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 col-span-full">
            <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="公司名称 (Chinese Company Name)" name="sellerNameCn" value={header.sellerNameCn} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/>
            <LineInput themeMode={themeMode} customTheme={customTheme} placeholder={titleCasePlaceholder("Company Name (English)")} name="sellerName" value={header.sellerName} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/>
            {showSellerInfo && (
              <>
                <LineInput themeMode={themeMode} customTheme={customTheme} placeholder={titleCasePlaceholder("Seller Address (Full English)")} name="sellerAddress" value={header.sellerAddress} onChange={handleHeaderChange} className="col-span-2 text-base font-bold placeholder:font-normal"/>
                <LineInput themeMode={themeMode} customTheme={customTheme} placeholder={titleCasePlaceholder("Unified Social Credit Code (USCC)")} name="sellerUscc" value={header.sellerUscc} onChange={handleHeaderChange} className="col-span-2 text-base font-bold placeholder:font-normal"/>
                <LineInput themeMode={themeMode} customTheme={customTheme} placeholder={titleCasePlaceholder("Seller Customs Code (10-Digit)")} name="sellerCustomsCode" value={header.sellerCustomsCode} onChange={handleHeaderChange} className="col-span-2 text-base font-bold placeholder:font-normal"/>
              </>
            )}
          </div>

          {/* Row 1: Invoice No, Contract No, Invoice Date */}
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Invoice No.</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Invoice Number" name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Contract No.</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Contract Number" name="contractNo" value={header.contractNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Invoice Date</label><LineInput themeMode={themeMode} customTheme={customTheme} type="date" name="invoiceDate" value={header.invoiceDate} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
          
          {/* Row 2: Loading Port, Discharge Port, Transport Method */}
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Loading Port</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Port of Loading" name="loadingPort" value={header.loadingPort} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Discharge Port / Country</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Port of Discharge / Destination" name="dischargePort" value={header.dischargePort} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Transport Method</label>
            <SelectInput 
              themeMode={themeMode} 
              customTheme={customTheme}
              name="transportMethod" 
              value={header.transportMethod} 
              onChange={handleHeaderChange} 
              className="text-base font-bold placeholder:font-normal" 
              placeholderOptionText="请选择运输方式"
            >
              <option value="海运">海运 (Ocean)</option>
              <option value="空运">空运 (Air)</option>
              <option value="快件">快件 (Express)</option>
            </SelectInput>
          </div>
          
          {/* Row 3: Incoterms, Currency, Payment Method */}
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Incoterms</label><SelectInput themeMode={themeMode} customTheme={customTheme} name="incoterms" value={header.incoterms} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" placeholderOptionText="请选择贸易条款"><option value="FOB">FOB</option><option value="EXW">EXW</option><option value="CFR">CFR</option><option value="CIF">CIF</option><option value="DDP">DDP</option></SelectInput></div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className={`block text-xs font-bold ${themeClasses.label}`}>Currency</label>
                {header.currency !== 'CNY' && (
                    <button 
                      onClick={handleFetchRate} 
                      disabled={isFetchingRate}
                      className={`text-[10px] flex items-center gap-1 font-bold hover:underline ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : 'text-blue-500')}`}
                      title="Fetch Real-time Rate"
                    >
                      {isFetchingRate ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      更新汇率
                    </button>
                )}
            </div>
            <SelectInput 
              themeMode={themeMode} 
              customTheme={customTheme}
              name="currency" 
              value={header.currency} 
              onChange={handleHeaderChange} 
              className="text-base font-bold placeholder:font-normal" 
              placeholderOptionText="请选择币种"
            >
              <option value="USD">USD</option><option value="CNY">CNY</option><option value="JPY">JPY</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AUD">AUD</option>
            </SelectInput>
            <div className="flex items-center gap-2 mt-2"> 
              {header.currency === 'CNY' ? (
                <span className={`text-xs font-bold ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : (isNight ? 'text-green-400' : 'text-green-700'))}`}>1 CNY = 1.0000 CNY</span>
              ) : (
                <>
                  <label className={`block text-[10px] font-bold ${themeClasses.label} min-w-[40px]`}>汇率:</label>
                  <div className="relative flex items-center">
                    <LineInput 
                      themeMode={themeMode} 
                      customTheme={customTheme}
                      type="number" 
                      name="exchangeRateTargetToCny" 
                      value={localExchangeRate} 
                      onChange={handleLocalExchangeRateChange} 
                      onBlur={handleExchangeRateBlur} 
                      className="w-[110px] text-xs font-bold placeholder:font-normal text-right" 
                      step="0.000001" 
                      placeholder="Rate" 
                      style={{ color: isCustom ? customTheme?.colors.accent : (isVibrant ? '#F1BB3E' : (isNight ? '#86efac' : '#047857')) }} 
                    />
                  </div>
                  <span className={`text-xs font-bold ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : (isNight ? 'text-green-400' : 'text-green-700'))} mr-2`}>CNY</span>
                </>
              )}
            </div>
            {rateSource && (
              <a href={rateSource} target="_blank" rel="noopener noreferrer" className="block mt-1 text-[9px] text-blue-400 hover:underline flex items-center gap-1">
                Source: ExchangeRate-API <ExternalLink size={8}/>
              </a>
            )}
          </div>
          <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Payment Method</label><SelectInput themeMode={themeMode} customTheme={customTheme} name="paymentMethod" value={header.paymentMethod} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" placeholderOptionText="请选择支付方式"><option value="T/T">T/T</option><option value="L/C">L/C</option><option value="OA">OA</option></SelectInput></div>

          {/* Buyer Section */}
          <div className="col-span-full border-b border-gray-200 pb-2 mb-2 flex justify-between items-center mt-4"><h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${themeClasses.label}`}><Users size={16}/> Buyer/Consignee Info</h3><button onClick={onOpenConsigneeModal} className={`text-xs hover:underline flex items-center gap-1 ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : 'text-blue-600')}`}><Users size={12}/> Select Consignee</button></div>
          <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Full Consignee Name" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} className="col-span-full text-base font-bold placeholder:font-normal"/>
          <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Full Consignee Address" name="buyerAddress" value={header.buyerAddress} onChange={handleHeaderChange} className="col-span-full text-base font-bold placeholder:font-normal"/>
          
          {/* Other Charges - Conditionally Hidden */}
          {!shouldHideOtherCharges && (
            <div className="col-span-full">
                <div className="border-b border-gray-200 pb-2 mb-2 flex justify-between items-center mt-4">
                    <h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${themeClasses.label}`}><BadgeDollarSign size={16}/> Other Charges</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                  {showOceanFreight && (<div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Ocean Freight</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Freight Amount" type="number" name="oceanFreight" value={header.oceanFreight} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" step="0.01"/></div>)}
                  {showInsurance && (<div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Insurance</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Insurance Amount" type="number" name="insurance" value={header.insurance} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" step="0.01"/></div>)}
                </div>
            </div>
          )}

          {/* Bill of Lading Specifics */}
          <div className="col-span-full border-b border-gray-200 pb-2 mb-2 flex justify-between items-center mt-4">
             <h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${themeClasses.label}`}><Ship size={16}/> Shipping & B/L Details</h3>
             <button onClick={() => setShowBLInfo(!showBLInfo)} className={`text-xs hover:underline flex items-center gap-1 ${isCustom ? 'text-[var(--theme-text-secondary)]' : 'text-gray-500'}`}>{showBLInfo ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {showBLInfo ? 'Hide Details' : 'Show Details'}</button>
          </div>
          {showBLInfo && (
            <div className="col-span-full flex flex-col gap-6">
              {/* Row 1: Notify Party & Description of Goods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Notify Party (通知人)</label>
                  <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Full Notify Party Info (Default: SAME AS CONSIGNEE)" name="notifyParty" value={header.notifyParty} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/>
                </div>
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className={`block text-xs font-bold ${themeClasses.label}`}>Description of Goods (货物描述汇总)</label>
                    <button 
                      onClick={handleAiSummarizeCargo}
                      disabled={isSummarizingCargo || items.length === 0}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${isSummarizingCargo ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'}`}
                    >
                      {isSummarizingCargo ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI 汇总
                    </button>
                  </div>
                  <LineInput 
                      themeMode={themeMode} 
                      customTheme={customTheme} 
                      placeholder="例如: 125 CTNS OF TOOLS, ETC." 
                      name="customsMarks" 
                      value={header.customsMarks} 
                      onChange={handleHeaderChange} 
                      className="text-base font-bold placeholder:italic"
                  />
                </div>
              </div>

              {/* Row 2: Vessel, Voyage, Shipped Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Vessel Name (船名)</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="e.g. EVER GIVEN" name="vesselName" value={header.vesselName} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" uppercase/></div>
                <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Voyage No. (航次)</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="e.g. 023E" name="voyageNo" value={header.voyageNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" uppercase/></div>
                <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Shipped on Board Date (开船日期)</label><LineInput themeMode={themeMode} customTheme={customTheme} type="date" name="shippedOnBoardDate" value={header.shippedOnBoardDate} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal"/></div>
              </div>

              {/* Row 3: B/L No, Container No, Seal No */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>B/L Number (提单号)</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Bill of Lading No." name="blNo" value={header.blNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" uppercase/></div>
                <div className="relative">
                  <label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Container No. (箱号)</label>
                  <div className="flex items-center gap-2">
                    <LineInput themeMode={themeMode} customTheme={customTheme} placeholder="e.g. TCLU1234567" name="containerNo" value={header.containerNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" uppercase/>
                    <button 
                      onClick={() => header.containerNo && setShowTracking(true)}
                      disabled={!header.containerNo}
                      className={`shrink-0 p-1.5 rounded-lg border transition-all ${!header.containerNo ? 'opacity-30 cursor-not-allowed' : (isNight ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100')}`}
                      title="追踪集装箱位置"
                    >
                      <MapPin size={16} />
                    </button>
                  </div>
                </div>
                <div><label className={`block text-xs font-bold mb-1 ${themeClasses.label}`}>Seal No. (封号)</label><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="e.g. 987654" name="sealNo" value={header.sealNo} onChange={handleHeaderChange} className="text-base font-bold placeholder:font-normal" uppercase/></div>
              </div>

              {/* Row 4: B/L Settings (Release Type & Freight) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                 <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${themeClasses.label}`}>Release Type (放货方式)</label>
                    <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm">
                       {[
                         { id: 'ORIGINAL', label: '正本 (Original)' },
                         { id: 'TELEX', label: '电放 (Telex)' },
                         { id: 'WAYBILL', label: '海运单 (Waybill)' }
                       ].map(opt => (
                         <button 
                           key={opt.id}
                           onClick={() => setHeader(prev => ({ ...prev, blReleaseType: opt.id as any }))}
                           className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${header.blReleaseType === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${themeClasses.label}`}>Freight Charges (运费支付)</label>
                    <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm">
                       {[
                         { id: 'PREPAID', label: '预付 (Prepaid)' },
                         { id: 'COLLECT', label: '到付 (Collect)' }
                       ].map(opt => (
                         <button 
                           key={opt.id}
                           onClick={() => setHeader(prev => ({ ...prev, freightType: opt.id as any }))}
                           className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${header.freightType === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="col-span-full border-b border-gray-200 pb-2 mb-2 flex justify-between items-center mt-4"><h3 className={`font-bold text-sm uppercase flex items-center gap-2 ${themeClasses.label}`}><NotebookText size={16}/> Remarks</h3><button onClick={addRemarkItem} className={`text-xs hover:underline flex items-center gap-1 ${isCustom ? 'text-[var(--theme-accent)]' : (isVibrant ? 'text-[#0068BA]' : 'text-blue-600')}`}><Plus size={12}/> Add Remark</button></div>
          <div className="col-span-full space-y-2">{(header.remarks || []).map((remark, index) => (<div key={remark.id} className="flex items-center gap-2"><LineInput themeMode={themeMode} customTheme={customTheme} placeholder="Enter Additional Notes Here" value={remark.text} onChange={(e) => handleRemarkChange(index, e.target.value)} className="flex-1 text-base font-bold placeholder:font-normal"/><button onClick={() => removeRemarkItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button></div>))}{(header.remarks || []).length === 0 && <p className={`text-xs ${isCustom ? 'text-[var(--theme-text-secondary)] opacity-70' : (isVibrant ? 'text-[#00A8E9]/70' : (isNight ? 'text-slate-600' : 'text-gray-400'))} italic`}>No remarks added yet.</p>}</div>
        </div>
      </div>
  );
});
