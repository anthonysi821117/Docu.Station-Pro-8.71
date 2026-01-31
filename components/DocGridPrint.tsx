
import React, { memo } from 'react';
import { HeaderInfo, ProductItem } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
}

export const DocGridPrint: React.FC<Props> = memo(({ header, items }) => {
  const validItems = items.filter(item => item.cnName || item.enName || item.hsCode);
  
  // 统计逻辑（全局合计）
  const totals = validItems.reduce((acc, item) => {
    acc.qty += Number(item.quantity) || 0;
    acc.totalRmb += Math.floor(Number(item.purchaseTotalPriceRMB) || 0);
    acc.totalPrice += Math.floor(Number(item.totalPrice) || 0);
    acc.pkgs += Number(item.cartonCount) || 0;
    acc.gw += Number(item.grossWeight) || 0;
    acc.nw += Number(item.netWeight) || 0;
    acc.vol += Number(item.volume) || 0;
    return acc;
  }, { qty: 0, totalRmb: 0, totalPrice: 0, pkgs: 0, gw: 0, nw: 0, vol: 0 });

  // 分页配置 - Adjusted for taller rows (h-10 / 40px)
  const ITEMS_PAGE_1 = 12; 
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
    <div className="w-full bg-white text-black text-xs">
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
            <div className="w-[297mm] h-[210mm] p-8 flex flex-col print:origin-top-left print:rotate-[-90deg] print:translate-y-[297mm]">
              
              {/* 1. 标题区域 - 仅限首页 */}
              {isFirstPage && (
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4 shrink-0">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{header.sellerNameCn || "DATA REPORT"}</h1>
                    <p className="text-sm text-gray-500 font-bold">COMMODITY DATA SHEET - {header.invoiceNo || 'DRAFT'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">Generation Date</p>
                    <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* 2. 汇总卡片 - 仅限首页 */}
              {isFirstPage && (
                <div className="grid grid-cols-4 gap-4 mb-4 text-xs shrink-0">
                  <div className="bg-gray-50 p-2 border rounded">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Invoice No.</span>
                    <span className="font-black text-sm">{header.invoiceNo || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-2 border rounded">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Currency</span>
                    <span className="font-black text-sm">{header.currency}</span>
                  </div>
                  <div className="bg-gray-50 p-2 border rounded">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Incoterms</span>
                    <span className="font-black text-sm">{header.incoterms}</span>
                  </div>
                  <div className="bg-gray-50 p-2 border rounded">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">RMB Calculation</span>
                    <span className={`font-black text-sm ${header.isRmbCalculation ? 'text-blue-600' : 'text-gray-400'}`}>
                      {header.isRmbCalculation ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              )}

              {/* 非首页显示的页码指示 */}
              {!isFirstPage && (
                <div className="mb-4 pb-2 border-b flex justify-between items-end shrink-0">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {header.invoiceNo} - Commodity Data Sheet (Continued)
                  </span>
                  <span className="text-xs font-bold">Page {pageIndex + 1}</span>
                </div>
              )}

              {/* 3. 数据表格 */}
              <div className="flex-1 overflow-hidden">
                <table className="w-full text-[10px] border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b-2 border-black">
                      <th className="p-2 text-center w-8">#</th>
                      <th className="p-2 text-left w-24">HS CODE</th>
                      <th className="p-2 text-left">PRODUCT NAME (CN/EN)</th>
                      <th className="p-2 text-right w-16">QTY</th>
                      <th className="p-2 text-center w-12">UNIT</th>
                      <th className="p-2 text-right w-24">RMB TOTAL</th>
                      <th className="p-2 text-right w-24">{header.currency} TOTAL</th>
                      <th className="p-2 text-right w-16">PKGS</th>
                      <th className="p-2 text-right w-20">G.W.</th>
                      <th className="p-2 text-right w-20">N.W.</th>
                      <th className="p-2 text-right w-20">VOL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 h-10">
                        <td className="p-1 text-center font-bold text-gray-400">
                          {isFirstPage ? idx + 1 : ITEMS_PAGE_1 + (pageIndex - 1) * ITEMS_PAGE_N + idx + 1}
                        </td>
                        <td className="p-1 font-mono font-bold">{item.hsCode}</td>
                        <td className="p-1 truncate">
                          <span className="font-bold">{item.cnName}</span>
                          <span className="mx-1 text-gray-400">/</span>
                          <span className="text-[9px] text-gray-500 uppercase">{item.enName}</span>
                        </td>
                        <td className="p-1 text-right font-bold">{item.quantity}</td>
                        <td className="p-1 text-center uppercase">{item.unit}</td>
                        <td className="p-1 text-right font-mono">
                          {item.purchaseTotalPriceRMB ? Number(item.purchaseTotalPriceRMB).toLocaleString() : '-'}
                        </td>
                        <td className="p-1 text-right font-mono font-bold">
                          {item.totalPrice ? Number(item.totalPrice).toLocaleString() : '-'}
                        </td>
                        <td className="p-1 text-right">{item.cartonCount}</td>
                        <td className="p-1 text-right">{Number(item.grossWeight || 0).toFixed(2)}</td>
                        <td className="p-1 text-right">{Number(item.netWeight || 0).toFixed(2)}</td>
                        <td className="p-1 text-right">{Number(item.volume || 0).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>

                  {/* 4. 合计行 - 仅限末页 */}
                  {isLastPage && (
                    <tfoot>
                      <tr className="bg-gray-100 font-black border-t-2 border-black">
                        <td colSpan={3} className="p-2 text-right text-xs uppercase tracking-widest">TOTALS</td>
                        <td className="p-2 text-right">{totals.qty.toLocaleString()}</td>
                        <td></td>
                        <td className="p-2 text-right font-mono">¥ {totals.totalRmb.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-blue-700">{header.currency} {totals.totalPrice.toLocaleString()}</td>
                        <td className="p-2 text-right">{totals.pkgs}</td>
                        <td className="p-2 text-right">{totals.gw.toFixed(2)}</td>
                        <td className="p-2 text-right">{totals.nw.toFixed(2)}</td>
                        <td className="p-2 text-right">{totals.vol.toFixed(3)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* 5. Footer Info */}
              <div className="mt-auto pt-6 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between italic">
                  <div>
                      Docu.Station Pro - Grid Data Report
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
