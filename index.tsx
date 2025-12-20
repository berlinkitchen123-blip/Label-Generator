import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
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
  Printer, 
  Package, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  Sparkles,
  Croissant
} from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBlB6j_w_-Mb_ughrrz8BDFdiIJEDNTKGM",
  authDomain: "label-c61eb.firebaseapp.com",
  databaseURL: "https://label-c61eb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "label-c61eb",
  storageBucket: "label-c61eb.appspot.com",
  messagingSenderId: "168446433946",
  appId: "1:168446433946:web:6536d1d40fb86ee1f61d23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


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

// --- SUB-COMPONENTS ---

const DietSymbol = ({ type, size = 18 }: { type: string; size?: number }) => {
  const t = type.toLowerCase();
  if (t.includes('vegan')) return <Leaf size={size} strokeWidth={2.5} className="text-emerald-600" />;
  if (t.includes('vege')) return <Sprout size={size} strokeWidth={2.5} className="text-emerald-500" />;
  if (t.includes('fish') || t.includes('fisch')) return <Fish size={size} strokeWidth={2.5} className="text-blue-500" />;
  if (t.includes('fleisch') || t.includes('meat') || t.includes('omni')) return <Beef size={size} strokeWidth={2.5} className="text-rose-700" />;
  return <Utensils size={size} strokeWidth={2.5} className="text-slate-400" />;
};

