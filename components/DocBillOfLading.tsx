
import React, { memo } from 'react';
import { HeaderInfo, ProductItem } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
}

export const DocBillOfLading: React.FC<Props> = memo(({ header, items }) => {
  // Calculations
  const totalPkgs = items.reduce((sum, item) => sum + (Number(item.cartonCount) || 0), 0);
  const totalGw = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalVol = items.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
  
  const uniquePkgTypes = new Set(items.map(i => (i.packageType || "CTNS").toUpperCase().trim()));
  let pkgUnit = "CTNS";
  if (uniquePkgTypes.size === 1) pkgUnit = uniquePkgTypes.values().next().value;
  else if (uniquePkgTypes.size > 1) pkgUnit = "PKGS";

  const marks = "N/M"; // Fixed for B/L usually
  const blNo = header.blNo || header.invoiceNo || "TBD";

  // Change 1: Use EN names from items to match English Customs descriptions
  const customsProductNames = Array.from(new Set(items.map(i => i.enName).filter(Boolean))).join(', ');

  // New Fields Integration
  const notifyParty = header.notifyParty || "SAME AS CONSIGNEE";
  const containerInfo = (header.containerNo || header.sealNo) 
    ? `${header.containerNo || 'TBD'} / ${header.sealNo || 'TBD'}`
    : "";

  const freightText = header.freightType === 'COLLECT' ? 'FREIGHT COLLECT' : 'FREIGHT PREPAID';
  const releaseType = header.blReleaseType || 'TELEX';

  // Boilerplate text from template
  const clauseText = "Received in apparent good order condition except as otherwise noted the total number of Containers or other packages or units enumerated below by the Merchant to comprise the Goods specified below for transportation from the place of Receipt or the Port of Loading, whichever is applicable, to the Place of Delivery or the Port of Discharge, whichever is applicable, subjected to the terms hereof, (including the terms of the reverse hereof and the terms of the Carrier's applicable Tariff)...";

  return (
    <div className="w-[210mm] h-[297mm] bg-white text-black font-sans p-[8mm] print-portrait-page box-border relative flex flex-col text-[9px] leading-tight">
      
      {/* 1. Header Grid */}
      <div className="grid grid-cols-2 border-t border-l border-black">
        {/* Left Column */}
        <div className="flex flex-col">
          <div className="h-24 border-b border-r border-black p-1.5">
            <div className="uppercase font-bold mb-1 text-[7px]">Shipper Name & Address</div>
            <div className="font-bold uppercase text-[8.5px] leading-snug">
               {header.sellerName}<br/>
               {header.sellerAddress}
            </div>
          </div>
          <div className="h-24 border-b border-r border-black p-1.5">
            <div className="uppercase font-bold mb-1 text-[7px]">Consignee (If "Order" State Notify Party)</div>
            <div className="font-bold uppercase text-[8.5px] leading-snug">
               {header.buyerName}<br/>
               {header.buyerAddress}
            </div>
          </div>
          <div className="h-24 border-b border-r border-black p-1.5">
            <div className="uppercase font-bold mb-1 text-[7px]">Notify Party/Address - See Clause 18</div>
            <div className="font-bold uppercase text-[8.5px] leading-snug">
               {notifyParty}
            </div>
          </div>
        </div>

        {/* Right Column (Neutralized Title Area) */}
        <div className="flex flex-col">
          <div className="h-32 border-b border-r border-black flex items-center justify-center relative p-2">
             <div className="text-center font-bold">
                <div className="text-2xl tracking-[0.3em] font-black uppercase">Carrier</div>
                <div className="text-[7px] tracking-widest mt-1 opacity-50 italic">International Shipping Lines</div>
             </div>
          </div>
          <div className="h-40 border-b border-r border-black p-2 flex flex-col items-center justify-center text-center">
             <div className="uppercase font-black text-sm mb-1">{releaseType === 'WAYBILL' ? 'Sea Waybill' : 'Bill of Lading'}</div>
             <div className="uppercase font-medium text-[8px] mb-4">Multimodal Transport or Port to Port Shipment</div>
             
             <div className="border border-black w-48 py-2 px-4 relative">
                <div className="absolute -top-1.5 left-2 bg-white px-1 text-[7px] font-bold uppercase">Booking NO.</div>
                <div className="text-sm font-black font-mono tracking-wider">{blNo}</div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Grid (Transport Info) */}
      <div className="grid grid-cols-2 border-l border-black">
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Vessel</div>
            <div className="text-[10px] font-bold uppercase">{header.vesselName || "TBD"}</div>
         </div>
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Voyage No.</div>
            <div className="text-[10px] font-bold uppercase">{header.voyageNo || "TBD"}</div>
         </div>
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Port of Loading</div>
            <div className="text-[10px] font-bold uppercase">{header.loadingPort}</div>
         </div>
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Port of Discharge</div>
            <div className="text-[10px] font-bold uppercase">{header.dischargePort}</div>
         </div>
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Place of Receipt</div>
            <div className="text-[9px] font-bold uppercase">{header.placeOfReceipt || header.loadingPort}</div>
         </div>
         <div className="border-b border-r border-black h-12 p-1.5">
            <div className="uppercase text-[7px] font-bold">Place of Delivery</div>
            <div className="text-[9px] font-bold uppercase">{header.placeOfDelivery || header.dischargePort}</div>
         </div>
      </div>

      {/* 3. Clause Text */}
      <div className="border-l border-r border-black p-2 text-justify leading-tight text-[6px] text-gray-700">
         {clauseText}
      </div>

      {/* 4. Cargo Grid Table */}
      <div className="border-t border-l border-r border-black flex-1 flex flex-col">
         {/* Table Header */}
         <div className="flex border-b border-black text-center font-bold text-[7px] bg-gray-50 h-8 items-center uppercase">
            <div className="w-[10%] border-r border-black h-full flex flex-col justify-center">Item No.</div>
            <div className="w-[30%] border-r border-black h-full flex flex-col justify-center">Container No./Seal No.<br/>Marks & Numbers</div>
            <div className="w-[10%] border-r border-black h-full flex flex-col justify-center">No. of Packages</div>
            <div className="w-[30%] border-r border-black h-full flex flex-col justify-center">Description of Goods<br/>Said To Contain</div>
            <div className="w-[10%] border-r border-black h-full flex flex-col justify-center">Gross Cargo<br/>Weight (Kilos)</div>
            <div className="w-[10%] h-full flex flex-col justify-center">Measurement<br/>(Cu. Metres)</div>
         </div>

         {/* Table Body */}
         <div className="flex-1 flex border-b border-black relative">
            {/* Vertical Lines */}
            <div className="absolute top-0 bottom-0 left-[10%] w-[0.5px] bg-black"></div>
            <div className="absolute top-0 bottom-0 left-[40%] w-[0.5px] bg-black"></div>
            <div className="absolute top-0 bottom-0 left-[50%] w-[0.5px] bg-black"></div>
            <div className="absolute top-0 bottom-0 left-[80%] w-[0.5px] bg-black"></div>
            <div className="absolute top-0 bottom-0 left-[90%] w-[0.5px] bg-black"></div>

            <div className="w-full flex flex-col">
               <div className="flex min-h-[400px]">
                  <div className="w-[10%] p-2 text-center font-bold">1</div>
                  <div className="w-[30%] p-2 text-center uppercase whitespace-pre-wrap font-mono">
                     {containerInfo && <div className="font-black mb-2 border-b border-black pb-1">{containerInfo}</div>}
                     {marks}
                  </div>
                  <div className="w-[10%] p-2 text-center font-bold">{totalPkgs} {pkgUnit}</div>
                  <div className="w-[30%] p-2 uppercase leading-snug">
                     <div className="font-bold mb-4">SAID TO CONTAIN:</div>
                     {/* Manually entered Description of Goods summary */}
                     {header.customsMarks && (
                        <div className="font-black text-[10px] mb-2 border-b border-black/10 pb-1">
                           {header.customsMarks}
                        </div>
                     )}
                     {/* Automatically derived product list */}
                     <div className="font-black text-[10px] mb-4">
                        {customsProductNames || "VARIOUS GENERAL CARGOES"}
                     </div>
                  </div>
                  <div className="w-[10%] p-2 text-center font-bold">{totalGw.toFixed(2)}</div>
                  <div className="w-[10%] p-2 text-center font-bold">{totalVol.toFixed(3)}</div>
               </div>
               
               <div className="mt-auto border-t border-black p-2 font-bold uppercase text-[8px] bg-gray-50 flex justify-between">
                  <span>Above particulars as declared by shipper</span>
                  <span className="text-red-600 font-black tracking-widest">{freightText}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 5. Footer Summary Grid */}
      <div className="border-l border-r border-black grid grid-cols-[1fr_1.5fr]">
         <div className="flex flex-col divide-y divide-black border-r border-black">
            <div className="h-8 p-1 flex justify-between items-center px-4">
               <span className="uppercase text-[7px] font-bold">Total No. of Pkgs/Cntrs</span>
               <span className="font-black text-[10px]">{totalPkgs} {pkgUnit} / CNTR</span>
            </div>
            <div className="h-8 p-1 flex items-center px-4">
               <span className="uppercase text-[7px] font-bold">Shipped on Board Date</span>
               <span className="font-black text-[10px] ml-4">{header.shippedOnBoardDate || ""}</span>
            </div>
            {/* Updated: Place and Date on two separate lines */}
            <div className="h-10 p-1 flex flex-col justify-center px-4">
               <span className="uppercase text-[7px] font-bold">Place & Date of Issue</span>
               <div className="font-black text-[9px] uppercase leading-none mt-1">{header.loadingPort}</div>
               <div className="font-black text-[9px] uppercase leading-none mt-1">{header.invoiceDate}</div>
            </div>
            <div className="h-16 p-2 text-[7px] leading-tight">
               <div className="mb-1">In witness of the contract herein contained</div>
               <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-black underline">{releaseType === 'ORIGINAL' ? '3' : 'ZERO'}</span>
                  <span className="uppercase font-bold">
                    {releaseType === 'ORIGINAL' 
                        ? 'originals have been issued one of which being accomplished the other(s) to be void.'
                        : 'ORIGINAL(S) TO BE ISSUED. GOODS TO BE RELEASED UPON SURRENDER OF TELEX ADVICE.'}
                  </span>
               </div>
            </div>
         </div>

         {/* Carrier Signature Area */}
         <div className="p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <span className="text-lg font-black uppercase tracking-tighter">Carrier</span>
               <span className="text-[8px] font-bold">AS AGENT FOR THE CARRIER</span>
            </div>
            
            <div className="text-center mt-4">
               <div className="text-[8px] font-black uppercase mb-1">SIGNED FOR AND ON BEHALF OF THE CARRIER</div>
               <div className="flex items-center gap-2 justify-center">
                  <span className="text-lg font-black">By</span>
                  <div className="border-b border-dotted border-black flex-1 max-w-[200px] h-6"></div>
               </div>
               <div className="flex justify-between items-end mt-2 text-[7px] font-bold">
                  <span className="uppercase">{header.loadingPort}</span>
                  <span className="uppercase">Authorized Signature</span>
               </div>
            </div>
         </div>
      </div>

      <div className="border border-black p-1 text-[6px] uppercase font-bold text-gray-400 mt-2 flex justify-between">
         <span>Docu.Station Pro v8.0 System Generation</span>
         <span>Type: {releaseType}</span>
      </div>
    </div>
  );
});
