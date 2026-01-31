
import React, { useState, useEffect, memo, useCallback } from 'react';
import { X, Building2, Download, Import, Star, Pencil, Trash2, Users, Database, Sparkles, Loader2, Upload, Ship, ExternalLink, Globe, MapPin } from 'lucide-react';
import { Seller, Consignee, ProductPreset, CustomTheme, HeaderInfo } from '../types';
import { ModalPortal } from './ui/ModalPortal';
import { ModalInput, ModalTextarea } from './ui/SharedInputs';
import { GoogleGenAI, Type } from "@google/genai";

interface BaseModalProps {
  onClose: () => void;
  isNight: boolean;
  themeMode: string;
  customTheme?: CustomTheme;
  themeClasses: any;
}

// --- Missing Prop Interfaces ---

// Fix: Added SellerModalProps interface
interface SellerModalProps extends BaseModalProps {
  savedSellers: Seller[];
  onUpdateSellers: (sellers: Seller[]) => void;
  onSelect: (s: Seller) => void;
  downloadFile: (filename: string, text: string) => void;
}

// Fix: Added ConsigneeModalProps interface
interface ConsigneeModalProps extends BaseModalProps {
  savedConsignees: Consignee[];
  onUpdateConsignees: (consignees: Consignee[]) => void;
  onSelect: (c: Consignee) => void;
  downloadFile: (filename: string, text: string) => void;
}

// Fix: Added PresetModalProps interface
interface PresetModalProps extends BaseModalProps {
  savedPresets: ProductPreset[];
  onUpdatePresets: (presets: ProductPreset[]) => void;
  downloadFile: (filename: string, text: string) => void;
}

// Fix: Added BatchModalProps interface
interface BatchModalProps extends BaseModalProps {
  onImport: (text: string) => void;
  header: HeaderInfo;
}

// Fix: Added ImportModalProps interface
interface ImportModalProps extends BaseModalProps {
  title: string;
  placeholder: string;
  onImport: (text: string) => void;
}

// --- New Container Tracking Modal ---
interface TrackingModalProps extends BaseModalProps {
  containerNo: string;
}

