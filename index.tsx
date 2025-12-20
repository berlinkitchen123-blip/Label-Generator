import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  FileText, 
  X, 
  Edit2, 
  Eye, 
  Leaf, 
  Sprout, 
  Fish, 
  Utensils, 
  Beef, 
  PlusCircle,
  Printer,
  Package,
  Calendar,
  RefreshCw,
  Database
} from 'lucide-react';

// Constants
const DB_KEY = 'bb_label_db_v7';
const BRAND_GREEN = '#024930';
const BRAND_PINK = '#FEACCF';
const BRAND_MUTED_PINK = '#C197AB';

interface BundleItem {
  id: string;
  item_name_de: string;
  item_name_en: string;
  allergens_de: string;
  diet_de: string;
}

interface Bundle {
  id: string;
  name_de: string;
  name_en: string;
  items: BundleItem[];
  created_at: string;
}

interface Selection {
  bundleId: string;
  quantity: number;
}

// Dietary icons with consistent styling
const DietSymbol = ({ type, size = 20 }: { type: string; size?: number }) => {
  const t = type.toLowerCase();
  if (t.includes('vegan')) return <Leaf size={size} strokeWidth={2.5} className="text-emerald-600" />;
  if (t.includes('vege')) return <Sprout size={size} strokeWidth={2.5} className="text-emerald-500" />;
  if (t.includes('fish') || t.includes('fisch')) return <Fish size={size} strokeWidth={2.5} className="text-blue-500" />;
  if (t.includes('fleisch') || t.includes('meat') || t.includes('omni')) return <Beef size={size} strokeWidth={2.5} className="text-rose-700" />;
  return <Utensils size={size} strokeWidth={2.5} className="text-slate-400" />;
};

