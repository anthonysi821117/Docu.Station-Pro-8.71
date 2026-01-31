
import React, { useEffect, memo } from 'react';
import { HeaderInfo, ProductItem, Seller } from '../types';

interface Props {
  header: HeaderInfo;
  items: ProductItem[];
  onPageCountChange?: (count: number) => void;
  seller?: Seller;
}

// Darker border color for better print visibility
const BORDER_COLOR = "border-pink-500";

interface CellProps {
  label?: string;
  value?: string | number;
  className?: string;
  colSpan?: number;
  minHeight?: string;
}

const Cell: React.FC<CellProps> = ({ label, value, className = "", colSpan = 1, minHeight = "h-8" }) => (
  <div className={`border-r border-b ${BORDER_COLOR} px-1.5 flex flex-col justify-center relative ${minHeight} ${className}`} style={{ gridColumn: `span ${colSpan}` }}>
    {label && <span className="text-[7px] text-gray-500 scale-90 origin-top-left absolute top-[1px] left-[1.5px] leading-none font-medium">{label}</span>}
    <span className={`text-[10px] ${label ? 'mt-2' : ''} leading-tight overflow-hidden text-ellipsis ${className.includes('whitespace-normal') ? '' : 'whitespace-nowrap'}`}>{value}</span>
  </div>
);

const ListHeader: React.FC = () => (
  <div className={`col-span-full border-b border-r ${BORDER_COLOR} bg-pink-50/50 text-[9px] font-bold grid grid-cols-[repeat(24,minmax(0,1fr))] text-center py-1.5 print:bg-transparent shrink-0`}>
      <div className="col-span-1">项号</div>
      <div className="col-span-2">商品编号</div>
      <div className="" style={{ gridColumn: 'span 11' }}>商品名称及规格型号</div>
      <div className="col-span-2">数量及单位</div>
      <div className="col-span-3">单价/总价/币制</div>
      <div className="col-span-3">原产国(地区)</div>
      <div className="col-span-2">境内货源地</div>
  </div>
);

// Increased height to allow 1 line name + 2 lines elements comfortably
const ROW_HEIGHT_CLASS = "h-[54px]"; 

interface ListItemProps {
  item: ProductItem;
  index: number;
  pageStartIndex: number;
  currency: string;
}

const ListItem: React.FC<ListItemProps> = ({ item, index, pageStartIndex, currency }) => (
  <React.Fragment>
      <div className={`col-span-1 border-r border-b ${BORDER_COLOR} p-1 text-center text-[9px] ${ROW_HEIGHT_CLASS} flex items-center justify-center shrink-0`}>
      {pageStartIndex + index + 1}
      </div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} p-1 text-center text-[9px] flex items-center justify-center font-mono break-all ${ROW_HEIGHT_CLASS} shrink-0`}>
      {item.hsCode}
      </div>
      <div className={`border-r border-b ${BORDER_COLOR} p-1 text-[9px] flex flex-col justify-start text-left ${ROW_HEIGHT_CLASS} shrink-0 overflow-hidden`} style={{ gridColumn: 'span 11' }}>
        <div className="font-bold leading-tight truncate w-full h-[16px] mb-0.5 text-black uppercase text-[10px]">
            {item.cnName}
        </div>
        <div className="text-[9px] text-gray-700 leading-[1.25] border-t border-gray-300 pt-1 whitespace-pre-wrap break-all overflow-hidden flex-1 print:text-black">
             {item.declarationElements || '1|1|无品牌|无型号'}
        </div>
      </div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} p-1 text-center text-[9px] flex flex-col justify-center leading-tight ${ROW_HEIGHT_CLASS} shrink-0`}>
      <div className="font-bold">{item.quantity} {item.unit}</div>
      <div className="text-gray-400 mt-0.5 scale-90">({Number(item.netWeight).toFixed(2)}KG)</div>
      </div>
      <div className={`col-span-3 border-r border-b ${BORDER_COLOR} p-1 text-right text-[9px] flex flex-col justify-center leading-tight font-mono ${ROW_HEIGHT_CLASS} shrink-0`}>
      <div>{Number(item.unitPrice).toFixed(4)}</div>
      <div className="font-bold">{Number(item.totalPrice).toFixed(2)}</div>
      <div className="text-[8px] opacity-60">{currency}</div>
      </div>
      <div className={`col-span-3 border-r border-b ${BORDER_COLOR} p-1 text-center text-[9px] flex flex-col justify-center leading-tight ${ROW_HEIGHT_CLASS} shrink-0`}>
        <div className="truncate">{item.originCountry || "CHINA (CHN)"}</div>
      </div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} p-1 text-center text-[9px] flex items-center justify-center break-all ${ROW_HEIGHT_CLASS} shrink-0`}>
      {item.origin || "境内货源地"}
      </div>
  </React.Fragment>
);

const EmptyRow: React.FC = () => (
  <React.Fragment>
      <div className={`col-span-1 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
      <div className={`border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`} style={{ gridColumn: 'span 11' }}></div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
      <div className={`col-span-3 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
      <div className={`col-span-3 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
      <div className={`col-span-2 border-r border-b ${BORDER_COLOR} ${ROW_HEIGHT_CLASS}`}></div>
  </React.Fragment>
);

