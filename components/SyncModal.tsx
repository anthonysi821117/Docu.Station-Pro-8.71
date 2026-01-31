
import { X, Upload, Download, RotateCcw, Clock, AlertTriangle, Layers, CheckCircle2, History, Database, FileJson, Trash2, Archive, CalendarDays, Eraser, Info, Cloud, Lock, ExternalLink, Loader2, FileUp, Save, HardDriveUpload } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InvoiceProject, WebDavConfig, KnowledgeBase } from '../types';
import { db } from '../db';

interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  data: InvoiceProject[];
}

interface Props {
  projects: InvoiceProject[];
  onUpdateProjects: (newProjects: InvoiceProject[]) => void;
  onClose: () => void;
  isNight: boolean;
  showToast: (msg: string) => void;
}

export const SyncModal: React.FC<Props> = ({ projects, onUpdateProjects, onClose, isNight, showToast }) => {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use ref instead of state for importMode to avoid closure staleness in onChange handler
  const importModeRef = useRef<'smart' | 'overwrite' | null>(null);

  // WebDAV 状态
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig>({ url: '', username: '', password: '' });
  const [isWebDavConnected, setIsWebDavConnected] = useState<boolean | null>(null); // null: not tested, true: connected, false: failed
  const [webDavTestMessage, setWebDavTestMessage] = useState<string>('');
  const [isTestingWebDav, setIsTestingWebDav] = useState(false);
  
  // 备份状态
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string>('');

  // Confirmation State
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  useEffect(() => {
    // Load backups from IDB
    const loadBackups = async () => {
      // Fix: cast to any[] to avoid 'unknown' type error
      const b = (await db.backups.getAll()) as any[];
      setBackups(b);
    };
    loadBackups();

    const savedWebDavConfig = localStorage.getItem('dsp_webdav_config');
    if (savedWebDavConfig) {
      setWebDavConfig(JSON.parse(savedWebDavConfig));
    }

    const lastDate = localStorage.getItem('dsp_last_webdav_date');
    if (lastDate) setLastBackupDate(lastDate);
  }, []);

  const handleWebDavConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWebDavConfig(prev => ({ ...prev, [name]: value }));
    setIsWebDavConnected(null); // Reset connection status on config change
    setWebDavTestMessage('');
  };

  const saveWebDavConfig = () => {
    localStorage.setItem('dsp_webdav_config', JSON.stringify(webDavConfig));
    showToast('WebDAV 配置已保存');
  };

  const testWebDavConnection = async () => {
    if (!webDavConfig.url || !webDavConfig.username || !webDavConfig.password) {
      setWebDavTestMessage('请填写完整的 WebDAV URL、用户名和密码。');
      setIsWebDavConnected(false);
      return;
    }

    setIsTestingWebDav(true);
    setWebDavTestMessage('正在测试连接...');
    setIsWebDavConnected(null); // Indicate testing in progress

    try {
      const auth = btoa(`${webDavConfig.username}:${webDavConfig.password}`);
      const testUrl = webDavConfig.url.endsWith('/') ? webDavConfig.url : `${webDavConfig.url}/`;

      // Use PROPFIND to check for directory existence and authentication
      const response = await fetch(testUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '0', // Request properties of the resource itself, not its children
          'Content-Type': 'application/xml; charset=utf-8' // Some servers require this for PROPFIND
        },
        // Body is usually optional or an empty XML for basic PROPFIND
        body: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>'
      });

      if (response.ok || response.status === 207) { // 207 Multi-Status is common for PROPFIND success
        setIsWebDavConnected(true);
        setWebDavTestMessage('WebDAV 连接成功！');
        showToast('WebDAV 连接成功！');
      } else if (response.status === 401) {
        setIsWebDavConnected(false);
        setWebDavTestMessage('WebDAV 认证失败，请检查用户名 and 密码。');
        showToast('WebDAV 认证失败！');
      } else if (response.status === 404) {
        setIsWebDavConnected(false);
        setWebDavTestMessage('WebDAV 路径未找到，请检查 URL。');
        showToast('WebDAV 路径未找到！');
      } else {
        const errorText = await response.text();
        setIsWebDavConnected(false);
        setWebDavTestMessage(`WebDAV 连接失败: ${response.status} ${response.statusText}. 详情: ${errorText.substring(0, 100)}...`);
        showToast('WebDAV 连接失败！');
      }
    } catch (error: any) {
      console.error('WebDAV connection test error:', error);
      setIsWebDavConnected(false);
      setWebDavTestMessage(`WebDAV 连接错误: ${error.message}. 请检查 URL 或网络。`);
      showToast('WebDAV 连接错误！');
    } finally {
      setIsTestingWebDav(false);
    }
  };

  const handleManualBackup = async () => {
    if (!webDavConfig.url || !webDavConfig.username || !webDavConfig.password) {
        showToast('请先配置 WebDAV 信息');
        return;
    }

    setIsBackingUp(true);
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        // Include knowledge base in backup
        const knowledgeBase = await db.knowledgeBase.get();

        const backupPayload = {
          meta: { 
            version: '1.1', 
            type: 'manual_full_backup',
            date: now.toISOString() 
          },
          projects: projects,
          // Fix: cast database results to any to avoid unknown type errors in object literal
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
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
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
        console.error(e);
        showToast(`备份失败: ${e.message}`);
    } finally {
        setIsBackingUp(false);
    }
  };

  const archivedProjects = useMemo(() => {
    return projects.filter(p => p.status === 'S10' || p.status === 'ARCHIVE');
  }, [projects]);

  const saveToHistory = async (data: InvoiceProject[], label: string) => {
    const newSnapshot: BackupSnapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      label,
      data: JSON.parse(JSON.stringify(data))
    };
    // Keep latest 5
    // Fix: cast to any[] to avoid 'unknown' type error
    const existing = (await db.backups.getAll()) as any[];
    const updatedBackups = [newSnapshot, ...existing].sort((a,b) => Number(b.id) - Number(a.id)).slice(0, 5);
    
    setBackups(updatedBackups);
    await db.backups.saveAll(updatedBackups);
  };

  const handleExport = async (data: InvoiceProject[], filename: string) => {
    const exportData = {
        meta: { version: '1.1', type: 'local_export', date: new Date().toISOString() },
        projects: data,
        knowledgeBase: await db.knowledgeBase.get()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleArchiveCleanup = () => {
    if (archivedProjects.length === 0) return;
    const date = new Date();
    const filename = `dsp_archive_${date.getFullYear()}_${date.getMonth() + 1}.dsp`;
    if (window.confirm(`确认执行月度归档？\n\n1. 导出已归档记录到文件。\n2. 释放本地存储空间。`)) {
      handleExport(archivedProjects, filename);
      saveToHistory(projects, '归档清理前');
      const remainingProjects = projects.filter(p => p.status !== 'S10' && p.status !== 'ARCHIVE');
      onUpdateProjects(remainingProjects);
      showToast('归档成功，已释放存储空间');
    }
  };

  const restoreFromHistory = (snapshot: BackupSnapshot) => {
    if (window.confirm(`还原到 ${snapshot.timestamp}？`)) {
      saveToHistory(projects, '还原前');
      onUpdateProjects(snapshot.data);
      showToast('数据已还原');
    }
  };

  const handleImportClick = (mode: 'smart' | 'overwrite') => {
    importModeRef.current = mode;
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear value to allow re-selecting same file
        fileInputRef.current.click();
    }
  };

  const inputClass = isNight
    ? 'bg-slate-700 border-slate-600 focus:border-indigo-500 text-white placeholder-slate-400'
    : 'bg-white border-gray-300 focus:border-indigo-500 text-gray-900 placeholder-gray-500';

  const labelClass = isNight ? 'text-slate-300' : 'text-gray-700';

  return (
    // Performance: removed backdrop-blur, used simple opacity
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 animate-in fade-in duration-150" onClick={onClose}>
      <div className={`w-full max-w-7xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col transition-all h-[90vh] relative will-change-transform ${isNight ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        
        {/* Custom Confirmation Overlay for Overwrite */}
        {showOverwriteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-150 p-8 rounded-[32px]">
             <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border text-center ${isNight ? 'bg-slate-900 border-red-500/30' : 'bg-white border-red-200'}`}>
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-6">
                   <AlertTriangle size={32} />
                </div>
                <h3 className={`text-xl font-black uppercase mb-4 ${isNight ? 'text-white' : 'text-gray-900'}`}>确认覆盖导入?</h3>
                <p className={`text-sm mb-8 font-medium ${isNight ? 'text-slate-400' : 'text-gray-500'}`}>
                   此操作将<span className="text-red-500 font-bold">清空当前所有数据</span>，并完全使用导入的备份文件进行覆盖。
                   <br/><br/>
                   如果您导入的是 WebDAV 全量备份，系统也会同时恢复您的发货人、收货人、预设数据库及<span className="text-indigo-500 font-bold">合规知识库</span>。
                </p>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setShowOverwriteConfirm(false)} 
                     className={`flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isNight ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                   >
                     取消
                   </button>
                   <button 
                     onClick={() => {
                        setShowOverwriteConfirm(false);
                        handleImportClick('overwrite');
                     }} 
                     className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/30 transition-all active:scale-95"
                   >
                     确认并选择文件
                   </button>
                </div>
             </div>
          </div>
        )}

        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
              <RotateCcw size={24} className="animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">同步与历史中心</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Column 1: Manual Data Sync */}
          <div className="space-y-6">
            <h3 className={`font-black uppercase tracking-widest text-xs flex items-center gap-2 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}><Database size={14}/> 本地数据管理</h3>
            <div className={`p-5 rounded-3xl border transition-all ${isNight ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
               <button onClick={() => handleExport(projects, 'full_backup.dsp')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                 <Download size={16} /> 全量导出备份
               </button>
               <button onClick={() => handleImportClick('smart')} className="w-full py-3 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                 <Layers size={16} className="inline mr-2" /> 智能合并导入
               </button>
               <button 
                 onClick={() => setShowOverwriteConfirm(true)} 
                 className={`w-full py-3 mt-3 border rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isNight ? 'bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'}`}
               >
                 <Eraser size={16} /> 清空并覆盖导入
               </button>
            </div>
            <div className={`p-5 rounded-3xl border border-dashed ${isNight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-amber-600 uppercase">待归档记录</span>
                 <span className="text-xl font-black text-amber-600">{archivedProjects.length}</span>
               </div>
               <button onClick={handleArchiveCleanup} disabled={archivedProjects.length === 0} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50">
                 执行归档清理
               </button>
            </div>
          </div>

          {/* Column 2: WebDAV Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className={`font-black uppercase tracking-widest text-xs flex items-center gap-2 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}><Cloud size={14}/> 云端单据存档 (WebDAV)</h3>
            <div className={`p-8 rounded-[32px] border h-full flex flex-col ${isNight ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div className="flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                           isWebDavConnected === true ? (isNight ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600') : 
                           isWebDavConnected === false ? (isNight ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600') : 
                           (isNight ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100 text-gray-500')
                         }`}>
                            {isWebDavConnected === true ? <CheckCircle2 size={24} /> : isWebDavConnected === false ? <AlertTriangle size={24} /> : <Cloud size={24} />}
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">云端存储配置</p>
                            <h4 className="text-sm font-black">{isWebDavConnected === true ? 'WebDAV 已连接' : isWebDavConnected === false ? 'WebDAV 连接失败' : '配置 WebDAV'}</h4>
                         </div>
                      </div>
                      <button onClick={() => window.open('https://www.synology.com/zh-cn/dsm/feature/webdav', '_blank')} className={`p-2 rounded-lg border hover:bg-opacity-80 transition-colors ${isNight ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'}`}>
                         <ExternalLink size={18} />
                      </button>
                   </div>

                   {/* WebDAV Config Fields */}
                   <div className="flex-1 space-y-4 mb-6">
                        <div>
                            <label htmlFor="webdav-url" className={`block text-xs font-bold mb-1 ${labelClass}`}>WebDAV URL (例如: `https://your-nas.synology.me:5006/webdav`)</label>
                            <input
                                id="webdav-url"
                                name="url"
                                type="text"
                                value={webDavConfig.url}
                                onChange={handleWebDavConfigChange}
                                placeholder="https://your-nas.synology.me:5006/webdav"
                                className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="webdav-username" className={`block text-xs font-bold mb-1 ${labelClass}`}>用户名</label>
                            <input
                                id="webdav-username"
                                name="username"
                                type="text"
                                value={webDavConfig.username}
                                onChange={handleWebDavConfigChange}
                                placeholder="WebDAV 用户名"
                                className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="webdav-password" className={`block text-xs font-bold mb-1 ${labelClass}`}>密码</label>
                            <input
                                id="webdav-password"
                                name="password"
                                type="password"
                                value={webDavConfig.password}
                                onChange={handleWebDavConfigChange}
                                placeholder="WebDAV 密码"
                                className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            {webDavTestMessage ? (
                                <p className={`text-xs font-medium mt-2 ${isWebDavConnected === true ? 'text-green-500' : 'text-red-500'}`}>
                                    {webDavTestMessage}
                                </p>
                            ) : (<div></div>)}
                            
                            {lastBackupDate && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">
                                    Last Auto Backup: <span className="text-indigo-500">{lastBackupDate}</span>
                                </p>
                            )}
                        </div>
                   </div>
                   
                   {/* WebDAV Actions */}
                   <div className="grid grid-cols-2 gap-3 mt-auto">
                       <button
                           onClick={testWebDavConnection}
                           disabled={isTestingWebDav}
                           className={`py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                             isTestingWebDav ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                             (isNight ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')
                           }`}
                       >
                           {isTestingWebDav ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                           测试连接
                       </button>
                       <button
                           onClick={saveWebDavConfig}
                           className={`py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isNight ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white border hover:bg-gray-50 text-gray-800'}`}
                       >
                           <Save size={16} /> 保存配置
                       </button>
                       <button
                           onClick={handleManualBackup}
                           disabled={isBackingUp || !webDavConfig.url}
                           className={`col-span-2 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isBackingUp ? 'bg-indigo-900/50 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
                       >
                           {isBackingUp ? <Loader2 size={16} className="animate-spin" /> : <HardDriveUpload size={16} />}
                           {isBackingUp ? '正在上传全量数据...' : '立即备份到 WebDAV'}
                       </button>
                   </div>
                </div>
            </div>
          </div>

          {/* Column 3: Backup History */}
          <div className="space-y-6">
            <h3 className={`font-black uppercase tracking-widest text-xs flex items-center gap-2 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}><History size={14}/> 备份历史</h3>
            <div className={`rounded-3xl border overflow-hidden flex flex-col h-[400px] ${isNight ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
               <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-white/5">
                  {backups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                       <Clock size={48} className="text-slate-200" />
                       <p className="text-sm font-bold text-slate-400">暂无备份记录</p>
                    </div>
                  ) : (
                    backups.map(snap => (
                      <div key={snap.id} className={`p-4 flex items-center justify-between group transition-colors ${isNight ? 'hover:bg-blue-900/10' : 'hover:bg-blue-50/50'}`}>
                        <div className="min-w-0">
                           <p className={`text-[11px] font-black truncate ${isNight ? 'text-white' : 'text-slate-800'}`}>{snap.timestamp}</p>
                           <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isNight ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>{snap.label}</span>
                        </div>
                        <button onClick={() => restoreFromHistory(snap)} className="px-3 py-1 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest">还原</button>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={async (e) => {
          const file = e.target.files?.[0];
          const currentMode = importModeRef.current;
          
          if (!file || !currentMode) return;
          
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const jsonStr = event.target?.result as string;
              const content = JSON.parse(jsonStr);
              
              // Check if it's the Full Backup format (has 'meta' and 'projects' array)
              const isFullBackup = content.meta && Array.isArray(content.projects);
              // Fix: cast importedProjects to any[] to avoid 'unknown' type errors
              const importedProjects = (isFullBackup ? content.projects : (Array.isArray(content) ? content : null)) as any[] | null;

              if (!importedProjects) {
                  throw new Error('Invalid file format');
              }

              await saveToHistory(projects, currentMode === 'smart' ? '合并前' : '覆盖前');

              if (currentMode === 'overwrite') {
                  if (isFullBackup) {
                      // Restore auxiliary databases
                      if (content.sellers) await db.sellers.saveAll(content.sellers);
                      if (content.consignees) await db.consignees.saveAll(content.consignees);
                      if (content.presets) await db.presets.saveAll(content.presets);
                      if (content.knowledgeBase) await db.knowledgeBase.save(content.knowledgeBase);
                      
                      // Force save projects to DB immediately
                      await db.projects.saveAll(importedProjects);
                      
                      onUpdateProjects(importedProjects);
                      alert('全量备份（包含订单、客户、供应商、预设数据库及知识库）已成功导入！\n\n页面即将刷新以应用所有更改。');
                      window.location.reload();
                  } else {
                      onUpdateProjects(importedProjects);
                      showToast('项目列表已恢复');
                  }
              } else {
                  // Smart Merge Logic
                  const merged = [...projects];
                  importedProjects.forEach((item: any) => {
                      const idx = merged.findIndex(p => p.id === item.id);
                      if (idx !== -1) {
                          if (new Date(item.updatedAt).getTime() > new Date(merged[idx].updatedAt).getTime()) merged[idx] = item;
                      } else merged.push(item);
                  });
                  onUpdateProjects(merged);

                  if (isFullBackup) {
                       showToast('订单记录已合并 (基础数据库未变更)');
                  } else {
                       showToast('导入成功');
                  }
              }
              importModeRef.current = null;
            } catch (err) { 
                console.error(err);
                alert('文件无效或格式错误'); 
                importModeRef.current = null;
            }
          };
          reader.readAsText(file);
        }} accept=".dsp,.json" className="hidden" />
        
        <div className={`px-8 py-4 text-[10px] font-bold uppercase tracking-widest border-t flex justify-between ${isNight ? 'border-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
          <span className="flex items-center gap-2"><Lock size={10} className="text-emerald-500" /> 本地快照保留最近 5 次重大操作</span>
          <span className="flex items-center gap-1"><Database size={10}/> 数据存储于您的浏览器 IndexedDB</span>
        </div>
      </div>
    </div>
  );
};