export const ContainerTrackingModal = memo<TrackingModalProps>(({ onClose, isNight, themeClasses, containerNo }) => {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<{ carrier: string, officialUrl: string, globalUrl: string, note: string } | null>(null);

    const identifyAndTrack = useCallback(async () => {
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `分析集装箱号: ${containerNo}。
                1. 识别其所属的船公司（根据前4位前缀）。
                2. 提供该船公司的官方货物追踪(Tracking)页面URL。
                3. 提供一个通用的全球追踪平台URL(如 track-trace.com)。
                请以 JSON 格式返回。`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            carrier: { type: Type.STRING, description: "识别出的船公司名称" },
                            officialUrl: { type: Type.STRING, description: "船公司官网追踪链接" },
                            globalUrl: { type: Type.STRING, description: "第三方通用查询链接" },
                            note: { type: Type.STRING, description: "温馨提示或小知识" }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || '{}');
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [containerNo]);

    useEffect(() => {
        if (containerNo) identifyAndTrack();
    }, [containerNo, identifyAndTrack]);

    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className={`relative w-full max-w-md mx-auto rounded-3xl shadow-2xl p-8 flex flex-col ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText}`} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                    
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-500/20">
                            <Ship size={32} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">集装箱智能追踪</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Smart Container Tracker</p>
                    </div>

                    <div className={`p-4 rounded-2xl mb-6 flex flex-col items-center justify-center ${isNight ? 'bg-black/40' : 'bg-slate-50 border border-slate-100'}`}>
                        <span className="text-[10px] font-bold uppercase text-indigo-500 mb-1">正在查询箱号</span>
                        <span className="text-2xl font-black font-mono tracking-widest">{containerNo}</span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                            <span className="text-xs font-bold text-gray-500 animate-pulse">正在识别船公司前缀...</span>
                        </div>
                    ) : result ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Globe size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">识别结果 (Carrier)</p>
                                    <p className="font-black text-lg truncate">{result.carrier}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-4">
                                <a 
                                    href={result.officialUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                                >
                                    <Ship size={16} /> 前往官网追踪
                                </a>
                                <a 
                                    href={result.globalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={`w-full py-4 border-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isNight ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <MapPin size={16} /> 通用平台查询
                                </a>
                            </div>

                            {result.note && (
                                <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-relaxed flex gap-2">
                                    <Sparkles size={14} className="shrink-0 mt-0.5" />
                                    <span>{result.note}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-red-500 font-bold text-sm">无法识别或连接超时</div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
});

// Fix: Added missing ImportModal component
const ImportModal = memo<ImportModalProps>(({ title, placeholder, onClose, onImport, isNight, themeClasses, themeMode, customTheme }) => {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
            <div className={`w-full max-w-2xl p-6 rounded-lg shadow-xl ${themeClasses.modalContentBg}`} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <ModalTextarea isNight={isNight} themeMode={themeMode} customTheme={customTheme} rows={10} value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} className="mb-4" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonSecondary}`}>Cancel</button>
                    <button onClick={() => { onImport(text); onClose(); }} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonPrimary}`}>Import</button>
                </div>
            </div>
        </div>
    );
});

export const SellerModal = memo<SellerModalProps>(({ onClose, isNight, themeMode, customTheme, themeClasses, savedSellers, onUpdateSellers, onSelect, downloadFile }) => {
    const [localSellers, setLocalSellers] = useState(savedSellers);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Seller>({ id: '', nameCn: '', nameEn: '', address: '', uscc: '', customsCode: '', isDefault: false });
    const [showImport, setShowImport] = useState(false);

    useEffect(() => setLocalSellers(savedSellers), [savedSellers]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);

    const handleSave = () => {
        if (!formData.nameCn && !formData.nameEn) { alert("请输入发货人名称"); return; }
        let updated = [...localSellers];
        const newSeller = { ...formData, id: editingId || Date.now().toString() };
        
        if (newSeller.isDefault) updated = updated.map(s => ({ ...s, isDefault: false }));
        else if (updated.length === 0) newSeller.isDefault = true;

        if (editingId) updated = updated.map(s => s.id === editingId ? newSeller : s);
        else updated.push(newSeller);

        onUpdateSellers(updated);
        setFormData({ id: '', nameCn: '', nameEn: '', address: '', uscc: '', customsCode: '', isDefault: false });
        setEditingId(null);
    };

    const handleEdit = (s: Seller) => { setFormData(s); setEditingId(s.id); };
    const handleDelete = (id: string) => { if(window.confirm("Delete this seller?")) onUpdateSellers(localSellers.filter(s => s.id !== id)); };
    const handleSetDefault = (id: string) => onUpdateSellers(localSellers.map(s => ({ ...s, isDefault: s.id === id })));
    const handleCancelEdit = () => { setFormData({ id: '', nameCn: '', nameEn: '', address: '', uscc: '', customsCode: '', isDefault: false }); setEditingId(null); };

    const handleExport = () => {
        const headers = "nameCn\tnameEn\taddress\tuscc\tcustomsCode\tinvoiceSealBase64\tcustomsSealBase64\tisDefault";
        const data = localSellers.map(s => `${s.nameCn||''}\t${s.nameEn||''}\t${s.address||''}\t${s.uscc||''}\t${s.customsCode||''}\t${s.invoiceSealBase64||''}\t${s.customsSealBase64||''}\t${s.isDefault?'true':'false'}`).join('\n');
        downloadFile('sellers_export.txt', `${headers}\n${data}`);
    };

    const handleImport = (text: string) => {
        const rows = text.trim().split('\n').filter(r => r.trim());
        if(!rows.length) return;
        const newSellers: Seller[] = [];
        rows.slice(1).forEach((row, i) => {
            const c = row.split('\t');
            if(c[0] || c[1]) newSellers.push({ id: Date.now().toString()+i, nameCn: c[0]||'', nameEn: c[1]||'', address: c[2]||'', uscc: c[3]||'', customsCode: c[4]||'', invoiceSealBase64: c[5]||'', customsSealBase64: c[6]||'', isDefault: c[7]==='true' });
        });
        onUpdateSellers([...localSellers, ...newSellers]);
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className={`relative w-full max-w-4xl rounded-lg shadow-2xl p-6 ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText}`} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Building2 size={24}/> Manage Sellers</h3>
                    
                    <div className="flex justify-end gap-2 mb-4">
                        <button onClick={handleExport} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ${themeClasses.modalButtonPrimary}`}><Download size={14}/> Export</button>
                        <button onClick={() => setShowImport(true)} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ${themeClasses.modalButtonPrimary}`}><Import size={14}/> Import</button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="公司名称 (CN)" name="nameCn" value={formData.nameCn} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Company Name (EN)" name="nameEn" value={formData.nameEn} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Address" name="address" value={formData.address} onChange={handleChange} className="col-span-2"/>
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="USCC" name="uscc" value={formData.uscc} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Customs Code" name="customsCode" value={formData.customsCode} onChange={handleChange} />
                        <div className="col-span-2 flex items-center gap-2 px-2">
                            <input type="checkbox" name="isDefault" checked={!!formData.isDefault} onChange={handleChange} className="w-4 h-4"/>
                            <label className="text-xs font-bold">Set as Default</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mb-6">
                        {editingId && <button onClick={handleCancelEdit} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonSecondary}`}>Cancel</button>}
                        <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonPrimary}`}>{editingId ? 'Update' : 'Add'}</button>
                    </div>

                    <h4 className="font-bold text-lg mb-3">Saved Sellers</h4>
                    <div className={`border rounded-lg overflow-y-auto no-scrollbar h-[256px] ${themeClasses.modalBorder}`}>
                        {localSellers.length === 0 && <p className="p-4 text-center opacity-50">No sellers.</p>}
                        {localSellers.map(s => (
                            <div key={s.id} className={`flex items-center justify-between p-3 border-b last:border-0 ${themeClasses.modalBorder} hover:bg-black/5 dark:hover:bg-white/5`}>
                                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                    <button onClick={() => handleSetDefault(s.id)}><Star size={18} className={s.isDefault ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}/></button>
                                    <div className="truncate">
                                        <p className="font-bold text-sm truncate">{s.nameCn}</p>
                                        <p className="text-[10px] opacity-60 truncate">{s.nameEn}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { onSelect(s); onClose(); }} className={`px-3 py-1 rounded text-xs font-bold ${themeClasses.modalButtonPrimary}`}>Select</button>
                                    <button onClick={() => handleEdit(s)} className="p-1 text-blue-400"><Pencil size={16}/></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-1 text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {showImport && <ImportModal title="Import Sellers" placeholder="nameCn\tnameEn\taddress..." onClose={() => setShowImport(false)} onImport={handleImport} isNight={isNight} themeClasses={themeClasses} themeMode={themeMode} customTheme={customTheme} />}
            </div>
        </ModalPortal>
    );
});

export const ConsigneeModal = memo<ConsigneeModalProps>(({ onClose, isNight, themeMode, customTheme, themeClasses, savedConsignees, onUpdateConsignees, onSelect, downloadFile }) => {
    const [localConsignees, setLocalConsignees] = useState(savedConsignees);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Consignee>({ id: '', name: '', address: '', country: '' });
    const [showImport, setShowImport] = useState(false);

    useEffect(() => setLocalConsignees(savedConsignees), [savedConsignees]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSave = () => {
        if (!formData.name) { alert("Please enter name"); return; }
        let updated = [...localConsignees];
        const newItem = { ...formData, id: editingId || Date.now().toString() };
        if (editingId) updated = updated.map(i => i.id === editingId ? newItem : i);
        else updated.push(newItem);
        onUpdateConsignees(updated);
        setFormData({ id: '', name: '', address: '', country: '' });
        setEditingId(null);
    };

    const handleEdit = (c: Consignee) => { setFormData(c); setEditingId(c.id); };
    const handleDelete = (id: string) => { if(window.confirm("Delete?")) onUpdateConsignees(localConsignees.filter(c => c.id !== id)); };
    const handleCancel = () => { setFormData({ id: '', name: '', address: '', country: '' }); setEditingId(null); };

    const handleImport = (text: string) => {
        const rows = text.trim().split('\n').filter(r => r.trim());
        const newItems: Consignee[] = rows.slice(1).map((row, i) => {
            const c = row.split('\t');
            return { id: Date.now().toString()+i, name: c[0]||'', address: c[1]||'', country: c[2]||'' };
        }).filter(i => i.name);
        onUpdateConsignees([...localConsignees, ...newItems]);
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className={`relative w-full max-w-4xl rounded-lg shadow-2xl p-6 ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText}`} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Users size={24}/> Manage Consignees</h3>
                    <div className="flex justify-end gap-2 mb-4">
                        <button onClick={() => setShowImport(true)} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ${themeClasses.modalButtonPrimary}`}><Import size={14}/> Import</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Consignee Name" name="name" value={formData.name} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Address" name="address" value={formData.address} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Country" name="country" value={formData.country} onChange={handleChange} />
                    </div>
                    <div className="flex justify-end gap-3 mb-6">
                        {editingId && <button onClick={handleCancel} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonSecondary}`}>Cancel</button>}
                        <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonPrimary}`}>{editingId ? 'Update' : 'Add'}</button>
                    </div>
                    <h4 className="font-bold text-lg mb-3">Saved Consignees</h4>
                    <div className={`border rounded-lg overflow-y-auto no-scrollbar h-[256px] ${themeClasses.modalBorder}`}>
                        {localConsignees.map(c => (
                            <div key={c.id} className={`flex items-center justify-between p-3 border-b last:border-0 ${themeClasses.modalBorder} hover:bg-black/5 dark:hover:bg-white/5`}>
                                <div className="truncate flex-1 pr-4">
                                    <p className="font-bold text-sm truncate">{c.name}</p>
                                    <p className="text-[10px] opacity-60 truncate">{c.address}, {c.country}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => { onSelect(c); onClose(); }} className={`px-3 py-1 rounded text-xs font-bold ${themeClasses.modalButtonPrimary}`}>Select</button>
                                    <button onClick={() => handleEdit(c)} className="p-1 text-blue-400"><Pencil size={16}/></button>
                                    <button onClick={() => handleDelete(c.id)} className="p-1 text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {showImport && <ImportModal title="Import Consignees" placeholder="name\taddress\tcountry" onClose={() => setShowImport(false)} onImport={handleImport} isNight={isNight} themeClasses={themeClasses} themeMode={themeMode} customTheme={customTheme} />}
            </div>
        </ModalPortal>
    );
});