// Component for rendering labels specifically for PDF capture
const LabelPreview = ({ bundle, date, lang }: { bundle: Bundle; date: string; lang: 'de' | 'en' }) => {
  const itemCount = bundle.items.length;
  
  const layout = useMemo(() => {
    if (itemCount <= 3) return { titleSize: 'text-3xl', itemSize: 'text-xl', allergenSize: 'text-[10px]', spacing: 'gap-8', iconSize: 28 };
    if (itemCount <= 5) return { titleSize: 'text-2xl', itemSize: 'text-lg', allergenSize: 'text-[9px]', spacing: 'gap-4', iconSize: 22 };
    return { titleSize: 'text-xl', itemSize: 'text-base', allergenSize: 'text-[8px]', spacing: 'gap-3', iconSize: 18 };
  }, [itemCount]);

  const displayBundleName = lang === 'de' ? bundle.name_de : bundle.name_en;

  return (
    <div 
      className="flex flex-col relative bg-white overflow-hidden" 
      style={{ width: '105mm', height: '148.5mm', boxSizing: 'border-box' }}
    >
      <div className="bg-[#024930] text-white p-10 flex flex-col justify-center items-center text-center min-h-[140px]">
        <h1 className={`font-black uppercase tracking-tight leading-tight ${layout.titleSize}`}>
          {displayBundleName}
        </h1>
      </div>
      
      <div className="h-3 bg-[#FEACCF] w-full"></div>

      <div className={`flex-1 flex flex-col px-12 py-12 ${layout.spacing}`}>
        {bundle.items.map((item) => {
          const itemName = lang === 'de' ? item.item_name_de : item.item_name_en;
          return (
            <div key={item.id} className="flex justify-between items-start w-full border-b border-slate-50 pb-2 last:border-0">
              <div className="flex-1">
                <p className={`font-black text-[#024930] leading-tight mb-2 ${layout.itemSize}`}>
                  {itemName}
                </p>
                {item.allergens_de && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.allergens_de.split(',').map((a, i) => (
                      <span key={i} className="bg-[#FEACCF] text-[#024930] px-2 py-0.5 rounded-sm font-bold uppercase text-[10px] tracking-wide">
                        {a.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center ml-6 shrink-0">
                <DietSymbol type={item.diet_de} size={layout.iconSize} />
                <span className="text-[10px] font-black uppercase text-[#024930] mt-1.5 tracking-tighter opacity-80">{item.diet_de}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-12 py-8 flex justify-between items-end bg-[#C197AB]">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase text-[#024930]/70 tracking-widest">
            {lang === 'de' ? 'Abgepackt am' : 'Packed On'}
          </p>
          <p className="text-base font-black text-[#024930]">
            {new Date(date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#024930] leading-none tracking-tighter">
            BELLA<span className="text-white">&</span>BONA
          </p>
        </div>
      </div>
    </div>
  );
};

// Modal for adding or editing catering bundles
const BundleModal = ({ bundle, onSave, onClose, lang }: { bundle: any; onSave: (b: Bundle) => void; onClose: () => void; lang: string }) => {
  const [data, setData] = useState<Bundle>(bundle || {
    id: Math.random().toString(36).substr(2, 9),
    name_de: '',
    name_en: '',
    items: [],
    created_at: new Date().toISOString()
  });

  const addItem = () => setData({
    ...data,
    items: [...data.items, { 
      id: Math.random().toString(36).substr(2, 9), 
      item_name_de: '', 
      item_name_en: '', 
      allergens_de: '', 
      diet_de: 'Vegetarisch' 
    }]
  });

  const updateItem = (id: string, field: string, value: string) => {
    setData({ ...data, items: data.items.map(i => i.id === id ? { ...i, [field]: value } : i) });
  };

  const removeItem = (id: string) => setData({ ...data, items: data.items.filter(i => i.id !== id) });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-[#024930] uppercase">
              {bundle ? 'Edit Bundle' : 'New Bundle'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Configure label display names and contents</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bundle Name (DE)</label>
              <input 
                placeholder="Business Breakfast Set" 
                className="w-full bg-slate-100 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF] transition-all"
                value={data.name_de} onChange={e => setData({...data, name_de: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bundle Name (EN)</label>
              <input 
                placeholder="Business Breakfast Set" 
                className="w-full bg-slate-100 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF] transition-all"
                value={data.name_en} onChange={e => setData({...data, name_en: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-[#024930] uppercase text-sm tracking-widest">Items in Label</h3>
              <button onClick={addItem} className="bg-[#024930] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                <Plus size={16} /> ADD ITEM
              </button>
            </div>
            
            <div className="space-y-4">
              {data.items.map((item) => (
                <div key={item.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group hover:border-[#FEACCF] transition-all">
                  <button onClick={() => removeItem(item.id)} className="absolute -top-3 -right-3 bg-white shadow-lg text-slate-400 hover:text-rose-500 p-2 rounded-full border border-slate-100 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">German Name</label>
                      <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={item.item_name_de} onChange={e => updateItem(item.id, 'item_name_de', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">English Name</label>
                      <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={item.item_name_en} onChange={e => updateItem(item.id, 'item_name_en', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Allergens (e.g. A, G, H)</label>
                      <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={item.allergens_de} onChange={e => updateItem(item.id, 'allergens_de', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Dietary Type</label>
                      <select className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" value={item.diet_de} onChange={e => updateItem(item.id, 'diet_de', e.target.value)}>
                        <option value="Vegetarisch">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Fleisch">Meat</option>
                        <option value="Fisch">Fish</option>
                        <option value="Omni">Omni</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {data.items.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No items configured for this label</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t flex justify-end gap-4 bg-slate-50">
          <button onClick={onClose} className="px-8 py-4 font-black text-slate-500 hover:text-[#024930] transition-colors uppercase text-sm tracking-widest">Cancel</button>
          <button onClick={() => onSave(data)} className="bg-[#FEACCF] text-[#024930] px-12 py-4 rounded-2xl font-black shadow-lg hover:shadow-xl active:scale-95 transition-all uppercase text-sm tracking-widest">
            Save Label Bundle
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [lang, setLang] = useState<'de' | 'en'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initial load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        setBundles(JSON.parse(saved));
      } catch (e) {
        console.error("Database corruption detected. Initializing with demo data.");
        loadDemo();
      }
    } else {
      loadDemo();
    }
  }, []);

  const loadDemo = () => {
    const demos: Bundle[] = [{
      id: 'demo-1',
      name_de: 'Frühstück Classic',
      name_en: 'Breakfast Classic',
      created_at: new Date().toISOString(),
      items: [
        { id: 'd1', item_name_de: 'Buttercroissant', item_name_en: 'Butter Croissant', allergens_de: 'A, C, G', diet_de: 'Vegetarisch' },
        { id: 'd2', item_name_de: 'Frischer Obstsalat', item_name_en: 'Fresh Fruit Salad', allergens_de: '', diet_de: 'Vegan' },
        { id: 'd3', item_name_de: 'Griechischer Joghurt', item_name_en: 'Greek Yogurt', allergens_de: 'G', diet_de: 'Vegetarisch' }
      ]
    }, {
      id: 'demo-2',
      name_de: 'Lunch Box Vital',
      name_en: 'Lunch Box Vital',
      created_at: new Date().toISOString(),
      items: [
        { id: 'd4', item_name_de: 'Quinoa Bowl mit Avocado', item_name_en: 'Quinoa Bowl with Avocado', allergens_de: 'N', diet_de: 'Vegan' },
        { id: 'd5', item_name_de: 'Gebackenes Lachsfilet', item_name_en: 'Baked Salmon Fillet', allergens_de: 'D', diet_de: 'Fisch' }
      ]
    }];
    setBundles(demos);
    localStorage.setItem(DB_KEY, JSON.stringify(demos));
  };

  useEffect(() => {
    if (bundles.length > 0) {
      localStorage.setItem(DB_KEY, JSON.stringify(bundles));
    }
  }, [bundles]);

  const filtered = useMemo(() => bundles.filter(b => 
    b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  ), [bundles, searchTerm]);

  const toggleSelection = (id: string) => {
    const exists = selections.find(s => s.bundleId === id);
    if (exists) setSelections(selections.filter(s => s.bundleId !== id));
    else setSelections([...selections, { bundleId: id, quantity: 1 }]);
  };

  const updateQuantity = (id: string, q: number) => {
    setSelections(selections.map(s => s.bundleId === id ? { ...s, quantity: Math.max(1, q) } : s));
  };

  const generatePDF = async (download: boolean = false) => {
    if (selections.length === 0) return;
    setIsGenerating(true);
    
    try {
      // Access libraries from window (loaded in HTML)
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.getElementById('pdf-render-container');
      if (!container) throw new Error("PDF layout engine container not found");

      // Expand selections into a flat queue based on quantities
      const printQueue: Bundle[] = [];
      selections.forEach(s => {
        const b = bundles.find(x => x.id === s.bundleId);
        if (b) {
          for(let i=0; i < s.quantity; i++) {
            printQueue.push(b);
          }
        }
      });

      // Render each label into the hidden container, capture it, and add to PDF
      for (let i = 0; i < printQueue.length; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.width = '105mm';
        wrapper.style.height = '148.5mm';
        container.appendChild(wrapper);
        
        const root = createRoot(wrapper);
        root.render(<LabelPreview bundle={printQueue[i]} date={packedOn} lang={lang} />);
        
        // Give browser enough time to render fonts and layout correctly
        await new Promise(r => setTimeout(r, 750)); 
        
        const canvas = await html2canvas(wrapper, { 
          scale: 2, // High resolution for print
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Coordinates for 4 labels per A4 page (2x2 grid)
        const x = (i % 2) * 105;
        const y = (Math.floor(i / 2) % 2) * 148.5;
        
        if (i > 0 && i % 4 === 0) {
          doc.addPage();
        }
        
        doc.addImage(imgData, 'PNG', x, y, 105, 148.5);
        
        // Cleanup resources
        root.unmount();
        container.removeChild(wrapper);
      }

      if (download) {
        doc.save(`BellaBona_Catering_Labels_${packedOn}.pdf`);
      } else {
        const blob = doc.output('blob');
        if (previewUrl) URL.revokeObjectURL(previewUrl); // Cleanup old previews
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error("PDF Engine Error:", error);
      alert("A system error occurred during PDF generation. Please ensure your browser supports canvas-to-pdf exports.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#FEACCF]/30">
      <div id="pdf-render-container"></div>
      
      {editingBundle && (
        <BundleModal 
          bundle={editingBundle === 'new' ? null : editingBundle} 
          onClose={() => setEditingBundle(null)}
          lang={lang}
          onSave={(b) => {
            setBundles(prev => {
              const exists = prev.find(x => x.id === b.id);
              return exists ? prev.map(x => x.id === b.id ? b : x) : [b, ...prev];
            });
            setEditingBundle(null);
          }}
        />
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-[#024930]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 md:p-12 animate-slide-up">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-[#024930] uppercase tracking-tighter">Print Verification</h2>
                <p className="text-slate-500 text-sm font-medium">Verify dietary icons and allergens before committing to print</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => generatePDF(true)} 
                  className="bg-[#FEACCF] text-[#024930] px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  <Download size={20} /> Export PDF
                </button>
                <button 
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }} 
                  className="p-3 text-slate-400 hover:text-[#024930] transition-colors"
                >
                  <X size={32} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200 overflow-hidden shadow-inner">
               <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}

      {/* Global Navigation */}
      <nav className="bg-[#024930] text-white px-10 py-6 flex justify-between items-center shadow-2xl sticky top-0 z-[60]">
        <div className="flex items-center gap-5">
          <div className="bg-[#FEACCF] p-3 rounded-2xl shadow-inner">
            <FileText className="text-[#024930]" size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">BELLA<span className="text-[#FEACCF]">&</span>BONA</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-1">Production Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="bg-white/5 p-1 rounded-2xl flex border border-white/5">
            <button 
              onClick={() => setLang('de')} 
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${lang === 'de' ? 'bg-[#FEACCF] text-[#024930] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              DE
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-[#FEACCF] text-[#024930] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              EN
            </button>
          </div>
          <button 
            onClick={() => setEditingBundle('new')} 
            className="bg-[#FEACCF] text-[#024930] px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:shadow-[0_0_30px_rgba(254,172,207,0.3)] active:scale-95 transition-all uppercase tracking-widest"
          >
            <PlusCircle size={20} /> Add Bundle
          </button>
        </div>
      </nav>

      <main className="flex-1 p-10 max-w-7xl mx-auto w-full grid grid-cols-12 gap-12">
        {/* Content Management Area */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FEACCF] transition-colors" size={20} />
              <input 
                placeholder="Search production bundles..." 
                className="w-full bg-slate-50 rounded-[1.25rem] pl-16 pr-6 py-5 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF] focus:bg-white transition-all shadow-inner"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-slate-50 px-6 rounded-[1.25rem] border-2 border-transparent focus-within:border-[#FEACCF] transition-all shadow-inner min-w-[200px]">
              <Calendar size={18} className="text-slate-300 mr-4" />
              <input 
                type="date" 
                value={packedOn} 
                onChange={e => setPackedOn(e.target.value)}
                className="bg-transparent border-0 font-bold outline-none py-5 text-[#024930] w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2 mb-4">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Catering Inventory</h2>
              <button onClick={loadDemo} className="text-[10px] font-black text-[#FEACCF] hover:text-[#024930] transition-colors uppercase tracking-widest">Reset Demo</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {filtered.map(b => (
                <div 
                  key={b.id} 
                  className={`group p-8 rounded-[2rem] flex justify-between items-center border-2 transition-all cursor-pointer relative ${selections.find(s => s.bundleId === b.id) ? 'border-[#FEACCF] bg-[#FEACCF]/5 ring-4 ring-[#FEACCF]/10' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                  onClick={() => toggleSelection(b.id)}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm">
                      <Package className="text-[#024930]" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#024930] mb-1">{lang === 'de' ? b.name_de : b.name_en}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase tracking-tighter">{b.items.length} items</span>
                        <div className="flex gap-1.5 items-center">
                          {Array.from(new Set(b.items.map(i => i.diet_de))).map((diet, idx) => (
                             <DietSymbol key={idx} type={diet} size={14} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingBundle(b); }} 
                      className="p-4 bg-white text-slate-400 hover:text-[#024930] rounded-2xl shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={20} />
                    </button>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selections.find(s => s.bundleId === b.id) ? 'bg-[#FEACCF] border-[#FEACCF] scale-110' : 'border-slate-200 bg-white'}`}>
                      {selections.find(s => s.bundleId === b.id) && <Plus size={20} className="text-[#024930]" />}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Database size={64} className="mx-auto text-slate-200 mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Library is empty or filtered out</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar for Production Queue */}
        <div className="col-span-12 lg:col-span-4 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#024930] text-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col h-[calc(100vh-180px)] sticky top-32 border border-white/5">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-sm font-black text-[#FEACCF] uppercase tracking-[0.2em]">Batch Processing</h2>
                <p className="text-white/40 text-[11px] font-bold mt-1">Pending labels</p>
              </div>
              <span className="bg-white/10 text-[#FEACCF] text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/10">{selections.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 custom-scrollbar">
              {selections.map(s => {
                const b = bundles.find(x => x.id === s.bundleId);
                return b && (
                  <div key={s.bundleId} className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate pr-4">{lang === 'de' ? b.name_de : b.name_en}</p>
                      <div className="flex items-center mt-3 gap-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Qty</label>
                        <input 
                          type="number" 
                          value={s.quantity} 
                          onChange={e => updateQuantity(s.bundleId, parseInt(e.target.value))}
                          className="w-20 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-black text-[#FEACCF] outline-none focus:border-[#FEACCF] transition-all"
                        />
                      </div>
                    </div>
                    <button onClick={() => toggleSelection(s.bundleId)} className="p-2 text-white/20 hover:text-rose-400 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                );
              })}
              {selections.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <Printer size={48} className="mx-auto text-white mb-4" />
                  <p className="text-xs font-black text-white uppercase leading-loose tracking-widest">Select bundles<br/>to begin batch</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-8 border-t border-white/10">
              <button 
                disabled={selections.length === 0 || isGenerating}
                onClick={() => generatePDF(false)}
                className="w-full bg-white/10 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-white/20 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Eye size={20} className="text-[#FEACCF]" />} 
                Live Preview
              </button>
              <button 
                disabled={selections.length === 0 || isGenerating}
                onClick={() => generatePDF(true)}
                className="w-full bg-[#FEACCF] text-[#024930] py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(254,172,207,0.4)] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Printer size={20} /> Print Final Batch
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="px-12 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black text-[#024930] uppercase tracking-[0.3em]">Catering Ops System v1.4</p>
          <p className="text-[10px] font-bold text-slate-400">Optimized for A4 label sheets (4 x A6)</p>
        </div>
        <div className="flex gap-8">
          {['Documentation', 'Print Settings', 'Help Center'].map(link => (
            <span key={link} className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[#024930] transition-colors">{link}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

// Application entry point with strict root checking for stable mounting
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  }
};

// Defer initialization to ensure DOM and importmap are fully ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
