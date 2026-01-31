
import React, { memo } from 'react';
import { HeaderInfo, ProductItem, Seller } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  seller?: Seller;
}

export const DocContract: React.FC<Props> = memo(({ header, items, seller }) => {
  const validItems = items.filter(item => item.cnName || item.enName || item.totalPrice);
  const totalAmount = validItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const getContractDate = () => {
    if (!header.invoiceDate) return "";
    const date = new Date(header.invoiceDate);
    date.setDate(date.getDate() - 60);
    return date.toISOString().split('T')[0];
  };

  const invoiceSealBase64 = seller?.invoiceSealBase64;

  // Unified row counts
  const ITEMS_PAGE_1 = 12;      
  const ITEMS_PAGE_N = 24;      
  const TERMS_THRESHOLD_P1 = 8; 
  const TERMS_THRESHOLD_PN = 20;

  // 构建带分页逻辑的页面数组
  const pages: { items: ProductItem[]; showTerms: boolean; pageType: 'first' | 'continuation' }[] = [];

  if (validItems.length === 0) {
    pages.push({ items: [], showTerms: true, pageType: 'first' });
  } else {
    let remaining = [...validItems];

    // 处理第一页
    const firstPageItems = remaining.splice(0, ITEMS_PAGE_1);
    const isFirstPageLast = remaining.length === 0;

    if (isFirstPageLast) {
      if (firstPageItems.length <= TERMS_THRESHOLD_P1) {
        // 第一页既是最后一页，且行数少，可以放下条款
        pages.push({ items: firstPageItems, showTerms: true, pageType: 'first' });
      } else {
        // 第一页放不下条款，拆分成两页
        pages.push({ items: firstPageItems, showTerms: false, pageType: 'first' });
        pages.push({ items: [], showTerms: true, pageType: 'continuation' });
      }
    } else {
      // 还有后续页面
      pages.push({ items: firstPageItems, showTerms: false, pageType: 'first' });

      // 处理后续页面
      while (remaining.length > 0) {
        const chunk = remaining.splice(0, ITEMS_PAGE_N);
        const isCurrentLast = remaining.length === 0;

        if (isCurrentLast) {
          if (chunk.length <= TERMS_THRESHOLD_PN) {
            pages.push({ items: chunk, showTerms: true, pageType: 'continuation' });
          } else {
            // 商品占满全页，条款单独起一页
            pages.push({ items: chunk, showTerms: false, pageType: 'continuation' });
            pages.push({ items: [], showTerms: true, pageType: 'continuation' });
          }
        } else {
          pages.push({ items: chunk, showTerms: false, pageType: 'continuation' });
        }
      }
    }
  }

  return (
    <div className="w-[210mm] font-sans leading-tight bg-white text-black">
      {pages.map((page, pageIndex) => {
        const isFirstPage = page.pageType === 'first';
        const isLastPage = pageIndex === pages.length - 1;
        const { items: pageItems, showTerms } = page;

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
                  <h1 className="text-2xl font-bold tracking-widest border-b-2 border-black inline-block pb-1 uppercase">Sales Contract</h1>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="w-[55%]">
                    <div className="font-bold text-xs text-gray-500 mb-1">To:</div>
                    <div className="whitespace-pre-line font-medium text-sm leading-snug">{header.buyerName}<br />{header.buyerAddress}</div>
                  </div>
                  <div className="w-[40%] text-right text-sm">
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left">
                      <div className="font-bold text-right text-gray-600 uppercase">Inv No.:</div>
                      <div className="font-bold">{header.invoiceNo || 'TBD'}</div>
                      <div className="font-bold text-right text-gray-600 uppercase">Date:</div>
                      <div>{getContractDate()}</div>
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
                <span className="text-xs text-gray-400 font-bold uppercase">Sales Contract No: {header.contractNo} (Continuation)</span>
              </div>
            )}

            {pageItems.length > 0 && (
              <div className="flex-shrink-0">
                <div className="border-b-2 border-black flex px-2 py-2 font-bold text-xs uppercase bg-gray-50 mt-2">
                  <div className="flex-1">Description</div>
                  <div className="w-20 text-center">Qty</div>
                  <div className="w-32 text-right">Unit Price</div>
                  <div className="w-48 text-right">Amount</div>
                </div>

                <div className="mb-2">
                  {pageItems.map((item) => (
                    <div key={item.id} className="flex px-2 h-10 items-center border-b border-gray-100 text-sm">
                      <div className="flex-1 pr-2 flex flex-col justify-center">
                        <span className="font-bold text-sm leading-tight text-black">{item.enName}</span>
                        {item.cnName && <span className="text-[10px] text-gray-600 leading-none mt-0.5">{item.cnName}</span>}
                      </div>
                      <div className="w-20 text-center whitespace-nowrap text-xs">{item.quantity} {item.unit}</div>
                      <div className="w-32 text-right font-mono whitespace-nowrap">{header.currency} {Number(item.unitPrice).toFixed(2)}</div>
                      <div className="w-48 text-right font-bold font-mono whitespace-nowrap">{header.currency} {Number(item.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showTerms && (
              <div className="mt-4 flex-1 mb-20">
                <div className="border-t-2 border-black pt-2 px-2 flex justify-between items-end font-bold text-lg mb-4">
                  <div>TOTAL</div>
                  <div className="whitespace-nowrap ml-4">{header.currency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>

                <div className="text-[10px] leading-[1.4] text-justify text-gray-700 space-y-1 mb-6 border-t pt-2">
                  <p><strong>(5) Quality & Inspection:</strong> The quality shall be in conformity with the standards of the manufacturer. Any quality discrepancy should be filed within 30 days after the goods arrive at the port of destination.</p>
                  <p><strong>(6) Time of Shipment:</strong> Shipment shall be effected within the agreed period as specified in the commercial invoice after receipt of the advance payment or operative L/C.</p>
                  <p><strong>(7) Terms of Payment:</strong> Payment shall be made by T/T remittance or L/C as agreed. All banking charges outside the Seller's country are for the Buyer's account.</p>
                  <p><strong>(8) Insurance:</strong> Risk and insurance coverage shall be determined based on the Incoterms specified in this contract. For CIF/CIP, insurance covers All Risks as per standard clauses.</p>
                  <p><strong>(9) Force Majeure:</strong> Neither party shall be held responsible for failure or delay to perform all or any part of this contract due to events beyond reasonable control (e.g., natural disasters, war, etc.).</p>
                  <p><strong>(10) Arbitration:</strong> All disputes arising from this contract shall be settled through friendly negotiation. If no settlement is reached, cases shall be submitted to CIETAC for final arbitration.</p>
                </div>
              </div>
            )}

            {!showTerms && !isFirstPage && (
               <div className="flex-1 italic text-gray-400 text-xs mt-4">Continued on next page...</div>
            )}

            {/* Footer Section */}
            <div className="absolute bottom-10 left-10 right-10 z-20 bg-white/95 pt-2">
                <div className="flex justify-between items-end">
                    <div className="text-[10px] text-gray-400">
                       Page {pageIndex + 1} of {pages.length}
                    </div>
                    {/* Signature Line: LAST PAGE ONLY */}
                    {isLastPage && (
                        <div className="text-center relative z-10">
                           <div className="border-b border-black w-48 mb-2"></div>
                           <div className="text-xs font-bold uppercase">Authorized Signature</div>
                        </div>
                    )}
                    {/* Placeholder for alignment if not last page */}
                    {!isLastPage && <div className="w-48"></div>}
                </div>
            </div>

            {/* Seal: EVERY PAGE - Increased z-index to 30 */}
            {invoiceSealBase64 && (
                 <img
                    src={invoiceSealBase64}
                    alt="Seal"
                    className="absolute bottom-12 right-12 w-[180px] h-auto opacity-70 pointer-events-none z-30"
                    style={{ mixBlendMode: 'multiply' }}
                 />
            )}
          </div>
        );
      })}
    </div>
  );
});
