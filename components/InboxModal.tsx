
import React, { useState, useEffect, useCallback } from 'react';
import { X, Cloud, Download, Trash2, FileJson, RefreshCw, AlertTriangle, FolderOpen, Loader2, Import, FileText, CheckCircle2 } from 'lucide-react';
import { WebDavConfig, DSPImportPacket } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  onClose: () => void;
  onImport: (data: DSPImportPacket, fileName: string) => void;
  isNight: boolean;
  showToast: (msg: string) => void;
}

interface InboxFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

const INBOX_FOLDER = '/DSP_INBOX/';

export const InboxModal: React.FC<Props> = ({ onClose, onImport, isNight, showToast }) => {
  const [files, setFiles] = useState<InboxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WebDavConfig | null>(null);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('dsp_webdav_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    } else {
      setLoading(false);
      setError("未配置 WebDAV 信息，请在【同步与历史中心】配置。");
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!config || !config.url) return;
    setLoading(true);
    setError(null);
    setPreviewContent(null);

    const baseWebDavUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
    // Ensure we are looking at the root relative to the WebDAV endpoint plus our inbox folder
    // Some WebDAV implementations might need adjustments here depending on the root mount point
    const folderUrl = `${baseWebDavUrl}${INBOX_FOLDER}`;
    const auth = btoa(`${config.username}:${config.password}`);

    try {
      const response = await fetch(folderUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '1',
          'Content-Type': 'application/xml; charset=utf-8'
        }
      });

      if (response.status === 404) {
        // Try to create the folder if it doesn't exist
        try {
            await fetch(folderUrl, {
                method: 'MKCOL',
                headers: { 'Authorization': `Basic ${auth}` }
            });
            setFiles([]); // Created empty folder
        } catch (e) {
            setError(`无法创建收件箱文件夹 (${INBOX_FOLDER})`);
        }
        setLoading(false);
        return;
      }

      if (!response.ok && response.status !== 207) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const responses = xml.querySelectorAll("D\\:response, response");

      const loadedFiles: InboxFile[] = [];

      responses.forEach(resp => {
        const href = resp.querySelector("D\\:href, href")?.textContent || "";
        const decodedHref = decodeURIComponent(href);
        const name = decodedHref.endsWith('/') ? '' : decodedHref.split('/').pop() || "";

        if (!name || name.startsWith('.')) return; // Skip folder itself and hidden files

        const propStat = resp.querySelector("D\\:propstat, propstat");
        if (propStat) {
            const prop = propStat.querySelector("D\\:prop, prop");
            const isCollection = prop?.querySelector("D\\:resourcetype D\\:collection, resourcetype collection");
            if (isCollection) return; 

            const contentLength = prop?.querySelector("D\\:getcontentlength, getcontentlength")?.textContent || "0";
            const lastMod = prop?.querySelector("D\\:getlastmodified, getlastmodified")?.textContent || "";

            if (name.toLowerCase().endsWith('.json')) {
                loadedFiles.push({
                    name: name,
                    path: href,
                    size: parseInt(contentLength, 10),
                    lastModified: lastMod ? new Date(lastMod).toLocaleString('zh-CN', { hour12: false }) : '',
                });
            }
        }
      });

      // Sort by newest first
      loadedFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      setFiles(loadedFiles);
    } catch (err: any) {
      console.error("WebDAV Fetch Error:", err);
      setError(err.message || "无法加载收件箱");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      fetchFiles();
    }
  }, [config, fetchFiles]);

  const handleProcessFile = async (file: InboxFile, action: 'import' | 'preview') => {
    if (!config) return;
    setProcessingFile(file.name);
    
    // Construct URL. Note: file.path from PROPFIND is usually absolute path on server. 
    // We construct full URL using config.url base.
    // However, WebDAV hrefs usually include the path context. 
    // Best practice for fetch is to combine base origin with the href path.
    
    // Simplification: Assume file.path works if we prepend the origin if missing, 
    // or use the constructed URL strategy if file.path is relative.
    // Let's use the consistent construction strategy we used in upload:
    const baseWebDavUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
    const fileUrl = `${baseWebDavUrl}${INBOX_FOLDER}${encodeURIComponent(file.name)}`;
    
    const auth = btoa(`${config.username}:${config.password}`);

    try {
        const response = await fetch(fileUrl, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!response.ok) throw new Error("Download failed");

        const jsonText = await response.text();
        
        if (action === 'preview') {
            setPreviewContent(jsonText);
        } else {
            try {
                const data = JSON.parse(jsonText);
                onImport(data, file.name);
                // Prompt to delete
                if (window.confirm(`导入成功！是否从收件箱删除文件 "${file.name}"？`)) {
                    await handleDelete(file);
                } else {
                    showToast('文件已保留在收件箱');
                }
            } catch (e) {
                alert("JSON 格式解析错误，请检查文件内容");
            }
        }
    } catch (err) {
        showToast("操作失败，请检查网络");
    } finally {
        setProcessingFile(null);
    }
  };

  const handleDelete = async (file: InboxFile) => {
    if (!config) return;
    const baseWebDavUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
    const fileUrl = `${baseWebDavUrl}${INBOX_FOLDER}${encodeURIComponent(file.name)}`;
    const auth = btoa(`${config.username}:${config.password}`);

    try {
        await fetch(fileUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Basic ${auth}` }
        });
        setFiles(prev => prev.filter(f => f.name !== file.name));
        showToast("文件已删除");
        if (previewContent) setPreviewContent(null); // Clear preview if deleted
    } catch (err) {
        showToast("删除失败");
    }
  };

  const themeClasses = {
    bg: isNight ? 'bg-slate-900' : 'bg-white',
    text: isNight ? 'text-slate-100' : 'text-gray-800',
    border: isNight ? 'border-slate-700' : 'border-gray-200',
    itemBg: isNight ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100',
    codeBg: isNight ? 'bg-black/50 border-white/10' : 'bg-slate-50 border-gray-200',
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className={`w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`} onClick={e => e.stopPropagation()}>
          
          <div className="px-8 py-5 border-b shrink-0 flex justify-between items-center bg-indigo-600 text-white">
             <div className="flex items-center gap-4">
               <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                 <Cloud size={24} className="text-white" />
               </div>
               <div>
                 <h2 className="text-lg font-black tracking-tight uppercase">云端数据收件箱</h2>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Sync from n8n Automation</p>
               </div>
             </div>
             <div className="flex gap-2">
                <button onClick={fetchFiles} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="刷新">
                    <RefreshCw size={20} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                </button>
             </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
             {/* Left: File List */}
             <div className={`w-1/3 flex flex-col border-r ${themeClasses.border} ${isNight ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                <div className="p-4 border-b shrink-0 flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase">Inbox Files ({files.length})</span>
                    <span className="text-[10px] font-mono">{INBOX_FOLDER}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-indigo-500">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="text-xs font-bold">Connecting...</span>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-400">
                            <AlertTriangle size={24} className="mx-auto mb-2" />
                            <p className="text-xs font-bold">{error}</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-40">
                            <FolderOpen size={32} className="mb-2" />
                            <p className="text-xs font-bold">收件箱为空</p>
                        </div>
                    ) : (
                        files.map((file) => (
                            <div key={file.name} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all group ${themeClasses.itemBg} ${themeClasses.border}`}>
                                <div className="flex items-start gap-3">
                                    <FileJson size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold truncate leading-tight mb-1">{file.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] opacity-60">
                                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span>{file.lastModified}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <button 
                                        onClick={() => handleProcessFile(file, 'preview')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${isNight ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/30' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        预览
                                    </button>
                                    <button 
                                        onClick={() => handleProcessFile(file, 'import')}
                                        disabled={!!processingFile}
                                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                                    >
                                        {processingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : <Import size={12} />}
                                        导入
                                    </button>
                                    <button 
                                        onClick={() => { if(window.confirm('确定删除?')) handleDelete(file); }}
                                        className={`p-1.5 rounded-lg border transition-colors ${isNight ? 'border-red-500/30 text-red-400 hover:bg-red-900/30' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>

             {/* Right: Preview Area */}
             <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black/20 p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500"/>
                        JSON 预览
                    </h3>
                    {previewContent && (
                        <span className="text-[10px] font-mono opacity-50">Read-Only</span>
                    )}
                </div>
                <div className={`flex-1 rounded-xl border p-4 overflow-auto custom-scrollbar font-mono text-xs whitespace-pre-wrap break-words ${themeClasses.codeBg}`}>
                    {previewContent ? previewContent : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                            <FileJson size={48} />
                            <p>选择左侧文件进行预览或导入</p>
                        </div>
                    )}
                </div>
                {previewContent && (
                    <div className="mt-4 p-3 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">导入提示</p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                点击“导入”后，系统会自动将数据解析并合并到当前网格。如果检测到中文品名，会自动应用本地预设（HS编码、申报要素等）进行补全。
                            </p>
                        </div>
                    </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
