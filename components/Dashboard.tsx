
import React, { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Copy, Trash2, Globe, ChevronDown, RotateCcw, Calendar, Tag, X, Hash, Settings, LayoutGrid, Download, List, Layout as LayoutIcon, PackageSearch, MessageSquareQuote, TrendingUp, BarChart3, Banknote, StickyNote, FileText, FileSpreadsheet, FileBarChart, ChevronRight, RefreshCw, Share2, Grid3X3, MonitorPlay, MessageSquarePlus, Save, Check, ExternalLink, Table, UploadCloud, Archive, ListTodo, PieChart, Activity, Cloud, Settings2, Clock, FileStack } from 'lucide-react';
import { InvoiceProject, ProjectStatus, RemarkItem } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  projects: InvoiceProject[];
  statusLabels: Record<ProjectStatus, string>;
  onUpdateStatusLabels: (labels: Record<ProjectStatus, string>) => void;
  onNew: (initialStatus?: ProjectStatus) => void;
  onEdit: (project: InvoiceProject) => void;
  onUpdateProject: (project: InvoiceProject) => void;
  onDelete: (id: string) => void;
  onCopy: (project: InvoiceProject) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  onTagsChange: (id: string, newTags: string[]) => void;
  onQuickDownload: (project: InvoiceProject, type: 'full' | 'grid' | 'csv' | 'settlement' | 'share' | 'gridCsv') => void;
  isNight: boolean;
  onOpenWebDavForProject: (project: InvoiceProject) => void;
  onOpenConfigCenter: () => void;
  customTags: string[];
}

