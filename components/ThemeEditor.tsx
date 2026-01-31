
import React from 'react';
import { X, RefreshCcw, Save, Palette, LayoutTemplate } from 'lucide-react';
import { CustomTheme, DEFAULT_CUSTOM_THEME } from '../types';

interface Props {
  theme: CustomTheme;
  onChange: (theme: CustomTheme) => void;
  onClose: () => void;
  onReset: () => void;
}

const ColorInput = ({ label, description, value, onChange }: { label: string, description?: string, value: string, onChange: (val: string) => void }) => (
  <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-black/5 transition-colors">
    <div className="flex items-center justify-between">
      <label className="text-xs font-bold text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-400 uppercase">{value}</span>
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-8 h-8 rounded cursor-pointer border-none bg-transparent shadow-sm" 
        />
      </div>
    </div>
    {description && (
      <p className="text-[9px] text-gray-400 leading-tight">{description}</p>
    )}
  </div>
);

const GroupHeader = ({ title }: { title: string }) => (
  <div className="px-2 mt-4 mb-2">
    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-100 pb-1">{title}</h4>
  </div>
);

export const ThemeEditor: React.FC<Props> = ({ theme, onChange, onClose, onReset }) => {
  
  const handleColorChange = (key: keyof CustomTheme['colors'], value: string) => {
    onChange({
      ...theme,
      colors: { ...theme.colors, [key]: value }
    });
  };

  const handleLayoutChange = (key: keyof CustomTheme['layout'], value: string) => {
    onChange({
        ...theme,
        layout: { ...theme.layout, [key]: value }
    });
  };

  return (
    <div className="fixed right-6 top-20 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[1000] animate-in slide-in-from-right-10 fade-in duration-300 flex flex-col max-h-[80vh]">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-indigo-600" />
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">UI Customizer</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        
        {/* Group 1: Global Base */}
        <GroupHeader title="Global Structure (全局基础)" />
        <ColorInput 
          label="App Background" 
          description="Main window background behind all content."
          value={theme.colors.bg} 
          onChange={(v) => handleColorChange('bg', v)} 
        />
        <ColorInput 
          label="Borders & Dividers" 
          description="Lines between sections and input borders."
          value={theme.colors.border} 
          onChange={(v) => handleColorChange('border', v)} 
        />

        {/* Group 2: Navigation & Sidebar */}
        <GroupHeader title="Navigation & Preview (侧边栏)" />
        <ColorInput 
          label="Sidebar Background" 
          description="Background of the preview sidebar on the right."
          value={theme.colors.sidebarBg || theme.colors.surface} 
          onChange={(v) => handleColorChange('sidebarBg', v)} 
        />
        <ColorInput 
          label="Sidebar Text" 
          description="Text color inside the preview sidebar."
          value={theme.colors.sidebarText || theme.colors.text} 
          onChange={(v) => handleColorChange('sidebarText', v)} 
        />

        {/* Group 3: Content Cards */}
        <GroupHeader title="Content Cards (内容卡片)" />
        <ColorInput 
          label="Card Surface" 
          description="Background for input forms and panels."
          value={theme.colors.surface} 
          onChange={(v) => handleColorChange('surface', v)} 
        />
        <ColorInput 
          label="Primary Text" 
          description="Main headings and labels."
          value={theme.colors.text} 
          onChange={(v) => handleColorChange('text', v)} 
        />
        <ColorInput 
          label="Secondary Text" 
          description="Subtitles, icons, and placeholder text."
          value={theme.colors.textSecondary} 
          onChange={(v) => handleColorChange('textSecondary', v)} 
        />

        {/* Group 4: Interaction */}
        <GroupHeader title="Interaction & Forms (交互)" />
        <ColorInput 
          label="Accent Color" 
          description="Primary buttons, active links, and highlights."
          value={theme.colors.accent} 
          onChange={(v) => handleColorChange('accent', v)} 
        />
        <ColorInput 
          label="Input Field Background" 
          description="Background color of text inputs and selects."
          value={theme.colors.inputBg} 
          onChange={(v) => handleColorChange('inputBg', v)} 
        />

        <div className="h-4"></div>
        <div className="h-px bg-gray-100 my-2"></div>

        {/* Layout Section */}
        <div className="px-2">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
             <LayoutTemplate size={12}/> Layout Geometry
           </h4>
           <div className="space-y-3">
              <div>
                 <label className="text-xs font-bold text-gray-600 mb-2 block">Border Radius (圆角)</label>
                 <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {['0px', '0.5rem', '1rem', '1.5rem'].map((rad) => (
                        <button
                           key={rad}
                           onClick={() => handleLayoutChange('borderRadius', rad)}
                           className={`flex-1 h-8 border border-gray-300 transition-all ${theme.layout.borderRadius === rad ? 'bg-indigo-600 border-indigo-600 ring-2 ring-indigo-200' : 'bg-white'}`}
                           style={{ borderRadius: rad }}
                           title={rad}
                        />
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
        <button 
          onClick={onReset}
          className="flex-1 py-2 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          <RefreshCcw size={14} /> Reset
        </button>
        <button 
          onClick={onClose} 
          className="flex-[2] py-2 flex items-center justify-center gap-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Save size={14} /> Done
        </button>
      </div>
    </div>
  );
};
