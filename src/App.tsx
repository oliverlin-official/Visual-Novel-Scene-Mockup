import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Upload, Save, FolderOpen, Image as ImageIcon, Type, Palette, Settings2, ChevronDown, ChevronUp, LayoutTemplate, Plus, Trash2 } from 'lucide-react';

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  hasOutline: boolean;
  isItalic: boolean;
}

interface BoxStyle {
  type: 'gradient' | 'solid' | 'fantasy' | 'romance';
  backgroundColor: string;
  opacity: number;
  padding: number;
  textAlign: 'left' | 'center' | 'right';
}

interface UITemplate {
  id: string;
  name: string;
  nameStyle: TextStyle;
  dialogueStyle: TextStyle;
  secondaryDialogueStyle: TextStyle;
  boxStyle: BoxStyle;
}

interface SceneState {
  image: string | null;
  imageScale: 'fit' | 'original';
  characterName: string;
  dialogue: string;
  secondaryDialogue: string;
  template: UITemplate;
  savedTemplates: UITemplate[];
}

const DEFAULT_TEMPLATES: UITemplate[] = [
  {
    id: 'cinematic',
    name: 'Cinematic (Default)',
    nameStyle: { fontFamily: 'sans-serif', fontSize: 24, color: '#ffffff', hasOutline: true, isItalic: false },
    dialogueStyle: { fontFamily: 'sans-serif', fontSize: 32, color: '#ffffff', hasOutline: true, isItalic: false },
    secondaryDialogueStyle: { fontFamily: 'sans-serif', fontSize: 20, color: '#cccccc', hasOutline: true, isItalic: true },
    boxStyle: { type: 'gradient', backgroundColor: '#000000', opacity: 80, padding: 20, textAlign: 'left' }
  },
  {
    id: 'fantasy',
    name: 'Fantasy RPG',
    nameStyle: { fontFamily: 'serif', fontSize: 28, color: '#ffd700', hasOutline: true, isItalic: false },
    dialogueStyle: { fontFamily: 'serif', fontSize: 28, color: '#ffffff', hasOutline: true, isItalic: false },
    secondaryDialogueStyle: { fontFamily: 'serif', fontSize: 18, color: '#cccccc', hasOutline: true, isItalic: true },
    boxStyle: { type: 'fantasy', backgroundColor: '#1a1a1a', opacity: 90, padding: 15, textAlign: 'left' }
  },
  {
    id: 'romance',
    name: 'Romance / Otome',
    nameStyle: { fontFamily: 'serif', fontSize: 26, color: '#ff69b4', hasOutline: false, isItalic: false },
    dialogueStyle: { fontFamily: 'sans-serif', fontSize: 28, color: '#333333', hasOutline: false, isItalic: false },
    secondaryDialogueStyle: { fontFamily: 'sans-serif', fontSize: 18, color: '#666666', hasOutline: false, isItalic: true },
    boxStyle: { type: 'romance', backgroundColor: '#ffffff', opacity: 85, padding: 10, textAlign: 'center' }
  }
];

const defaultState: SceneState = {
  image: null,
  imageScale: 'fit',
  characterName: 'Character Name',
  dialogue: 'This is an example of dialogue text.',
  secondaryDialogue: 'これはダイアログテキストの例です。',
  template: DEFAULT_TEMPLATES[0],
  savedTemplates: []
};