const STATUS_KEYS: ProjectStatus[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

const STATUS_UI_CONFIG = [
  { key: 'S1', bg: 'bg-slate-500', headerBg: 'bg-slate-100', headerText: 'text-slate-600', dot: 'bg-slate-500', fade: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-600', darkText: 'text-slate-300' },
  { key: 'S2', bg: 'bg-blue-600', headerBg: 'bg-blue-100', headerText: 'text-blue-700', dot: 'bg-blue-600', fade: 'bg-blue-600/20', border: 'border-blue-500/40', text: 'text-blue-700', darkText: 'text-blue-300' },
  { key: 'S3', bg: 'bg-indigo-600', headerBg: 'bg-indigo-100', headerText: 'text-indigo-700', dot: 'bg-indigo-600', fade: 'bg-indigo-600/20', border: 'border-indigo-500/40', text: 'text-indigo-700', darkText: 'text-indigo-300' },
  { key: 'S4', bg: 'bg-emerald-600', headerBg: 'bg-emerald-100', headerText: 'text-emerald-700', dot: 'bg-emerald-600', fade: 'bg-emerald-600/20', border: 'border-emerald-500/40', text: 'text-emerald-700', darkText: 'text-emerald-300' },
  { key: 'S5', bg: 'bg-amber-500', headerBg: 'bg-amber-100', headerText: 'text-amber-700', dot: 'bg-amber-500', fade: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-700', darkText: 'text-amber-300' },
  { key: 'S6', bg: 'bg-orange-600', headerBg: 'bg-orange-100', headerText: 'text-orange-700', dot: 'bg-orange-600', fade: 'bg-orange-600/20', border: 'border-orange-500/40', text: 'text-orange-700', darkText: 'text-orange-300' },
  { key: 'S7', bg: 'bg-rose-600', headerBg: 'bg-rose-100', headerText: 'text-rose-700', dot: 'bg-rose-600', fade: 'bg-rose-600/20', border: 'border-rose-500/40', text: 'text-rose-700', darkText: 'text-rose-300' },
  { key: 'S8', bg: 'bg-pink-600', headerBg: 'bg-pink-100', headerText: 'text-pink-700', dot: 'bg-pink-600', fade: 'bg-pink-600/20', border: 'border-pink-500/40', text: 'text-pink-700', darkText: 'text-pink-300' },
  { key: 'S9', bg: 'bg-purple-600', headerBg: 'bg-purple-100', headerText: 'text-purple-700', dot: 'bg-purple-600', fade: 'bg-purple-600/20', border: 'border-purple-500/40', text: 'text-purple-700', darkText: 'text-purple-300' },
  { key: 'S10', bg: 'bg-zinc-700', headerBg: 'bg-zinc-200', headerText: 'text-zinc-800', dot: 'bg-zinc-700', fade: 'bg-zinc-700/20', border: 'border-zinc-500/40', text: 'text-zinc-700', darkText: 'text-zinc-400' },
];

const invoiceComparator = (a: InvoiceProject, b: InvoiceProject) => {
  return (a.headerInfo.invoiceNo || '').localeCompare(b.headerInfo.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
};

// --------------------------------------------------------------------------------
// 迷你图表组件
// --------------------------------------------------------------------------------

const MiniTrendLine = memo(({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...(data as number[]), 1);
  const height = 50;
  const points = (data as number[]).map((val: number, i: number) => {
    const x = (i / 11) * 100;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative group/chart mt-2 w-full">
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M 0,${height} L ${points} L 100,${height} Z`} fill={`url(#grad-${color})`} className="transition-all duration-700" />
        <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} className="transition-all duration-700" />
        {(data as number[]).map((val: number, i: number) => (
          <circle key={i} cx={(i / 11) * 100} cy={height - (val / max) * height} r="1" fill={color} className="opacity-0 group-hover/chart:opacity-100 transition-opacity" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Jan</span><span>Dec</span>
      </div>
    </div>
  );
});

const Top5Rank = memo(({ consignees, color, isNight }: { consignees: Record<string, number>, color: string, isNight: boolean }) => {
  const sorted = Object.entries(consignees).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(...sorted.map(s => s[1]), 1);
  if (sorted.length === 0) return <p className="text-[10px] text-slate-500 italic py-2 text-center">本月暂无主要收货人</p>;
  return (
    <div className="space-y-2 mt-3">
      {sorted.map(([name, amount], idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-bold">
            <span className="truncate flex-1 text-slate-500 pr-2">{name}</span>
            <span className="font-mono text-slate-400 shrink-0">{(amount/10000).toFixed(2)}万</span>
          </div>
          <div className={`h-1 w-full rounded-full overflow-hidden ${isNight ? 'bg-white/5' : 'bg-slate-100'}`}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(amount / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
});

// --------------------------------------------------------------------------------
// Sub-Components
// --------------------------------------------------------------------------------

const InlineTagManager: React.FC<{
  tags: string[];
  availableTags: string[];
  onTagsChange: (newTags: string[]) => void;
  isNight: boolean;
  className?: string;
  variant?: 'card' | 'row';
}> = memo(({ tags, availableTags, onTagsChange, isNight, className = "", variant = 'card' }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (isAdding && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        let top = rect.bottom + 4;
        let left = rect.left;
        if (left + 192 > window.innerWidth) left = window.innerWidth - 200;
        if (top + 200 > window.innerHeight) top = rect.top - 200; 
        setDropdownStyle({ position: 'fixed', top: top, left: left, zIndex: 9999 });
    }
  }, [isAdding]);

  useEffect(() => {
    if (!isAdding) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        const dropdownEl = document.getElementById('tag-dropdown-portal');
        if (dropdownEl && !dropdownEl.contains(event.target as Node)) { setIsAdding(false); setInputValue(''); }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAdding]);

  const handleAdd = (val?: string) => {
    const finalVal = val || inputValue.trim();
    if (finalVal && !tags.includes(finalVal)) onTagsChange([...tags, finalVal]);
    setInputValue(''); setIsAdding(false);
  };

  const tagBaseClass = variant === 'card' ? 'bg-white/10 border-white/20 text-white' : isNight ? 'bg-white/5 border-white/10 text-xs text-white' : 'bg-white/40 border-white/60 text-xs text-white'; 
  const availablePresets = availableTags.filter(p => !tags.includes(p) && p.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className={`flex flex-wrap gap-1 items-center relative ${className}`} onClick={e => e.stopPropagation()}>
      {tags.map(tag => (
        <span key={tag} className={`group/tag flex items-center gap-1 px-1.5 py-0 rounded-full text-[9px] font-bold border transition-all ${tagBaseClass}`}>
          {tag}
          <button onClick={() => onTagsChange(tags.filter(t => t !== tag))} className="hover:text-red-300 transition-colors opacity-0 group-hover/tag:opacity-100"><X size={8} /></button>
        </span>
      ))}
      <div ref={wrapperRef} className="relative">
        <button onClick={() => setIsAdding(!isAdding)} className={`flex items-center justify-center w-4 h-4 rounded-full border border-dashed transition-all hover:border-solid ${tagBaseClass} opacity-60 hover:opacity-100 ${isAdding ? 'bg-white/20 border-solid opacity-100' : ''}`}>
          <Plus size={8} />
        </button>
        {isAdding && createPortal(
          <div id="tag-dropdown-portal" style={dropdownStyle} className={`w-48 p-2 rounded-xl shadow-2xl border flex flex-col gap-2 animate-in fade-in duration-100 ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
             <div className="flex gap-1">
               <input autoFocus className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold border outline-none ${isNight ? 'bg-black/40 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`} placeholder="New Tag..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}/>
               <button onClick={() => handleAdd()} className="bg-blue-600 text-white rounded-md p-1 hover:bg-blue-500"><Plus size={12}/></button>
             </div>
             <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar content-start">
                {availablePresets.map(preset => (
                  <button key={preset} onClick={() => handleAdd(preset)} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${isNight ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>{preset}</button>
                ))}
             </div>
          </div>, document.body
        )}
      </div>
    </div>
  );
});

const MouseTrackingTooltip: React.FC<{ content: RemarkItem[] | null; isNight: boolean; initialPos: { x: number, y: number } | null; }> = memo(({ content, isNight, initialPos }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!content) return;
    const handleMove = (e: MouseEvent) => {
      if (ref.current) {
        const x = Math.min(window.innerWidth - 270, e.clientX + 15);
        const y = Math.min(window.innerHeight - 200, e.clientY + 15);
        ref.current.style.transform = `translate(${x}px, ${y}px) translateZ(0)`; 
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [content]);
  if (!content || content.length === 0) return null;
  let initialStyle: React.CSSProperties = {};
  if (initialPos) {
      const x = Math.min(window.innerWidth - 270, initialPos.x + 15);
      const y = Math.min(window.innerHeight - 200, initialPos.y + 15);
      initialStyle = { transform: `translate(${x}px, ${y}px) translateZ(0)` };
  } else initialStyle = { opacity: 0 };
  return createPortal(
    <div ref={ref} style={initialStyle} className={`fixed top-0 left-0 z-[999] w-64 p-3 rounded-xl border shadow-xl pointer-events-none backdrop-blur-sm transition-opacity duration-150 will-change-transform no-print ${isNight ? 'bg-slate-900/90 border-slate-700/50 text-slate-100 shadow-black' : 'bg-white/90 border-slate-200/60 text-slate-900 shadow-slate-300/40'}`}>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
         {content.map((r) => (
            <li key={r.id} className="text-[11px] leading-relaxed font-bold flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />{r.text}</li>
         ))}
      </ul>
    </div>, document.body
  );
});

const KanbanCard: React.FC<{ project: InvoiceProject, cardBg: string, isBeingDragged: boolean, isNight: boolean, customTags: string[], onEdit: (p: InvoiceProject) => void, onDragStart: (id: string) => void, onTouchStart: (id: string) => void, onTagsChange: (id: string, tags: string[]) => void, onMouseEnter: (e: React.MouseEvent, remarks: RemarkItem[]) => void, onMouseLeave: () => void, onContextMenu: (e: React.MouseEvent, p: InvoiceProject) => void, }> = memo(({ project, cardBg, isBeingDragged, isNight, customTags, onEdit, onDragStart, onTouchStart, onTagsChange, onMouseEnter, onMouseLeave, onContextMenu }) => {
  const { headerInfo, productItems = [], tags = [] } = project;
  const totalAmount = productItems.reduce((sum, item) => sum + (parseFloat(String(item.totalPrice)) || 0), 0);
  const handleEditClick = useCallback((e: React.MouseEvent) => { e.preventDefault(); onEdit(project); }, [onEdit, project]);
  const handleContextMenu = useCallback((e: React.MouseEvent) => onContextMenu(e, project), [onContextMenu, project]);
  const handleMouseEnter = useCallback((e: React.MouseEvent) => onMouseEnter(e, headerInfo.remarks || []), [onMouseEnter, headerInfo.remarks]);
  const handleTagsChangeLocal = useCallback((newTags: string[]) => onTagsChange(project.id, newTags), [onTagsChange, project.id]);
  return (
    <div draggable onDragStart={(e) => { if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', project.id); } onDragStart(project.id); }} onTouchStart={(e) => { e.stopPropagation(); onTouchStart(project.id); }} onClick={handleEditClick} onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave} onContextMenu={handleContextMenu} className={`group relative p-4 rounded-lg transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] ${cardBg} text-white ${isBeingDragged ? 'opacity-20 scale-90 rotate-1' : 'opacity-100'}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black tracking-tighter truncate leading-tight mt-0">{headerInfo.invoiceNo || 'DRAFT'}</h3></div>
        <div className="space-y-0"><p className="text-[13px] font-bold truncate leading-snug">{headerInfo.buyerName || '未指定收货人'}</p></div>
        <div className="border-t border-dashed border-white/20 my-1"></div>
        <div className="min-h-[14px] relative group/remark">{(productItems && productItems.length > 0 && productItems[0].cnName) ? (<p className="line-clamp-1 text-white font-bold text-[10px] italic opacity-90 pr-2">商品: {productItems[0].cnName}</p>) : (<p className="text-[10px] text-white/60 italic">无商品详情</p>)}</div>
        <div className="mt-0.5"><InlineTagManager tags={tags} availableTags={customTags} onTagsChange={handleTagsChangeLocal} isNight={isNight} variant="card" /></div>
        <div className="mt-2 pt-2 border-t border-white/20 flex flex-col gap-0.5"><div className="flex items-baseline justify-end"><div className="text-lg font-black tracking-tighter flex items-baseline truncate"><span className="text-[10px] opacity-60 mr-1 font-mono uppercase shrink-0">{headerInfo.currency}</span><span className="truncate">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></div></div>
      </div>
    </div>
  );
});

const ListRow: React.FC<{ project: InvoiceProject, isNight: boolean, statusLabel: string, statusUIConfig: any, customTags: string[], onEdit: (p: InvoiceProject) => void, onTagsChange: (id: string, newTags: string[]) => void, onMouseEnter: (e: React.MouseEvent, remarks: RemarkItem[]) => void, onMouseLeave: () => void, onContextMenu: (e: React.MouseEvent, p: InvoiceProject) => void, }> = memo(({ project, isNight, statusLabel, statusUIConfig, customTags, onEdit, onTagsChange, onMouseEnter, onMouseLeave, onContextMenu }) => {
  const { headerInfo, productItems = [], tags = [] } = project;
  const totalAmount = productItems.reduce((sum, item) => sum + (parseFloat(String(item.totalPrice)) || 0), 0);
  const ui = statusUIConfig;
  return (
    <tr onClick={(e) => { e.preventDefault(); onEdit(project); }} onMouseEnter={(e) => onMouseEnter(e, headerInfo.remarks || [])} onMouseLeave={onMouseLeave} onContextMenu={(e) => onContextMenu(e, project)} className={`group transition-all cursor-pointer ${isNight ? (ui.fade + ' hover:brightness-125') : (`${ui.bg} hover:brightness-105 hover:shadow-lg`)} text-white`}>
       <td className={`px-6 py-4 border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><span className="text-sm font-black">{headerInfo.invoiceNo || 'DRAFT'}</span></td>
       <td className={`px-4 py-4 border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><span className="text-sm font-black whitespace-nowrap">{headerInfo.invoiceDate || '未定'}</span></td>
       <td className={`px-4 py-4 border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><span className="text-sm font-bold truncate block max-w-[200px]">{headerInfo.sellerNameCn || '未指定'}</span></td>
       <td className={`px-4 py-4 border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><span className="text-sm font-bold truncate block max-w-[320px]">{headerInfo.buyerName || '未指定'}</span></td>
       <td className={`px-4 py-4 text-right border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><div className="text-lg font-black font-mono"><span className="text-xs mr-1 opacity-40 uppercase">{headerInfo.currency}</span>{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></td>
       <td className={`px-4 py-4 text-center border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-black uppercase tracking-widest ${isNight ? (ui.darkText + ' bg-white/5') : ('text-white bg-white/20')}`}><div className={`w-1.5 h-1.5 rounded-full ${ui.dot}`} />{statusLabel}</span></td>
       <td className={`px-4 py-4 border-b ${isNight ? 'border-white/10' : 'border-white/20'}`}><InlineTagManager tags={tags} availableTags={customTags} onTagsChange={(newTags) => onTagsChange(project.id, newTags)} isNight={isNight} variant="row" /></td>
    </tr>
  );
});

export const Dashboard: React.FC<Props> = memo(({ projects, statusLabels, onUpdateStatusLabels, onNew, onEdit, onUpdateProject, onDelete, onCopy, onStatusChange, onTagsChange, onQuickDownload, isNight, onOpenWebDavForProject, onOpenConfigCenter, customTags }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => (localStorage.getItem('dsp_dashboard_view_mode') as 'kanban' | 'list') || 'kanban');
  const [showHidden, setShowHidden] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ProjectStatus | null>(null);
  // localRemarks holds the array of remarks currently being edited in the modal
  const [editingRemarks, setEditingRemarks] = useState<{ project: InvoiceProject, remarks: RemarkItem[] } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ project: InvoiceProject, x: number, y: number } | null>(null);
  const [hoveredRemarks, setHoveredRemarks] = useState<RemarkItem[] | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  const [webDavTriggers, setWebDavTriggers] = useState<ProjectStatus[]>(() => {
    try { const saved = localStorage.getItem('dsp_webdav_triggers'); return saved ? JSON.parse(saved) : ['S4']; } catch (e) { return ['S4']; }
  });

  useEffect(() => { localStorage.setItem('dsp_webdav_triggers', JSON.stringify(webDavTriggers)); }, [webDavTriggers]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const columnRefs = useRef<Record<ProjectStatus, HTMLDivElement | null>>(Object.fromEntries(STATUS_KEYS.map(key => [key, null])) as Record<ProjectStatus, HTMLDivElement | null>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchInputRef.current?.focus(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 恢复滚动位置
  useLayoutEffect(() => { 
    if (viewMode === 'kanban') { 
      const savedScroll = localStorage.getItem('kanban_board_scroll'); 
      if (savedScroll && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = parseInt(savedScroll, 10); 
      }
    } else {
      const savedScroll = localStorage.getItem('list_board_scroll');
      if (savedScroll && listScrollRef.current) {
        listScrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [viewMode]);

  // 记录滚动位置
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => { 
    if (viewMode === 'kanban') {
      localStorage.setItem('kanban_board_scroll', e.currentTarget.scrollLeft.toString()); 
    } else {
      localStorage.setItem('list_board_scroll', e.currentTarget.scrollTop.toString());
    }
  }, [viewMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (draggingId) {
      e.preventDefault(); const touch = e.touches[0]; let newDragOverStatus: ProjectStatus | null = null;
      for (const statusKey of STATUS_KEYS) {
        const colEl = columnRefs.current[statusKey]; if (colEl) { const rect = colEl.getBoundingClientRect(); if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) { newDragOverStatus = statusKey; break; } }
      }
      setDragOverStatus(newDragOverStatus);
    }
  }, [draggingId]);

  const handleStatusChangeInternal = useCallback((projectId: string, newStatus: ProjectStatus) => {
    onStatusChange(projectId, newStatus);
    if (webDavTriggers.includes(newStatus)) { const project = projects.find(p => p.id === projectId); if (project) setTimeout(() => onOpenWebDavForProject(project), 100); }
  }, [onStatusChange, webDavTriggers, projects, onOpenWebDavForProject]);

  const handleTouchEnd = useCallback(() => { if (draggingId && dragOverStatus) handleStatusChangeInternal(draggingId, dragOverStatus); setDraggingId(null); setDragOverStatus(null); }, [draggingId, dragOverStatus, handleStatusChangeInternal]);

  const searchMatchedProjects = useMemo(() => {
    const q = searchTerm.toLowerCase(); if (!q) return projects;
    return projects.filter(p => {
      const invoiceNo = (p.headerInfo.invoiceNo || '').toLowerCase(); 
      const buyerName = (p.headerInfo.buyerName || '').toLowerCase(); 
      const sellerName = (p.headerInfo.sellerNameCn || '').toLowerCase(); 
      const tags = (p.tags || []).join(' ').toLowerCase(); 
      const productNames = (p.productItems || []).map(item => (item.cnName || '').toLowerCase()).join(' '); 
      const remarksContent = (p.headerInfo.remarks || []).map(r => r.text.toLowerCase()).join(' ');
      const dateContent = (p.headerInfo.invoiceDate || '').toLowerCase(); // Added Date Search Capability

      return invoiceNo.includes(q) || buyerName.includes(q) || sellerName.includes(q) || tags.includes(q) || productNames.includes(q) || remarksContent.includes(q) || dateContent.includes(q);
    });
  }, [projects, searchTerm]);

  const globalSortedProjects = useMemo(() => {
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const filtered = searchMatchedProjects.filter(p => { if (showHidden) return true; const isArchive = p.status === 'S10' || p.status === 'ARCHIVE'; if (!isArchive) return true; if (!p.headerInfo.invoiceDate) return true; const docDate = new Date(p.headerInfo.invoiceDate); return docDate >= oneMonthAgo; });
    return [...filtered].sort((a, b) => { const statusIdxA = STATUS_KEYS.indexOf(a.status || 'S1'); const statusIdxB = STATUS_KEYS.indexOf(b.status || 'S1'); if (statusIdxA !== statusIdxB) return statusIdxA - statusIdxB; return invoiceComparator(a, b); });
  }, [searchMatchedProjects, showHidden]);

  const dashboardAnalytics = useMemo(() => {
    const now = new Date(); const curYear = now.getFullYear(); const curMonth = now.getMonth(); const mainCurrencies = ['USD', 'CNY', 'JPY'];
    const summary: Record<string, { total: number, month: number, year: number }> = {}; const yearMonthly: Record<string, number[]> = {}; const monthConsignees: Record<string, Record<string, number>> = {};
    mainCurrencies.forEach(c => { summary[c] = { total: 0, month: 0, year: 0 }; yearMonthly[c] = Array(12).fill(0); monthConsignees[c] = {}; });
    searchMatchedProjects.forEach(p => {
      const currency = (p.headerInfo.currency || 'USD').toUpperCase(); if (!mainCurrencies.includes(currency)) return;
      const projectTotal = (p.productItems || []).reduce((sum, item) => sum + (parseFloat(String(item.totalPrice)) || 0), 0);
      summary[currency].total += projectTotal;
      if (p.headerInfo.invoiceDate) {
        const d = new Date(p.headerInfo.invoiceDate);
        if (d.getFullYear() === curYear) {
          summary[currency].year += projectTotal; yearMonthly[currency][d.getMonth()] += projectTotal;
          if (d.getMonth() === curMonth) { summary[currency].month += projectTotal; const cName = p.headerInfo.buyerName || '未指定收货人'; monthConsignees[currency][cName] = (monthConsignees[currency][cName] || 0) + projectTotal; }
        }
      }
    });
    return { summary, yearMonthly, monthConsignees };
  }, [searchMatchedProjects]);

  const renderCurrencyItems = () => {
    const mainCurrencies = ['USD', 'CNY', 'JPY'];
    const getItem = (code: string, isMain: boolean) => {
      const data = dashboardAnalytics.summary[code] || { total: 0, month: 0, year: 0 };
      const symbol = code === 'USD' ? '$' : code === 'CNY' ? '¥' : code === 'JPY' ? 'JP¥' : code;
      const colorClass = code === 'USD' ? 'text-blue-500' : code === 'CNY' ? 'text-emerald-500' : code === 'JPY' ? 'text-orange-500' : 'text-slate-400';
      return (
        <div key={code} className={`flex flex-col shrink-0 ${isMain ? 'min-w-[96px]' : 'min-w-[96px] border-l border-white/10 ml-2 pl-2'}`}>
           <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{code}</span>
           <span className={`text-[10px] font-black font-mono leading-none ${colorClass}`}>{symbol}{Math.floor(data.total).toLocaleString()}</span>
        </div>
      );
    };

    return (
      <div className="relative group/totals h-full flex items-center">
        <div className={`flex items-center px-3 py-1 rounded-lg border shadow-inner transition-all cursor-help ${isNight ? 'bg-black/40 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
           <div className="flex gap-2">{mainCurrencies.map(c => getItem(c, true))}</div>
        </div>
        <div className={`absolute top-full left-0 right-0 pt-2 pb-0 opacity-0 translate-y-2 pointer-events-none group-hover/totals:opacity-100 group-hover/totals:translate-y-0 group-hover/totals:pointer-events-auto transition-all duration-200 z-[100] no-print`}>
           <div className={`rounded-xl shadow-2xl border backdrop-blur-md overflow-hidden flex flex-col ${isNight ? 'bg-slate-900/95 border-white/10 shadow-black' : 'bg-white/95 border-slate-200 shadow-slate-300'}`}>
              <div className="flex-1 overflow-y-auto max-h-[75vh] p-4 no-scrollbar">
                <div className="space-y-6">
                  {mainCurrencies.map(code => {
                    const data = dashboardAnalytics.summary[code] || { total: 0, month: 0, year: 0 };
                    const monthlyHistory = dashboardAnalytics.yearMonthly[code] || Array(12).fill(0);
                    const topConsignees = dashboardAnalytics.monthConsignees[code] || {};
                    const symbol = code === 'USD' ? '$' : code === 'CNY' ? '¥' : code === 'JPY' ? 'JP¥' : code;
                    const colorClass = code === 'USD' ? 'text-blue-500' : code === 'CNY' ? 'text-emerald-500' : code === 'JPY' ? 'text-orange-500' : 'text-slate-400';
                    const chartColor = code === 'USD' ? '#3b82f6' : code === 'CNY' ? '#10b981' : '#f59e0b';
                    return (
                      <div key={code} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <div className="flex items-center gap-2"><TrendingUp size={12} className={colorClass} /><span className={`text-[9px] font-black uppercase tracking-widest ${colorClass}`}>{code} 分析</span></div>
                          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded-lg ${isNight ? 'bg-white/5' : 'bg-slate-50'} border ${isNight ? 'border-white/5' : 'border-slate-100'}`}><p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">本月 MTD</p><p className="text-[11px] font-black font-mono tracking-tighter truncate">{symbol}{Math.floor(data.month).toLocaleString()}</p></div>
                          <div className={`p-2 rounded-lg ${isNight ? 'bg-white/5' : 'bg-slate-50'} border ${isNight ? 'border-white/5' : 'border-slate-100'}`}><p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">年度 YTD</p><p className="text-[11px] font-black font-mono tracking-tighter truncate">{symbol}{Math.floor(data.year).toLocaleString()}</p></div>
                        </div>
                        <div className="w-full">
                            <div className="flex items-center gap-2 mb-1"><Activity size={10} className="text-slate-500" /><span className="text-[7px] font-black uppercase text-slate-400">趋势 (Monthly)</span></div>
                            <MiniTrendLine data={monthlyHistory} color={chartColor} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1"><PieChart size={10} className="text-slate-500" /><span className="text-[7px] font-black uppercase text-slate-400">本月买家 (Top Buyers)</span></div>
                            <Top5Rank consignees={topConsignees} color={chartColor} isNight={isNight} />
                        </div>
                        {code !== 'JPY' && <div className={`h-px ${isNight ? 'bg-white/5' : 'bg-slate-100'} mt-4`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`p-2 border-t text-[7px] font-black uppercase tracking-widest text-center opacity-30 ${isNight ? 'border-white/5' : 'border-slate-100'}`}>Business Intelligence</div>
           </div>
        </div>
      </div>
    );
  };

  // --- Quick Remarks Logic ---
  const handleUpdateRemarkText = (idx: number, newText: string) => {
    if (!editingRemarks) return;
    const updated = [...editingRemarks.remarks];
    updated[idx] = { ...updated[idx], text: newText };
    setEditingRemarks({ ...editingRemarks, remarks: updated });
  };

  const handleRemoveRemark = (idx: number) => {
    if (!editingRemarks) return;
    const updated = [...editingRemarks.remarks];
    updated.splice(idx, 1);
    setEditingRemarks({ ...editingRemarks, remarks: updated });
  };

  const handleAddRemark = () => {
    if (!editingRemarks) return;
    const newRemark: RemarkItem = { id: Date.now().toString(), text: '' };
    setEditingRemarks({ ...editingRemarks, remarks: [...editingRemarks.remarks, newRemark] });
  };

  const handleSaveQuickRemarks = () => {
    if (!editingRemarks) return;
    const updatedProject = {
      ...editingRemarks.project,
      headerInfo: {
        ...editingRemarks.project.headerInfo,
        remarks: editingRemarks.remarks
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateProject(updatedProject);
    setEditingRemarks(null);
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isNight ? 'bg-[#0f0f0f] text-slate-100' : 'bg-[#f4f7f9] text-slate-800'}`}>
      <MouseTrackingTooltip content={hoveredRemarks} isNight={isNight} initialPos={tooltipPos} />
      <div className={`shrink-0 px-6 py-2 flex items-center justify-between border-b shadow-sm no-print ${isNight ? 'border-slate-800 bg-[#191919]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-5 flex-1 max-w-2xl">
           <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg"><LayoutGrid size={18}/></div>
              <h2 className={`text-base font-black tracking-tight ${isNight ? 'text-white' : 'text-slate-900'}`}>业务中心</h2>
           </div>
           <div className="relative group flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input ref={searchInputRef} type="text" placeholder="搜索单号、备注、商品或日期... (例如: 2024-05)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-8 py-1.5 rounded-lg outline-none transition-all text-[11px] font-bold border ${isNight ? 'bg-slate-800/50 border-slate-700 focus:border-blue-500 text-slate-200' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 placeholder:text-slate-400'}`} />
              {searchTerm && <button onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }} className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${isNight ? 'text-slate-500 hover:text-slate-300 hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-black/5'}`}><X size={12} /></button>}
           </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
           {renderCurrencyItems()}
           <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
           <button onClick={() => setShowHidden(!showHidden)} className={`p-2 rounded-lg border transition-all ${isNight ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'} ${showHidden ? (isNight ? 'text-indigo-400 bg-indigo-900/30 border-indigo-500/50' : 'text-indigo-600 bg-indigo-50 border-indigo-200') : (isNight ? 'text-slate-500' : 'text-slate-400')}`} title={showHidden ? "查看所有沉淀记录 (Show Full Archive)" : "仅看近期记录 (Monthly Archive Mode)"}><Clock size={14} /></button>
           <div className={`flex p-0.5 rounded-lg border transition-all ${isNight ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-slate-200'}`}>
             <button onClick={() => { setViewMode('kanban'); localStorage.setItem('dsp_dashboard_view_mode', 'kanban'); }} className={`p-1 px-2.5 rounded-md text-[9px] font-black uppercase tracking-widest ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>看板</button>
             <button onClick={() => { setViewMode('list'); localStorage.setItem('dsp_dashboard_view_mode', 'list'); }} className={`p-1 px-2.5 rounded-md text-[9px] font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>列表</button>
           </div>
           <button onClick={onOpenConfigCenter} className={`p-2 rounded-lg border transition-all ${isNight ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="基础资料管理 (Data Management Center)"><Settings2 size={14} className="text-slate-500" /></button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div ref={scrollContainerRef} onScroll={handleScroll} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="flex-1 overflow-x-auto flex p-4 gap-4 items-stretch custom-scrollbar">
          {STATUS_KEYS.map((statusKey, idx) => {
            const columnProjects = globalSortedProjects.filter(p => (p.status || 'S1') === statusKey);
            const sortedColumnProjects = [...columnProjects].sort(invoiceComparator);
            const ui = STATUS_UI_CONFIG[idx];
            const label = (statusLabels[statusKey] || `状态 ${idx + 1}`).replace(/\s*\(.*?\)\s*/g, '').trim();
            const isTargeted = dragOverStatus === statusKey;
            return (
              <div key={statusKey} ref={el => { columnRefs.current[statusKey] = el; }} onDragOver={(e) => { e.preventDefault(); setDragOverStatus(statusKey); }} onDragLeave={() => setDragOverStatus(null)} onDrop={() => { if(draggingId) handleStatusChangeInternal(draggingId, statusKey); setDraggingId(null); setDragOverStatus(null); }} className={`w-64 shrink-0 flex flex-col max-h-full transition-all duration-300 p-1.5 rounded-lg border-2 ${isTargeted ? (isNight ? 'bg-blue-600/10 border-blue-500/50 scale-[1.01]' : 'bg-blue-500/5 border-blue-400/40 scale-[1.01]') : (isNight ? 'bg-white/5 border-transparent' : 'bg-slate-200/40 border-transparent')}`}>
                <div className="flex items-center justify-between mb-3 px-1.5 pt-0.5"><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${ui.dot}`} /><span className={`text-[10px] font-black uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span><span className={`text-sm font-black ml-1 ${ui.text}`}>{sortedColumnProjects.length}</span></div></div>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 no-scrollbar min-h-[400px]">{sortedColumnProjects.map(p => (<KanbanCard key={p.id} project={p} cardBg={ui.bg} isBeingDragged={draggingId === p.id} isNight={isNight} customTags={customTags} onEdit={(p) => { setHoveredRemarks(null); onEdit(p); }} onDragStart={(id) => { setHoveredRemarks(null); setDraggingId(id); }} onTouchStart={(id) => { setHoveredRemarks(null); setDraggingId(id); }} onTagsChange={onTagsChange} onMouseEnter={(e, remarks) => { if(remarks.length > 0) { setTooltipPos({ x: e.clientX, y: e.clientY }); setHoveredRemarks(remarks); } }} onMouseLeave={() => { setHoveredRemarks(null); setTooltipPos(null); }} onContextMenu={(e, p) => { e.preventDefault(); setHoveredRemarks(null); setContextMenu({ project: p, x: e.clientX, y: e.clientY }); }}/>))}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col p-4">
           <div className={`flex-1 rounded-lg border shadow-lg overflow-hidden flex flex-col ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}>
              <div ref={listScrollRef} onScroll={handleScroll} className="overflow-auto flex-1 custom-scrollbar">
                 <table className="w-full text-[11px] border-separate border-spacing-0 table-fixed">
                    <thead className={`sticky top-0 z-10 font-black uppercase tracking-widest text-[9px] no-print ${isNight ? 'bg-slate-800 text-slate-500' : 'bg-gray-50 text-slate-500'}`}><tr><th className="px-6 py-2.5 text-left w-32 border-b dark:border-slate-800">发票号码</th><th className="px-4 py-2.5 text-left w-36 border-b dark:border-slate-800">日期</th><th className="px-4 py-2.5 text-left w-56 border-b dark:border-slate-800">发货人</th><th className="px-4 py-2.5 text-left w-[340px] border-b dark:border-slate-800">收货人</th><th className="px-4 py-2.5 text-right w-60 border-b dark:border-slate-800">总金额</th><th className="px-4 py-2.5 text-center w-28 border-b dark:border-slate-800">状态</th><th className="px-4 py-2.5 text-left w-40 border-b dark:border-slate-800">标签</th></tr></thead>
                    <tbody>{globalSortedProjects.map(p => (<ListRow key={p.id} project={p} isNight={isNight} statusLabel={(statusLabels[p.status || 'S1'] || '').replace(/\s*\(.*?\)\s*/g, '').trim()} statusUIConfig={STATUS_UI_CONFIG[STATUS_KEYS.indexOf(p.status || 'S1')]} customTags={customTags} onEdit={(p) => { setHoveredRemarks(null); onEdit(p); }} onTagsChange={onTagsChange} onMouseEnter={(e, remarks) => { if(remarks.length > 0) { setTooltipPos({ x: e.clientX, y: e.clientY }); setHoveredRemarks(remarks); } }} onMouseLeave={() => { setHoveredRemarks(null); setTooltipPos(null); }} onContextMenu={(e, p) => { e.preventDefault(); setHoveredRemarks(null); setContextMenu({ project: p, x: e.clientX, y: e.clientY }); }}/>))}</tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
      <button onClick={() => onNew('S1')} className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-[0.95] transition-all z-[60] group border-4 border-white dark:border-slate-900 no-print"><Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" /></button>
      
      {/* Quick Remarks Modal */}
      {editingRemarks && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditingRemarks(null)}>
            <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl border flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${isNight ? 'bg-slate-900 border-slate-700 text-white shadow-black' : 'bg-white border-gray-200 text-gray-800'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                   <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <MessageSquareQuote size={20} className="text-blue-500" />
                      快速备注编辑器
                   </h4>
                   <button onClick={() => setEditingRemarks(null)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-1 custom-scrollbar">
                    {editingRemarks.remarks.length > 0 ? (
                        editingRemarks.remarks.map((r, idx) => (
                            <div key={r.id} className="flex gap-2 group/remitem">
                                <textarea 
                                    className={`flex-1 p-3 rounded-lg border text-xs leading-relaxed font-bold resize-none min-h-[60px] outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isNight ? 'bg-white/5 border-white/5 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                                    value={r.text}
                                    onChange={(e) => handleUpdateRemarkText(idx, e.target.value)}
                                    placeholder="输入备注内容..."
                                />
                                <button onClick={() => handleRemoveRemark(idx)} className="self-center p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover/remitem:opacity-100">
                                   <Trash2 size={16}/>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30 italic text-sm">暂无备注，点击下方按钮添加</div>
                    )}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                   <button onClick={handleAddRemark} className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 border-dashed ${isNight ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <Plus size={16}/> 新增一条备注
                   </button>
                   
                   <div className="flex gap-3">
                      <button onClick={handleSaveQuickRemarks} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                         <Save size={16}/> 保存更改
                      </button>
                      <button onClick={() => { onEdit(editingRemarks.project); setEditingRemarks(null); }} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isNight ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                         进入编辑器
                      </button>
                   </div>
                </div>
            </div>
        </div>
      )}

      {/* Improved Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-[999]" onClick={() => setContextMenu(null)}>
            <div 
                style={{ 
                    position: 'fixed', 
                    top: Math.min(contextMenu.y, window.innerHeight - 340), 
                    left: Math.min(contextMenu.x, window.innerWidth - 220), 
                    zIndex: 1000 
                }} 
                className={`w-56 py-2 rounded-lg shadow-2xl border flex flex-col animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md ${isNight ? 'bg-slate-900/95 border-white/10 text-slate-200 shadow-black' : 'bg-white/95 border-gray-200 text-gray-700 shadow-slate-300/50'}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-4 py-2 mb-1">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">单据操作菜单</p>
                </div>
                
                <button onClick={() => { onEdit(contextMenu.project); setContextMenu(null); }} className="px-4 py-3 text-xs font-black flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all">
                   <Settings2 size={16} className="text-blue-500 group-hover:text-white"/> 编辑此单据
                </button>
                
                <button onClick={() => { onCopy(contextMenu.project); setContextMenu(null); }} className="px-4 py-3 text-xs font-black flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all">
                   <Copy size={16} className="text-indigo-500 group-hover:text-white"/> 复制副本 (Copy)
                </button>
                
                <div className={`h-px my-1.5 ${isNight ? 'bg-white/10' : 'bg-gray-100'}`} />
                
                <button onClick={() => { onQuickDownload(contextMenu.project, 'full'); setContextMenu(null); }} className="px-4 py-3 text-xs font-black flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all">
                   <FileText size={16} className="text-emerald-500 group-hover:text-white"/> 下载报关单据 (PDF)
                </button>
                
                <div className={`h-px my-1.5 ${isNight ? 'bg-white/10' : 'bg-gray-100'}`} />
                
                <button onClick={() => { if(window.confirm('确定要永久删除此单据吗？')) onDelete(contextMenu.project.id); setContextMenu(null); }} className="px-4 py-3 text-xs font-black flex items-center gap-3 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                   <Trash2 size={16}/> 删除此单据
                </button>
            </div>
        </div>
      )}
    </div>
  );
});
