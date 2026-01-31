
import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Cloud, Download, Trash2, FileText, Image as ImageIcon, FileSpreadsheet, File, RefreshCw, AlertTriangle, FolderOpen, Loader2, Eye } from 'lucide-react';
import { WebDavConfig } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  invoiceNo: string;
  isNight: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface WebDavFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  type: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) return <ImageIcon size={20} className="text-purple-500" />;
  if (['pdf'].includes(ext || '')) return <FileText size={20} className="text-red-500" />;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet size={20} className="text-green-500" />;
  if (['doc', 'docx', 'txt', 'md'].includes(ext || '')) return <FileText size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-400" />;
};

const PREVIEW_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  PDF: ['pdf'],
  TEXT: ['txt', 'json', 'xml', 'md', 'csv', 'log', 'dsp']
};

// 抽取文件行组件并进行 Memo 优化
const FileRow = memo(({ file, isNight, downloadingFile, onPreview, onDownload, onDelete }: any) => {
    const canPreview = PREVIEW_TYPES.IMAGE.includes(file.type) || PREVIEW_TYPES.PDF.includes(file.type) || PREVIEW_TYPES.TEXT.includes(file.type);
    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all group ${isNight ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 bg-white dark:bg-black/20 rounded-lg shadow-sm shrink-0">
                    {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-sm truncate pr-4">{file.name}</p>
                    <div className="flex items-center gap-3 text-[10px] font-medium opacity-60 uppercase tracking-wider mt-0.5">
                        <span>{formatSize(file.size)}</span>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>{file.lastModified}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {canPreview && (
                    <button 
                        onClick={() => onPreview(file)}
                        className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${isNight ? 'border-blue-500/30 text-blue-400 hover:bg-blue-900/30' : 'border-blue-100 text-blue-600 bg-white hover:bg-blue-50'}`}
                    >
                        <Eye size={16} />
                        <span className="text-xs font-bold hidden sm:inline">预览</span>
                    </button>
                )}
                <button 
                    onClick={() => onDownload(file)}
                    disabled={downloadingFile === file.name}
                    className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${isNight ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/30' : 'border-indigo-100 text-indigo-600 bg-white hover:bg-blue-50'}`}
                >
                    {downloadingFile === file.name ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
                    <span className="text-xs font-bold hidden sm:inline">下载</span>
                </button>
                <button 
                    onClick={() => onDelete(file)}
                    className={`p-2 rounded-lg border transition-all ${isNight ? 'border-red-500/30 text-red-400 hover:bg-red-900/30' : 'border-red-100 text-red-500 bg-white hover:bg-blue-50'}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
});

export const WebDavFileBrowser: React.FC<Props> = ({ invoiceNo, isNight, onClose, showToast }) => {
  const [files, setFiles] = useState<WebDavFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WebDavConfig | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<WebDavFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'text' | null>(null);
  const [previewContent, setPreviewContent] = useState<string>(''); 
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('dsp_webdav_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    else { setLoading(false); setError("未配置 WebDAV 信息"); }
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!config || !config.url) return;
    setLoading(true);
    setError(null);
    const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    const folderUrl = `${baseWebDavUrl}${encodeURIComponent(invoiceNo)}/`;
    const auth = btoa(`${config.username}:${config.password}`);
    try {
      const response = await fetch(folderUrl, {
        method: 'PROPFIND',
        headers: { 'Authorization': `Basic ${auth}`, 'Depth': '1', 'Content-Type': 'application/xml; charset=utf-8' }
      });
      if (response.status === 404) { setFiles([]); setLoading(false); return; }
      if (!response.ok && response.status !== 207) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const responses = xml.querySelectorAll("D\\:response, response"); 
      const loadedFiles: WebDavFile[] = [];
      responses.forEach(resp => {
        const href = resp.querySelector("D\\:href, href")?.textContent || "";
        const decodedHref = decodeURIComponent(href);
        const name = (decodedHref.endsWith('/') ? decodedHref.slice(0, -1) : decodedHref).split('/').pop() || "";
        if (name === invoiceNo || !name || name.includes('快照')) return;
        const propStat = resp.querySelector("D\\:propstat, propstat");
        if (propStat) {
            const prop = propStat.querySelector("D\\:prop, prop");
            if (prop?.querySelector("D\\:resourcetype D\\:collection, resourcetype collection")) return; 
            const contentLength = prop?.querySelector("D\\:getcontentlength, getcontentlength")?.textContent || "0";
            const lastMod = prop?.querySelector("D\\:getlastmodified, getlastmodified")?.textContent || "";
            loadedFiles.push({ name, path: href, size: parseInt(contentLength, 10), lastModified: lastMod ? new Date(lastMod).toLocaleString('zh-CN', { hour12: false }) : '', type: name.split('.').pop()?.toLowerCase() || 'file' });
        }
      });
      setFiles(loadedFiles);
    } catch (err: any) { setError(err.message || "无法加载文件列表"); } finally { setLoading(false); }
  }, [config, invoiceNo]);

  useEffect(() => { if (config) fetchFiles(); }, [config, fetchFiles]);

  const closePreview = useCallback(() => {
    // 强制先断开 iframe 的数据引用
    setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
    });
    setPreviewFile(null);
    setPreviewType(null);
    setPreviewContent('');
    setIsPreviewLoading(false);
  }, []);

  const handlePreview = async (file: WebDavFile) => {
    if (!config) return;
    const ext = file.type.toLowerCase();
    let type: 'image' | 'pdf' | 'text' | null = null;
    if (PREVIEW_TYPES.IMAGE.includes(ext)) type = 'image';
    else if (PREVIEW_TYPES.PDF.includes(ext)) type = 'pdf';
    else if (PREVIEW_TYPES.TEXT.includes(ext)) type = 'text';

    if (!type) { showToast("不支持预览该格式"); return; }
    
    setIsPreviewLoading(true);
    setPreviewType(type);
    setPreviewFile(file);

    const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    const fileUrl = `${baseWebDavUrl}${encodeURIComponent(invoiceNo)}/${encodeURIComponent(file.name)}`;
    const auth = btoa(`${config.username}:${config.password}`);

    try {
        const response = await fetch(fileUrl, { method: 'GET', headers: { 'Authorization': `Basic ${auth}` } });
        if (!response.ok) throw new Error("Fetch failed");
        if (type === 'text') {
            const text = await response.text();
            setPreviewContent(text);
        } else {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(objectUrl);
        }
    } catch (err) {
        showToast("预览加载失败");
        setPreviewFile(null); 
    } finally {
        setIsPreviewLoading(false);
    }
  };

  const handleDownload = async (file: WebDavFile) => {
    if (!config) return;
    setDownloadingFile(file.name);
    const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    const fileUrl = `${baseWebDavUrl}${encodeURIComponent(invoiceNo)}/${encodeURIComponent(file.name)}`;
    const auth = btoa(`${config.username}:${config.password}`);
    try {
        const response = await fetch(fileUrl, { method: 'GET', headers: { 'Authorization': `Basic ${auth}` } });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) { showToast("下载失败"); } finally { setDownloadingFile(null); }
  };

  const handleDelete = async (file: WebDavFile) => {
    if (!config || !window.confirm(`确认删除 "${file.name}"?`)) return;
    const baseWebDavUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    const fileUrl = `${baseWebDavUrl}${encodeURIComponent(invoiceNo)}/${encodeURIComponent(file.name)}`;
    const auth = btoa(`${config.username}:${config.password}`);
    try {
        const response = await fetch(fileUrl, { method: 'DELETE', headers: { 'Authorization': `Basic ${auth}` } });
        if (response.ok || response.status === 204) { showToast("文件已删除"); setFiles(prev => prev.filter(f => f.name !== file.name)); }
    } catch (err) { showToast("删除失败"); }
  };

  const themeClasses = {
    modalBg: isNight ? 'bg-slate-900/90' : 'bg-gray-900/90',
    modalContentBg: isNight ? 'bg-slate-800' : 'bg-white',
    modalBorder: isNight ? 'border-slate-700' : 'border-gray-200',
    modalText: isNight ? 'text-slate-100' : 'text-gray-800',
  };

  return (
    <ModalPortal>
      {/* 遮罩层：当预览打开时移除模糊，改为纯黑背景，减少重绘开销 */}
      <div className={`fixed inset-0 ${themeClasses.modalBg} ${!previewFile ? 'backdrop-blur-sm' : ''} z-[200] flex items-center justify-center p-4 transition-all`} onClick={onClose}>
        
        {/* 底层内容容器：预览打开时彻底 display:none，防止重绘和滚动卡顿 */}
        <div 
            className={`relative w-full max-w-3xl mx-auto rounded-3xl shadow-2xl flex flex-col ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText} max-h-[85vh] transition-all duration-300 ${previewFile ? 'hidden' : 'flex'}`} 
            onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Cloud size={20} /></div>
                <div>
                   <h3 className="text-lg font-black tracking-tight leading-tight">云端单据管理</h3>
                   <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{invoiceNo}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-[300px] custom-scrollbar">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-indigo-500">
                   <Loader2 size={32} className="animate-spin" />
                   <span className="text-xs font-bold uppercase tracking-wider">Loading...</span>
                </div>
             ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                   <AlertTriangle size={32} />
                   <span className="text-sm font-bold">{error}</span>
                   <button onClick={fetchFiles} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"><RefreshCw size={12} /> 重试</button>
                </div>
             ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                   <FolderOpen size={48} className="opacity-20" />
                   <span className="text-sm font-bold opacity-60">暂无文件</span>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-3">
                   {files.map((file) => (
                      <FileRow 
                        key={file.name} 
                        file={file} 
                        isNight={isNight} 
                        downloadingFile={downloadingFile} 
                        onPreview={handlePreview} 
                        onDownload={handleDownload} 
                        onDelete={handleDelete} 
                      />
                   ))}
                </div>
             )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-50 bg-gray-50 dark:bg-black/20 rounded-b-3xl shrink-0">
             <span>{files.length} Files</span>
             <span className="flex items-center gap-1"><Cloud size={12}/> Connected</span>
          </div>
        </div>

        {/* 独立预览层：直接挂在 Modal 根部，不作为列表的子元素变换 */}
        {previewFile && (
            <div 
                className="absolute inset-0 z-[300] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 bg-[#0a0a0a] border-b border-white/10 text-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="p-2 bg-white/10 rounded-lg shrink-0">{getFileIcon(previewFile.name)}</span>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate max-w-[200px] sm:max-w-md">{previewFile.name}</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{formatSize(previewFile.size)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(previewFile)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300" title="下载"><Download size={20} /></button>
                        <button onClick={closePreview} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-gray-300 hover:text-red-400" title="关闭"><X size={24} /></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden relative bg-[#111] flex items-center justify-center">
                    {isPreviewLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 bg-black/50 z-20">
                            <Loader2 size={48} className="animate-spin mb-4" />
                            <span className="font-bold tracking-widest uppercase text-xs">Loading...</span>
                        </div>
                    )}

                    {previewType === 'image' && previewUrl && (
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl" />
                    )}

                    {previewType === 'pdf' && previewUrl && (
                        <iframe 
                            src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
                            className="w-full h-full border-none bg-white" 
                            title="PDF Preview"
                        />
                    )}

                    {previewType === 'text' && (
                        <div className="w-full h-full max-w-5xl p-4 sm:p-10 overflow-hidden">
                            <pre className="w-full h-full bg-slate-900 rounded-xl border border-slate-700 p-6 overflow-auto custom-scrollbar shadow-2xl text-slate-300 font-mono text-xs whitespace-pre-wrap break-words">{previewContent}</pre>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </ModalPortal>
  );
};
