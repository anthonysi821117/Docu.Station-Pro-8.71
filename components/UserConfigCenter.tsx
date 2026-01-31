
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Cloud, ListTodo, ShieldAlert, Save, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Palette, Command, Lock, Monitor, Moon, Sun, Trash2, Keyboard, Tag, Plus, Database, Download, Upload, Layers, Eraser, History, Clock, HardDrive, ExternalLink, HardDriveUpload, Check, Archive } from 'lucide-react';
import { ModalPortal } from './ui/ModalPortal';
import { WebDavConfig, ProjectStatus, CustomRule, InvoiceProject, KnowledgeBase } from '../types';
import { db } from '../db';

interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  data: InvoiceProject[];
}

interface Props {
  onClose: () => void;
  isNight: boolean;
  statusLabels: Record<ProjectStatus, string>;
  onUpdateStatusLabels: (labels: Record<ProjectStatus, string>) => void;
  customRules: CustomRule[];
  onUpdateRules: (rules: CustomRule[]) => void;
  customTags: string[];
  onUpdateTags: (tags: string[]) => void;
  themeMode: string;
  setThemeMode: (mode: any) => void;
  showToast: (msg: string) => void;
  projects: InvoiceProject[];
  onUpdateProjects: (newProjects: InvoiceProject[]) => void;
}

