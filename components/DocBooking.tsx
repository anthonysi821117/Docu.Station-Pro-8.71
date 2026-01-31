
import React, { memo } from 'react';
import { HeaderInfo, ProductItem } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
}

export const DocBooking: React.FC<Props> = memo(({ header, items }) => {
  // Calculations
  const totalPkgs = items.reduce((sum, item) => sum + (Number(item.cartonCount) || 0), 0);
  const totalGw = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalVol = items.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
  
  // Unique package unit
  const uniquePkgTypes = new Set(items.map(i => (i.packageType || "CTNS").toUpperCase().trim()));
  let pkgUnit = "CTNS";
  if (uniquePkgTypes.size === 1) pkgUnit = uniquePkgTypes.values().next().value;
  else if (uniquePkgTypes.size > 1) pkgUnit = "PKGS";

  // Descriptions
  const descriptions = Array.from(new Set(items.map(i => i.enName).filter(Boolean))).join(', ');
  const marks = header.customsMarks || "N/M";

  const currentDate = new Date().toISOString().split('T')[0];

  // Helper for labeled box
  const Box = ({ title, content, className = "", contentClass = "" }: { title: string, content?: React.ReactNode, className?: string, contentClass?: string }) => (
    <div className={`border-r border-b border-black p-1.5 flex flex-col ${className}`}>
        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{title}</div>
        <div className={`text-xs font-bold font-mono uppercase leading-snug whitespace-pre-wrap ${contentClass}`}>{content}</div>
    </div>
  );

  // 获取第一条有效备注
  const firstRemark = header.remarks && header.remarks.length > 0 ? header.remarks[0].text : "";

  return (
    <div className="w-[210mm] h-[297mm] bg-white text-black font-sans p-8 print-portrait-page box-border relative flex flex-col">
      
      {/* 1. Header Area */}
      <div className="flex justify-between items-start mb-4">
         <div>
            <div className="text-3xl font-black tracking-tight uppercase">Booking Note</div>
            <div className="text-sm font-bold text-gray-500 tracking-[0.2em] uppercase">Export Cargo Booking Request</div>
         </div>
         <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase">Invoice No.</div>
            <div className="text-xl font-black font-mono">{header.invoiceNo}</div>
            <div className="text-[10px] font-bold mt-1 text-gray-400">DATE: {currentDate}</div>
         </div>
      </div>

      {/* 2. Main Grid Container */}
      <div className="border-2 border-black flex-1 flex flex-col">
         
         {/* Top Section: Parties */}
         <div className="flex border-b border-black h-32">
            <div className="w-1/2 border-r border-black p-2 flex flex-col">
               <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Shipper (Exporter)</div>
               <div className="text-xs font-bold uppercase leading-relaxed">
                  <div>{header.sellerName}</div>
                  <div className="font-normal text-[11px] text-gray-700 mt-1">{header.sellerAddress}</div>
               </div>
            </div>
            <div className="w-1/2 flex flex-col">
               <div className="h-16 border-b border-black p-2 bg-gray-50">
                  <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Booking Agent</div>
                  <div className="text-xs font-bold italic opacity-40">CARRIER / FORWARDER AGENT</div>
               </div>
               <div className="h-16 p-2 bg-gray-50">
                   <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Local Contact / Forwarder</div>
                   <div className="text-xs font-bold">{header.sellerNameCn}</div>
               </div>
            </div>
         </div>

         <div className="flex border-b border-black h-24">
             <div className="w-1/2 border-r border-black p-2">
               <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Consignee</div>
               <div className="text-xs font-bold uppercase leading-relaxed">
                  <div>{header.buyerName}</div>
                  <div className="font-normal text-[11px] text-gray-700 mt-1">{header.buyerAddress}</div>
               </div>
             </div>
             <div className="w-1/2 p-2">
               <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Notify Party</div>
               <div className="text-xs font-bold uppercase leading-snug whitespace-pre-wrap">
                  {header.notifyParty || <span className="italic text-gray-400">SAME AS CONSIGNEE</span>}
               </div>
             </div>
         </div>

         {/* Transport Section */}
         <div className="flex border-b border-black h-16">
            <Box title="Pre-Carriage By" className="w-1/4" />
            <Box title="Place of Receipt" className="w-1/4" />
            <Box title="Port of Loading" content={header.loadingPort} className="w-1/4" />
            <Box title="Port of Discharge" content={header.dischargePort} className="w-1/4 border-r-0" />
         </div>

         {/* Cargo Particulars Header */}
         <div className="flex border-b border-black bg-gray-100 text-[9px] font-black uppercase text-center tracking-wider">
            <div className="w-[20%] py-1.5 border-r border-black">Marks & Nos</div>
            <div className="w-[15%] py-1.5 border-r border-black">Quantity</div>
            <div className="w-[45%] py-1.5 border-r border-black">Description of Goods</div>
            <div className="w-[10%] py-1.5 border-r border-black">Gross Wt.</div>
            <div className="w-[10%] py-1.5">Measurement</div>
         </div>

         {/* Cargo Particulars Content */}
         <div className="flex flex-1 border-b border-black relative min-h-[300px]">
             {/* Vertical Lines */}
             <div className="absolute top-0 bottom-0 left-[20%] w-px bg-black"></div>
             <div className="absolute top-0 bottom-0 left-[35%] w-px bg-black"></div>
             <div className="absolute top-0 bottom-0 left-[80%] w-px bg-black"></div>
             <div className="absolute top-0 bottom-0 left-[90%] w-px bg-black"></div>

             <div className="w-[20%] p-3 text-xs font-mono whitespace-pre-wrap break-words text-center">N/M</div>
             <div className="w-[15%] p-3 text-sm font-bold text-center">{totalPkgs} {pkgUnit}</div>
             <div className="w-[45%] p-3 text-sm font-bold uppercase">
                {/* 优先显示 Description of Goods 汇总信息 */}
                {header.customsMarks && (
                   <div className="mb-4 pb-2 border-b border-black/20 text-[11px] font-black leading-tight">
                      {header.customsMarks}
                   </div>
                )}
                
                {/* 然后显示具体品名列表 */}
                <div className="leading-snug">
                   {descriptions}
                </div>
                
                <div className="mt-4 text-xs font-normal text-gray-500">
                   HS CODE(S): {Array.from(new Set(items.map(i => i.hsCode).filter(Boolean))).join(', ')}
                </div>
             </div>
             <div className="w-[10%] p-3 text-sm font-bold text-center">{totalGw.toFixed(2)} KGS</div>
             <div className="w-[10%] p-3 text-sm font-bold text-center">{totalVol.toFixed(3)} CBM</div>
         </div>

         {/* Total Summary Row */}
         <div className="flex border-b border-black h-10 bg-gray-50 items-center">
             <div className="w-[35%] border-r border-black h-full flex items-center justify-center text-xs font-black uppercase">Total</div>
             <div className="w-[45%] border-r border-black h-full flex items-center px-2 text-xs font-bold uppercase italic text-gray-500">
                SAY TOTAL {totalPkgs} {pkgUnit} ONLY.
             </div>
             <div className="w-[10%] border-r border-black h-full flex items-center justify-center text-xs font-bold">{totalGw.toFixed(2)} KGS</div>
             <div className="w-[10%] h-full flex items-center justify-center text-xs font-bold">{totalVol.toFixed(3)} CBM</div>
         </div>

         {/* Bottom Details */}
         <div className="flex h-20 border-b border-black">
             <Box title="Freight Charges" content={header.freightType === 'PREPAID' ? 'FREIGHT PREPAID' : 'FREIGHT COLLECT'} className="w-1/4" contentClass="text-lg" />
             <Box title="Bill of Lading Type" content={header.blReleaseType || 'TELEX RELEASE'} className="w-1/4" />
             <Box title="Cargo Ready Date" content={header.exportDate} className="w-1/4" />
             <Box title="Container Type" content="STANDARD" className="w-1/4 border-r-0" />
         </div>

         {/* Remarks Section - 限制仅显示第一条 */}
         <div className="p-3 bg-white">
             <div className="text-[9px] font-bold text-gray-500 uppercase mb-2">Special Instructions / Remarks</div>
             <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {firstRemark ? (
                   <span>{firstRemark}</span>
                ) : (
                  <div className="italic opacity-30 uppercase tracking-widest text-[10px]">No special instructions</div>
                )}
             </div>
         </div>
      </div>

      {/* Footer Signatures */}
      <div className="mt-4 flex justify-between items-end px-2 shrink-0">
          <div className="text-[10px] text-gray-400 font-mono">
             GENERATED BY DOCU.STATION PRO v8.5
          </div>
          <div className="text-center">
             <div className="border-b border-black w-48 mb-1"></div>
             <div className="text-[10px] font-bold uppercase tracking-widest">Authorized Signature & Stamp</div>
          </div>
      </div>

    </div>
  );
});
