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

// Global XLSX from script tag
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

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const DB_KEY = 'bb_label_db_v4';

const generateSafeId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

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
    downloadTemplate: 'Download Template',
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
      if (!db) throw new Error("Database not ready");
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
      console.warn("Firestore fetch error:", e);
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    }
  },
  saveBundles: async (bundles: Bundle[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(bundles));
    try {
      const batch = writeBatch(db);
      bundles.forEach(b => {
        const d = doc(db, "bundles", b.id);
        batch.set(d, b);
      });
      await batch.commit();
    } catch (e) { 
      console.error("Firestore Save Error:", e);
      throw e; 
    }
  },
  deleteBundle: async (id: string) => {
    try { 
      await deleteDoc(doc(db, "bundles", id)); 
    } catch (e) { 
      console.error("Firestore Delete Error:", e); 
    }
  }
};

const Label: React.FC<{ bundle: Bundle, lang: 'de' | 'en', packedOn: string, forPrint?: boolean }> = ({ bundle, lang, packedOn, forPrint }) => {
  const getDietIcon = (diet: string) => {
    const d = diet.toLowerCase();
    if (d.includes('vegan')) return <Leaf size={22} className="text-[#024930]" />;
    if (d.includes('vegetarisch')) return <Sprout size={22} className="text-green-600" />;
    if (d.includes('meat') || d.includes('beef')) return <div className="text-red-700 font-bold text-lg leading-none">🥩</div>;
    return <Soup size={22} className="text-blue-500" />;
  };

  return (
    <div 
      className={`label-card w-[100mm] h-[62mm] bg-white text-slate-900 flex flex-col overflow-hidden relative ${!forPrint ? 'shadow-2xl border border-slate-700 rounded-lg scale-90 sm:scale-100 origin-top' : ''}`} 
      style={{ 
        color: '#000', 
        fontFamily: "'Inter', sans-serif", 
        boxSizing: 'border-box',
        minWidth: '100mm',
        minHeight: '62mm',
        backgroundColor: '#fff'
      }}
    >
      {/* Header - Matching reference image style */}
      <div className="bg-[#024930] py-3 px-4 flex items-center justify-center min-h-[52px]">
        <h2 className="text-white text-center font-black text-[18px] uppercase tracking-wide leading-tight">
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h2>
      </div>

      {/* Brand Line */}
      <div className="w-full h-[2px] bg-[#FEACCF]"></div>

      {/* Body with Watermark pattern */}
      <div className="flex-1 px-4 py-3 flex flex-col overflow-hidden relative watermark">
        <div className="space-y-4 relative z-10">
          {bundle.items.map(item => (
            <div key={item.id} className="flex justify-between items-start pb-1">
              <div className="flex-1 pr-3">
                <div className="font-extrabold text-[15px] leading-tight text-gray-950">
                  {lang === 'de' ? item.item_name_de : item.item_name_en}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.allergens_de.split(/[,/]+/).map((alg, idx) => {
                    const trimmed = alg.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={idx} className="bg-[#FEACCF] text-[9px] font-black px-1.5 py-0.5 rounded-[1px] uppercase text-[#024930] tracking-tighter">
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center min-w-[75px] text-center pt-1">
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

      {/* Footer - Matching reference layout */}
      <div className="bg-[#C197AB] py-2.5 px-5 flex justify-between items-center text-[#024930] mt-auto">
         <div className="flex flex-col">
           <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none">PACKED ON</span>
           <span className="text-[12px] font-black leading-none mt-1">{packedOn}</span>
         </div>
         <div className="font-black text-xl tracking-tighter italic leading-none">BELLA&BONA</div>
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const init = async () => {
    setIsSyncing(true);
    try {
      const b = await DataService.getBundles();
      setBundles(b);
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const filteredBundles = useMemo(() => {
    return bundles.filter(b => 
      b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bundles, searchTerm]);

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
          const rawNameDe = row.bundle_name_de || row['bundle_name_de'] || 'Unnamed Bundle';
          const nameDe = String(rawNameDe).trim();
          const nameEn = String(row.bundle_name_en || nameDe).trim();
          
          if (!bundleMap[nameDe]) {
            bundleMap[nameDe] = {
              id: generateSafeId(),
              name_de: nameDe,
              name_en: nameEn,
              items: []
            };
          }

          bundleMap[nameDe].items.push({
            id: generateSafeId(),
            item_name_de: String(row.item_name_de || '').trim(),
            item_name_en: String(row.item_name_en || row.item_name_de || '').trim(),
            allergens_de: String(row.allergens_de || '').trim(),
            diet_de: String(row.diet_de || '').trim()
          });
        });

        const newBundlesList = Object.values(bundleMap);
        const updatedBundles = [...bundles, ...newBundlesList];
        setBundles(updatedBundles);
        await DataService.saveBundles(updatedBundles);
        alert(t.successImport);
        setLastSync(new Date());
      } catch (err) { 
        console.error("Import Error:", err);
        alert(t.errorImport); 
      } 
      finally { setIsProcessingImport(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePrint = () => {
    if (selections.length === 0) {
      alert(t.noSelected);
      return;
    }
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Improved Grouping Logic for A4 Page Layout
  const printGroups = useMemo(() => {
    const allLabels = selections.flatMap(sel => {
      const bundle = bundles.find(b => b.id === sel.bundleId);
      if (!bundle) return [];
      return Array(sel.quantity).fill(bundle);
    });

    const groups = [];
    for (let i = 0; i < allLabels.length; i += 4) {
      groups.push(allLabels.slice(i, i + 4));
    }
    return groups;
  }, [selections, bundles]);

  return (
    <>
      {/* PRINT AREA - Managed in groups of 4 for A4 pages */}
      <div className="print-only">
        {printGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="label-page-group">
            {group.map((bundle, bundleIdx) => (
              <Label key={`${groupIdx}-${bundleIdx}`} bundle={bundle} lang={lang} packedOn={packedOn} forPrint />
            ))}
          </div>
        ))}
      </div>

      {/* WEB UI CONTAINER */}
      <div className="no-print min-h-screen flex flex-col bg-slate-950 overflow-x-hidden text-slate-100">
        <div className="flex flex-1">
          <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all flex-shrink-0">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEACCF] flex items-center justify-center shadow-lg">
                  <Sprout size={24} color="#024930" />
                </div>
                <div className="hidden lg:block">
                  <h1 className="font-black text-sm tracking-tighter leading-none text-white">BELLA&BONA</h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Label Factory</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button onClick={() => setActiveTab('generator')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'generator' ? 'bg-[#FEACCF] text-[#024930] shadow-lg shadow-pink-500/10' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Printer size={20} />
                <span className="hidden lg:block font-bold text-sm">{t.labelGenerator}</span>
              </button>
              <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'database' ? 'bg-[#FEACCF] text-[#024930] shadow-lg shadow-pink-500/10' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Database size={20} />
                <span className="hidden lg:block font-bold text-sm">{t.importData}</span>
              </button>
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-4">
              <div className="hidden lg:block px-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{t.packedOn}</label>
                <input type="text" value={packedOn} onChange={e => setPackedOn(e.target.value)} className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-white focus:ring-1 focus:ring-pink-400" />
              </div>
              <div className="hidden lg:block px-2 text-[10px] text-slate-500 font-bold">
                <div className="flex items-center gap-2">
                  {isSyncing ? <RefreshCw size={12} className="animate-spin text-pink-400" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                  <span>{isSyncing ? t.syncing : t.synced}</span>
                </div>
              </div>
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button onClick={() => setLang('de')} className={`flex-1 py-1 text-[10px] font-black rounded ${lang === 'de' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>DE</button>
                <button onClick={() => setLang('en')} className={`flex-1 py-1 text-[10px] font-black rounded ${lang === 'en' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>EN</button>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-8 lg:p-12">
            {activeTab === 'generator' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-5 space-y-8 animate-fade-in">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium text-white focus:ring-2 focus:ring-emerald-500 transition-all shadow-xl" />
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
                    {filteredBundles.map(bundle => (
                      <div key={bundle.id} onClick={() => addSelection(bundle.id)} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all shadow-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                            <Soup size={22} />
                          </div>
                          <div>
                            <p className="font-black text-slate-200">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{bundle.items.length} items</p>
                          </div>
                        </div>
                        <Plus size={20} className="text-slate-600 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-7">
                  <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col h-full min-h-[500px]">
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-2xl font-black text-white">{t.selectedBundles} <span className="text-emerald-500 ml-2">{selections.length}</span></h2>
                      {selections.length > 0 && (
                        <button onClick={() => setSelections([])} className="text-xs font-black text-red-400 uppercase tracking-widest px-4 py-2 rounded-xl">
                          {t.clearAll}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 space-y-6">
                      {selections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-700">
                          <Printer size={64} className="mb-6 opacity-20" />
                          <p className="font-bold text-lg opacity-40">{t.noSelected}</p>
                        </div>
                      ) : (
                        selections.map(sel => {
                          const bundle = bundles.find(b => b.id === sel.bundleId);
                          if (!bundle) return null;
                          return (
                            <div key={sel.bundleId} className="flex items-center gap-6 bg-slate-800/50 rounded-2xl p-6 border border-slate-800 animate-fade-in">
                              <div className="flex-1">
                                <p className="font-black text-slate-100 text-lg leading-tight">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 truncate max-w-xs">{bundle.items.map(i => i.item_name_de).join(', ')}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Quantity</span>
                                <input type="number" min="1" value={sel.quantity} onChange={e => {
                                   const q = parseInt(e.target.value) || 1;
                                   setSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: q } : s));
                                }} className="w-16 bg-slate-900 border-2 border-slate-700 rounded-xl px-2 py-3 text-center font-black text-emerald-400 focus:border-emerald-500 outline-none" />
                              </div>
                              <button onClick={() => setSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="p-3 text-slate-600 hover:text-red-400">
                                <X size={22} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {selections.length > 0 && (
                      <div className="mt-12 pt-10 border-t border-slate-800 flex items-center justify-between">
                         <button onClick={() => setIsPreviewing(true)} className="flex items-center gap-3 text-emerald-400 font-black text-sm uppercase tracking-widest">
                           <Eye size={20} /> {t.previewPdf}
                         </button>
                         <button onClick={handlePrint} className="bg-emerald-500 text-slate-950 font-black px-12 py-5 rounded-2xl shadow-xl flex items-center gap-4 text-lg active:scale-95 transition-all">
                           <Printer size={28} /> {t.generatePdf}
                         </button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
                <section className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-4xl font-black mb-3 text-[#FEACCF]">{t.importData}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
                    <div onClick={() => {
                      const template = [{ 'bundle_name_de': 'Asiatische Veggie-Auswahl', 'bundle_name_en': 'Asian Vegan Mix', 'item_name_de': 'Blumenkohl-Wings', 'item_name_en': 'Cauliflower Wings', 'allergens_de': 'Gluten', 'diet_de': 'Vegan' }];
                      const ws = XLSX.utils.json_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Labels");
                      XLSX.writeFile(wb, "BellaBona_Template.xlsx");
                    }} className="bg-slate-800/50 rounded-3xl p-10 border-2 border-dashed border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-all group">
                       <FileSpreadsheet size={40} className="text-emerald-500 mb-6 group-hover:rotate-6 transition-transform" />
                       <div className="text-xl font-black text-white">{t.downloadTemplate}</div>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="bg-slate-800/50 rounded-3xl p-10 border-2 border-dashed border-slate-700 cursor-pointer hover:border-pink-500/50 transition-all group relative">
                       {isProcessingImport && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
                             <Loader2 className="animate-spin text-pink-400" size={40} />
                          </div>
                       )}
                       <Upload size={40} className="text-pink-400 mb-6 group-hover:-rotate-6 transition-transform" />
                       <div className="text-xl font-black text-white">{t.uploadFile}</div>
                       <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.csv" onChange={handleFileUpload} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {bundles.map(bundle => (
                      <div key={bundle.id} className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-slate-800 shadow-sm">
                        <div className="flex items-center gap-5">
                           <Soup size={24} className="text-slate-600" />
                           <p className="font-black text-slate-100">{bundle.name_de}</p>
                        </div>
                        <button onClick={async () => {
                           if(confirm('Delete bundle "' + bundle.name_de + '"?')) {
                             const next = bundles.filter(b => b.id !== bundle.id);
                             setBundles(next);
                             await DataService.deleteBundle(bundle.id);
                           }
                        }} className="p-3 text-slate-700 hover:text-red-500">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {isPreviewing && (
        <div className="no-print fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col border border-slate-800 overflow-hidden">
            <div className="p-6 sm:p-10 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{t.previewPdf} (A4 Layout)</h2>
              <button onClick={() => setIsPreviewing(false)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 custom-scrollbar">
              <div className="flex flex-col items-center gap-8">
                {printGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="bg-white p-8 shadow-2xl" style={{ width: '210mm', height: '297mm', minHeight: '297mm', position: 'relative' }}>
                    <div className="grid grid-cols-2 gap-4 justify-center pt-8">
                      {group.map((bundle, bundleIdx) => (
                        <Label key={`${groupIdx}-${bundleIdx}`} bundle={bundle} lang={lang} packedOn={packedOn} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-10 border-t border-slate-800 flex gap-6">
              <button onClick={handlePrint} className="flex-1 bg-emerald-500 text-slate-950 font-black py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 text-lg sm:text-xl">
                <Printer size={28} /> {t.generatePdf}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}