const LabelPreview = ({ bundle, date, lang }: { bundle: Bundle; date: string; lang: 'de' | 'en' }) => {
  const itemCount = bundle.items.length;
  const layout = useMemo(() => {
    if (itemCount <= 3) return { title: 'text-3xl', item: 'text-xl', spacing: 'gap-10', icon: 32 };
    if (itemCount <= 5) return { title: 'text-2xl', item: 'text-lg', spacing: 'gap-6', icon: 24 };
    return { title: 'text-xl', item: 'text-base', spacing: 'gap-4', icon: 20 };
  }, [itemCount]);

  return (
    <div className="flex flex-col relative bg-white overflow-hidden" style={{ width: '105mm', height: '148.5mm', boxSizing: 'border-box' }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap justify-around items-center overflow-hidden p-10">
        {Array.from({ length: 6 }).map((_, i) => <Croissant key={i} size={100} className="rotate-12" />)}
      </div>

      <div className="bg-[#024930] text-white p-10 flex flex-col justify-center items-center text-center min-h-[140px] relative z-10 shadow-lg">
        <h1 className={`font-black uppercase tracking-tight leading-none ${layout.title}`}>
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h1>
      </div>
      
      <div className="h-2 bg-[#FEACCF] w-full relative z-10"></div>
      
      <div className={`flex-1 flex flex-col px-12 py-12 relative z-10 ${layout.spacing}`}>
        {bundle.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start w-full border-b border-slate-50 pb-3 last:border-0">
            <div className="flex-1">
              <p className={`font-black text-[#024930] leading-tight mb-2 ${layout.item}`}>
                {lang === 'de' ? item.item_name_de : item.item_name_en}
              </p>
              {item.allergens_de && (
                <div className="flex flex-wrap gap-1.5">
                  {item.allergens_de.split(',').map((a, i) => (
                    <span key={i} className="bg-[#FEACCF]/20 text-[#024930] px-2 py-0.5 rounded-sm font-black uppercase text-[9px] tracking-widest border border-[#FEACCF]/40">
                      {a.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center ml-8 shrink-0 pt-1">
              <DietSymbol type={item.diet_de} size={layout.icon} />
              <span className="text-[9px] font-black uppercase text-[#024930] opacity-40 mt-1 tracking-tighter">{item.diet_de}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-12 py-8 flex justify-between items-end bg-slate-50 border-t border-slate-100 relative z-10">
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase text-[#024930]/40 tracking-widest mb-1">Packed On</p>
          <p className="text-base font-black text-[#024930]">
            {new Date(date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#024930] leading-none tracking-tighter">
            BELLA<span className="text-[#FEACCF]">&</span>BONA
          </p>
        </div>
      </div>
    </div>
  );
};

const BundleModal = ({ bundle, onSave, onClose }: { bundle: any; onSave: (b: Bundle) => void; onClose: () => void }) => {
  const [data, setData] = useState<Bundle>(bundle || {
    id: Math.random().toString(36).substr(2, 9),
    name_de: '', name_en: '', items: [], created_at: new Date().toISOString()
  });

  const addItem = () => setData({
    ...data,
    items: [...data.items, { id: Math.random().toString(36).substr(2, 9), item_name_de: '', item_name_en: '', allergens_de: '', diet_de: 'Vegetarisch' }]
  });

  const updateItem = (id: string, field: string, value: string) => {
    setData({ ...data, items: data.items.map(i => i.id === id ? { ...i, [field]: value } : i) });
  };

  const removeItem = (id: string) => setData({ ...data, items: data.items.filter(i => i.id !== id) });

  return (
    <div className="fixed inset-0 bg-[#024930]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-slide-up">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-black text-[#024930] uppercase tracking-tighter">{bundle ? 'Edit Item' : 'New Production Item'}</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Name (DE)</label>
                <input placeholder="Item Name (DE)" className="w-full bg-slate-100 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF]" value={data.name_de} onChange={e => setData({...data, name_de: e.target.value})} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Name (EN)</label>
                <input placeholder="Item Name (EN)" className="w-full bg-slate-100 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF]" value={data.name_en} onChange={e => setData({...data, name_en: e.target.value})} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-black text-[#024930] uppercase text-sm">Components</h3>
              <button onClick={addItem} className="bg-[#024930] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> ADD</button>
            </div>
            {data.items.map((item) => (
              <div key={item.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group">
                <button onClick={() => removeItem(item.id)} className="absolute -top-3 -right-3 bg-white shadow-lg text-slate-300 hover:text-rose-500 p-2 rounded-full border border-slate-100"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" placeholder="DE Name" value={item.item_name_de} onChange={e => updateItem(item.id, 'item_name_de', e.target.value)} />
                  <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" placeholder="EN Name" value={item.item_name_en} onChange={e => updateItem(item.id, 'item_name_en', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" placeholder="Allergens (A, G, C)" value={item.allergens_de} onChange={e => updateItem(item.id, 'allergens_de', e.target.value)} />
                  <select className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" value={item.diet_de} onChange={e => updateItem(item.id, 'diet_de', e.target.value)}>
                    <option value="Vegetarisch">Vegetarian</option><option value="Vegan">Vegan</option><option value="Fleisch">Meat</option><option value="Fisch">Fish</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 border-t flex justify-end gap-4 bg-slate-50">
          <button onClick={onClose} className="px-8 py-4 font-black text-slate-400 uppercase text-xs">Cancel</button>
          <button onClick={() => onSave(data)} className="bg-[#FEACCF] text-[#024930] px-10 py-4 rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [bundles, setBundles] = useState<Bundle[] | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [lang, setLang] = useState<'de' | 'en'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bundles"), (snapshot) => {
      const bundlesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Bundle[];
      bundlesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBundles(bundlesData);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => (bundles || []).filter(b => 
    b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  ), [bundles, searchTerm]);

  const toggleSelection = (id: string) => {
    if (selections.find(s => s.bundleId === id)) setSelections(selections.filter(s => s.bundleId !== id));
    else setSelections([...selections, { bundleId: id, quantity: 1 }]);
  };

  const generatePDF = async (download = false) => {
    if (!selections.length) return;
    setIsGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.getElementById('pdf-render-container')!;
      const queue: Bundle[] = [];
      selections.forEach(s => { const b = bundles?.find(x => x.id === s.bundleId); if (b) for(let i=0; i<s.quantity; i++) queue.push(b); });

      for (let i = 0; i < queue.length; i++) {
        const wrap = document.createElement('div');
        container.appendChild(wrap);
        const root = createRoot(wrap);
        root.render(<LabelPreview bundle={queue[i]} date={packedOn} lang={lang} />);
        await new Promise(r => setTimeout(r, 800));
        const canvas = await html2canvas(wrap, { scale: 2.5, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const x = (i % 2) * 105;
        const y = (Math.floor(i / 2) % 2) * 148.5;
        if (i > 0 && i % 4 === 0) doc.addPage();
        doc.addImage(imgData, 'PNG', x, y, 105, 148.5);
        root.unmount();
        container.removeChild(wrap);
      }
      
      if (download) doc.save(`Labels_${packedOn}.pdf`);
      else {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(doc.output('blob')));
      }
    } catch (e) {
        console.error("PDF generation error:", e);
    } finally { setIsGenerating(false); }
  };

  const onSaveBundle = async (bundle: Bundle) => {
    const docRef = doc(db, "bundles", bundle.id);
    const { id, ...dataToSave } = bundle;
    await setDoc(docRef, dataToSave);
    setEditingBundle(null);
  };

  const deleteBundle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this production item? This cannot be undone.')) {
        await deleteDoc(doc(db, "bundles", id));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <div id="pdf-render-container"></div>
      
      {editingBundle && <BundleModal bundle={editingBundle === 'new' ? null : editingBundle} onClose={() => setEditingBundle(null)} onSave={onSaveBundle} />}
      
      {previewUrl && (
        <div className="fixed inset-0 bg-[#024930]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-12 animate-slide-up">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-[#024930]">PRINT PREVIEW</h2>
              <div className="flex gap-4">
                <button onClick={() => generatePDF(true)} className="bg-[#FEACCF] text-[#024930] px-8 py-3 rounded-2xl font-black text-sm tracking-widest shadow-lg">DOWNLOAD</button>
                <button onClick={() => setPreviewUrl(null)} className="p-3 text-slate-300 hover:text-black transition-colors"><X size={32} /></button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full border-0" />
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-[#024930] text-white px-12 py-8 flex justify-between items-center sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="bg-[#FEACCF] p-4 rounded-3xl shadow-lg rotate-3"><FileText className="text-[#024930]" size={32} /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">BELLA<span className="text-[#FEACCF]">&</span>BONA</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-1.5">Production Cockpit</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="bg-white/10 p-1 rounded-2xl flex border border-white/5 backdrop-blur-sm">
            <button onClick={() => setLang('de')} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${lang === 'de' ? 'bg-[#FEACCF] text-[#024930] shadow-lg' : 'text-white/40'}`}>DE</button>
            <button onClick={() => setLang('en')} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-[#FEACCF] text-[#024930] shadow-lg' : 'text-white/40'}`}>EN</button>
          </div>
          <button onClick={() => setEditingBundle('new')} className="bg-[#FEACCF] text-[#024930] px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(254,172,207,0.3)] active:scale-95 transition-all">+ New Item</button>
        </div>
      </nav>

      <main className="flex-1 p-12 max-w-7xl mx-auto w-full grid grid-cols-12 gap-12">
        {/* Left Side: Library */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 animate-slide-up">
          <div className="flex gap-6 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#FEACCF]" size={20} />
              <input placeholder="Search production items..." className="w-full bg-slate-50 rounded-[1.5rem] pl-16 pr-6 py-4.5 font-bold outline-none border-2 border-transparent focus:border-[#FEACCF] focus:bg-white transition-all shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center bg-slate-50 px-8 rounded-[1.5rem] border shadow-inner">
              <Calendar size={18} className="text-slate-300 mr-4" />
              <input type="date" value={packedOn} onChange={e => setPackedOn(e.target.value)} className="bg-transparent border-0 font-bold outline-none text-[#024930] py-4" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-4 mb-4">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Library</h2>
              <Sparkles className="text-[#FEACCF]" size={16} />
            </div>
            {!bundles && (
              <div className="text-center py-20 text-slate-400 font-bold">
                <RefreshCw className="animate-spin inline-block mr-2" /> Loading Inventory...
              </div>
            )}
            {bundles && bundles.length === 0 && (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem] m-4">
                <Package size={48} className="mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-600">Inventory is Empty</h3>
                <p className="text-sm">Click "+ New Item" to add your first production item.</p>
              </div>
            )}
            {bundles && filtered.map(b => (
              <div key={b.id} className={`p-8 rounded-[2.5rem] flex justify-between items-center border-2 cursor-pointer transition-all relative ${selections.find(s => s.bundleId === b.id) ? 'border-[#FEACCF] bg-[#FEACCF]/5 ring-4 ring-[#FEACCF]/10' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`} onClick={() => toggleSelection(b.id)}>
                <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-[1.5rem] transition-all ${selections.find(s => s.bundleId === b.id) ? 'bg-[#FEACCF]' : 'bg-white'}`}>
                    <Package className="text-[#024930]" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#024930] tracking-tight">{lang === 'de' ? b.name_de : b.name_en}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{b.items.length} items</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={e => { e.stopPropagation(); setEditingBundle(b); }} className="p-4 bg-white text-slate-300 hover:text-[#024930] rounded-2xl border border-slate-100 shadow-sm transition-all"><Edit2 size={20} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteBundle(b.id); }} className="p-4 bg-white text-slate-300 hover:text-rose-500 rounded-2xl border border-slate-100 shadow-sm transition-all"><Trash2 size={20} /></button>
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${selections.find(s => s.bundleId === b.id) ? 'bg-[#FEACCF] border-[#FEACCF] scale-110 shadow-lg' : 'border-slate-200 bg-white'}`}>{selections.find(s => s.bundleId === b.id) ? <Plus size={24} className="text-[#024930]" /> : <ChevronRight className="text-slate-200" size={24} />}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Queue */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-fit lg:h-[calc(100vh-180px)] lg:sticky top-32 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#024930] text-white rounded-[3rem] p-10 flex flex-col flex-1 shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xs font-black text-[#FEACCF] uppercase tracking-widest">Print Queue</h2>
              <span className="bg-white/10 text-[#FEACCF] text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/10">{selections.reduce((acc, s) => acc + s.quantity, 0)}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 custom-scrollbar max-h-[400px]">
              {selections.map(s => {
                const b = bundles?.find(x => x.id === s.bundleId);
                return b && (
                  <div key={s.bundleId} className="bg-white/5 rounded-2xl p-5 flex flex-col border border-white/5 group">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-black truncate pr-4 text-white tracking-tight">{lang === 'de' ? b.name_de : b.name_en}</p>
                      <button onClick={() => setSelections(selections.filter(x => x.bundleId !== s.bundleId))} className="text-white/20 hover:text-rose-400 p-1"><X size={18} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/30 uppercase">Quantity</span>
                      <input type="number" value={s.quantity} onChange={e => setSelections(selections.map(x => x.bundleId === s.bundleId ? { ...x, quantity: Math.max(1, parseInt(e.target.value) || 1) } : x))} className="w-20 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-black text-[#FEACCF] text-center outline-none" />
                    </div>
                  </div>
                );
              })}
              {!selections.length && (
                <div className="text-center py-24 opacity-20 border border-dashed border-white/20 rounded-3xl">
                  <Printer size={48} className="mx-auto text-white mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Queue Empty</p>
                </div>
              )}
            </div>
            <div className="space-y-4 pt-6 border-t border-white/10">
              <button disabled={!selections.length || isGenerating} onClick={() => generatePDF(false)} className="w-full bg-white/10 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30">{isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Eye size={20} className="text-[#FEACCF]" />} Verification</button>
              <button disabled={!selections.length || isGenerating} onClick={() => generatePDF(true)} className="w-full bg-[#FEACCF] text-[#024930] py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(254,172,207,0.3)] active:scale-95 transition-all disabled:opacity-30"><Printer size={20} /> Process Batch</button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="px-12 py-10 bg-white border-t border-slate-50 flex justify-between items-center text-slate-400">
         <p className="text-[10px] font-black uppercase tracking-widest">BELLA&BONA CATERING OPS V1.4</p>
         <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
            <span>Production Hub</span>
            <span>Support</span>
         </div>
      </footer>
    </div>
  );
};

// --- MOUNTING ---
const mount = () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}