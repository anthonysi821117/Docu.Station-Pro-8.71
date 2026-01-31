
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Download, X, ZoomIn, ChevronDown, Eye, EyeOff, LayoutDashboard, Save, Moon, Sun, RefreshCw, CheckCircle2, Grid3X3, FileText, FileSpreadsheet, FileBarChart, ChevronRight, Eraser, Undo2, Settings2, MonitorPlay, Settings, Loader2, Share2, Sparkles, Inbox, Link, Link2Off, LogOut, Trash2, UploadCloud, Table, Home, Palette, Paintbrush, AlertTriangle, FileBadge, ShieldAlert, Cloud, RefreshCcw, Ship, Gavel, ArrowLeft, DownloadCloud, Copy } from 'lucide-react';
import { INITIAL_HEADER, HeaderInfo, ProductItem, InvoiceProject, Seller, ProjectStatus, createInitialProductWithUniqueId, WebDavConfig, CustomTheme, DEFAULT_CUSTOM_THEME, KnowledgeBase, INITIAL_KNOWLEDGE_BASE, CustomRule, Consignee, ProductPreset } from './types';
import { InputSection } from './components/InputSection';
import { DocInvoice } from './components/DocInvoice';
import { DocPackingList } from './components/DocPackingList';
import { DocContract } from './components/DocContract';
import { DocCustoms } from './components/DocCustoms';
import { DocCertificateOfOrigin } from './components/DocCertificateOfOrigin';
import { DocBooking } from './components/DocBooking';
import { DocBillOfLading } from './components/DocBillOfLading';
import { SettlementWorkspace } from './components/SettlementWorkspace';
import { DocSettlement, H_PAGE } from './components/DocSettlement';
import { Dashboard } from './components/Dashboard';
import { GridEditor } from './components/GridEditor';
import { DocGridPrint } from './components/DocGridPrint';
import { AuthGate } from './components/AuthGate';
import { WebDavUploadModal } from './components/WebDavUploadModal';
import { ThemeEditor } from './components/ThemeEditor';
import { HealthCheckModal } from './components/HealthCheckModal';
import { ModalPortal } from './components/ui/ModalPortal';
import { useProductHealthCheck, ItemHealthReport } from './hooks/useProductHealthCheck';
import { ComplianceManager } from './components/ComplianceManager';
import { CloudRestoreModal } from './components/CloudRestoreModal';
import { UserConfigCenter } from './components/UserConfigCenter';
import { db } from './db';

// Performance Hook: useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const DEFAULT_STATUS_LABELS: Record<ProjectStatus, string> = {
  'S1': '待处理 (TO DO)', 'S2': '进行中 (PROGRESS)', 'S3': '待审核 (REVIEW)', 'S4': '已报关 (DECLARED)', 'S5': '待结算 (BILLING)', 'S6': '已完成 (DONE)', 'S7': '已归档', 'S8': '异常件', 'S9': '紧急', 'S10': '历史记录', 'TODO': '待处理 (TO DO)', 'DOING': '进行中 (PROGRESS)', 'DONE': '已完成 (COMPLETED)', 'REVIEW': '待审核 (REVIEW)', 'ARCHIVE': '已归档 (ARCHIVED)'
};

async function compressAndEncode(obj: any): Promise<string> {
  const str = JSON.stringify(obj);
  const stream = new Blob([str]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const chunks = [];
  const reader = compressedStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const blob = new Blob(chunks);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
    };
    reader.readAsDataURL(blob);
  });
}

async function decodeAndDecompress(base64: string): Promise<any> {
  const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64Standard);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  
  const stream = new Blob([bytes]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(decompressedStream);
  const text = await response.text();
  return JSON.parse(text);
}