const STATUS_KEYS: ProjectStatus[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

const SHORTCUTS = [
  { keys: ['Ctrl/Cmd', 'S'], desc: '保存当前单据 (Save)' },
  { keys: ['Ctrl/Cmd', 'P'], desc: '打印/导出单据 (Print)' },
  { keys: ['Ctrl/Cmd', 'E'], desc: '切换实时预览 (Preview)' },
  { keys: ['Ctrl/Cmd', 'N'], desc: '新建单据 (New Project)' },
  { keys: ['Ctrl/Cmd', 'F'], desc: '全局搜索 (Find)' },
  { keys: ['Esc'], desc: '关闭弹窗 / 退出编辑器' },
];

export const UserConfigCenter: React.FC<Props> = ({ 
  onClose, isNight, 
  statusLabels, onUpdateStatusLabels,
  customRules, onUpdateRules,
  customTags, onUpdateTags,
  themeMode, setThemeMode,
  showToast,
  projects, onUpdateProjects
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'workflow' | 'rules' | 'tags' | 'system'>('cloud');
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig>({ url: '', username: '', password: '' });
  const [isTestingWebDav, setIsTestingWebDav] = useState(false);
  const [webDavStatus, setWebDavStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [webDavTestMessage, setWebDavTestMessage] = useState('');
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'smart' | 'overwrite' | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [localLabels, setLocalLabels] = useState(statusLabels);
  const [localRules, setLocalRules] = useState(customRules);
  const [localTags, setLocalTags] = useState(customTags);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('dsp_webdav_config');
    if (savedConfig) setWebDavConfig(JSON.parse(savedConfig));
    const lastDate = localStorage.getItem('dsp_last_webdav_date');
    if (lastDate) setLastBackupDate(lastDate);

    const loadBackups = async () => {
      const b = (await db.backups.getAll()) as any[];
      setBackups(b.sort((a,b) => Number(b.id) - Number(a.id)));
    };
    loadBackups();
  }, []);

  const handleSaveWebDav = () => {
    localStorage.setItem('dsp_webdav_config', JSON.stringify(webDavConfig));
    showToast('WebDAV 配置已保存');
    setWebDavStatus('idle');
  };

  const testWebDav = async () => {
    setIsTestingWebDav(true);
    setWebDavStatus('idle');
    setWebDavTestMessage('');
    try {
      const auth = btoa(`${webDavConfig.username}:${webDavConfig.password}`);
      const url = webDavConfig.url.endsWith('/') ? webDavConfig.url : `${webDavConfig.url}/`;
      const res = await fetch(url, {
        method: 'PROPFIND',
        headers: { 'Authorization': `Basic ${auth}`, 'Depth': '0', 'Content-Type': 'application/xml; charset=utf-8' },
        body: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>'
      });
      if (res.ok || res.status === 207) {
        setWebDavStatus('success');
        setWebDavTestMessage('连接成功');
        showToast('WebDAV 连接成功');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e: any) {
      setWebDavStatus('error');
      setWebDavTestMessage(e.message);
      showToast('连接失败，请检查配置');
    } finally {
      setIsTestingWebDav(false);
    }
  };

  const handleManualCloudBackup = async () => {
    if (!webDavConfig.url || !webDavConfig.username || !webDavConfig.password) {
        showToast('请先配置 WebDAV 信息');
        return;
    }
    setIsBackingUp(true);
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const knowledgeBase = await db.knowledgeBase.get();
        const backupPayload = {
          meta: { version: '1.1', type: 'manual_full_backup', date: now.toISOString() },
          projects: projects,
          sellers: (await db.sellers.getAll()) as any,
          consignees: (await db.consignees.getAll()) as any,
          presets: (await db.presets.getAll()) as any,
          knowledgeBase: knowledgeBase || { complianceRules: {} }, 
        };
        const auth = btoa(`${webDavConfig.username}:${webDavConfig.password}`);
        const filename = `DSP_FullBackup_${dateStr}_${timeStr}.json`;
        const baseWebDavUrl = webDavConfig.url.endsWith('/') ? webDavConfig.url : `${webDavConfig.url}/`;
        const uploadUrl = `${baseWebDavUrl}${filename}`;
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(backupPayload),
        });
        if (response.ok || response.status === 201 || response.status === 204) {
            localStorage.setItem('dsp_last_webdav_date', dateStr);
            setLastBackupDate(dateStr);
            showToast('全量数据（含知识库）已备份到云端');
        } else {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (e: any) {
        showToast(`备份失败: ${e.message}`);
    } finally {
        setIsBackingUp(false);
    }
  };

  const saveToHistory = async (data: InvoiceProject[], label: string) => {
    const newSnapshot: BackupSnapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      label,
      data: JSON.parse(JSON.stringify(data))
    };
    const existing = (await db.backups.getAll()) as any[];
    const updatedBackups = [newSnapshot, ...existing].sort((a,b) => Number(b.id) - Number(a.id)).slice(0, 5);
    setBackups(updatedBackups);
    await db.backups.saveAll(updatedBackups);
  };

  const restoreFromHistory = (snapshot: BackupSnapshot) => {
    if (window.confirm(`还原到 ${snapshot.timestamp}？`)) {
      saveToHistory(projects, '还原前快照');
      onUpdateProjects(snapshot.data);
      showToast('数据已还原');
    }
  };

  const handleExport = async () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const exportData = {
        meta: { version: '1.1', type: 'local_export', date: now.toISOString() },
        projects: projects,
        knowledgeBase: await db.knowledgeBase.get()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dsp_backup_${dateStr}_${timeStr}.dsp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = (mode: 'smart' | 'overwrite') => {
    importModeRef.current = mode;
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    }
  };

  const processImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentMode = importModeRef.current;
    if (!file || !currentMode) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const content = JSON.parse(jsonStr);
        
        // 识别格式
        const isFullBackup = content.meta && Array.isArray(content.projects);
        const isSingleProject = content && content.headerInfo && content.productItems;
        
        let importedProjects: any[] | null = null;
        
        if (isFullBackup) {
            importedProjects = content.projects;
        } else if (Array.isArray(content)) {
            importedProjects = content;
        } else if (isSingleProject) {
            // 如果是单个单据快照，包装成数组处理
            importedProjects = [content];
        }

        if (!importedProjects) throw new Error('文件格式无效');
        
        await saveToHistory(projects, currentMode === 'smart' ? '合并前快照' : '覆盖前快照');
        
        if (currentMode === 'overwrite') {
            if (isFullBackup) {
                if (content.sellers) await db.sellers.saveAll(content.sellers);
                if (content.consignees) await db.consignees.saveAll(content.consignees);
                if (content.presets) await db.presets.saveAll(content.presets);
                if (content.knowledgeBase) await db.knowledgeBase.save(content.knowledgeBase);
                await db.projects.saveAll(importedProjects);
                onUpdateProjects(importedProjects);
                alert('全量备份已恢复，页面将刷新。');
                window.location.reload();
            } else {
                onUpdateProjects(importedProjects);
                showToast(isSingleProject ? '单据快照已覆盖载入' : '项目列表已恢复');
            }
        } else {
            const merged = [...projects];
            importedProjects.forEach((item: any) => {
                const idx = merged.findIndex(p => p.id === item.id);
                if (idx !== -1) {
                    if (new Date(item.updatedAt).getTime() > new Date(merged[idx].updatedAt).getTime()) {
                        merged[idx] = item;
                    }
                } else {
                    merged.push(item);
                }
            });
            onUpdateProjects(merged);
            showToast(isSingleProject ? `单据 ${content.headerInfo?.invoiceNo || ''} 已合并导入` : '数据已合并');
        }
      } catch (err) { 
        console.error(err);
        alert('导入失败：文件格式不识别或内容损坏。请确保导入的是 .dsp 或 .json 备份文件。'); 
      }
      importModeRef.current = null;
    };
    reader.readAsText(file);
  };

  const themeClasses = {
    bg: isNight ? 'bg-[#1a1a1a]' : 'bg-white',
    sidebar: isNight ? 'bg-[#111] border-white/5' : 'bg-slate-50 border-slate-200',
    text: isNight ? 'text-slate-200' : 'text-slate-800',
    border: isNight ? 'border-white/10' : 'border-slate-200',
    itemBg: isNight ? 'bg-white/5' : 'bg-white',
    inputBg: isNight ? 'bg-black/20 focus:bg-black/40 text-white' : 'bg-white focus:bg-blue-50 text-slate-900',
    activeTab: isNight ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white text-blue-600 shadow-md',
    inactiveTab: isNight ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-200/50',
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold mb-1 ${activeTab === id ? themeClasses.activeTab : themeClasses.inactiveTab}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <ModalPortal>
      {showOverwriteConfirm && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 p-8">
             <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border text-center ${isNight ? 'bg-slate-900 border-red-500/30' : 'bg-white border-red-200'}`}>
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-6">
                   <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black uppercase mb-4">确认覆盖导入?</h3>
                <p className="text-sm mb-8 font-medium">此操作将清空当前所有数据，并完全使用导入的备份文件进行覆盖。</p>
                <div className="flex gap-4">
                   <button onClick={() => setShowOverwriteConfirm(false)} className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-slate-100 dark:bg-slate-800">取消</button>
                   <button onClick={() => { setShowOverwriteConfirm(false); handleImportClick('overwrite'); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg">确认</button>
                </div>
             </div>
          </div>
      )}
      <input type="file" ref={fileInputRef} onChange={processImportFile} accept=".dsp,.json" className="hidden" />
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className={`w-full max-w-6xl h-[85vh] rounded-[32px] shadow-2xl flex overflow-hidden border ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`} onClick={e => e.stopPropagation()}>
          <div className={`w-64 shrink-0 flex flex-col p-4 border-r ${themeClasses.sidebar}`}>
             <div className="px-4 pt-4 pb-8">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Command size={18}/></div>
                   配置中心
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50 pl-10">Settings & Data</p>
             </div>
             <div className="flex-1 space-y-1">
                <SidebarItem id="cloud" icon={Cloud} label="云端与数据" />
                <SidebarItem id="workflow" icon={ListTodo} label="工作流配置" />
                <SidebarItem id="tags" icon={Tag} label="标签管理" />
                <SidebarItem id="rules" icon={ShieldAlert} label="合规规则库" />
                <SidebarItem id="system" icon={Monitor} label="系统与外观" />
             </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden relative">
             <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"><X size={24}/></button>
             {activeTab === 'cloud' && (
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                   <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Cloud size={28} className="text-blue-500"/> 云端连接与数据备份</h3>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className={`p-8 rounded-3xl border flex flex-col gap-6 ${themeClasses.itemBg} ${themeClasses.border}`}>
                            <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><HardDriveUpload size={16}/> WebDAV 配置</h4>
                            <div className="space-y-4">
                                <div><label className="block text-[10px] font-bold uppercase opacity-60 mb-1.5">Server URL</label><input value={webDavConfig.url} onChange={e => setWebDavConfig({...webDavConfig, url: e.target.value})} className={`w-full px-4 py-3 rounded-xl border outline-none font-mono text-sm ${themeClasses.inputBg} ${themeClasses.border}`}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold uppercase opacity-60 mb-1.5">Username</label><input value={webDavConfig.username} onChange={e => setWebDavConfig({...webDavConfig, username: e.target.value})} className={`w-full px-4 py-3 rounded-xl border outline-none text-sm ${themeClasses.inputBg} ${themeClasses.border}`}/></div>
                                    <div><label className="block text-[10px] font-bold uppercase opacity-60 mb-1.5">Password</label><input type="password" value={webDavConfig.password} onChange={e => setWebDavConfig({...webDavConfig, password: e.target.value})} className={`w-full px-4 py-3 rounded-xl border outline-none text-sm ${themeClasses.inputBg} ${themeClasses.border}`}/></div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-auto pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                                <button onClick={testWebDav} disabled={isTestingWebDav} className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-100 dark:bg-white/10">{isTestingWebDav ? <Loader2 className="animate-spin inline" size={14}/> : <RefreshCw size={14} className="inline mr-1"/>} 测试</button>
                                <button onClick={handleSaveWebDav} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">保存</button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className={`p-6 rounded-3xl border ${themeClasses.itemBg} ${themeClasses.border}`}>
                                <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-4"><Database size={16}/> 本地数据操作</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleExport} className="py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">导出备份</button>
                                    <button onClick={() => handleImportClick('smart')} className="py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">智能导入</button>
                                    <button onClick={() => setShowOverwriteConfirm(true)} className="py-3 border border-red-200 text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest">覆盖导入</button>
                                    <button onClick={() => projects.filter(p => p.status === 'S10').length > 0 ? alert('清理已归档') : showToast('暂无归档')} className="py-3 border border-amber-200 text-amber-600 rounded-xl font-bold text-xs uppercase tracking-widest">归档清理</button>
                                </div>
                            </div>
                            <button onClick={handleManualCloudBackup} disabled={isBackingUp || !webDavConfig.url} className={`w-full p-6 rounded-3xl border flex items-center justify-between ${isBackingUp ? 'opacity-50' : 'hover:border-blue-500'} ${themeClasses.itemBg} ${themeClasses.border}`}>
                                <div className="text-left"><h4 className="font-bold text-sm flex items-center gap-2"><Cloud size={16} className="text-blue-500"/> 立即备份到云端</h4><p className="text-[10px] opacity-50 mt-1">上次: {lastBackupDate || '未记录'}</p></div>
                                {isBackingUp ? <Loader2 size={20} className="animate-spin text-blue-500"/> : <HardDriveUpload size={20}/>}
                            </button>
                        </div>
                   </div>
                   <div className="mt-8">
                       <h4 className="font-bold text-sm uppercase tracking-wider mb-4 opacity-60">本地快照历史</h4>
                       <div className={`rounded-3xl border overflow-hidden ${themeClasses.border} ${themeClasses.itemBg}`}>
                           {backups.map((snap) => (
                               <div key={snap.id} className={`p-4 flex items-center justify-between border-b last:border-0 ${themeClasses.border} hover:bg-black/5 dark:hover:bg-white/5`}>
                                   <div className="flex items-center gap-4">
                                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-slate-500"><Clock size={14}/></div>
                                       <div><p className="text-xs font-black uppercase tracking-wider opacity-60">{snap.label}</p><p className="text-sm font-bold">{snap.timestamp}</p></div>
                                   </div>
                                   <button onClick={() => restoreFromHistory(snap)} className="px-4 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 font-bold text-xs uppercase">还原</button>
                               </div>
                           ))}
                       </div>
                   </div>
                </div>
             )}
             {activeTab === 'workflow' && (
                <div className="flex-1 overflow-y-auto p-10">
                   <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black">状态映射设置</h3><button onClick={() => {onUpdateStatusLabels(localLabels); showToast('已保存');}} className="px-6 py-2 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">保存更改</button></div>
                   <div className="grid grid-cols-2 gap-4">
                      {STATUS_KEYS.map((key, idx) => (
                         <div key={key} className={`p-4 rounded-2xl border flex items-center gap-4 ${themeClasses.itemBg} ${themeClasses.border}`}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-slate-100 dark:bg-white/5">{idx+1}</div>
                            <div className="flex-1"><label className="block text-[9px] font-bold uppercase opacity-40 mb-1">Status {key}</label><input value={localLabels[key]} onChange={e => setLocalLabels({...localLabels, [key]: e.target.value})} className={`w-full bg-transparent outline-none font-bold text-sm border-b ${isNight?'border-slate-700':'border-slate-200'} focus:border-purple-500`}/></div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
             {activeTab === 'tags' && (
                <div className="flex-1 overflow-y-auto p-10">
                   <h3 className="text-2xl font-black mb-6">业务标签管理</h3>
                   <div className="flex gap-2 mb-6"><input value={newTagInput} onChange={e => setNewTagInput(e.target.value)} placeholder="输入标签名..." className={`flex-1 px-4 py-3 rounded-xl border outline-none font-bold text-sm ${themeClasses.inputBg} ${themeClasses.border}`}/><button onClick={() => {if(newTagInput && !localTags.includes(newTagInput)){ const updated=[...localTags, newTagInput]; setLocalTags(updated); onUpdateTags(updated); setNewTagInput(''); }}} className="px-6 py-3 bg-pink-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">添加</button></div>
                   <div className="flex flex-wrap gap-2">
                      {localTags.map(tag => (
                         <div key={tag} className={`group flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl border text-sm font-bold ${themeClasses.itemBg} ${themeClasses.border}`}>
                            <span>{tag}</span><button onClick={() => {const updated=localTags.filter(t=>t!==tag); setLocalTags(updated); onUpdateTags(updated); }} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                         </div>
                      ))}
                   </div>
                </div>
             )}
             {activeTab === 'rules' && (
                <div className="flex-1 overflow-y-auto p-10">
                   <h3 className="text-2xl font-black mb-6">数据校验规则集</h3>
                   <div className="space-y-3">
                      {localRules.map(rule => (
                         <div key={rule.id} className={`p-4 rounded-2xl border flex items-center justify-between ${themeClasses.itemBg} ${themeClasses.border} ${!rule.enabled ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-4"><div className={`w-2 h-12 rounded-full ${rule.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} /><div><h4 className="font-bold text-sm">{rule.name}</h4><p className="text-[10px] opacity-60 font-mono">{rule.targetField} {rule.operator} {rule.compareValue}</p></div></div>
                            <div className="flex items-center gap-4"><button onClick={() => {const updated=localRules.map(r=>r.id===rule.id?{...r,enabled:!r.enabled}:r); setLocalRules(updated); onUpdateRules(updated);}} className="text-xs font-bold uppercase">{rule.enabled ? 'Enabled' : 'Disabled'}</button><button onClick={() => {if(confirm('删除?')){const updated=localRules.filter(r=>r.id!==rule.id); setLocalRules(updated); onUpdateRules(updated);}}} className="text-red-400"><Trash2 size={16}/></button></div>
                         </div>
                      ))}
                      <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl opacity-40"><p className="text-xs font-bold">请在网格编辑器或单据页定义新规则</p></div>
                   </div>
                </div>
             )}
             {activeTab === 'system' && (
                <div className="flex-1 overflow-y-auto p-10">
                   <h3 className="text-2xl font-black mb-8">系统与外观</h3>
                   <section className="mb-10"><h4 className="text-xs font-black uppercase opacity-40 mb-4">界面主题模式</h4><div className="grid grid-cols-4 gap-4">{['classic','night','vibrant','custom'].map(m => (<button key={m} onClick={() => setThemeMode(m as any)} className={`p-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest ${themeMode === m ? 'border-blue-600 bg-blue-600/10 text-blue-600' : themeClasses.border}`}>{m}</button>))}</div></section>
                   <section><h4 className="text-xs font-black uppercase opacity-40 mb-4">全局快捷键参考</h4><div className={`rounded-2xl border overflow-hidden ${themeClasses.border}`}>{SHORTCUTS.map((sc, i) => (<div key={i} className={`flex items-center justify-between p-4 border-b last:border-0 ${themeClasses.border} ${i%2===0?'bg-slate-50 dark:bg-white/5':''}`}><span className="text-sm font-bold opacity-80">{sc.desc}</span><div className="flex gap-1">{sc.keys.map(k=>(<kbd key={k} className="px-2 py-1 rounded border text-[10px] font-black uppercase bg-white dark:bg-slate-800">{k}</kbd>))}</div></div>))}</div></section>
                </div>
             )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
