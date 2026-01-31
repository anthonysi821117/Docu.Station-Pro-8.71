
import { X, Upload, Download, RotateCcw, Clock, AlertTriangle, Layers, CheckCircle2, History, Database, FileJson, Trash2, Archive, CalendarDays, Eraser, Info, Cloud, Lock, ExternalLink, Loader2, FileUp, Save, UploadCloud, Folder, FileText, ReceiptText, ScrollText, Package, Stamp, Receipt, Files } from 'lucide-react';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { InvoiceProject, WebDavConfig } from '../types';
import { ModalPortal } from './ui/ModalPortal';

interface Props {
  invoiceNo: string;
  isNight: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface UploadStatus {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  message?: string;
  progress?: number;
}

type FileCategory = 'bl' | 'vat' | 'pc' | 'osd' | 'ccd' | 'ei' | 'od';

export const WebDavUploadModal: React.FC<Props> = ({ invoiceNo, isNight, onClose, showToast }) => {
  // File States
  const [blFile, setBlFile] = useState<File | null>(null);
  const [vatFiles, setVatFiles] = useState<File[]>([]);
  const [pcFiles, setPcFiles] = useState<File[]>([]);
  const [osdFiles, setOsdFiles] = useState<File[]>([]);
  const [ccdFiles, setCcdFiles] = useState<File[]>([]);
  const [eiFiles, setEiFiles] = useState<File[]>([]);
  const [odFiles, setOdFiles] = useState<File[]>([]);

  // Drag State
  const [dragOverState, setDragOverState] = useState<Record<FileCategory, boolean>>({
    bl: false, vat: false, pc: false, osd: false, ccd: false, ei: false, od: false
  });

  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('dsp_webdav_config');
    if (savedConfig) {
      setWebDavConfig(JSON.parse(savedConfig));
    }
  }, []);

  const hasValidConfig = useMemo(() => {
    return webDavConfig && webDavConfig.url && webDavConfig.username && webDavConfig.password;
  }, [webDavConfig]);

  const handleDragOver = useCallback((e: React.DragEvent, type: FileCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverState(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, type: FileCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverState(prev => ({ ...prev, [type]: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: FileCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverState(prev => ({ ...prev, [type]: false }));

    const files = Array.from(e.dataTransfer.files);

    if (type === 'bl') {
      if (files.length > 1) {
        showToast('只能拖放一个提单文件');
      } else if (files.length === 1) {
        setBlFile(files[0]);
      }
    } else {
      // Helper to add files to array states
      const addFiles = (setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        setter(prev => [...prev, ...files]);
      };

      switch (type) {
        case 'vat': addFiles(setVatFiles); break;
        case 'pc': addFiles(setPcFiles); break;
        case 'osd': addFiles(setOsdFiles); break;
        case 'ccd': addFiles(setCcdFiles); break;
        case 'ei': addFiles(setEiFiles); break;
        case 'od': addFiles(setOdFiles); break;
      }
    }
  }, [showToast]);

  const removeFile = useCallback((fileToRemove: File, type: FileCategory) => {
    if (type === 'bl') {
      setBlFile(null);
    } else {
      const removeFromFileList = (setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        setter(prev => prev.filter(file => file !== fileToRemove));
      };

      switch (type) {
        case 'vat': removeFromFileList(setVatFiles); break;
        case 'pc': removeFromFileList(setPcFiles); break;
        case 'osd': removeFromFileList(setOsdFiles); break;
        case 'ccd': removeFromFileList(setCcdFiles); break;
        case 'ei': removeFromFileList(setEiFiles); break;
        case 'od': removeFromFileList(setOdFiles); break;
      }
    }
  }, []);

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'dat'; // Default to 'dat' if no extension
  };

  const uploadFileToWebDav = async (file: File, remotePath: string, config: WebDavConfig, onProgress?: (progress: number) => void): Promise<UploadStatus> => {
    const auth = btoa(`${config.username}:${config.password}`);
    try {
      const response = await fetch(remotePath, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': file.size.toString(),
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传失败: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return { fileName: file.name, status: 'success', message: '上传成功' };
    } catch (error: any) {
      console.error(`WebDAV upload failed for ${file.name} to ${remotePath}:`, error);
      return { fileName: file.name, status: 'failed', message: error.message || '网络或服务器错误' };
    }
  };

  const hasAnyFiles = !!blFile || vatFiles.length > 0 || pcFiles.length > 0 || osdFiles.length > 0 || ccdFiles.length > 0 || eiFiles.length > 0 || odFiles.length > 0;

  const handleUploadAll = async () => {
    if (!hasValidConfig) {
      showToast('请先在同步设置中配置有效的 WebDAV 连接信息');
      setOverallStatus('failed');
      return;
    }
    if (!hasAnyFiles) {
      showToast('请至少拖入一个文件');
      setOverallStatus('idle');
      return;
    }

    setIsUploading(true);
    setOverallStatus('processing');
    setUploadStatuses([]);

    const baseWebDavUrl = webDavConfig!.url.endsWith('/') ? webDavConfig!.url : `${webDavConfig!.url}/`;
    const documentFolder = `${baseWebDavUrl}${encodeURIComponent(invoiceNo)}`;

    try {
      // 1. Create document folder
      // showToast(`尝试创建 WebDAV 文件夹: ${invoiceNo}`);
      const auth = btoa(`${webDavConfig!.username}:${webDavConfig!.password}`);
      
      const checkFolderResponse = await fetch(documentFolder, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '0' // Only check the folder itself
        }
      });

      if (checkFolderResponse.status === 404) { // Folder does not exist, create it
        const mkcolResponse = await fetch(documentFolder, {
          method: 'MKCOL',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });
        if (!mkcolResponse.ok) {
          const errorText = await mkcolResponse.text();
          throw new Error(`无法创建文件夹: ${mkcolResponse.status} ${mkcolResponse.statusText} - ${errorText}`);
        }
        // showToast('文件夹创建成功');
      } else if (!checkFolderResponse.ok && checkFolderResponse.status !== 207) { // 207 Multi-Status is also OK for PROPFIND
         const errorText = await checkFolderResponse.text();
         throw new Error(`检查文件夹失败: ${checkFolderResponse.status} ${checkFolderResponse.statusText} - ${errorText}`);
      }
      // If folder exists or created, proceed
    } catch (error: any) {
      setOverallStatus('failed');
      setUploadStatuses([{ fileName: invoiceNo, status: 'failed', message: error.message || '文件夹操作失败' }]);
      showToast(error.message || '文件夹操作失败');
      setIsUploading(false);
      return;
    }

    // 2. Upload files
    const allFilesToUpload: { file: File, remoteName: string }[] = [];

    const addFilesToQueue = (files: File[] | File | null, prefix: string, isSingle: boolean = false) => {
        if (!files) return;
        if (isSingle && files instanceof File) {
            const ext = getFileExtension(files.name);
            allFilesToUpload.push({ file: files, remoteName: `${invoiceNo}_${prefix}.${ext}` });
        } else if (Array.isArray(files)) {
            files.forEach((file, index) => {
                const ext = getFileExtension(file.name);
                allFilesToUpload.push({ file, remoteName: `${invoiceNo}_${prefix}_${index + 1}.${ext}` });
            });
        }
    };

    addFilesToQueue(blFile, 'BL', true);
    addFilesToQueue(vatFiles, 'VAT');
    addFilesToQueue(pcFiles, 'PurchaseContract');
    addFilesToQueue(osdFiles, 'ShippingDoc');
    addFilesToQueue(ccdFiles, 'CustomsDoc');
    addFilesToQueue(eiFiles, 'ExpenseInvoice');
    addFilesToQueue(odFiles, 'OtherDoc');

    const results: UploadStatus[] = [];
    for (const item of allFilesToUpload) {
      setUploadStatuses(prev => [...prev, { fileName: item.file.name, status: 'uploading', progress: 0, message: '开始上传...' }]);
      const remoteFilePath = `${documentFolder}/${encodeURIComponent(item.remoteName)}`;
      
      const updateProgress = (progress: number) => {
        setUploadStatuses(prev => prev.map(s => s.fileName === item.file.name ? { ...s, progress } : s));
      };

      const result = await uploadFileToWebDav(item.file, remoteFilePath, webDavConfig!, updateProgress);
      results.push(result);
      setUploadStatuses(prev => prev.map(s => s.fileName === item.file.name ? result : s));
    }

    const allSuccess = results.every(r => r.status === 'success');
    setOverallStatus(allSuccess ? 'success' : 'failed');
    showToast(allSuccess ? '所有单据上传完成！' : '部分单据上传失败，请检查');
    setIsUploading(false);
  };

  const themeClasses = {
    modalBg: isNight ? 'bg-slate-900/90' : 'bg-gray-900/90',
    modalContentBg: isNight ? 'bg-slate-800' : 'bg-white',
    modalBorder: isNight ? 'border-slate-700' : 'border-gray-200',
    modalText: isNight ? 'text-slate-100' : 'text-gray-800',
    dropZoneBg: isNight ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-300',
    dropZoneHoverBg: isNight ? 'bg-indigo-900/40 border-indigo-500' : 'bg-indigo-50 border-indigo-400',
    fileItemBg: isNight ? 'bg-slate-700' : 'bg-gray-100',
    fileItemBorder: isNight ? 'border-slate-600' : 'border-gray-200',
  };

  const renderDropZone = (
    key: FileCategory, 
    label: string, 
    subLabel: string, 
    icon: any, 
    files: File | File[] | null,
    isMultiple: boolean,
    colorClass: string
  ) => {
    const Icon = icon;
    const fileList = isMultiple ? (files as File[]) : (files ? [files as File] : []);
    const isOver = dragOverState[key];

    return (
        <div 
            onDragOver={(e) => handleDragOver(e, key)} 
            onDragLeave={(e) => handleDragLeave(e, key)} 
            onDrop={(e) => handleDrop(e, key)}
            className={`flex-1 p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col justify-start relative ${themeClasses.dropZoneBg} ${isOver ? themeClasses.dropZoneHoverBg : ''} min-h-[140px]`}
        >
            {fileList.length > 0 ? (
            <div className="space-y-2 w-full max-h-[120px] overflow-y-auto custom-scrollbar z-10">
                {fileList.map((file, index) => (
                <div key={index} className={`${themeClasses.fileItemBg} ${themeClasses.fileItemBorder} p-2 rounded-lg flex items-center justify-between shadow-sm`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <Icon size={16} className={colorClass} />
                        <span className="text-xs font-bold truncate">{file.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(file, key); }} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                </div>
                ))}
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 pointer-events-none">
                <Icon size={24} className={isOver ? colorClass : 'text-gray-300'} />
                <p className="mt-2 text-xs font-bold">{label}</p>
                <p className="text-[10px] opacity-60">{subLabel}</p>
            </div>
            )}
            {fileList.length > 0 && (
                <div className="absolute top-2 right-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isNight ? 'bg-black/30' : 'bg-gray-200'}`}>{fileList.length}</span>
                </div>
            )}
        </div>
    );
  };

  return (
    <ModalPortal>
      <div className={`fixed inset-0 ${themeClasses.modalBg} backdrop-blur-sm z-[200] flex items-center justify-center p-4`} onClick={onClose}>
        <div className={`relative w-full max-w-5xl mx-auto rounded-3xl shadow-2xl p-8 flex flex-col ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText} max-h-[90vh]`} onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
          
          <div className="mb-6">
            <h3 className="text-2xl font-black flex items-center gap-3">
                <UploadCloud size={28} className="text-indigo-500" />
                上传单据到 WebDAV
            </h3>
            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                <Folder size={16} /> 目标文件夹: <span className="font-bold text-indigo-400">{invoiceNo}</span>
            </p>
          </div>

          {!hasValidConfig && (
            <div className={`p-4 mb-4 rounded-xl flex items-center gap-3 text-sm ${isNight ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'}`}>
              <AlertTriangle size={20} />
              请在“同步与历史中心”中配置有效的 WebDAV URL、用户名和密码。
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. 提单 */}
                {renderDropZone('bl', '提单 (Bill of Lading)', '单份文件', FileText, blFile, false, 'text-blue-400')}
                
                {/* 2. 增值税发票 */}
                {renderDropZone('vat', '增值税发票 (VAT)', '多份文件', ReceiptText, vatFiles, true, 'text-green-400')}
                
                {/* 3. 采购合同 */}
                {renderDropZone('pc', '采购合同 (Contracts)', '多份文件', ScrollText, pcFiles, true, 'text-orange-400')}
                
                {/* 4. 出货原始资料 */}
                {renderDropZone('osd', '出货原始资料 (Shipping Docs)', '多份文件', Package, osdFiles, true, 'text-purple-400')}
                
                {/* 5. 清关单据 */}
                {renderDropZone('ccd', '清关单据 (Customs Docs)', '多份文件', Stamp, ccdFiles, true, 'text-indigo-400')}
                
                {/* 6. 费用发票 */}
                {renderDropZone('ei', '费用发票 (Expenses)', '多份文件', Receipt, eiFiles, true, 'text-pink-400')}
                
                {/* 7. 其他单据 */}
                {renderDropZone('od', '其他单据 (Others)', '多份文件', Files, odFiles, true, 'text-gray-400')}
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUploadAll}
            disabled={isUploading || !hasAnyFiles || !hasValidConfig}
            className={`w-full py-4 rounded-2xl text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              isUploading 
                ? 'bg-indigo-900/50 text-indigo-400 cursor-not-allowed' 
                : !hasAnyFiles || !hasValidConfig
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl active:scale-95'
            }`}
          >
            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
            {isUploading ? '正在上传...' : `确认上传所有文件`}
          </button>

          {/* Upload Statuses */}
          {uploadStatuses.length > 0 && (
            <div className={`mt-4 p-4 rounded-xl border ${isNight ? 'bg-slate-900/50 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-gray-500">
                <Info size={12} /> 任务队列 ({uploadStatuses.length})
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {uploadStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between text-[11px] font-medium">
                    <span className="flex-1 truncate opacity-80">
                      {status.fileName}
                    </span>
                    <div className="flex items-center gap-2 ml-4 min-w-[100px] justify-end">
                      {status.status === 'uploading' && <Loader2 size={10} className="animate-spin text-indigo-400" />}
                      {status.status === 'success' && <CheckCircle2 size={10} className="text-green-500" />}
                      {status.status === 'failed' && <AlertTriangle size={10} className="text-red-500" />}
                      <span className={`${
                        status.status === 'success' ? 'text-green-500' :
                        status.status === 'failed' ? 'text-red-500' :
                        'text-gray-400'
                      }`}>
                        {status.message || status.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overallStatus === 'success' && (
            <div className={`mt-4 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-in slide-in-from-bottom-2 ${isNight ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'}`}>
              <CheckCircle2 size={20} />
              所有文件已成功上传!
            </div>
          )}
          {overallStatus === 'failed' && uploadStatuses.some(s => s.status === 'failed') && (
            <div className={`mt-4 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-in slide-in-from-bottom-2 ${isNight ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'}`}>
              <AlertTriangle size={20} />
              部分文件上传失败，请检查日志并重试。
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};