const ThemeMenu = memo(({ isNight, isVibrant, themeMode, setThemeMode, setShowThemeMenu }: any) => (
  <div 
    id="theme-dropdown-menu" 
    className={`absolute right-0 top-full mt-2 w-48 rounded-[20px] shadow-xl border p-2 z-[100] animate-in fade-in duration-100 backdrop-blur-sm ${isNight ? 'bg-slate-800/95 border-slate-600 shadow-black/50' : 'bg-white/95 border-gray-200'}`} 
    onClick={e => e.stopPropagation()}
    style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
  >
     <div className="px-3 py-2 mb-1">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>UI Theme</p>
     </div>
     {[
       { id: 'classic', label: 'Classic White', icon: Sun, color: 'text-gray-500' },
       { id: 'vibrant', label: 'Vibrant Blue', icon: Sparkles, color: 'text-blue-500' },
       { id: 'night', label: 'Midnight Dark', icon: Moon, color: 'text-indigo-400' },
       { id: 'custom', label: 'Custom Theme', icon: Palette, color: 'text-purple-500' },
     ].map(opt => (
       <button 
         key={opt.id}
         onClick={() => { setThemeMode(opt.id as any); setShowThemeMenu(false); }}
         className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group mb-1 last:mb-0 ${themeMode === opt.id ? (isNight ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900') : (isNight ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')}`}
       >
          <div className="flex items-center gap-2.5">
             <opt.icon size={14} className={themeMode === opt.id ? 'text-current' : opt.color} />
             <span>{opt.label}</span>
          </div>
          {themeMode === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
       </button>
     ))}
  </div>
), (prev, next) => prev.themeMode === next.themeMode && prev.isNight === next.isNight && prev.isVibrant === next.isVibrant);

const DownloadMenu = memo(({ isNight, isVibrant, setShowActionsMenu, requestPrint, handleExportCSV, handleExportGridCSV, handleShareLink, setShowWebDavUploadModal }: any) => (
  <div 
    id="actions-dropdown-menu" 
    className={`absolute right-0 top-full mt-2 w-72 rounded-[24px] shadow-xl border p-2.5 z-[100] animate-in fade-in duration-100 backdrop-blur-sm ${isNight ? 'bg-slate-800/95 border-slate-600 shadow-black/50' : 'bg-white/95 border-gray-200'}`} 
    onClick={e => e.stopPropagation()}
    style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
  >
     <button onClick={() => { setShowActionsMenu(false); requestPrint('customsDocs'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#0068BA]/30 text-[#0068BA]' : (isNight ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600')}`}><FileText size={20}/></div>
           <span>报关单据 (PDF) [Ctrl+P]</span>
        </div>
        <ChevronRight size={16} className="opacity-0 group-hover/item:opacity-100 translate-x-1 group-hover/item:translate-x-0 transition-all"/>
     </button>
     
     <button onClick={() => { setShowActionsMenu(false); requestPrint('billOfLading'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#E31E24]/30 text-[#E31E24]' : (isNight ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600')}`}><Ship size={20}/></div>
           <span>提单确认书 (B/L Draft)</span>
        </div>
     </button>

     <button onClick={() => { setShowActionsMenu(false); requestPrint('booking'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#00A8E9]' : (isNight ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600')}`}><RefreshCcw size={20}/></div>
           <span>订舱托书 (Booking Note)</span>
        </div>
     </button>

     <button onClick={() => { setShowActionsMenu(false); requestPrint('certificateOrigin'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#00A8E9]' : (isNight ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600')}`}><FileBadge size={20}/></div>
           <span>原产地证 (CO)</span>
        </div>
     </button>

     <button onClick={() => { setShowActionsMenu(false); requestPrint('settlementOnly'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#00A8E9]' : (isNight ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600')}`}><FileBarChart size={20}/></div>
           <span>结算单 (PDF)</span>
        </div>
     </button>
     <button onClick={() => { setShowActionsMenu(false); requestPrint('gridOnly'); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#00A8E9]' : (isNight ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600')}`}><Grid3X3 size={20}/></div>
           <span>货物明细 (PDF)</span>
        </div>
     </button>
     <div className={`h-px my-2 ${isNight ? 'bg-white/10' : 'bg-gray-100'}`} />
     <button onClick={() => { setShowActionsMenu(false); handleExportCSV(); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#0068BA]' : (isNight ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600')}`}><FileSpreadsheet size={20}/></div>
           <span>开票数据 (CSV)</span>
        </div>
     </button>
      <button onClick={() => { setShowActionsMenu(false); handleExportGridCSV(); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#0068BA]' : (isNight ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-600')}`}><Table size={20}/></div>
           <span>商品明细 (Excel)</span>
        </div>
     </button>
     <button onClick={() => { setShowActionsMenu(false); handleShareLink(); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#0068BA]' : (isNight ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600')}`}><Share2 size={20}/></div>
           <span>分享链接 (Link)</span>
        </div>
     </button>
     <button onClick={() => { setShowActionsMenu(false); setShowWebDavUploadModal(true); }} className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between group/item mt-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'} hover:bg-blue-600 hover:text-white`}>
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover/item:bg-white/20 group-hover/item:text-white transition-colors ${isVibrant ? 'bg-[#00A8E9]/30 text-[#0068BA]' : (isNight ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600')}`}><UploadCloud size={20}/></div>
           <span>上传到 WebDAV</span>
        </div>
     </button>
  </div>
), (prev, next) => prev.isNight === next.isNight && prev.isVibrant === next.isVibrant);

const App: React.FC = () => {
  const getInitialHeader = () => {
    return JSON.parse(JSON.stringify(INITIAL_HEADER)) as HeaderInfo;
  };

  const [view, setView] = useState<'dashboard' | 'editor' | 'viewer'>('dashboard');
  
  // Core Data
  const [projects, setProjects] = useState<InvoiceProject[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(INITIAL_KNOWLEDGE_BASE);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  // Auxiliary Data 
  const [savedSellers, setSavedSellers] = useState<Seller[]>([]);
  const [savedConsignees, setSavedConsignees] = useState<Consignee[]>([]);
  const [savedPresets, setSavedPresets] = useState<ProductPreset[]>([]);

  // Tags State (Lifted from Dashboard)
  const [customTags, setCustomTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dsp_custom_tags');
      return saved ? JSON.parse(saved) : [
        'Urgent', 'Paid', 'Pending', 'Sample', 'Air', 'Sea', 
        'DHL', 'FedEx', 'L/C', 'T/T', 'Hold', 'Checked', 
        'Customs', 'Factory', 'Problem', 'VIP'
      ];
    } catch (e) { return []; }
  });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ProjectStatus>('S1');
  const [statusLabels, setStatusLabels] = useState<Record<ProjectStatus, string>>(() => {
    try { const saved = localStorage.getItem('dsp_status_labels'); return saved ? JSON.parse(saved) : DEFAULT_STATUS_LABELS; } catch (e) { return DEFAULT_STATUS_LABELS; }
  });

  const [headerInfo, setHeaderInfo] = useState<HeaderInfo>(getInitialHeader());
  const [settlementInfo, setSettlementInfo] = useState<HeaderInfo>(getInitialHeader());
  const [productItems, setProductItems] = useState<ProductItem[]>(() => [createInitialProductWithUniqueId()]); 
  
  const debouncedHeaderInfo = useDebounce(headerInfo, 200);
  const debouncedProductItems = useDebounce(productItems, 200);
  const debouncedSettlementInfo = useDebounce(settlementInfo, 200);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [sharedProject, setSharedProject] = useState<InvoiceProject | null>(null);
  const [themeMode, setThemeMode] = useState<'classic' | 'night' | 'vibrant' | 'custom'>(() => {
      const saved = localStorage.getItem('dsp_themeMode');
      return saved ? (saved as 'classic' | 'night' | 'vibrant' | 'custom') : 'classic';
  });
  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    try {
      const saved = localStorage.getItem('dsp_custom_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
            ...DEFAULT_CUSTOM_THEME,
            ...parsed,
            colors: { ...DEFAULT_CUSTOM_THEME.colors, ...(parsed.colors || {}) },
            layout: { ...DEFAULT_CUSTOM_THEME.layout, ...(parsed.layout || {}) }
        };
      }
    } catch(e) {}
    return DEFAULT_CUSTOM_THEME;
  });
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  const [modalDoc, setModalDoc] = useState<'invoice' | 'packing' | 'contract' | 'customs' | 'settlement' | 'grid' | 'co' | 'booking' | 'billOfLading' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false); 
  const [focusMode, setFocusMode] = useState(false); 
  
  const [printMode, setPrintMode] = useState<'customsDocs' | 'settlementOnly' | 'gridOnly' | 'certificateOrigin' | 'booking' | 'billOfLading' | null>(null);
  
  const isScrollingRef = useRef(false);
  const inputScrollDebounceTimeout = useRef<number | null>(null);
  const previewScrollDebounceTimeout = useRef<number | null>(null);

  const [inputWidthPercent, setInputWidthPercent] = useState(() => {
    const savedWidth = localStorage.getItem('dsp_input_width_percent');
    return savedWidth ? parseFloat(savedWidth) : 70;
  });
  
  const isResizing = useRef<boolean>(false);
  const inputScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const [settlementPageCount, setSettlementPageCount] = useState(1);
  const [customsPageCount, setCustomsPageCount] = useState(1);
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({show: false, msg: '', type: 'success'});

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showWebDavUploadModal, setShowWebDavUploadModal] = useState(false);
  const [webDavProjectTarget, setWebDavProjectTarget] = useState<InvoiceProject | null>(null);

  const [showComplianceManager, setShowComplianceManager] = useState<'rules' | 'kb' | null>(null);
  const [showConfigCenter, setShowConfigCenter] = useState(false);

  // Health Check State
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [healthIssues, setHealthIssues] = useState<ItemHealthReport[]>([]);
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Cloud Restore State
  const [cloudRestoreInfo, setCloudRestoreInfo] = useState<{ cloudDate: string, localDate: string, data: any } | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  
  const { checkAll } = useProductHealthCheck(projects, headerInfo.currency, knowledgeBase, customRules);

  // Load All Data from IndexedDB on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedProjects = await db.projects.getAll();
        setProjects(loadedProjects as InvoiceProject[]); 
        
        const kb = await db.knowledgeBase.get();
        if (kb) setKnowledgeBase(kb as KnowledgeBase);
        
        const rules = await db.customRules.getAll();
        setCustomRules(rules as CustomRule[]);
        
        setSavedSellers((await db.sellers.getAll()) as Seller[]);
        setSavedConsignees((await db.consignees.getAll()) as Consignee[]);
        setSavedPresets((await db.presets.getAll()) as ProductPreset[]);
      } catch (error) {
        console.error("Failed to load data from DB:", error);
      } finally {
        setIsDataLoaded(true); 
      }
    };
    loadData();
  }, []);

  // Sync Changes to IndexedDB
  useEffect(() => { 
    if (isDataLoaded) {
      db.projects.saveAll(projects); 
    }
  }, [projects, isDataLoaded]);

  useEffect(() => { 
    if (isDataLoaded) {
      db.knowledgeBase.save(knowledgeBase); 
    }
  }, [knowledgeBase, isDataLoaded]);

  useEffect(() => { 
    if (isDataLoaded) {
      db.customRules.saveAll(customRules); 
    }
  }, [customRules, isDataLoaded]);

  // Persist Tags
  useEffect(() => { localStorage.setItem('dsp_custom_tags', JSON.stringify(customTags)); }, [customTags]);
  
  const updateSellers = useCallback((newSellers: Seller[]) => {
    setSavedSellers(newSellers);
    db.sellers.saveAll(newSellers);
  }, []);
  const updateConsignees = useCallback((newConsignees: Consignee[]) => {
    setSavedConsignees(newConsignees);
    db.consignees.saveAll(newConsignees);
  }, []);
  const updatePresets = useCallback((newPresets: ProductPreset[]) => {
    setSavedPresets(newPresets);
    db.presets.saveAll(newPresets);
  }, []);

  const currentSeller = savedSellers.find(s => s.nameCn === headerInfo.sellerNameCn);

  // --- Cloud Logic Code Block ---
  const CLOUD_SYNC_FOLDER = "DSP_CLOUD_SYNC";
  const CLOUD_MASTER_FILE = "MASTER_DB.json";

  const getWebDavConfig = () => {
    try {
      const saved = localStorage.getItem('dsp_webdav_config');
      if (!saved) return null;
      const config = JSON.parse(saved);
      if (!config.url || !config.username || !config.password) return null;
      return config as WebDavConfig;
    } catch (e) { return null; }
  };

  const cleanupCloudArchives = useCallback(async (config: WebDavConfig, baseWebDavUrl: string, auth: string) => {
    try {
      const folderUrl = `${baseWebDavUrl}${CLOUD_SYNC_FOLDER}/`;
      const response = await fetch(folderUrl, { method: 'PROPFIND', headers: { 'Authorization': `Basic ${auth}`, 'Depth': '1' } });
      if (!response.ok) return;
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const responses = xml.querySelectorAll("D\\:response, response");
      const today = new Date();
      const retentionDays = 30;
      for (const resp of responses) {
        const href = resp.querySelector("D\\:href, href")?.textContent || "";
        const filename = href.split('/').pop() || "";
        if (filename.startsWith('HISTORY_') && filename.endsWith('.json')) {
           const datePart = filename.replace('HISTORY_', '').replace('.json', '');
           const fileDate = new Date(datePart);
           const diffTime = Math.abs(today.getTime() - fileDate.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
           if (diffDays > retentionDays) {
              await fetch(href, { method: 'DELETE', headers: { 'Authorization': `Basic ${auth}` } });
              console.log(`Cleaned up old backup: ${filename}`);
           }
        }
      }
    } catch (e) {
      console.error('Cleanup failed', e);
    }
  }, []);

  const initCloudCheck = useCallback(async () => {
    const config = getWebDavConfig();
    if (!config) return;

    try {
      const auth = btoa(`${config.username}:${config.password}`);
      const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
      const masterUrl = `${baseWebDavUrl}${CLOUD_SYNC_FOLDER}/${CLOUD_MASTER_FILE}`;

      const response = await fetch(masterUrl, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (response.ok) {
        const cloudData = await response.json();
        const cloudDateStr = cloudData?.meta?.date;
        const localDateStr = localStorage.getItem('dsp_last_local_save') || '1970-01-01T00:00:00.000Z';

        if (cloudDateStr && new Date(cloudDateStr).getTime() > new Date(localDateStr).getTime()) {
          setCloudRestoreInfo({
            cloudDate: cloudDateStr,
            localDate: localDateStr,
            data: cloudData
          });
        }
        cleanupCloudArchives(config, baseWebDavUrl, auth);
      }
    } catch (error) {
      console.warn("Cloud check failed (offline or not configured):", error);
    }
  }, [cleanupCloudArchives]);

  useEffect(() => { initCloudCheck(); }, [initCloudCheck]); 

  const performCloudRestore = async () => {
    if (!cloudRestoreInfo) return;
    try {
      const { data } = cloudRestoreInfo;
      if (data.projects) await db.projects.saveAll(data.projects);
      if (data.sellers) await db.sellers.saveAll(data.sellers);
      if (data.consignees) await db.consignees.saveAll(data.consignees);
      if (data.presets) await db.presets.saveAll(data.presets);
      if (data.knowledgeBase) await db.knowledgeBase.save(data.knowledgeBase);
      
      localStorage.setItem('dsp_last_local_save', new Date().toISOString());
      showToast('云端数据已恢复', 'success');
      setCloudRestoreInfo(null);
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      showToast('恢复失败: 数据格式错误', 'error');
    }
  };

  const autoSyncToCloud = async (currentProjects: InvoiceProject[]) => {
    const config = getWebDavConfig();
    if (!config) return;
    setIsCloudSyncing(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const isoStr = now.toISOString();
      const backupPayload = {
        meta: { version: '2.0', type: 'auto_sync', date: isoStr },
        projects: currentProjects,
        sellers: await db.sellers.getAll(),
        consignees: await db.consignees.getAll(),
        presets: await db.presets.getAll(),
        knowledgeBase: await db.knowledgeBase.get(),
      };
      const auth = btoa(`${config.username}:${config.password}`);
      const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
      const folderUrl = `${baseWebDavUrl}${CLOUD_SYNC_FOLDER}`;
      await fetch(folderUrl, { method: 'MKCOL', headers: { 'Authorization': `Basic ${auth}` } }).catch(() => {});
      const masterUrl = `${folderUrl}/${CLOUD_MASTER_FILE}`;
      await fetch(masterUrl, { method: 'PUT', headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(backupPayload) });
      const historyUrl = `${folderUrl}/HISTORY_${dateStr}.json`;
      await fetch(historyUrl, { method: 'PUT', headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(backupPayload) });
      console.log('Cloud auto-sync successful');
    } catch (e) {
      console.error('Cloud auto-sync failed', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
      setToast({show: true, msg, type});
      setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
  }, []);

  const performHealthCheck = useCallback((action: () => void, targetItems?: ProductItem[]) => {
    const itemsToCheck = targetItems || productItems;
    const issues = checkAll(itemsToCheck, !!headerInfo.isRmbCalculation);
    if (issues.length > 0) {
      const criticals = issues.filter(i => i.issues.some(ii => ii.type === 'critical'));
      
      showToast(`数据异常：检测到 ${issues.length} 项风险点，请检查表格标记`, 'error');

      if (criticals.length > 0) {
          setHealthIssues(issues);
          setPendingAction(() => action);
          setShowHealthModal(true);
      } else {
          action();
      }
    } else {
      action();
    }
  }, [productItems, headerInfo.isRmbCalculation, checkAll, showToast]);

  const confirmHealthWarning = useCallback(() => {
    setShowHealthModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const cancelHealthWarning = useCallback(() => {
    setShowHealthModal(false);
    setPendingAction(null);
  }, []);

  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  useEffect(() => {
    const SNAPSHOT_INTERVAL = 6 * 60 * 60 * 1000;
    const performSnapshot = async () => {
      try {
        const savedBackups = (await db.backups.getAll()) as any[];
        const newSnapshot = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
          label: '自动快照 (6h)',
          data: projectsRef.current
        };
        const sorted = savedBackups.sort((a: any, b: any) => Number(b.id) - Number(a.id));
        const updated = [newSnapshot, ...sorted].slice(0, 5);
        await db.backups.saveAll(updated);
        localStorage.setItem('dsp_last_auto_snapshot', Date.now().toString());
      } catch (e) { console.error('Auto snapshot failed', e); }
    };
    const lastSnapshot = parseInt(localStorage.getItem('dsp_last_auto_snapshot') || '0');
    if (Date.now() - lastSnapshot > SNAPSHOT_INTERVAL) {
       const timer = window.setTimeout(performSnapshot, 5000);
       return () => window.clearTimeout(timer);
    }
    const interval = window.setInterval(performSnapshot, SNAPSHOT_INTERVAL);
    return () => interval && window.clearInterval(interval);
  }, []);

  const syncProjectToWebDav = async (p: InvoiceProject, docTypeLabel: string) => {
    const savedConfig = localStorage.getItem('dsp_webdav_config');
    if (!savedConfig) return;
    try {
      const config: WebDavConfig = JSON.parse(savedConfig);
      if (!config.url || !config.username || !config.password) return;
      const auth = btoa(`${config.username}:${config.password}`);
      const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
      const invNo = p.headerInfo.invoiceNo || 'DRAFT';
      const documentFolder = `${baseWebDavUrl}${encodeURIComponent(invNo)}`;
      await fetch(documentFolder, { method: 'MKCOL', headers: { 'Authorization': `Basic ${auth}` } }).catch(() => {});
      const snapshotData = JSON.stringify(p, null, 2);
      const filename = `${invNo}_${docTypeLabel}_快照.dsp`;
      const remoteFilePath = `${documentFolder}/${encodeURIComponent(filename)}`;
      await fetch(remoteFilePath, { method: 'PUT', headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, body: snapshotData });
    } catch (error) { console.error('[NAS Sync] Failed:', error); }
  };

  const initiateDownload = useCallback((mode: 'customsDocs' | 'settlementOnly' | 'gridOnly' | 'certificateOrigin' | 'booking' | 'billOfLading', targetHeader?: HeaderInfo, targetItems?: ProductItem[]) => {
    setPrintMode(mode);
    
    // 优先使用传入的参数，解决 React 状态更新异步导致的文件名过旧问题
    const activeHeader = targetHeader || headerInfo;
    const activeItems = targetItems || productItems;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const originalTitle = document.title;
    
    // 清理发票号首尾空格
    const invNo = (activeHeader.invoiceNo || 'Draft').toString().trim();
    let docType = '';
    if (mode === 'settlementOnly') docType = '结算单';
    else if (mode === 'gridOnly') docType = '商品明细';
    else if (mode === 'certificateOrigin') docType = '原产地证';
    else if (mode === 'booking') docType = '订舱托书';
    else if (mode === 'billOfLading') docType = '提单草案';
    else docType = '报关单据';

    document.title = `${invNo}_${docType}_${dateStr}_${timeStr}`;

    const currentProject: InvoiceProject = {
      id: currentProjectId || 'temp',
      headerInfo: activeHeader, 
      settlementInfo: targetHeader || settlementInfo, 
      productItems: activeItems,
      status: activeStatus,
      updatedAt: new Date().toISOString(),
      tags: []
    };
    syncProjectToWebDav(currentProject, docType);

    setTimeout(() => { 
      window.print(); 
      setPrintMode(null); 
      document.title = originalTitle; 
    }, 500); 
  }, [headerInfo, settlementInfo, productItems, activeStatus, currentProjectId]);

  const requestPrint = useCallback((mode: 'customsDocs' | 'settlementOnly' | 'gridOnly' | 'certificateOrigin' | 'booking' | 'billOfLading', targetHeader?: HeaderInfo, targetItems?: ProductItem[]) => {
    performHealthCheck(() => initiateDownload(mode, targetHeader, targetItems), targetItems);
  }, [performHealthCheck, initiateDownload]);

  const handleInputScroll = useCallback(() => {
    if (!syncScroll || !inputScrollRef.current || !previewScrollRef.current) return;
    if (isScrollingRef.current) return; 
    const inputEl = inputScrollRef.current;
    const previewEl = previewScrollRef.current;
    const scrollPct = inputEl.scrollTop / (inputEl.scrollHeight - inputEl.clientHeight);
    if (inputScrollDebounceTimeout.current !== null) clearTimeout(inputScrollDebounceTimeout.current);
    inputScrollDebounceTimeout.current = window.setTimeout(() => {
        isScrollingRef.current = true; 
        requestAnimationFrame(() => {
            if (previewEl) previewEl.scrollTop = scrollPct * (previewEl.scrollHeight - previewEl.clientHeight);
            setTimeout(() => { isScrollingRef.current = false; }, 0); 
        });
        inputScrollDebounceTimeout.current = null;
    }, 10);
  }, [syncScroll]);

  const handlePreviewScroll = useCallback(() => {
    if (!syncScroll || !inputScrollRef.current || !previewScrollRef.current) return;
    if (isScrollingRef.current) return; 
    const inputEl = inputScrollRef.current;
    const previewEl = previewScrollRef.current;
    const scrollPct = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);
    if (previewScrollDebounceTimeout.current !== null) clearTimeout(previewScrollDebounceTimeout.current);
    previewScrollDebounceTimeout.current = window.setTimeout(() => {
        isScrollingRef.current = true; 
        requestAnimationFrame(() => {
            if (inputEl) inputEl.scrollTop = scrollPct * (inputEl.scrollHeight - inputEl.clientHeight);
            setTimeout(() => { isScrollingRef.current = false; }, 0); 
        });
        previewScrollDebounceTimeout.current = null;
    }, 10);
  }, [syncScroll]);

  useEffect(() => {
    if (view === 'editor' && inputScrollRef.current) inputScrollRef.current.scrollTop = 0;
  }, [view]);

  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        try {
          const base64 = hash.replace('#share=', '');
          const data = await decodeAndDecompress(base64);
          setSharedProject(data);
          setView('viewer'); 
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) { console.error('Failed to parse shared project', e); }
      }
    };
    checkHash();
  }, []);

  const handleImportShared = useCallback(() => {
    if (!sharedProject) return;
    const newProject = { ...sharedProject, id: Date.now().toString(), updatedAt: new Date().toISOString() };
    setProjects(prev => [newProject, ...prev]);
    setSharedProject(null);
    setView('dashboard');
    showToast('单据导入成功', 'success');
  }, [sharedProject, showToast]);

  const handleShareLink = useCallback(async (p?: InvoiceProject) => {
    const target = p || {
      id: currentProjectId || 'temp',
      headerInfo, settlementInfo, productItems,
      status: activeStatus,
      updatedAt: new Date().toISOString(),
      tags: projects.find(x => x.id === currentProjectId)?.tags || []
    };
    try {
      showToast('正在生成预览链接...', 'success');
      const encoded = await compressAndEncode(target);
      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
      await navigator.clipboard.writeText(url);
      showToast('分享预览链接已复制', 'success');
    } catch (e) { alert('链接生成失败'); }
  }, [currentProjectId, headerInfo, settlementInfo, productItems, activeStatus, projects, showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#theme-menu-button') && !target.closest('#theme-dropdown-menu')) setShowThemeMenu(false);
      if (!target.closest('#save-menu-button') && !target.closest('#save-dropdown-menu')) setShowSaveMenu(false);
      if (!target.closest('#actions-menu-button') && !target.closest('#actions-dropdown-menu')) setShowActionsMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('dsp_input_width_percent', inputWidthPercent.toString());
    if (sidebarRef.current && showPreview) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) setSidebarWidth(entry.contentRect.width);
      });
      resizeObserver.observe(sidebarRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [showPreview, inputWidthPercent]);

  useEffect(() => { localStorage.setItem('dsp_themeMode', themeMode); }, [themeMode]);
  useEffect(() => { localStorage.setItem('dsp_status_labels', JSON.stringify(statusLabels)); }, [statusLabels]);
  useEffect(() => { localStorage.setItem('dsp_custom_theme', JSON.stringify(customTheme)); }, [customTheme]);

  useEffect(() => {
    setSettlementInfo(prev => {
        const needsUpdate = 
            prev.invoiceNo !== headerInfo.invoiceNo ||
            prev.contractNo !== headerInfo.contractNo ||
            prev.sellerNameCn !== headerInfo.sellerNameCn ||
            prev.buyerName !== headerInfo.buyerName ||
            prev.invoiceDate !== headerInfo.invoiceDate ||
            prev.currency !== headerInfo.currency;
        
        if (needsUpdate) {
            return {
                ...prev,
                invoiceNo: headerInfo.invoiceNo,
                contractNo: headerInfo.contractNo,
                sellerNameCn: headerInfo.sellerNameCn,
                buyerName: headerInfo.buyerName,
                invoiceDate: headerInfo.invoiceDate,
                currency: headerInfo.currency
            };
        }
        return prev;
    });
  }, [headerInfo.invoiceNo, headerInfo.contractNo, headerInfo.sellerNameCn, headerInfo.buyerName, headerInfo.invoiceDate, headerInfo.currency]);

  const handleNewProject = useCallback((initialStatus?: ProjectStatus) => {
    setCurrentProjectId(null);
    setActiveStatus(initialStatus || 'S1');
    
    const defaultSeller = savedSellers.find(s => s.isDefault);
    let newHeader = getInitialHeader();
    if (defaultSeller) {
       newHeader = {
         ...newHeader,
         sellerNameCn: defaultSeller.nameCn,
         sellerName: defaultSeller.nameEn,
         sellerAddress: defaultSeller.address,
         sellerUscc: defaultSeller.uscc,
         sellerCustomsCode: defaultSeller.customsCode
       };
    }

    setHeaderInfo(newHeader);
    setSettlementInfo(newHeader);
    setProductItems([createInitialProductWithUniqueId()]);
    setHasUnsavedChanges(false);
    setView('editor');
  }, [savedSellers]);

  const handleEditProject = useCallback((p: InvoiceProject) => {
    setCurrentProjectId(p.id);
    setActiveStatus(p.status || 'S1');
    setHeaderInfo(p.headerInfo);
    setSettlementInfo(p.settlementInfo);
    setProductItems(p.productItems);
    setHasUnsavedChanges(false);
    setView('editor');
  }, []);

  const handleUpdateProject = useCallback((updatedProject: InvoiceProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const executeSave = useCallback(async () => {
    const currentInvoiceNo = (headerInfo.invoiceNo || '').trim();
    if (currentInvoiceNo) {
      const duplicateProject = projects.find(p => 
        (p.headerInfo.invoiceNo || '').trim() === currentInvoiceNo && 
        p.id !== currentProjectId
      );
      if (duplicateProject) {
        showToast(`无法保存：发票号码 "${currentInvoiceNo}" 重复`, 'error');
        return;
      }
    }
    const targetId = currentProjectId || Date.now().toString();
    if (!currentProjectId) setCurrentProjectId(targetId);
    
    const updatedProject: InvoiceProject = {
      id: targetId,
      updatedAt: new Date().toISOString(),
      status: activeStatus,
      headerInfo, settlementInfo, productItems,
      tags: projectsRef.current.find(p => p.id === targetId)?.tags || [] 
    };
    
    const newProjects = projects.some(p => p.id === updatedProject.id)
        ? projects.map(p => p.id === updatedProject.id ? updatedProject : p)
        : [updatedProject, ...projects];
        
    setProjects(newProjects);
    setHasUnsavedChanges(false);
    showToast('保存成功', 'success');
    localStorage.setItem('dsp_last_local_save', new Date().toISOString());
    autoSyncToCloud(newProjects);
  }, [currentProjectId, headerInfo, settlementInfo, productItems, activeStatus, projects, showToast]);

  const handleSaveOnly = useCallback(() => {
    performHealthCheck(executeSave);
  }, [performHealthCheck, executeSave]);

  const handleExitEditor = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm("存在未保存的修改，确定要退出编辑器吗？")) return;
    }
    setView('dashboard');
  }, [hasUnsavedChanges]);

  const handleClearCurrent = useCallback(() => {
    if (window.confirm("确定要彻底清空当前所有输入内容吗？")) {
       const emptyHeader = JSON.parse(JSON.stringify(INITIAL_HEADER));
       setHeaderInfo(emptyHeader);
       setSettlementInfo(emptyHeader); 
       setProductItems([createInitialProductWithUniqueId()]);
       setHasUnsavedChanges(true);
       showToast('已重置为空白单据', 'success');
    }
  }, [showToast]);

  const handleExportCSV = useCallback((overrideItems?: ProductItem[], overrideHeader?: HeaderInfo) => {
    const targetItems = overrideItems || productItems;
    const targetHeader = overrideHeader || headerInfo;
    const invNo = (targetHeader.invoiceNo || 'export').toString().trim();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const runExport = () => {
        const headers = "合同号码,中文品名,数量,单位,金额";
        const rows = targetItems.map(item => `"${targetHeader.contractNo || ''}","${item.cnName}","${item.quantity}","${item.unit}","${item.totalPrice}"`).join('\n');
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + `${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `开票数据_${invNo}_${dateStr}_${timeStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('CSV 导出成功', 'success');
    };

    if (view === 'editor' && !overrideItems) {
        performHealthCheck(runExport);
    } else {
        runExport();
    }
  }, [productItems, headerInfo, view, performHealthCheck, showToast]);

  const handleExportGridCSV = useCallback((overrideItems?: ProductItem[], overrideHeader?: HeaderInfo) => {
    const h = overrideHeader || headerInfo;
    const items = overrideItems || productItems;
    const invNo = (h.invoiceNo || 'Export').toString().trim();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const runExport = () => {
        const headers = ["InvoiceNo", "ContractNo", "Date", "Remark", "CN Name", "EN Name", "HS Code", "Qty", "Unit", "RMB Unit", "RMB Total", "USD Unit", "USD Total", "Pkgs", "PkgType", "GW", "NW", "Vol", "Elements", "Origin"];
        const rows = items.map(item => [h.invoiceNo, h.contractNo, h.invoiceDate, item.remark, item.cnName, item.enName, item.hsCode, item.quantity, item.unit, item.purchaseUnitPriceRMB, item.purchaseTotalPriceRMB, item.unitPrice, item.totalPrice, item.cartonCount, item.packageType, item.grossWeight, item.netWeight, item.volume, item.declarationElements, item.origin].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
        const content = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GridData_${invNo}_${dateStr}_${timeStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Excel 导出成功', 'success');
    };

    if (view === 'editor' && !overrideItems) {
        performHealthCheck(runExport);
    } else {
        runExport();
    }
  }, [productItems, headerInfo, view, performHealthCheck, showToast]);

  const handleQuickDownloadFromDashboard = useCallback((p: InvoiceProject, type: 'full' | 'grid' | 'csv' | 'settlement' | 'share' | 'gridCsv') => {
    if (type === 'share') { handleShareLink(p); return; }
    
    // 直接操作项目数据，不依赖异步更新后的全局状态，确保文件名正确
    if (type === 'csv') { 
       handleExportCSV(p.productItems, p.headerInfo); 
    } else if (type === 'gridCsv') {
       handleExportGridCSV(p.productItems, p.headerInfo);
    }
    else { 
       const mode = type === 'full' ? 'customsDocs' : (type === 'grid' ? 'gridOnly' : 'settlementOnly'); 
       // 通过参数直接传递数据，绕过 State 异步更新
       requestPrint(mode, p.headerInfo, p.productItems);
    }
    
    // 后置更新全局状态（如果用户随后进入编辑器）
    setHeaderInfo(p.headerInfo);
    setSettlementInfo(p.settlementInfo);
    setProductItems(p.productItems);
  }, [handleShareLink, handleExportCSV, handleExportGridCSV, requestPrint]);

  const handleInputSectionStatusChange = useCallback((s: ProjectStatus) => { 
    setActiveStatus(s); 
    setHasUnsavedChanges(true); 
  }, []);

  const handleOpenGridEditor = useCallback(() => setModalDoc('grid'), []);
  const handleSettlementPreview = useCallback(() => setModalDoc('settlement'), []);
  const handleDeleteProject = useCallback((id: string) => { setProjects(prev => prev.filter(p => p.id !== id)); db.projects.saveAll(projects.filter(p => p.id !== id)); }, [projects]);

  const handleCopyProject = useCallback((p: InvoiceProject) => {
    const sourceHeader = p.headerInfo;
    const newHeader: HeaderInfo = { ...INITIAL_HEADER, sellerNameCn: sourceHeader.sellerNameCn, sellerName: sourceHeader.sellerName, sellerAddress: sourceHeader.sellerAddress, sellerUscc: sourceHeader.sellerUscc, sellerCustomsCode: sourceHeader.sellerCustomsCode, buyerName: sourceHeader.buyerName, buyerAddress: sourceHeader.buyerAddress, tradeCountry: sourceHeader.tradeCountry, incoterms: sourceHeader.incoterms, currency: sourceHeader.currency, paymentMethod: sourceHeader.paymentMethod, loadingPort: sourceHeader.loadingPort, dischargePort: sourceHeader.dischargePort, destinationCountry: sourceHeader.destinationCountry, transportMethod: sourceHeader.transportMethod, invoiceNo: '', contractNo: '', invoiceDate: new Date().toISOString().split('T')[0], customsKnowledge: '', customsMarks: '' };
    const newProject: InvoiceProject = { id: Date.now().toString() + Math.random().toString().slice(2, 5), updatedAt: new Date().toISOString(), status: 'S1', headerInfo: newHeader, settlementInfo: JSON.parse(JSON.stringify(newHeader)), productItems: [createInitialProductWithUniqueId()], tags: [] };
    setProjects(prev => [newProject, ...prev]);
    showToast('副本已创建', 'success');
  }, [showToast]);

  const handleStatusChange = useCallback((id: string, s: ProjectStatus) => { setProjects(prev => prev.map(p => p.id === id ? {...p, status: s} : p)); }, []);
  const handleTagsChange = useCallback((id: string, newTags: string[]) => { setProjects(prev => prev.map(p => p.id === id ? { ...p, tags: newTags } : p)); }, []);
  const handleOpenWebDavForProject = useCallback((project: InvoiceProject) => { setWebDavProjectTarget(project); setShowWebDavUploadModal(true); }, []);
  const handleOpenWebDavFromEditor = useCallback(() => { const p: InvoiceProject = { id: currentProjectId || 'editor_temp', headerInfo, productItems, settlementInfo, status: activeStatus, updatedAt: new Date().toISOString() }; handleOpenWebDavForProject(p); }, [currentProjectId, headerInfo, productItems, settlementInfo, activeStatus, handleOpenWebDavForProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleNewProject('S1'); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (view === 'editor') handleSaveOnly(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); if (view === 'editor') requestPrint('customsDocs'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); if (view === 'editor') setShowPreview(prev => !prev); }
      if (e.key === 'Escape') { if (printMode) { setPrintMode(null); return; } if (modalDoc) { setModalDoc(null); return; } if (showWebDavUploadModal) { setShowWebDavUploadModal(false); return; } if (showThemeEditor) { setShowThemeEditor(false); return; } if (showComplianceManager) { setShowComplianceManager(null); return; } if (showConfigCenter) { setShowConfigCenter(false); return; } if (sharedProject) { setSharedProject(null); setView('dashboard'); return; } setShowThemeMenu(false); setShowSaveMenu(false); setShowActionsMenu(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, printMode, modalDoc, showWebDavUploadModal, showThemeEditor, showComplianceManager, showConfigCenter, sharedProject, handleSaveOnly, handleNewProject, requestPrint]);

  const renderDoc = (type: string, data?: { header: HeaderInfo, items: ProductItem[] }) => {
    const h = data?.header || debouncedHeaderInfo;
    const i = data?.items || debouncedProductItems;
    const s = data ? undefined : currentSeller; 
    switch (type) {
      case 'invoice': return <DocInvoice header={h} items={i} seller={s} />;
      case 'packing': return <DocPackingList header={h} items={i} seller={s} />;
      case 'contract': return <DocContract header={h} items={i} seller={s} />;
      case 'customs': return <DocCustoms header={h} items={i} onPageCountChange={setCustomsPageCount} seller={s} />;
      case 'settlement': return <DocSettlement header={data?.header || debouncedSettlementInfo} onPageCountChange={setSettlementPageCount} />;
      case 'grid_print': return <DocGridPrint header={h} items={i} />;
      case 'co': return <DocCertificateOfOrigin header={h} items={i} />;
      case 'booking': return <DocBooking header={h} items={i} />;
      case 'billOfLading': return <DocBillOfLading header={h} items={i} />;
      case 'grid': return <GridEditor items={productItems} header={headerInfo} onSave={(newItems, newCustomsKnowledge) => { setProductItems(newItems); setHeaderInfo(prev => ({...prev, customsKnowledge: newCustomsKnowledge})); setModalDoc(null); setHasUnsavedChanges(true); showToast('数据已同步', 'success'); }} onClose={() => setModalDoc(null)} isNight={themeMode === 'night'} allProjects={projects} knowledgeBase={knowledgeBase} customRules={customRules} savedPresets={savedPresets} />;
      default: return null;
    }
  };

  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const customStyleVariables = themeMode === 'custom' ? { '--theme-bg': customTheme?.colors?.bg, '--theme-surface': customTheme?.colors?.surface, '--theme-sidebar': customTheme?.colors?.sidebarBg || customTheme?.colors?.surface, '--theme-sidebar-text': customTheme?.colors?.sidebarText || customTheme?.colors?.text, '--theme-text': customTheme?.colors?.text, '--theme-text-secondary': customTheme?.colors?.textSecondary, '--theme-border': customTheme?.colors?.border, '--theme-accent': customTheme?.colors?.accent, '--theme-input-bg': customTheme?.colors?.inputBg, '--theme-radius': customTheme?.layout?.borderRadius } as React.CSSProperties : {};

  return (
    <AuthGate isNight={isNight}>
      <div className={`h-screen flex flex-col font-sans transition-colors main-app-content print:hidden overflow-hidden ${themeMode === 'custom' ? 'bg-[var(--theme-bg)] text-[var(--theme-text)]' : isVibrant ? 'bg-[#CFDFEF] text-gray-800' : (isNight ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-800')}`} style={customStyleVariables}>
        {toast.show && (
            <div className="fixed top-20 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 no-print">
                <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold border backdrop-blur-sm transition-all ${toast.type === 'error' ? (isNight ? 'bg-red-900/80 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-700') : (isNight ? 'bg-slate-800/90 border-slate-700 text-green-400' : 'bg-white/90 border-gray-200 text-gray-800')}`}>
                    {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} className="text-green-500" />}
                    <span>{toast.msg}</span>
                </div>
            </div>
        )}

        {showHealthModal && <HealthCheckModal issues={healthIssues} onConfirm={confirmHealthWarning} onCancel={cancelHealthWarning} isNight={isNight} />}
        {cloudRestoreInfo && <CloudRestoreModal cloudDate={cloudRestoreInfo.cloudDate} localDate={cloudRestoreInfo.localDate} onConfirmRestore={performCloudRestore} onIgnore={() => setCloudRestoreInfo(null)} isNight={isNight} />}
        {showConfigCenter && <UserConfigCenter onClose={() => setShowConfigCenter(false)} isNight={isNight} statusLabels={statusLabels} onUpdateStatusLabels={setStatusLabels} customRules={customRules} onUpdateRules={setCustomRules} customTags={customTags} onUpdateTags={setCustomTags} themeMode={themeMode} setThemeMode={setThemeMode} showToast={showToast} projects={projects} onUpdateProjects={setProjects} />}
        {showComplianceManager && <ComplianceManager initialTab={showComplianceManager} knowledgeBase={knowledgeBase} onUpdateKB={setKnowledgeBase} rules={customRules} onUpdateRules={setCustomRules} onClose={() => setShowComplianceManager(null)} isNight={isNight} />}
        {showWebDavUploadModal && <ModalPortal><WebDavUploadModal invoiceNo={(webDavProjectTarget?.headerInfo.invoiceNo || headerInfo.invoiceNo) || 'UNNAMED_INVOICE'} isNight={isNight} onClose={() => { setShowWebDavUploadModal(false); setWebDavProjectTarget(null); }} showToast={showToast} /></ModalPortal>}
        {showThemeEditor && <ThemeEditor theme={customTheme} onChange={setCustomTheme} onClose={() => setShowThemeEditor(false)} onReset={() => setCustomTheme(DEFAULT_CUSTOM_THEME)} />}
        
        {view !== 'viewer' && (
          <header className={`fixed top-0 left-0 right-0 z-50 border-b px-6 h-14 flex justify-between items-center shadow-sm shrink-0 transition-colors backdrop-blur-sm print:hidden ${themeMode === 'custom' ? 'bg-[var(--theme-surface)]/80 border-[var(--theme-border)] text-[var(--theme-text)]' : isVibrant ? 'bg-white/80 border-[#00A8E9]/20' : (isNight ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white/80 border-gray-200 text-gray-800')}`}>
            <div className="flex items-center gap-3"><button onClick={() => view !== 'dashboard' ? setView('dashboard') : null} className={`p-1.5 rounded-lg transition-all ${view !== 'dashboard' ? (themeMode === 'custom' ? 'hover:bg-black/5 text-[var(--theme-text-secondary)]' : (isNight ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600')) : 'cursor-default text-blue-600'}`} title={view !== 'dashboard' ? "返回看板" : "业务看板"}>{view !== 'dashboard' ? <Home size={18} /> : <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">D</div>}</button>
              {view === 'editor' && (<><ChevronRight size={14} className="text-gray-300" /><div className="flex flex-col"><div className="flex items-center gap-2"><span className={`text-xl font-black tracking-tight ${isNight ? 'text-white' : 'text-slate-900'}`}>{headerInfo.invoiceNo || 'New Draft'}</span><span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-wider ${isNight ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{statusLabels[activeStatus] || activeStatus}</span>{isCloudSyncing && <Loader2 size={12} className="animate-spin text-indigo-500 ml-2" />}</div></div></>)}
              {view === 'dashboard' && <h1 className="text-sm font-bold tracking-wide">Docu.Station Pro</h1>}
            </div>
            <div className="flex items-center gap-3">{view === 'editor' && (<><div className="flex items-center gap-1"><button onClick={() => setShowComplianceManager('kb')} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`} title="合规规则管理"><ShieldAlert size={18} /></button><button onClick={() => setShowComplianceManager('rules')} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`} title="自定义校验规则"><Gavel size={18} /></button><div className="relative"><button id="theme-menu-button" onClick={(e) => { e.stopPropagation(); setShowThemeMenu(prev => !prev); }} className={`p-2 rounded-lg transition-all ${themeMode === 'custom' ? 'text-[var(--theme-text-secondary)] hover:bg-black/5' : (isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')}`} title="主题设置"><Sparkles size={18} /></button>{showThemeMenu && <ThemeMenu isNight={isNight} isVibrant={isVibrant} themeMode={themeMode} setThemeMode={setThemeMode} setShowThemeMenu={setShowThemeMenu} />}</div>{themeMode === 'custom' && (<button onClick={() => setShowThemeEditor(true)} className="p-2 rounded-lg transition-all text-[var(--theme-accent)] hover:bg-black/5" title="Edit Custom Theme"><Paintbrush size={18} /></button>)}<button onClick={handleClearCurrent} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`} title="清空重置"><Eraser size={18} /></button><button onClick={handleOpenGridEditor} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`} title="网格编辑器"><Table size={18} /></button><button onClick={handleOpenWebDavFromEditor} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`} title="上传到 WebDAV"><UploadCloud size={18} /></button><button onClick={() => setShowPreview(prev => !prev)} className={`p-2 rounded-lg transition-all ${showPreview ? (isNight ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600') : (isNight ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')}`} title="实时预览 [Ctrl+E]">{showPreview ? <Eye size={18}/> : <EyeOff size={18}/>}</button></div><div className={`w-px h-6 ${isNight ? 'bg-white/10' : 'bg-gray-200'}`} /><div className="flex items-center gap-2"><div className="relative"><button id="save-menu-button" onClick={(e) => { e.stopPropagation(); handleSaveOnly(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${hasUnsavedChanges ? (isNight ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100') : (isNight ? 'text-slate-400 border-transparent hover:bg-white/10' : 'text-gray-600 border-transparent hover:bg-gray-100')}`} title="保存 [Ctrl+S]"><Save size={16}/><span>保存</span>{hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>}</button></div><div className="relative"><button id="actions-menu-button" onClick={(e) => { e.stopPropagation(); setShowActionsMenu(prev => !prev); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black tracking-wide text-white shadow-lg transition-all active:scale-95 ${themeMode === 'custom' ? 'bg-[var(--theme-accent)] hover:opacity-90' : (isVibrant ? 'bg-[#0068BA] hover:bg-[#005a9e]' : 'bg-indigo-600 hover:bg-indigo-500')}`} style={themeMode === 'custom' ? { backgroundColor: customTheme?.colors?.accent } : {}} title="导出与分享"><Download size={16}/><span>导出</span><ChevronDown size={12} className="opacity-60"/></button>{showActionsMenu && <DownloadMenu isNight={isNight} isVibrant={isVibrant} setShowActionsMenu={setShowActionsMenu} requestPrint={requestPrint} handleExportCSV={handleExportCSV} handleExportGridCSV={handleExportGridCSV} handleShareLink={handleShareLink} setShowWebDavUploadModal={setShowWebDavUploadModal} />}</div><button onClick={handleExitEditor} className={`p-2 rounded-lg transition-all ${isNight ? 'text-slate-500 hover:text-red-400 hover:bg-white/5' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title="关闭编辑器 [Esc]"><X size={20} /></button></div></>)}</div>
          </header>
        )}

        <div className="flex-1 overflow-hidden" style={{marginTop: view === 'viewer' ? '0' : '3.5rem'}}>
          {view === 'dashboard' ? (
            <div className="h-full overflow-hidden"><Dashboard projects={projects} statusLabels={statusLabels} onUpdateStatusLabels={setStatusLabels} onNew={handleNewProject} onEdit={handleEditProject} onUpdateProject={handleUpdateProject} onDelete={handleDeleteProject} onCopy={handleCopyProject} onStatusChange={handleStatusChange} isNight={isNight} onTagsChange={handleTagsChange} onQuickDownload={handleQuickDownloadFromDashboard} onOpenWebDavForProject={handleOpenWebDavForProject} onOpenConfigCenter={() => setShowConfigCenter(true)} customTags={customTags} /></div>
          ) : view === 'editor' ? (
            <div className="flex h-full overflow-hidden" style={{height: 'calc(100vh - 3.5rem)'}}> 
              <div ref={inputScrollRef} onScroll={handleInputScroll} className={`flex flex-col h-full flex-shrink-0 px-6 overflow-y-auto custom-scrollbar ${themeMode === 'custom' ? 'bg-[var(--theme-bg)]' : (isVibrant ? 'bg-[#CFDFEF]' : (isNight ? 'bg-slate-950' : 'bg-gray-100'))}`} style={{ width: showPreview ? `${inputWidthPercent}%` : '100%' }}>
                 <div className="mx-auto w-full pt-6"><InputSection header={headerInfo} items={productItems} setHeader={setHeaderInfo} setItems={setProductItems} themeMode={themeMode} customTheme={customTheme} setHasUnsavedChanges={setHasUnsavedChanges} status={activeStatus} onStatusChange={handleInputSectionStatusChange} statusLabels={statusLabels} showToast={showToast} allProjects={projects} knowledgeBase={knowledgeBase} customRules={customRules} onOpenGridEditor={handleOpenGridEditor} isFocusMode={focusMode} onToggleFocus={() => setFocusMode(!focusMode)} savedSellers={savedSellers} onUpdateSellers={updateSellers} savedConsignees={savedConsignees} onUpdateConsignees={updateConsignees} savedPresets={savedPresets} onUpdatePresets={updatePresets} />{!focusMode && <div className="mt-8"><SettlementWorkspace header={settlementInfo} setHeader={setSettlementInfo} themeMode={themeMode} onOpenSettlementPreview={handleSettlementPreview} setHasUnsavedChanges={setHasUnsavedChanges} /></div>}<div className="h-20 shrink-0"></div></div>
              </div>
              {showPreview && <div onMouseDown={(e) => { e.preventDefault(); isResizing.current = true; const handleMouseMove = (moveEvent: MouseEvent) => { if(!isResizing.current) return; const newWidthPercent = Math.min(90, Math.max(10, (moveEvent.clientX / window.innerWidth) * 100)); setInputWidthPercent(newWidthPercent); }; const handleMouseUp = () => { isResizing.current = false; document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); }; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); }} className="w-1.5 HEARTBIT-RESIZE-LINE cursor-col-resize z-30 transition-colors bg-gray-200 hover:bg-blue-400 no-print" />}
              {showPreview && (
                <div ref={sidebarRef} className={`h-full border-l flex flex-col relative z-10 shadow-xl transition-colors flex-1 no-print overflow-hidden ${themeMode === 'custom' ? 'bg-[var(--theme-sidebar)] border-[var(--theme-border)] text-[var(--theme-text)]' : (isVibrant ? 'bg-white border-[#00A8E9]/50' : (isNight ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'))}`}><div className={`px-5 py-4 HEARTBIT-SIDEBAR-HEADER border-b flex justify-between items-center shrink-0 ${themeMode === 'custom' ? 'bg-[var(--theme-sidebar)] border-[var(--theme-border)]' : (isVibrant ? 'bg-[#91D5F1]/30 border-[#00A8E9]/50' : (isNight ? 'bg-slate-900/50' : 'bg-gray-200/50'))}`}><div className="flex items-center gap-3"><span className={`text-xs font-black uppercase tracking-widest ${isVibrant ? 'text-[#0068BA]' : 'text-slate-400'}`}>实时预览</span><button onClick={() => setSyncScroll(prev => !prev)} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition-all ${syncScroll ? (isVibrant ? 'bg-[#00A8E9]/20 border-[#00A8E9] text-[#0068BA]' : 'bg-indigo-600/10 border-indigo-500 text-indigo-500') : (isVibrant ? 'bg-[#91D5F1]/30 border-[#00A8E9]/50 text-gray-600' : 'bg-slate-200 border-slate-300 text-slate-400')}`}>{syncScroll ? <Link size={10}/> : <Link2Off size={10}/>}{syncScroll ? '同步开启' : '同步关闭'}</button></div><button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-red-500" title="Close Preview [Esc]"><X size={20} /></button></div><div ref={previewScrollRef} onScroll={handlePreviewScroll} className="flex-1 overflow-y-auto p-6 space-y-12 custom-scrollbar flex flex-col items-center">
                    {[{ type: 'invoice', label: 'Invoice / 发票' }, { type: 'packing', label: 'Packing List / 装箱单' }, { type: 'contract', label: 'Contract / 合同' }, { type: 'customs', label: 'Customs Declaration / 报关单' }, { type: 'billOfLading', label: 'Bill of Lading / 提单确认书' }, { type: 'co', label: 'Certificate of Origin / 原产地证' }, { type: 'booking', label: 'Booking Note / 订舱托书' }, { type: 'settlement', label: 'Settlement / 结算单' }, { type: 'grid_print', label: 'Data Grid / 数据明细' }].map((doc) => {
                      const isLandscape = doc.type === 'customs' || doc.type === 'grid_print' || doc.type === 'co';
                      const docWidthPx = isLandscape ? (297 * 3.78) : (210 * 3.78); 
                      const padding = 48; 
                      const currentSidebarWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : (window.innerWidth * (100 - inputWidthPercent) / 100);
                      const availableWidth = Math.max(1, currentSidebarWidth - padding); 
                      const divisor = docWidthPx + 40; 
                      const dynamicScale = Math.min(0.6, availableWidth / divisor);
                      const boxWidth = (isLandscape ? 297 : 210) * dynamicScale * 3.78;
                      const boxHeight = (isLandscape ? 210 : 297) * dynamicScale * 3.78;
                      return (<div key={doc.type} className="flex flex-col gap-3 group items-center w-full"><div className="flex justify-between items-center w-full max-w-[400px] px-1"><span className={`text-[10px] font-black uppercase tracking-widest ${isVibrant ? 'text-[#0068BA]' : 'text-slate-500'} bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm`}>{doc.label}</span></div><div onClick={() => setModalDoc(doc.type as any)} className="shadow-xl border rounded-xl bg-white hover:border-blue-400 cursor-zoom-in relative overflow-hidden transition-all duration-300" style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}><div className="absolute top-0 left-0 origin-top-left pointer-events-none bg-white" style={{ transform: `scale(${dynamicScale})`, width: isLandscape ? '297mm' : '210mm' }}>{renderDoc(doc.type)}</div></div></div>);
                    })}
                  </div></div>
              )}
            </div>
          ) : (
            <div className={`h-full flex flex-col overflow-hidden ${isNight ? 'bg-[#0a0a0a]' : 'bg-slate-100'}`}><header className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-4xl px-4"><div className={`rounded-3xl shadow-2xl border p-4 flex items-center justify-between backdrop-blur-md transition-all ${isNight ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-gray-200'}`}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><FileText size={20} /></div><div><h2 className="text-sm font-black tracking-tight leading-none">正在查看分享的单据</h2><p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-60">INV NO: {sharedProject?.headerInfo.invoiceNo || 'DRAFT'}</p></div></div><div className="flex items-center gap-3"><button onClick={handleImportShared} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"><Download size={16} /> 导入我的工作区</button><div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" /><button onClick={() => { setSharedProject(null); setView('dashboard'); }} className={`p-2.5 rounded-xl transition-all ${isNight ? 'text-slate-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`} title="关闭预览"><X size={20} /></button></div></div></header><main className="flex-1 overflow-y-auto pt-32 pb-20 custom-scrollbar flex flex-col items-center gap-24">{sharedProject ? (<><div className="flex flex-col items-center gap-4 group"><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${isNight ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>1. 商业发票 / Commercial Invoice</span><div className="shadow-2xl rounded-sm overflow-hidden scale-[0.95] origin-top transition-transform group-hover:scale-100">{renderDoc('invoice', { header: sharedProject.headerInfo, items: sharedProject.productItems })}</div></div><div className="flex flex-col items-center gap-4 group"><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${isNight ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>2. 装箱单 / Packing List</span><div className="shadow-2xl rounded-sm overflow-hidden scale-[0.95] origin-top transition-transform group-hover:scale-100">{renderDoc('packing', { header: sharedProject.headerInfo, items: sharedProject.productItems })}</div></div><div className="flex flex-col items-center gap-4 group"><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${isNight ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>3. 销售合同 / Sales Contract</span><div className="shadow-2xl rounded-sm overflow-hidden scale-[0.95] origin-top transition-transform group-hover:scale-100">{renderDoc('contract', { header: sharedProject.headerInfo, items: sharedProject.productItems })}</div></div><div className="flex flex-col items-center gap-4 group"><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${isNight ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>4. 出口报关单 / Customs Declaration</span><div className="shadow-2xl rounded-sm overflow-hidden scale-[0.95] origin-top transition-transform group-hover:scale-100">{renderDoc('customs', { header: sharedProject.headerInfo, items: sharedProject.productItems })}</div></div><div className="py-20 text-center opacity-20"><div className="w-12 h-12 rounded-full border-4 border-current mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[0.4em]">End of Documents</p></div></>) : (<div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4"><Loader2 size={48} className="animate-spin" /><p className="font-bold">正在加载单据数据...</p></div>)}</main></div>
          )}
        </div>
        {modalDoc && (
          <div className="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 no-print animate-in fade-in duration-200" onClick={() => setModalDoc(null)}><div className="relative h-full w-full flex items-center justify-center p-4"><button onClick={() => setModalDoc(null)} className="fixed top-6 right-6 bg-white rounded-full p-2 shadow-lg z-[200]" title="Close [Esc]"><X size={24} /></button><div className={`${modalDoc === 'grid' ? 'w-full h-full' : 'bg-gray-200 rounded-lg shadow-2xl overflow-y-auto max-h-full max-w-full p-8'}`} onClick={e => e.stopPropagation()}><div className={`${modalDoc === 'grid' ? '' : 'bg-white shadow-xl'}`}>{renderDoc(modalDoc)}</div></div></div></div>
        )}
      </div>
      <div className="hidden print:block print-view-area">
        {printMode === 'customsDocs' && (<><div className="print-doc-wrapper"><DocInvoice header={headerInfo} items={productItems} seller={currentSeller} /></div><div className="print-doc-wrapper"><DocPackingList header={headerInfo} items={productItems} seller={currentSeller} /></div><div className="print-doc-wrapper"><DocContract header={headerInfo} items={productItems} seller={currentSeller} /></div><div className="print-doc-wrapper"><DocCustoms header={headerInfo} items={productItems} seller={currentSeller} /></div></>)}
        {printMode === 'billOfLading' && <div className="print-doc-wrapper"><DocBillOfLading header={headerInfo} items={productItems} /></div>}
        {printMode === 'settlementOnly' && <div className="print-doc-wrapper"><DocSettlement header={settlementInfo} /></div>}
        {printMode === 'gridOnly' && <div className="print-doc-wrapper"><DocGridPrint header={headerInfo} items={productItems} /></div>}
        {printMode === 'certificateOrigin' && <div className="print-doc-wrapper"><DocCertificateOfOrigin header={headerInfo} items={productItems} /></div>}
        {printMode === 'booking' && <div className="print-doc-wrapper"><DocBooking header={headerInfo} items={productItems} /></div>}
      </div>
    </AuthGate>
  );
};

export default App;
