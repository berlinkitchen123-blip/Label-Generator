import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Search, 
  Printer, 
  X,
  Sprout,
  Soup,
  Database,
  Eye,
  Loader2,
  FileSpreadsheet,
  Beef,
  Leaf,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';

declare const XLSX: any;

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "label-c61eb.firebaseapp.com",
  databaseURL: "https://label-c61eb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "label-c61eb",
  storageBucket: "label-c61eb.firebasestorage.app",
  messagingSenderId: "168446433946",
  appId: "1:168446433946:web:6536d1d40fb86ee1f61d23"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const DB_KEY = 'bb_label_db_v7_perfect';

const generateSafeId = () => Math.random().toString(36).substring(2, 15);

const TEXT = {
  de: {
    labelGenerator: 'Generator',
    importData: 'Datenbank',
    packedOn: 'Abgepackt am',
    searchPlaceholder: 'Bundles durchsuchen...',
    availableBundles: 'Verfügbare Bundles',
    selectedBundles: 'Ausgewählte Etiketten',
    clearAll: 'Alles leeren',
    generatePdf: 'PDF / Drucken',
    previewPdf: 'Vorschau',
    downloadTemplate: 'Template laden',
    uploadFile: 'Excel/CSV Import',
    successImport: 'Import erfolgreich abgeschlossen!',
    errorImport: 'Fehler beim Datei-Import.',
    noSelected: 'Keine Auswahl getroffen.',
    syncing: 'Synchronisierung...',
    synced: 'Cloud-Daten geladen'
  },
  en: {
    labelGenerator: 'Generator',
    importData: 'Database',
    packedOn: 'Packed On',
    searchPlaceholder: 'Search bundles...',
    availableBundles: 'Available Bundles',
    selectedBundles: 'Selected Labels',
    clearAll: 'Clear All',
    generatePdf: 'Print / PDF',
    previewPdf: 'Preview',
    downloadTemplate: 'Template laden',
    uploadFile: 'Upload Excel/CSV',
    successImport: 'Import completed successfully!',
    errorImport: 'Error importing file.',
    noSelected: 'Nothing selected yet.',
    syncing: 'Syncing...',
    synced: 'Cloud data loaded'
  }
};

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
}

interface Selection {
  bundleId: string;
  quantity: number;
}

const DataService = {
  getBundles: async (): Promise<Bundle[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "bundles"));
      const bundles: Bundle[] = [];
      querySnapshot.forEach((doc) => bundles.push(doc.data() as Bundle));
      if (bundles.length > 0) {
        localStorage.setItem(DB_KEY, JSON.stringify(bundles));
        return bundles;
      }
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    }
  },
  saveBundles: async (bundles: Bundle[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(bundles));
    const batch = writeBatch(db);
    bundles.forEach(b => {
      const d = doc(db, "bundles", b.id);
      batch.set(d, b);
    });
    await batch.commit();
  },
  deleteBundle: async (id: string) => {
    await deleteDoc(doc(db, "bundles", id));
  }
};