interface FooterProps { 
  customsSealBase64?: string; 
  sellerNameCn: string; 
  isVisible: boolean;
}

const Footer: React.FC<FooterProps> = ({ customsSealBase64, sellerNameCn, isVisible }) => (
  isVisible ? (
    <div className={`col-span-full h-[50px] border-r border-b ${BORDER_COLOR} flex text-[9px] relative shrink-0`}>
        <div className={`w-[20%] p-1 border-r ${BORDER_COLOR} flex flex-col justify-between relative z-10`}>
            <div>报关人员:</div>
            <div>报关人员证号:</div>
        </div>
        <div className={`w-[40%] p-1 border-r ${BORDER_COLOR} flex flex-col justify-between relative z-10`}>
            <div className="text-center font-bold">兹申明对以上内容承担如实申报、依法纳税之法律责任</div>
            <div>申报单位(签章)</div>
        </div>
        <div className="w-[40%] p-1 flex flex-col justify-between italic text-gray-400 relative z-10">
            <div>海关批注及签章</div>
        </div>
        {customsSealBase64 && (
          <img 
            src={customsSealBase64} 
            alt={`${sellerNameCn} Customs Seal`} 
            className="absolute bottom-2 left-[30%] transform -translate-x-1/2 w-[160px] h-auto opacity-75 pointer-events-none z-0" 
            style={{ mixBlendMode: 'multiply' }}
          />
        )}
    </div>
  ) : (
    null
  )
);

