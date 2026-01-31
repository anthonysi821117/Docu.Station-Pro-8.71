
import React, { memo } from 'react';
import { HeaderInfo, ProductItem } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
}

export const DocCertificateOfOrigin: React.FC<Props> = memo(({ header, items }) => {
  const validItems = items.filter(item => item.cnName || item.enName || item.totalPrice);
  
  // Totals Calculation
  const totals = validItems.reduce((acc, item) => {
    acc.pkgs += Number(item.cartonCount) || 0;
    acc.nw += Number(item.netWeight) || 0;
    acc.gw += Number(item.grossWeight) || 0;
    acc.amount += Number(item.totalPrice) || 0;
    return acc;
  }, { pkgs: 0, nw: 0, gw: 0, amount: 0 });

  // Pagination Configuration
  // Reduced to 8 for first page to accommodate header and footer without overflow
  const ITEMS_PAGE_1 = 8; 
  const ITEMS_PAGE_N = 16;

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
    <div className="w-full bg-white text-black">
      {pages.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <div 
            key={pageIndex} 
            className={`
              mx-auto bg-white text-sm relative font-sans text-gray-800 mb-8 overflow-hidden
              w-[297mm] h-[210mm] 
              print:mb-0 
              print:w-[210mm] print:h-[297mm] 
              print-portrait-page 
              ${pageIndex < pages.length - 1 ? 'print-internal-break' : ''}
            `}
          >
            {/* Content Wrapper with Rotation for Print: Forces Landscape content onto Portrait paper by rotating -90deg */}
            <div className="w-[297mm] h-[210mm] p-[8mm] flex flex-col print:origin-top-left print:rotate-[-90deg] print:translate-y-[297mm]">
              
              {/* 1. Page Header (Title) */}
              {isFirstPage && (
                <div className="shrink-0 mb-6">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight uppercase">原产地证申请数据单</h1>
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">CO Application Data Sheet</h2>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Created On</div>
                            <div className="text-sm font-black font-mono">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Left Column: Parties */}
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <div className="mb-4">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">1. Exporter (Seller) Name & Address</div>
                                <div className="text-sm font-bold leading-snug">{header.sellerName}</div>
                                <div className="text-xs text-gray-600 mt-0.5">{header.sellerAddress}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">2. Consignee (Buyer) Name & Address</div>
                                <div className="text-sm font-bold leading-snug">{header.buyerName}</div>
                                <div className="text-xs text-gray-600 mt-0.5">{header.buyerAddress}</div>
                            </div>
                        </div>

                        {/* Right Column: Transport & Invoice */}
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice No.</div>
                                    <div className="text-sm font-black font-mono">{header.invoiceNo}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice Date</div>
                                    <div className="text-sm font-black font-mono">{header.invoiceDate}</div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Transport Route</div>
                                <div className="flex items-baseline gap-2 text-xs font-bold">
                                    <span className="text-gray-500 text-[10px]">FROM</span>
                                    <span>{header.loadingPort}</span>
                                    <span className="text-gray-500 text-[10px]">TO</span>
                                    <span>{header.dischargePort}</span>
                                </div>
                                <div className="text-xs mt-1 text-gray-600">
                                    VIA: {header.transportMethod}
                                </div>
                            </div>
                            <div>
                                 <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Destination Country</div>
                                 <div className="text-xs font-bold uppercase">{header.destinationCountry}</div>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {!isFirstPage && (
                 <div className="mb-4 pb-2 border-b flex justify-between items-end shrink-0">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">CO Application Data Sheet (Continued) - {header.invoiceNo}</span>
                    <span className="text-xs font-bold">Page {pageIndex + 1}</span>
                 </div>
              )}

              {/* 3. Data Grid */}
              <div className="flex-1 overflow-hidden">
                  <table className="w-full text-xs border-collapse table-fixed">
                      <thead>
                          <tr className="bg-slate-900 text-white border-b-2 border-black">
                              <th className="p-2 text-center w-10">No.</th>
                              <th className="p-2 text-left w-48">中文品名 (CN Name)</th>
                              <th className="p-2 text-left w-64">英文品名 (EN Name)</th>
                              <th className="p-2 text-left w-24">HS Code</th>
                              <th className="p-2 text-right w-24">件数 (Pkgs)</th>
                              <th className="p-2 text-right w-24">净重 (N.W.)</th>
                              <th className="p-2 text-right w-24">毛重 (G.W.)</th>
                              <th className="p-2 text-right w-32">金额 ({header.currency})</th>
                          </tr>
                      </thead>
                      <tbody>
                          {pageItems.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-200 h-9">
                                  <td className="p-2 text-center font-bold text-gray-400">
                                      {isFirstPage ? idx + 1 : ITEMS_PAGE_1 + (pageIndex - 1) * ITEMS_PAGE_N + idx + 1}
                                  </td>
                                  <td className="p-2 font-bold truncate">{item.cnName}</td>
                                  <td className="p-2 uppercase truncate font-medium text-[11px]">{item.enName}</td>
                                  <td className="p-2 font-mono">{item.hsCode}</td>
                                  <td className="p-2 text-right font-bold">
                                      {item.cartonCount} <span className="text-[10px] text-gray-500 font-normal">{item.packageType || 'CTNS'}</span>
                                  </td>
                                  <td className="p-2 text-right">{Number(item.netWeight).toFixed(2)}</td>
                                  <td className="p-2 text-right">{Number(item.grossWeight).toFixed(2)}</td>
                                  <td className="p-2 text-right font-mono font-bold">{Number(item.totalPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              </tr>
                          ))}
                      </tbody>
                      
                      {/* Totals Row (Last Page Only) */}
                      {isLastPage && (
                          <tfoot>
                              <tr className="border-t-2 border-black bg-gray-100 font-black">
                                  <td colSpan={4} className="p-3 text-right uppercase tracking-widest text-[10px]">Total</td>
                                  <td className="p-3 text-right">{totals.pkgs}</td>
                                  <td className="p-3 text-right">{totals.nw.toFixed(2)}</td>
                                  <td className="p-3 text-right">{totals.gw.toFixed(2)}</td>
                                  <td className="p-3 text-right text-blue-700">{header.currency} {totals.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              </tr>
                          </tfoot>
                      )}
                  </table>
              </div>

              {/* 4. Footer Info */}
              <div className="mt-auto pt-6 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between italic">
                  <div>
                      Docu.Station Pro - CO Application Helper
                  </div>
                  <div className="font-bold not-italic text-gray-600">
                      Page {pageIndex + 1} of {pages.length}
                  </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
