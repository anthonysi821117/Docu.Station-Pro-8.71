
import React, { useEffect, memo } from 'react';
import { HeaderInfo } from '../types';
import { useSettlementCalculations, sNum } from '../hooks/useSettlementCalculations';

interface Props {
  header: HeaderInfo;
  onPageCountChange?: (count: number) => void;
}

// Block Types for Pagination Engine
type BlockType = 'doc-title' | 'business-info' | 'section-header' | 'table-header' | 'row' | 'expense-grid' | 'profit-section' | 'spacer';

interface RenderBlock {
  type: BlockType;
  height: number; 
  content: React.ReactNode;
  data?: any;
}

// Adjusted heights for business style layout
export const H_PAGE = 1000; 
export const H_DOC_TITLE = 110; 
export const H_BIZ_INFO = 100;
export const H_SEC_HEADER = 45; 
export const H_TBL_HEADER = 32;
export const H_ROW = 32; 
export const H_EXPENSE_GRID = 160; 
export const H_PROFIT = 200; // Increased to accommodate remark
export const H_SPACER = 12;

const SectionTitle = ({ title, rightContent, className = "border-l-4 border-slate-900 bg-slate-50" }: { title: React.ReactNode, rightContent?: React.ReactNode, className?: string }) => (
  <div className={`px-3 py-2 flex justify-between items-center ${className} mb-1`}>
    <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
        {title}
    </div>
    <div className="text-slate-900">{rightContent}</div>
  </div>
);

const TableHeader = ({ cols }: { cols: { label: string, width: string, align?: string }[] }) => (
  <div className="flex border-b border-slate-900 text-[9px] font-black text-slate-500 bg-white uppercase tracking-tighter">
    {cols.map((col, idx) => (
      <div key={idx} className={`${col.width} py-2 px-2 ${col.align || 'text-left'}`}>
        {col.label}
      </div>
    ))}
  </div>
);

const Row = ({ cols, isLast = false }: { cols: { content: React.ReactNode, width: string, align?: string, className?: string }[], isLast?: boolean }) => (
  <div className={`flex ${!isLast ? 'border-b border-slate-100' : ''} text-[10px] text-slate-800 items-center h-8`}>
    {cols.map((col, idx) => (
      <div key={idx} className={`${col.width} px-2 truncate ${col.align || 'text-left'} ${col.className || ''}`}>
        {col.content}
      </div>
    ))}
  </div>
);