export const PresetModal = memo<PresetModalProps>(({ onClose, isNight, themeMode, customTheme, themeClasses, savedPresets, onUpdatePresets, downloadFile }) => {
    const [localPresets, setLocalPresets] = useState(savedPresets);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductPreset>({ id: '', remark: '', cnName: '', enName: '', hsCode: '', unit: '', declarationElements: '', vatRate: 13, taxRefundRate: 13 });
    const [showImport, setShowImport] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => setLocalPresets(savedPresets), [savedPresets]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSave = () => {
        if (!formData.remark || !formData.cnName) { alert("Remark & CN Name required"); return; }
        let updated = [...localPresets];
        const newItem = { 
            ...formData, 
            id: editingId || Date.now().toString(),
            vatRate: formData.vatRate !== undefined ? Number(formData.vatRate) : 13,
            taxRefundRate: formData.taxRefundRate !== undefined ? Number(formData.taxRefundRate) : 13,
        };
        if (editingId) updated = updated.map(p => p.id === editingId ? newItem : p);
        else {
            const idx = updated.findIndex(p => p.remark === newItem.remark);
            if (idx !== -1) { if(!confirm("Overwrite?")) return; updated[idx] = newItem; }
            else updated.push(newItem);
        }
        onUpdatePresets(updated);
        setFormData({ id: '', remark: '', cnName: '', enName: '', hsCode: '', unit: '', declarationElements: '', vatRate: 13, taxRefundRate: 13 });
        setEditingId(null);
    };

    const handleEdit = (p: ProductPreset) => { setFormData({ ...p, vatRate: p.vatRate ?? 13, taxRefundRate: p.taxRefundRate ?? 13 }); setEditingId(p.id); };
    const handleDelete = (id: string) => { if(confirm("Delete?")) onUpdatePresets(localPresets.filter(p => p.id !== id)); };
    const handleCancel = () => { setFormData({ id: '', remark: '', cnName: '', enName: '', hsCode: '', unit: '', declarationElements: '', vatRate: 13, taxRefundRate: 13 }); setEditingId(null); };

    const handleAi = async () => {
        if(!formData.cnName) return;
        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate trade data for: ${formData.cnName}. Return JSON: { "enName": "string", "hsCode": "string", "declarationElements": "string" }`,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { enName: { type: Type.STRING }, hsCode: { type: Type.STRING }, declarationElements: { type: Type.STRING } } } }
            });
            const res = JSON.parse(response.text || '{}');
            setFormData(prev => ({ ...prev, ...res, remark: prev.remark || prev.cnName }));
        } catch(e) { alert("AI Failed"); } finally { setIsAiLoading(false); }
    };

    const handleImport = (text: string) => {
        const rows = text.trim().split('\n').filter(r => r.trim());
        const newItems: ProductPreset[] = rows.slice(1).map((row, i) => {
            const c = row.split('\t');
            return { 
                id: Date.now().toString()+i, 
                remark: c[0]||'', 
                cnName: c[1]||'', 
                enName: c[2]||'', 
                hsCode: c[3]||'', 
                unit: c[4]||'', 
                declarationElements: c[5]||'',
                vatRate: parseFloat(c[6]) || 13,
                taxRefundRate: parseFloat(c[7]) || 13
            };
        }).filter(i => i.remark);
        onUpdatePresets([...localPresets, ...newItems]);
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className={`relative w-full max-w-7xl rounded-lg shadow-2xl p-6 ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText}`} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Database size={24}/> Manage Presets</h3>
                    <div className="flex justify-end gap-2 mb-4">
                        <button onClick={() => setShowImport(true)} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ${themeClasses.modalButtonPrimary}`}><Import size={14}/> Import</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="col-span-1 flex items-end gap-1">
                            <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="CN Name" name="cnName" value={formData.cnName} onChange={handleChange} className="flex-1"/>
                            <button onClick={handleAi} disabled={isAiLoading} className="p-2 bg-indigo-600 text-white rounded-lg">{isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}</button>
                        </div>
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="EN Name" name="enName" value={formData.enName} onChange={handleChange} />
                        <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Remark Key" name="remark" value={formData.remark} onChange={handleChange} />
                        <div className="col-span-1 flex gap-2">
                            <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="HS Code" name="hsCode" value={formData.hsCode} onChange={handleChange} />
                            <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Unit" name="unit" value={formData.unit} onChange={handleChange} className="w-20"/>
                        </div>
                        <div className="col-span-1 flex gap-2">
                            <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="VAT%" name="vatRate" type="number" value={formData.vatRate} onChange={handleChange} />
                            <ModalInput isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Refund%" name="taxRefundRate" type="number" value={formData.taxRefundRate} onChange={handleChange} />
                        </div>
                        <div className="col-span-3">
                            <ModalTextarea isNight={isNight} themeMode={themeMode} customTheme={customTheme} placeholder="Elements" name="declarationElements" value={formData.declarationElements} onChange={handleChange as any} rows={1}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mb-6">
                        {editingId && <button onClick={handleCancel} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonSecondary}`}>Cancel</button>}
                        <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonPrimary}`}>{editingId ? 'Update' : 'Add'}</button>
                    </div>
                    <div className={`border rounded-lg overflow-y-auto no-scrollbar h-[440px] ${themeClasses.modalBorder}`}>
                        <table className="w-full text-sm table-fixed">
                            <thead className={`sticky top-0 z-10 ${isNight ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                <tr><th className="p-2 w-20">Act</th><th className="p-2 w-32">Key</th><th className="p-2 w-40">CN</th><th className="p-2 w-40">EN</th><th className="p-2 w-20">Tax/Ref</th><th className="p-2">Elements</th></tr>
                            </thead>
                            <tbody>
                                {localPresets.map(p => (
                                    <tr key={p.id} className="border-b last:border-0 border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-2 text-center flex justify-center gap-1">
                                            <button onClick={() => handleEdit(p)} className="text-blue-400 p-1"><Pencil size={14}/></button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-400 p-1"><Trash2 size={14}/></button>
                                        </td>
                                        <td className="p-2 truncate font-bold">{p.remark}</td>
                                        <td className="p-2 truncate">{p.cnName}</td>
                                        <td className="p-2 truncate">{p.enName}</td>
                                        <td className="p-2 truncate text-xs">{p.vatRate ?? 13}% / {p.taxRefundRate ?? 13}%</td>
                                        <td className="p-2 truncate text-xs opacity-60">{p.declarationElements}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {showImport && <ImportModal title="Import Presets" placeholder="Remark\tCN\tEN\tHS\tUnit\tElements\tVAT\tRefund" onClose={() => setShowImport(false)} onImport={handleImport} isNight={isNight} themeClasses={themeClasses} themeMode={themeMode} customTheme={customTheme} />}
            </div>
        </ModalPortal>
    );
});

export const BatchModal = memo<BatchModalProps>(({ onClose, onImport, isNight, themeMode, customTheme, themeClasses, header }) => {
    const [text, setText] = useState('');
    return (
        <ModalPortal>
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className={`relative w-full max-w-4xl rounded-lg shadow-2xl p-6 ${themeClasses.modalContentBg} ${themeClasses.modalBorder} ${themeClasses.modalText}`} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={24} /></button>
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><Upload size={24}/> Batch Import Products</h3>
                    <p className="text-sm opacity-60 mb-4">Format: `Quantity | Total Price ({header.isRmbCalculation ? 'RMB' : header.currency}) | Carton Count | Pkg Type | G.W. | N.W. | Vol` (Tab Separated)</p>
                    <ModalTextarea isNight={isNight} themeMode={themeMode} customTheme={customTheme} rows={15} value={text} onChange={(e: any) => setText(e.target.value)} placeholder="Paste Excel data here..." className="mb-4 whitespace-pre font-mono text-xs"/>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonSecondary}`}>Cancel</button>
                        <button onClick={() => { onImport(text); onClose(); }} className={`px-4 py-2 rounded-lg text-sm font-bold ${themeClasses.modalButtonPrimary}`}>Import Data</button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
});
