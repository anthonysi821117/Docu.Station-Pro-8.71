
import React, { memo } from 'react';
import { HeaderInfo, ProductItem, Seller } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  seller?: Seller;
}

export const DocInvoice: React.FC<Props> = memo(({ header, items, seller }) => {
  const validItems = items.filter(item => item.cnName || item.enName || item.totalPrice);
  const totalAmount = validItems.reduce((sum, item) => sum + Math.floor(Number(item.totalPrice || 0)), 0);
  
  const invoiceSealBase64 = seller?.invoiceSealBase64;

  // Unified row counts: 12 for first page, 24 for continuation pages
  const ITEMS_PAGE_1 = 12; 
  const ITEMS_PAGE_N = 24;
  const pages: ProductItem[][] = [];
  
  if (validItems.length === 0) {
    pages.push([]);
  } else {
    pages.push(validItems.slice(0, ITEMS_PAGE_1));
    let remaining = validItems.slice(ITEMS_PAGE_1);
    while (remaining.length > 0) {
        pages.push(remaining.slice(0, ITEMS_PAGE_N));
        remaining = remaining.slice(ITEMS_PAGE_N);
    }
  }

  return (
    <div className="w-[210mm] font-sans leading-tight bg-white text-black">
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const isFirstPage = pageIndex === 0;
        
        return (
          <div key={pageIndex} className={`bg-white p-10 text-sm w-[210mm] h-[297mm] relative flex flex-col print:mb-0 print-portrait-page ${pageIndex < pages.length - 1 ? 'print-internal-break' : ''}`}>
            
            {isFirstPage && (
                <div className="mb-6 flex-shrink-0">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold min-h-[1.5em]">{header.sellerNameCn || "请选择或输入卖方名称"}</h1>
                        <h2 className="text-sm font-bold min-h-[1.2em]">{header.sellerName}</h2>
                        <p className="text-xs text-gray-600 min-h-[1.2em]">{header.sellerAddress}</p>
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-[0.2em] border-b-2 border-black inline-block pb-1">INVOICE</h1>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="w-[55%]">
                            <div className="font-bold text-xs text-gray-500 mb-1">To:</div>
                            <div className="whitespace-pre-line font-medium text-sm leading-snug">{header.buyerName}<br/>{header.buyerAddress}</div>
                        </div>
                        <div className="w-[40%] text-right text-sm">
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left">
                                <div className="font-bold text-right text-gray-600 uppercase">Inv No.:</div>
                                <div className="font-bold">{header.invoiceNo || 'TBD'}</div>
                                <div className="font-bold text-right text-gray-600 uppercase">Date:</div>
                                <div>{header.invoiceDate}</div>
                                <div className="font-bold text-right text-gray-600 uppercase">S/C No.:</div>
                                <div>{header.contractNo}</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-300">
                        <div className="bg-gray-100 grid grid-cols-4 gap-4 px-3 py-1.5 font-bold border-b border-gray-300 text-xs uppercase text-gray-600">
                            <div>From</div>
                            <div>To</div>
                            <div>Incoterms</div>
                            <div className="text-right">Payment</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 px-3 py-2 text-sm font-medium">
                            <div>{header.loadingPort}</div>
                            <div>{header.dischargePort}</div>
                            <div>{header.incoterms}</div>
                            <div className="text-right">{header.paymentMethod}</div>
                        </div>
                    </div>
                </div>
            )}

            {!isFirstPage && (
                 <div className="mb-4 pb-2 border-b flex justify-between items-end flex-shrink-0">
                    <span className="text-xs text-gray-400 font-bold uppercase">Invoice No: {header.invoiceNo} (Continuation)</span>
                 </div>
            )}

            <div className="border-b-2 border-black flex px-2 py-2 font-bold text-xs uppercase bg-gray-50 mt-2 flex-shrink-0">
              <div className="flex-1">Description</div>
              <div className="w-24 text-center">Qty</div>
              <div className="w-32 text-right">Unit Price</div>
              <div className="w-40 text-right">Amount</div>
            </div>

            <div className="mb-2 flex-grow overflow-hidden">
              {pageItems.map((item) => (
                <div key={item.id} className="flex px-2 h-10 items-center border-b border-gray-100 text-sm">
                  <div className="flex-1 pr-2 flex flex-col justify-center">
                    <span className="font-bold text-sm leading-tight text-black">{item.enName}</span>
                    {item.cnName && <span className="text-[10px] text-gray-600 leading-none mt-0.5">{item.cnName}</span>}
                  </div>
                  <div className="w-24 text-center whitespace-nowrap text-xs">{item.quantity} {item.unit}</div>
                  <div className="w-32 text-right font-mono whitespace-nowrap">{header.currency} {Number(item.unitPrice).toFixed(2)}</div>
                  <div className="w-40 text-right font-bold font-mono whitespace-nowrap">{header.currency} {Number(item.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              ))}
            </div>

            {isLastPage && (
              <div className="mt-4 border-t-2 border-black pt-2 flex justify-between items-baseline px-2 flex-shrink-0 mb-20">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-lg font-black font-mono whitespace-nowrap ml-4">{header.currency} {totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}

            {/* Footer Section */}
            <div className="absolute bottom-10 left-10 right-10 z-20 bg-white/95 pt-2">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] text-gray-500 italic">
                     Page {pageIndex + 1} of {pages.length}
                  </div>
                  
                  {/* Authorized Signature: ONLY on Last Page */}
                  {isLastPage && (
                    <div className="text-center relative z-10">
                       <div className="border-b border-black w-48 mb-2"></div>
                       <div className="text-[10px] font-bold uppercase tracking-widest">Authorized Signature</div>
                    </div>
                  )}
                  {/* Placeholder for spacing if not last page */}
                  {!isLastPage && <div className="w-48"></div>}
               </div>
            </div>

            {/* Seal: Every Page - Increased z-index to 30 to sit ABOVE footer background */}
            {invoiceSealBase64 && (
              <img 
                 src={invoiceSealBase64} 
                 alt="Seal" 
                 className="absolute bottom-12 right-12 w-[160px] h-auto opacity-80 pointer-events-none z-30" 
                 style={{ mixBlendMode: 'multiply' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