const Label: React.FC<{ bundle: Bundle, lang: 'de' | 'en', packedOn: string, forPrint?: boolean }> = ({ bundle, lang, packedOn, forPrint }) => {
  const getDietIcon = (diet: string) => {
    const d = diet.toLowerCase();
    if (d.includes('vegan')) return <Leaf size={24} className="text-green-600" />;
    if (d.includes('vegetarisch')) return <Sprout size={24} className="text-green-500" />;
    if (d.includes('meat') || d.includes('fleisch') || d.includes('beef')) return <div className="text-red-700 text-2xl">🥩</div>;
    return <Soup size={24} className="text-blue-500" />;
  };

  const itemCount = bundle.items.length;
  
  // Dynamic styling for fitting up to 8+ items in 144.25mm height
  const nameFontSize = itemCount === 1 ? 'text-[28px]' : 
                     itemCount <= 4 ? 'text-[20px]' : 
                     itemCount <= 6 ? 'text-[16px]' : 'text-[13px]';
  
  const itemVerticalPadding = itemCount === 1 ? 'py-12' : 
                               itemCount <= 3 ? 'py-8' : 
                               itemCount <= 5 ? 'py-5' : 
                               itemCount <= 7 ? 'py-3' : 'py-2';
  
  const allergenFontSize = itemCount > 6 ? 'text-[8px]' : 'text-[10px]';
  const iconScaleClass = itemCount > 7 ? 'scale-75' : 'scale-90';

  return (
    <div 
      className={`label-card bg-white text-slate-900 flex flex-col overflow-hidden relative ${!forPrint ? 'shadow-2xl border border-slate-700 rounded-lg h-[144.25mm] w-[100.75mm]' : 'h-full w-full'}`} 
      style={{ 
        fontFamily: "'Inter', sans-serif", 
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        color: '#000',
        width: forPrint ? '100.75mm' : undefined,
        height: forPrint ? '144.25mm' : undefined
      }}
    >
      {/* Header - Fixed Height to prevent layout shift */}
      <div className="bg-[#024930] py-4 px-6 flex items-center justify-center min-h-[85px] shrink-0 border-b-2 border-[#FEACCF]">
        <h2 className="text-white text-center font-black text-[22px] uppercase tracking-wider leading-tight">
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 py-2 flex flex-col overflow-hidden relative watermark">
        <div className="flex-1 flex flex-col justify-around relative z-10 overflow-hidden">
          {bundle.items.map((item, idx) => (
            <div key={item.id} className={`flex justify-between items-center border-b border-gray-100 last:border-none ${itemVerticalPadding} transition-all`}>
              <div className="flex-1 pr-4">
                <div className={`font-black ${nameFontSize} leading-tight text-gray-950`}>
                  {lang === 'de' ? item.item_name_de : item.item_name_en}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.allergens_de.split(/[,/]+/).map((alg, aIdx) => {
                    const trimmed = alg.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={aIdx} className={`bg-[#FEACCF] ${allergenFontSize} font-black px-1.5 py-0.5 rounded-[1px] uppercase text-[#024930] tracking-tighter`}>
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className={`flex flex-col items-center min-w-[75px] text-center pt-1 transition-transform origin-top ${iconScaleClass}`}>
                <div className="mb-1">
                  {getDietIcon(item.diet_de)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-[#024930] leading-none opacity-80">
                  {item.diet_de}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Fixed Height at Bottom */}
      <div className="bg-[#C197AB] py-5 px-10 flex justify-between items-center text-[#024930] shrink-0">
         <div className="flex flex-col">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">PACKED ON</span>
           <span className="text-[16px] font-black leading-none mt-1.5">{packedOn}</span>
         </div>
         <div className="font-black text-[30px] tracking-tighter italic leading-none uppercase">BELLA&BONA</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = TEXT[lang];
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toLocaleDateString('en-GB'));
  const [activeTab, setActiveTab] = useState<'generator' | 'database'>('generator');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const init = async () => {
    try {
      const b = await DataService.getBundles();
      setBundles(b);
    } catch (e) {}
  };

  useEffect(() => { init(); }, []);

  const filteredBundles = useMemo(() => 
    bundles.filter(b => 
      b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    ), [bundles, searchTerm]);

  const addSelection = (bundleId: string) => {
    setSelections(prev => {
      const existing = prev.find(s => s.bundleId === bundleId);
      if (existing) return prev.map(s => s.bundleId === bundleId ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { bundleId, quantity: 1 }];
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImport(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const bundleMap: Record<string, Bundle> = {};
        rows.forEach((row: any) => {
          const nameDe = String(row.bundle_name_de || 'Unnamed').trim();
          const nameEn = String(row.bundle_name_en || nameDe).trim();
          if (!bundleMap[nameDe]) bundleMap[nameDe] = { id: generateSafeId(), name_de: nameDe, name_en: nameEn, items: [] };
          bundleMap[nameDe].items.push({
            id: generateSafeId(),
            item_name_de: String(row.item_name_de || '').trim(),
            item_name_en: String(row.item_name_en || row.item_name_de || '').trim(),
            allergens_de: String(row.allergens_de || '').trim(),
            diet_de: String(row.diet_de || '').trim()
          });
        });
        const updated = [...bundles, ...Object.values(bundleMap)];
        setBundles(updated);
        await DataService.saveBundles(updated);
        alert(t.successImport);
      } catch (err) { alert(t.errorImport); } 
      finally { setIsProcessingImport(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const printGroups = useMemo(() => {
    const allLabels = selections.flatMap(sel => {
      const b = bundles.find(b => b.id === sel.bundleId);
      return b ? Array(sel.quantity).fill(b) : [];
    });
    const groups = [];
    for (let i = 0; i < allLabels.length; i += 4) groups.push(allLabels.slice(i, i + 4));
    return groups;
  }, [selections, bundles]);

  return (
    <>
      <div className="print-only">
        {printGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="label-page-group">
            {group.map((bundle, bIdx) => (
              <div key={bIdx} className="label-card-container">
                <Label bundle={bundle} lang={lang} packedOn={packedOn} forPrint />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="no-print min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div className="flex flex-1">
          <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEACCF] flex items-center justify-center">
                <Sprout size={24} color="#024930" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-black text-sm text-white">BELLA&BONA</h1>
                <p className="text-[9px] text-slate-500 uppercase">Label Factory</p>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <button onClick={() => setActiveTab('generator')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'generator' ? 'bg-[#FEACCF] text-[#024930]' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Printer size={20} /><span className="hidden lg:block font-bold">Generator</span>
              </button>
              <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'database' ? 'bg-[#FEACCF] text-[#024930]' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Database size={20} /><span className="hidden lg:block font-bold">Database</span>
              </button>
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-4">
              <div className="hidden lg:block px-2">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Packed On</label>
                <input type="text" value={packedOn} onChange={e => setPackedOn(e.target.value)} className="w-full bg-slate-800 rounded px-2 py-1 text-white text-xs mt-1 border-none focus:ring-1 focus:ring-pink-400" />
              </div>
              <div className="flex bg-slate-800 rounded p-1">
                <button onClick={() => setLang('de')} className={`flex-1 py-1 text-xs rounded transition-all ${lang === 'de' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>DE</button>
                <button onClick={() => setLang('en')} className={`flex-1 py-1 text-xs rounded transition-all ${lang === 'en' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>EN</button>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-8 lg:p-12">
            {activeTab === 'generator' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-5 space-y-8">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 shadow-xl" />
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
                    {filteredBundles.map(bundle => (
                      <div key={bundle.id} onClick={() => addSelection(bundle.id)} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition-all shadow-lg">
                        <div className="flex items-center gap-4">
                          <Soup size={22} className="text-emerald-400" />
                          <div>
                            <p className="font-black text-slate-200">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                            <p className="text-[10px] font-bold text-slate-500">{bundle.items.length} items</p>
                          </div>
                        </div>
                        <Plus size={20} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="xl:col-span-7">
                  <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col min-h-[500px] shadow-2xl">
                    <div className="flex justify-between mb-10">
                      <h2 className="text-2xl font-black">Selected <span className="text-emerald-500">{selections.length}</span></h2>
                      {selections.length > 0 && <button onClick={() => setSelections([])} className="text-red-400 font-bold uppercase text-xs hover:text-red-300">Clear All</button>}
                    </div>
                    <div className="flex-1 space-y-4">
                      {selections.map(sel => {
                        const b = bundles.find(x => x.id === sel.bundleId);
                        if (!b) return null;
                        return (
                          <div key={sel.bundleId} className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="flex-1"><p className="font-bold text-slate-100">{lang === 'de' ? b.name_de : b.name_en}</p></div>
                            <input type="number" min="1" value={sel.quantity} onChange={e => setSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: parseInt(e.target.value) || 1 } : s))} className="w-16 bg-slate-950 rounded p-2 text-center text-emerald-400 font-bold border-none" />
                            <button onClick={() => setSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="text-slate-500 hover:text-red-400"><X size={20} /></button>
                          </div>
                        );
                      })}
                      {selections.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-500 mt-20">
                          <Printer size={64} className="mb-4" />
                          <p className="font-bold">No bundles selected</p>
                        </div>
                      )}
                    </div>
                    {selections.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center">
                        <button onClick={() => setIsPreviewing(true)} className="flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                          <Eye size={20} /> Preview
                        </button>
                        <button onClick={() => window.print()} className="bg-emerald-500 text-slate-950 font-black px-10 py-4 rounded-xl flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                          <Printer size={24} /> Print A4 Grid
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <section className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
                  <h2 className="text-3xl font-black mb-8 text-[#FEACCF]">Data Management</h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <div onClick={() => {
                      const template = [{ 'bundle_name_de': 'Brunch Set', 'bundle_name_en': 'Brunch Set', 'item_name_de': 'Croissant', 'item_name_en': 'Croissant', 'allergens_de': 'Gluten, Eier', 'diet_de': 'Vegetarisch' }];
                      const ws = XLSX.utils.json_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Labels");
                      XLSX.writeFile(wb, "BellaBona_Template.xlsx");
                    }} className="bg-slate-800/30 p-8 rounded-2xl border-2 border-dashed border-slate-700 cursor-pointer hover:border-emerald-500 transition-all group">
                      <FileSpreadsheet size={32} className="text-emerald-500 mb-4 group-hover:scale-100 transition-transform" />
                      <p className="font-bold">Download Template</p>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="bg-slate-800/30 p-8 rounded-2xl border-2 border-dashed border-slate-700 cursor-pointer hover:border-pink-400 transition-all relative group">
                      {isProcessingImport && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-2xl z-20"><Loader2 className="animate-spin text-pink-400" size={32} /></div>}
                      <Upload size={32} className="text-pink-400 mb-4 group-hover:scale-100 transition-transform" />
                      <p className="font-bold">Upload Excel</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileUpload} />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {bundles.map(b => (
                      <div key={b.id} className="flex justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 items-center hover:bg-slate-900 transition-colors">
                        <span className="font-bold text-slate-300">{b.name_de}</span>
                        <button onClick={async () => { if(confirm('Delete "' + b.name_de + '"?')) { setBundles(prev => prev.filter(x => x.id !== b.id)); await DataService.deleteBundle(b.id); }}} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

      {isPreviewing && (
        <div className="no-print fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col border border-slate-800 shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-black text-white">Print Preview</h2>
              <button onClick={() => setIsPreviewing(false)} className="text-white bg-slate-800 p-2 rounded-xl hover:bg-slate-700"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-950 flex flex-col items-center gap-16">
              {printGroups.map((group, idx) => (
                <div key={idx} className="bg-white shadow-2xl" style={{ width: '210mm', height: '297mm', minHeight: '297mm', minWidth: '210mm' }}>
                   <div className="label-page-group">
                     {group.map((b, bi) => (
                       <div key={bi} className="label-card-container">
                         <Label bundle={b} lang={lang} packedOn={packedOn} forPrint />
                       </div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-slate-800">
              <button onClick={() => window.print()} className="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-4 text-xl">
                <Printer size={28} /> Confirm and Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