export const DocCustoms: React.FC<Props> = memo(({ header, items, onPageCountChange, seller }) => {
  const validItems = items.filter(item => item.cnName || item.enName || item.hsCode);

  const customsSealBase64 = seller?.customsSealBase64;

  // Pagination Configuration
  const ITEMS_PAGE_1 = 6; 
  const ITEMS_PAGE_N = 10; 

  const pages: { items: ProductItem[], isMain: boolean, startIndex: number }[] = [];

  if (validItems.length === 0) {
    pages.push({ items: [], isMain: true, startIndex: 0 });
  } else {
    pages.push({ items: validItems.slice(0, ITEMS_PAGE_1), isMain: true, startIndex: 0 });
    let remainingIndex = ITEMS_PAGE_1;
    let remainingItems = validItems.slice(ITEMS_PAGE_1);
    while(remainingItems.length > 0) {
        const chunk = remainingItems.slice(0, ITEMS_PAGE_N);
        pages.push({ items: chunk, isMain: false, startIndex: remainingIndex });
        remainingIndex += ITEMS_PAGE_N;
        remainingItems = remainingItems.slice(ITEMS_PAGE_N);
    }
  }

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [pages.length, onPageCountChange]);

  const totalGw = validItems.reduce((sum, item) => sum + Number(item.grossWeight || 0), 0);
  const totalNw = validItems.reduce((sum, item) => sum + Number(item.netWeight || 0), 0);
  const totalPkgs = validItems.reduce((sum, item) => sum + Number(item.cartonCount || 0), 0);
  
  const sellerWithCode = `${header.sellerNameCn || ''} ${header.sellerCustomsCode || ''}${header.sellerUscc ? ` (${header.sellerUscc})` : ''}`;

  let pkgUnitStr = "纸箱"; 
  const uniquePkgTypes = new Set(validItems.map(i => (i.packageType || "CTNS").toUpperCase().trim()));
  if (uniquePkgTypes.size > 1) {
    pkgUnitStr = "PKGS"; 
  } else if (uniquePkgTypes.size === 1) {
    const type = uniquePkgTypes.values().next().value;
    if (type === "CTNS") pkgUnitStr = "纸箱";
    else if (type === "PLTS") pkgUnitStr = "托盘";
    else pkgUnitStr = type;
  }

  const customsMarksValue = header.customsMarks || "";

  // Increased Header Rows Heights for Page 1
  const h_static_row = "h-[45px]";
  const h_static_row_sm = "h-[38px]";

  return (
    <div className="w-[297mm] bg-gray-200 print:bg-white no-scrollbar">
      {pages.map((page, pageIndex) => {
        // const isLastPage = pageIndex === pages.length - 1; 
        // Force Footer visible on EVERY page for Customs Declaration
        const isFooterVisible = true; 

        return (
        <div 
          key={pageIndex} 
          className="mx-auto bg-white text-sm relative font-sans text-gray-800 w-[297mm] h-[210mm] mb-8 print:mb-0 print-landscape-section flex items-center justify-center overflow-hidden"
        >
            <div className="w-full h-full p-[4mm] flex flex-col print:scale-[0.98] print:origin-center">
                <div className="flex justify-between items-end mb-1 shrink-0">
                  <div className="text-[9px] w-32 font-bold">JG02</div>
                  <h1 className="text-lg font-bold tracking-widest text-center border-b-2 border-black pb-0.5">
                      中华人民共和国海关出口货物报关单
                  </h1>
                  <div className="text-[9px] w-32 text-right font-bold">页码/页数: {pageIndex + 1}/{pages.length}</div>
                </div>

                <div className="flex justify-between text-[9px] mb-1 px-1 shrink-0">
                  <div className="flex gap-2">
                     <span>预录入编号:</span>
                     <span className="min-w-[140px] border-b border-gray-400 font-bold"></span>
                  </div>
                  <div className="flex gap-2">
                     <span>海关编号:</span>
                     <span className="min-w-[140px] border-b border-gray-400"></span>
                  </div>
                   <div className="flex gap-2 font-black">
                     <span>出口报关单</span>
                  </div>
                </div>

                {/* Main Grid Container */}
                <div className={`border-t border-l ${BORDER_COLOR} grid grid-cols-[repeat(24,minmax(0,1fr))] relative`}>
                  
                  {page.isMain ? (
                      <>
                          {/* Row 1 */}
                          <Cell label="境内发货人" value={sellerWithCode} colSpan={8} className="whitespace-normal break-words" minHeight={h_static_row} />
                          <Cell label="出境关别" value={header.loadingPort} colSpan={4} minHeight={h_static_row} />
                          <Cell label="出口日期" value={header.exportDate} colSpan={4} minHeight={h_static_row} />
                          <Cell label="申报日期" value={header.declarationDate} colSpan={4} minHeight={h_static_row} />
                          <Cell label="备案号" value="" colSpan={4} minHeight={h_static_row} />

                          {/* Row 2 */}
                          <Cell label="境外收货人" value={header.buyerName} colSpan={8} minHeight={h_static_row} className="whitespace-normal" />
                          <Cell label="运输方式" value={header.transportMethod} colSpan={4} minHeight={h_static_row} />
                          <Cell label="运输工具名称及航次号" value="" colSpan={4} minHeight={h_static_row} />
                          <Cell label="提运单号" value="" colSpan={8} minHeight={h_static_row} />

                          {/* Row 3 */}
                          <Cell label="生产销售单位" value={sellerWithCode} colSpan={8} className="whitespace-normal break-words" minHeight={h_static_row} />
                          <Cell label="监管方式" value="一般贸易 (0110)" colSpan={4} minHeight={h_static_row} />
                          <Cell label="征免性质" value={header.taxExemptionNature || "一般征税"} colSpan={4} minHeight={h_static_row} />
                          <Cell label="许可证号" value="" colSpan={8} minHeight={h_static_row} />

                          {/* Row 4 */}
                          <Cell label="合同协议号" value={header.contractNo} colSpan={8} minHeight={h_static_row_sm}/>
                          <Cell label="贸易国(地区)" value={header.tradeCountry} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="运抵国(地区)" value={header.destinationCountry} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="指运港" value={header.dischargePort} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="离境口岸" value={header.loadingPort} colSpan={4} minHeight={h_static_row_sm}/>

                          {/* Row 5 */}
                          <Cell label="包装种类" value={pkgUnitStr} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="件数" value={totalPkgs || ''} colSpan={2} minHeight={h_static_row_sm}/>
                          <Cell label="毛重(千克)" value={totalGw > 0 ? totalGw.toFixed(2) : ''} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="净重(千克)" value={totalNw > 0 ? totalNw.toFixed(2) : ''} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="成交方式" value={header.incoterms} colSpan={4} minHeight={h_static_row_sm}/>
                          <Cell label="运费" value={header.oceanFreight} colSpan={2} minHeight={h_static_row_sm}/>
                          <Cell label="保费" value={header.insurance} colSpan={2} minHeight={h_static_row_sm}/>
                          <Cell label="杂费" value="" colSpan={2} minHeight={h_static_row_sm}/>

                          {/* Row 6 & 7 */}
                          <Cell label="随附单证及编号" value={`发票:${header.invoiceNo}`} colSpan={24} minHeight={h_static_row_sm}/>
                          <Cell label="标记唛码及备注" value={customsMarksValue} colSpan={24} minHeight={h_static_row_sm} className="whitespace-normal" />

                          <ListHeader />
                          {page.items.map((item, idx) => (
                              <ListItem key={item.id} item={item} index={idx} pageStartIndex={page.startIndex} currency={header.currency} />
                          ))}
                          {Array.from({ length: ITEMS_PAGE_1 - page.items.length }).map((_, idx) => (
                              <EmptyRow key={`empty-${idx}`} />
                          ))}
                      </>
                  ) : (
                      <>
                          {/* Continuation Page Header - Height adjusted for visual balance */}
                          <Cell label="合同协议号" value={header.contractNo} colSpan={8} minHeight="h-[40px]"/>
                          <Cell label="境内发货人" value={header.sellerNameCn} colSpan={16} minHeight="h-[40px]"/>
                          
                          <ListHeader />
                           {page.items.map((item, idx) => (
                              <ListItem key={item.id} item={item} index={idx} pageStartIndex={page.startIndex} currency={header.currency} />
                          ))}
                          {Array.from({ length: ITEMS_PAGE_N - page.items.length }).map((_, idx) => (
                               <EmptyRow key={`empty-${idx}`} />
                          ))}
                      </>
                  )}

                  <Footer customsSealBase64={customsSealBase64} sellerNameCn={header.sellerNameCn} isVisible={isFooterVisible}/>
                </div>
                
                <div className="mt-auto text-[8px] text-gray-400 italic flex justify-between shrink-0 font-mono">
                   <span>DOCU.STATION PRO - SYSTEM GENERATED</span>
                   <span>VERIFIED EXPORT DOCUMENTATION</span>
                </div>
            </div>
        </div>
        );
      })}
    </div>
  );
});