const FONTS = [
  { label: 'Sans-serif (Modern)', value: 'sans-serif' },
  { label: 'Serif (Classic)', value: 'serif' },
  { label: 'Monospace (Retro)', value: 'monospace' },
  { label: 'System UI', value: 'system-ui' },
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800">
      <button
        className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-zinc-100 font-medium">
          <Icon size={18} className="text-zinc-400" />
          {title}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
      </button>
      {isOpen && <div className="p-4 bg-zinc-950 space-y-4">{children}</div>}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<SceneState>(() => {
    const saved = localStorage.getItem('vn-mockup-autosave-v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load autosave', e);
      }
    }
    return defaultState;
  });

  const [styleTab, setStyleTab] = useState<'template'|'name'|'dialogue'|'secondary'|'box'>('template');
  const [newTemplateName, setNewTemplateName] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('vn-mockup-autosave-v2', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<SceneState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateTemplate = (updates: Partial<UITemplate>) => {
    setState(prev => ({ ...prev, template: { ...prev.template, ...updates } }));
  };

  const updateTextStyle = (key: 'nameStyle' | 'dialogueStyle' | 'secondaryDialogueStyle', updates: Partial<TextStyle>) => {
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        [key]: { ...prev.template[key], ...updates }
      }
    }));
  };

  const updateBoxStyle = (updates: Partial<BoxStyle>) => {
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        boxStyle: { ...prev.template.boxStyle, ...updates }
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateState({ image: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateState({ image: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "vn-scene-project.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedState = JSON.parse(event.target?.result as string);
          setState(loadedState);
        } catch (err) {
          alert('Invalid project file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportImage = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#000000',
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = 'vn-scene-export.png';
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image.');
    }
  };

  const saveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: UITemplate = {
      ...state.template,
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim()
    };
    setState(prev => ({
      ...prev,
      savedTemplates: [...prev.savedTemplates, newTemplate],
      template: newTemplate
    }));
    setNewTemplateName('');
  };

  const deleteTemplate = (id: string) => {
    setState(prev => ({
      ...prev,
      savedTemplates: prev.savedTemplates.filter(t => t.id !== id)
    }));
  };

  const applyTemplate = (template: UITemplate) => {
    updateState({ template });
  };

  const renderText = (text: string, style: TextStyle) => {
    if (!text) return null;
    return (
      <div
        style={{
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          color: style.color,
          fontStyle: style.isItalic ? 'italic' : 'normal',
          textShadow: style.hasOutline ? '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none',
          whiteSpace: 'pre-wrap',
          marginBottom: '0.5rem'
        }}
      >
        {text}
      </div>
    );
  };

  const renderBox = () => {
    const box = state.template.boxStyle;
    const content = (
      <div className="px-8 md:px-16 lg:px-24 w-full">
        {renderText(state.characterName, state.template.nameStyle)}
        {renderText(state.dialogue, state.template.dialogueStyle)}
        {renderText(state.secondaryDialogue, state.template.secondaryDialogueStyle)}
      </div>
    );

    if (box.type === 'gradient') {
      return (
        <div 
          className="absolute bottom-0 left-0 right-0 w-full pointer-events-none flex items-end"
          style={{
            background: `linear-gradient(to top, ${hexToRgba(box.backgroundColor, box.opacity / 100)} 0%, transparent 100%)`,
            paddingBottom: `${box.padding}%`,
            paddingTop: '10%',
            textAlign: box.textAlign,
          }}
        >
          {content}
        </div>
      );
    }

    let boxStyles: React.CSSProperties = {
      backgroundColor: hexToRgba(box.backgroundColor, box.opacity / 100),
      padding: '2rem',
      marginBottom: `${box.padding}%`,
      textAlign: box.textAlign,
      margin: `0 2rem ${box.padding}% 2rem`,
      width: 'calc(100% - 4rem)',
      pointerEvents: 'none'
    };

    if (box.type === 'fantasy') {
      boxStyles = {
        ...boxStyles,
        border: '4px solid #b8860b',
        borderRadius: '4px',
        boxShadow: '0 0 15px rgba(184, 134, 11, 0.5)',
      };
    } else if (box.type === 'romance') {
      boxStyles = {
        ...boxStyles,
        border: '2px solid #ffb6c1',
        borderRadius: '24px',
      };
    } else if (box.type === 'solid') {
      boxStyles = {
        ...boxStyles,
        borderRadius: '8px',
      };
    }

    return (
      <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center items-end">
        <div style={boxStyles}>
          {content}
        </div>
      </div>
    );
  };

  const renderTextStyleControls = (key: 'nameStyle' | 'dialogueStyle' | 'secondaryDialogueStyle', label: string) => {
    const style = state.template[key];
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Font Family</label>
          <select 
            value={style.fontFamily}
            onChange={(e) => updateTextStyle(key, { fontFamily: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            {FONTS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Font Size: {style.fontSize}px</label>
          <input 
            type="range" 
            min="12" max="72" 
            value={style.fontSize}
            onChange={(e) => updateTextStyle(key, { fontSize: parseInt(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Text Color</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={style.color}
              onChange={(e) => updateTextStyle(key, { color: e.target.value })}
              className="h-8 w-14 bg-transparent rounded cursor-pointer"
            />
            <span className="text-sm text-zinc-300 uppercase font-mono">{style.color}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Text Outline / Shadow</label>
          <button 
            onClick={() => updateTextStyle(key, { hasOutline: !style.hasOutline })}
            className={`w-10 h-5 rounded-full relative transition-colors ${style.hasOutline ? 'bg-indigo-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${style.hasOutline ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Italic</label>
          <button 
            onClick={() => updateTextStyle(key, { isItalic: !style.isItalic })}
            className={`w-10 h-5 rounded-full relative transition-colors ${style.isItalic ? 'bg-indigo-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${style.isItalic ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Preview Window (70%) */}
      <div className="flex-1 flex flex-col relative bg-zinc-900 border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <LayoutTemplate className="text-indigo-400" />
            Visual Novel Scene Mockup
          </h1>
          <div className="text-xs text-zinc-500">Preview Area</div>
        </div>

        <div 
          className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgvwEAIYCQW/P///38GxgEYM2gQjIYBw2gYMIyGAcNoGDAwGgYMAwAAb6Y3wZk2zE0AAAAASUVORK5CYII=')] bg-repeat"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div 
            ref={previewRef}
            className={`relative overflow-hidden shadow-2xl bg-black ${state.imageScale === 'fit' ? 'w-full max-w-5xl aspect-video' : 'inline-block'}`}
            style={state.imageScale === 'original' && state.image ? { minWidth: '800px', minHeight: '600px' } : {}}
          >
            {/* Background Image */}
            {state.image ? (
              <img 
                src={state.image} 
                alt="Scene Background" 
                className={`w-full h-full ${state.imageScale === 'fit' ? 'object-contain' : 'object-none'}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p>Drag and drop an image here</p>
                <p className="text-sm mt-2">or use the Media panel to upload</p>
              </div>
            )}

            {/* UI Overlay */}
            {renderBox()}
          </div>
        </div>
      </div>

      {/* Control Panel (30%) */}
      <div className="w-80 lg:w-96 flex flex-col bg-zinc-950 overflow-y-auto border-l border-zinc-800">
        <div className="p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings2 size={18} />
            Properties
          </h2>
        </div>

        <Accordion title="Media" icon={ImageIcon} defaultOpen>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Background Image</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Upload Image
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Scaling Mode</label>
              <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                <button 
                  className={`flex-1 text-sm py-1.5 rounded ${state.imageScale === 'fit' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  onClick={() => updateState({ imageScale: 'fit' })}
                >
                  Fit to Screen
                </button>
                <button 
                  className={`flex-1 text-sm py-1.5 rounded ${state.imageScale === 'original' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  onClick={() => updateState({ imageScale: 'original' })}
                >
                  Original Size
                </button>
              </div>
            </div>
          </div>
        </Accordion>

        <Accordion title="Script" icon={Type} defaultOpen>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Character Name</label>
              <input 
                type="text" 
                value={state.characterName}
                onChange={(e) => updateState({ characterName: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Narrator"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Primary Dialogue</label>
              <textarea 
                value={state.dialogue}
                onChange={(e) => updateState({ dialogue: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm h-24 resize-y focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter dialogue here..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Secondary Dialogue (Translation/Sub)</label>
              <textarea 
                value={state.secondaryDialogue}
                onChange={(e) => updateState({ secondaryDialogue: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm h-20 resize-y focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Optional secondary language..."
              />
            </div>
          </div>
        </Accordion>

        <Accordion title="Style & Templates" icon={Palette} defaultOpen>
          <div className="flex space-x-1 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {['template', 'name', 'dialogue', 'secondary', 'box'].map(tab => (
              <button 
                key={tab}
                onClick={() => setStyleTab(tab as any)} 
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors ${styleTab === tab ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="pt-2">
            {styleTab === 'template' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Built-in Templates</label>
                  <div className="space-y-2">
                    {DEFAULT_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${state.template.id === t.id ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'} border`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {state.savedTemplates.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">My Templates</label>
                    <div className="space-y-2">
                      {state.savedTemplates.map(t => (
                        <div key={t.id} className="flex gap-2">
                          <button
                            onClick={() => applyTemplate(t)}
                            className={`flex-1 text-left px-3 py-2 rounded text-sm transition-colors ${state.template.id === t.id ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'} border`}
                          >
                            {t.name}
                          </button>
                          <button 
                            onClick={() => deleteTemplate(t.id)}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded text-red-400 hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Save Current Style</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template name..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={saveCurrentAsTemplate}
                      disabled={!newTemplateName.trim()}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-zinc-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {styleTab === 'name' && renderTextStyleControls('nameStyle', 'Character Name')}
            {styleTab === 'dialogue' && renderTextStyleControls('dialogueStyle', 'Primary Dialogue')}
            {styleTab === 'secondary' && renderTextStyleControls('secondaryDialogueStyle', 'Secondary Dialogue')}

            {styleTab === 'box' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Box Type</label>
                  <select 
                    value={state.template.boxStyle.type}
                    onChange={(e) => updateBoxStyle({ type: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gradient">Gradient (Cinematic)</option>
                    <option value="solid">Solid Box</option>
                    <option value="fantasy">Fantasy Border</option>
                    <option value="romance">Romance Border</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={state.template.boxStyle.backgroundColor}
                      onChange={(e) => updateBoxStyle({ backgroundColor: e.target.value })}
                      className="h-8 w-14 bg-transparent rounded cursor-pointer"
                    />
                    <span className="text-sm text-zinc-300 uppercase font-mono">{state.template.boxStyle.backgroundColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Opacity: {state.template.boxStyle.opacity}%</label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={state.template.boxStyle.opacity}
                    onChange={(e) => updateBoxStyle({ opacity: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Alignment</label>
                  <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800">
                    {['left', 'center', 'right'].map(align => (
                      <button 
                        key={align}
                        className={`flex-1 text-sm py-1.5 rounded capitalize ${state.template.boxStyle.textAlign === align ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                        onClick={() => updateBoxStyle({ textAlign: align as any })}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Vertical Padding: {state.template.boxStyle.padding}%</label>
                  <input 
                    type="range" 
                    min="0" max="50" 
                    value={state.template.boxStyle.padding}
                    onChange={(e) => updateBoxStyle({ padding: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </Accordion>

        <Accordion title="Project" icon={FolderOpen}>
          <div className="space-y-3">
            <button 
              onClick={handleSaveProject}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Save Project (JSON)
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={projectInputRef}
              onChange={handleLoadProject}
            />
            <button 
              onClick={() => projectInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm rounded border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <FolderOpen size={16} />
              Load Project (JSON)
            </button>

            <div className="pt-4 mt-4 border-t border-zinc-800">
              <button 
                onClick={handleExportImage}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                <Download size={18} />
                Export Image (PNG)
              </button>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