export const DocSettlement: React.FC<Props> = memo(({ header, onPageCountChange }) => {
  const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { 
    totalFXRevenue, 
    totalPurchaseCost, 
    totalTaxRefund, 
    finalAgencyFee, 
    stampDuty, 
    totalExpenses, 
    grossProfit,
    validFXItems,
    validCostItems,
    calculableExtraExpenses
  } = useSettlementCalculations(header);

  const standardExpenses = [
    { label: `出口代理费 (Rate:${sNum(header.agencyFeeRate)})`, amount: finalAgencyFee },
    { label: '货运杂费/包干费', amount: sNum(header.exLumpSum) },
    { label: '国际海运费 (RMB)', amount: sNum(header.exOceanRMB) },
    { label: '证书/产地证工本费', amount: sNum(header.exCertFee) },
    { label: '国内快递/文件费', amount: sNum(header.exDomesticExpress) },
    { label: '国际快递/邮寄费', amount: sNum(header.exIntlExpress) },
    { label: '货运保险费', amount: sNum(header.exInsuranceRMB) },
    { label: '银行手续费/佣金', amount: sNum(header.exCommissionRMB) },
    { label: '买单/服务费', amount: sNum(header.exBuyingDocs) },
    { label: '印花税 (自动计算)', amount: stampDuty },
  ];
  
  const customExpenses = calculableExtraExpenses;

  const blocks: RenderBlock[] = [];

  // 1. Professional Header
  blocks.push({ 
    type: 'doc-title', 
    height: H_DOC_TITLE, 
    content: (
      <div className="mb-8 flex justify-between items-end border-b-4 border-slate-900 pb-4">
        <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{header.sellerNameCn || "财务结算报表"}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Export Settlement Statement</p>
        </div>
        <div className="text-right">
            <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Settlement</div>
        </div>
      </div>
    )
  });

  // 2. Business Summary Grid
  blocks.push({ 
    type: 'business-info', 
    height: H_BIZ_INFO, 
    content: (
      <div className="mb-8">
         <div className="grid grid-cols-3 gap-6">
            <div className="border-t border-slate-200 pt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issue Date / 结算日期</span>
                <span className="text-sm font-black font-mono">{header.invoiceDate || new Date().toISOString().split('T')[0]}</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reference No. / 单据编号</span>
                <span className="text-sm font-black font-mono">{header.invoiceNo || 'N/A'}</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contract No. / 合同号</span>
                <span className="text-sm font-black font-mono">{header.invoiceNo || 'N/A'}</span>
            </div>
            <div className="col-span-3 border-t border-slate-200 pt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer / 客户名称</span>
                <span className="text-sm font-black truncate block uppercase">{header.buyerName || "VARIOUS CUSTOMERS"}</span>
            </div>
         </div>
      </div>
    )
  });

  // 3. FX Revenue
  if (validFXItems.length > 0) {
    blocks.push({ 
      type: 'section-header', 
      height: H_SEC_HEADER, 
      content: (
        <SectionTitle 
          title="01. 外汇结算收入 (Foreign Exchange Revenue)" 
          rightContent={<span className="text-xs font-black font-mono text-slate-500 underline underline-offset-4">SUB-TOTAL: ¥{fmt(totalFXRevenue)}</span>}
        />
      ) 
    });
    blocks.push({ 
      type: 'table-header', 
      height: H_TBL_HEADER, 
      content: <TableHeader cols={[{label:'No.', width:'w-10 text-center'}, {label:'FX Amount', width:'flex-1 text-right'}, {label:'Op.', width:'w-8 text-center'}, {label:'Rate', width:'flex-1 text-center'}, {label:'Eq.', width:'w-8 text-center'}, {label:'Amount (RMB)', width:'flex-1 text-right'}]} /> 
    });
    validFXItems.forEach((fx, idx) => {
      blocks.push({ 
        type: 'row', 
        height: H_ROW, 
        content: <Row cols={[
          {content: String(idx + 1).padStart(2, '0'), width:'w-10 text-center font-mono opacity-40'},
          {content: fmt(sNum(fx.amount)), width:'flex-1 text-right font-mono font-bold'},
          {content: '×', width:'w-8 text-center text-slate-300'},
          {content: sNum(fx.rate).toFixed(8), width:'flex-1 text-center font-mono text-slate-500'}, // Updated to 8 decimal places
          {content: '=', width:'w-8 text-center text-slate-300'},
          {content: fmt(sNum(fx.amount) * sNum(fx.rate)), width:'flex-1 text-right font-bold font-mono text-slate-900'}
        ]} /> 
      });
    });
    blocks.push({ type: 'spacer', height: H_SPACER, content: <div className="h-3"></div> });
  }

  // 4. Cost & Refund
  if (validCostItems.length > 0) {
    blocks.push({ 
      type: 'section-header', 
      height: H_SEC_HEADER, 
      content: (
        <SectionTitle 
          title="02. 采购成本与退税 (Cost & Tax Refund)" 
          rightContent={<div className="flex gap-4 text-[10px] font-black font-mono opacity-50"><span>COST: ¥{fmt(totalPurchaseCost)}</span><span>REFUND: ¥{fmt(totalTaxRefund)}</span></div>}
        />
      ) 
    });
    blocks.push({ 
      type: 'table-header', 
      height: H_TBL_HEADER, 
      content: <TableHeader cols={[{label:'No.', width:'w-10 text-center'}, {label:'Supplier / 供应商', width:'flex-[2]'}, {label:'Inv. Amt', width:'flex-1 text-right'}, {label:'VAT%', width:'w-12 text-center'}, {label:'Ref%', width:'w-12 text-center'}, {label:'Refund (RMB)', width:'flex-1 text-right'}]} /> 
    });
    validCostItems.forEach((c, idx) => {
      const vatRate = (c.vatRate !== undefined && c.vatRate !== '') ? sNum(c.vatRate) : 13;
      const refundRate = sNum(c.taxRefundRate);
      const estRefund = sNum(c.amount) / (1 + vatRate / 100) * (refundRate / 100);

      blocks.push({ 
        type: 'row', 
        height: H_ROW, 
        content: <Row cols={[
          {content: String(idx + 1).padStart(2, '0'), width:'w-10 text-center font-mono opacity-40'},
          {content: c.supplierName || "UNNAMED", width:'flex-[2] truncate font-bold'},
          {content: fmt(sNum(c.amount)), width:'flex-1 text-right font-mono'},
          {content: `${vatRate}%`, width:'w-12 text-center text-slate-400'},
          {content: `${refundRate}%`, width:'w-12 text-center text-slate-400 font-bold'},
          {content: fmt(estRefund), width:'flex-1 text-right font-bold font-mono text-emerald-700'}
        ]} /> 
      });
    });
    blocks.push({ type: 'spacer', height: H_SPACER, content: <div className="h-3"></div> });
  }

  // 5. Operating Expenses
  blocks.push({ 
    type: 'section-header', 
    height: H_SEC_HEADER, 
    content: (
      <SectionTitle 
        title="03. 业务费用明细 (Operating Expenses)" 
        rightContent={<span className="text-[11px] font-black font-mono">TOTAL: ¥{fmt(totalExpenses)}</span>}
      />
    ) 
  });
  
  const renderExpenseTable = () => {
    const rows = [];
    const allEx = [...standardExpenses];
    if (customExpenses.length > 0) {
        customExpenses.forEach(ce => allEx.push({ label: ce.name || "其他费用", amount: sNum(ce.amount) }));
    }

    for(let i=0; i<allEx.length; i+=2) {
      const left = allEx[i];
      const right = allEx[i+1];
      rows.push(
        <div key={i} className="flex border-b border-slate-100 last:border-0 h-8 items-center">
           <div className="flex-1 flex px-2 border-r border-slate-100 items-center">
              <span className="text-[9px] font-mono text-slate-300 w-6">{String(i+1).padStart(2, '0')}</span>
              <span className="flex-1 text-[10px] font-medium text-slate-600 truncate">{left.label}</span>
              <span className="font-bold font-mono text-[10px] w-24 text-right">¥{fmt(left.amount)}</span>
           </div>
           {right ? (
             <div className="flex-1 flex px-2 items-center">
                <span className="text-[9px] font-mono text-slate-300 w-6">{String(i+2).padStart(2, '0')}</span>
                <span className="flex-1 text-[10px] font-medium text-slate-600 truncate">{right.label}</span>
                <span className="font-bold font-mono text-[10px] w-24 text-right">¥{fmt(right.amount)}</span>
             </div>
           ) : (<div className="flex-1"></div>)}
        </div>
      );
    }
    return <div className="border border-slate-200">{rows}</div>;
  };

  blocks.push({
    type: 'expense-grid',
    height: Math.ceil((standardExpenses.length + customExpenses.length) / 2) * 32 + 20, 
    content: renderExpenseTable()
  });

  blocks.push({ type: 'spacer', height: H_SPACER * 2, content: <div className="h-6"></div> });

  // 6. Financial Summary (Optimized for large numbers and no profit box)
  blocks.push({
    type: 'profit-section',
    height: H_PROFIT,
    content: (
      <div className="border-t-4 border-slate-900 pt-6">
         <div className="space-y-6">
            {/* Analysis Header */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400">
                <span className="border border-slate-900 px-2 py-0.5 tracking-tighter">Analysis</span>
                <span>财务盈亏摘要计算路径</span>
            </div>

            {/* Core Data Row - Full width to allow large numbers */}
            <div className="grid grid-cols-4 gap-4 border-b border-slate-100 pb-6">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">FX Revenue (+)</span>
                    <span className="font-mono text-slate-900 font-black text-base truncate">¥{fmt(totalFXRevenue)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Tax Refund (+)</span>
                    <span className="font-mono text-slate-900 font-black text-base truncate">¥{fmt(totalTaxRefund)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-rose-600 uppercase mb-1">Purchase Cost (-)</span>
                    <span className="font-mono text-rose-600 font-black text-base truncate">¥{fmt(totalPurchaseCost)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-rose-600 uppercase mb-1">Op. Expenses (-)</span>
                    <span className="font-mono text-rose-600 font-black text-base truncate">¥{fmt(totalExpenses)}</span>
                </div>
            </div>
            
            {/* Final Profit Row - Independent line, no box */}
            <div className="flex justify-between items-start pt-2">
                <div className="flex-1 pr-8">
                    {header.settlementRemark && (
                        <div className="mt-2 bg-slate-50 p-3 border-l-2 border-slate-300 rounded-sm">
                           <div className="text-[7px] font-black uppercase text-slate-400 mb-1 tracking-widest">Remarks / 结算备注</div>
                           <p className="text-[9px] font-bold text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">{header.settlementRemark}</p>
                        </div>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Gross Profit / 结算利润</div>
                    <div className={`text-4xl font-black font-mono tracking-tighter ${grossProfit >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                        {grossProfit < 0 ? '-' : ''}¥{fmt(Math.abs(grossProfit))}
                    </div>
                </div>
            </div>
         </div>
      </div>
    )
  });

  // Paging Logic
  const pages: RenderBlock[][] = [];
  let currentPage: RenderBlock[] = [];
  let currentHeight = 0;

  blocks.forEach((block) => {
    if (currentHeight + block.height > H_PAGE) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeight = block.height;
    } else {
      currentPage.push(block);
      currentHeight += block.height;
    }
  });
  if (currentPage.length > 0) pages.push(currentPage);

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [pages.length, onPageCountChange]);

  return (
    <div className="w-[210mm] font-sans leading-tight bg-white text-black no-scrollbar">
      {pages.map((pageBlocks, pageIndex) => (
        <div key={pageIndex} className={`bg-white p-12 w-[210mm] h-[297mm] relative flex flex-col print:mb-0 print-portrait-page ${pageIndex < pages.length - 1 ? 'print-internal-break' : ''}`}>
          {pageBlocks.map((block, bIdx) => (
            <div key={bIdx}>{block.content}</div>
          ))}
          
          <div className="mt-auto pt-8 flex justify-between items-center border-t border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <div>Docu.Station Pro Finance Engine v7.5</div>
            <div className="flex gap-4">
                <span>Ref: {header.invoiceNo || 'Draft'}</span>
                <span>Page {pageIndex + 1} of {pages.length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
