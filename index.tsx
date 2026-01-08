
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
  Fish,
  Egg,
  Milk,
  Wheat,
  Bean,
  Nut,
  RefreshCw,
  CheckCircle2,
  ChefHat,
  RotateCcw,
  Utensils
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
  deleted?: boolean;
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
      localStorage.setItem(DB_KEY, JSON.stringify(bundles));
      return bundles;
    } catch (e) {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    }
  },
  saveBundle: async (bundle: Bundle) => {
    // Optimistic Update Local
    const stored = localStorage.getItem(DB_KEY);
    const bundles: Bundle[] = stored ? JSON.parse(stored) : [];
    const idx = bundles.findIndex(b => b.id === bundle.id);
    if (idx >= 0) bundles[idx] = bundle;
    else bundles.push(bundle);
    localStorage.setItem(DB_KEY, JSON.stringify(bundles));

    // Cloud Update
    try {
      const d = doc(db, "bundles", bundle.id);
      await writeBatch(db).set(d, bundle).commit();
    } catch (e) { }
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
  const getItemIcons = (item: BundleItem, isHighDensity: boolean) => {
    const diet = item.diet_de.toLowerCase();
    const allergens = item.allergens_de.toLowerCase();

    // Increased base sizes for icons
    const size = isHighDensity ? 22 : 32;
    const icons: React.ReactNode[] = [];

    // 1. Diet-based Icons
    if (diet.includes('vegan')) {
      icons.push(<Leaf size={size} className="text-green-600" key="vegan" />);
    } else if (diet.includes('vegetarisch')) {
      icons.push(<Sprout size={size} className="text-green-500" key="veggie" />);
    } else if (diet.includes('fish') || diet.includes('fisch')) {
      icons.push(<Fish size={size} className="text-blue-500" key="fish" />);
    } else if (diet.includes('meat') || diet.includes('fleisch') || diet.includes('beef')) {
      icons.push(<div className={isHighDensity ? "text-xl" : "text-3xl"} key="meat">🥩</div>);
    }

    // 2. Allergen-based Icons (Expanded List)
    if (allergens.includes('gluten') || allergens.includes('weizen')) {
      icons.push(<Wheat size={size} className="text-amber-600" key="gluten" />);
    }
    if (allergens.includes('egg') || allergens.includes('ei')) {
      icons.push(<Egg size={size} className="text-amber-500" key="egg" />);
    }
    if (allergens.includes('lactose') || allergens.includes('milch')) {
      icons.push(<Milk size={size} className="text-blue-400" key="milk" />);
    }
    if (allergens.includes('soja') || allergens.includes('soy')) {
      icons.push(<Bean size={size} className="text-green-700" key="soy" />);
    }
    if (allergens.includes('nuss') || allergens.includes('nut') || allergens.includes('mandel') || allergens.includes('hazel')) {
      icons.push(<Nut size={size} className="text-amber-800" key="nut" />);
    }

    // Fallback if absolutely nothing matches
    if (icons.length === 0) {
      icons.push(<Soup size={size} className="text-blue-500" key="fallback" />);
    }

    return icons;
  };

  const itemCount = bundle.items.length;
  const isHighDensity = itemCount >= 5;
  const isExtremeDensity = itemCount >= 9;

  const nameFontSize = itemCount === 1 ? 'text-[28px]' :
    itemCount <= 3 ? 'text-[22px]' :
      itemCount <= 5 ? 'text-[18px]' :
        itemCount === 6 ? 'text-[16px]' :
          itemCount <= 8 ? 'text-[13px]' : 'text-[11px]';

  const itemVerticalPadding = itemCount === 1 ? 'py-6' :
    itemCount <= 3 ? 'py-4' :
      itemCount === 4 ? 'py-2' :
        itemCount <= 6 ? 'py-1.5' :
          itemCount <= 8 ? 'py-0.5' : 'py-0.25';

  const allergenFontSize = itemCount > 6 ? 'text-[7px]' : 'text-[10px]';

  const iconScaleClass = isExtremeDensity ? 'scale-[0.55]' :
    isHighDensity ? 'scale-[0.75]' :
      itemCount >= 4 ? 'scale-90' : 'scale-100';

  const headerMinHeight = isHighDensity ? 'min-h-[40px]' : 'min-h-[50px]';
  const headerPadding = isHighDensity ? 'py-1' : 'py-2';
  const headerTitleSize = isHighDensity ? 'text-[16px]' : 'text-[18px]';

  const footerPadding = isHighDensity ? 'py-1' : 'py-2';
  const footerBrandSize = isHighDensity ? 'text-[18px]' : 'text-[22px]';
  const footerDateLabelSize = isHighDensity ? 'text-[7px]' : 'text-[8px]';
  const footerDateSize = isHighDensity ? 'text-[11px]' : 'text-[14px]';

  return (
    <div
      className={`label-card text-slate-900 flex flex-col overflow-hidden relative ${!forPrint ? 'shadow-2xl border border-slate-700 rounded-lg h-[148.5mm] w-[105mm]' : 'h-full w-full'}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#FFF1F6', // Light baby pink background
        color: '#000',
        width: forPrint ? '105mm' : undefined,
        height: forPrint ? '148.5mm' : undefined
      }}
    >
      <div className={`bg-[#024930] ${headerPadding} px-6 flex items-center justify-center ${headerMinHeight} shrink-0 border-b-2 border-[#FEACCF]`}>
        <h2 className={`text-white text-center font-black ${headerTitleSize} uppercase tracking-wider leading-tight`}>
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h2>
      </div>

      <div className="flex-1 px-8 py-0.5 flex flex-col overflow-hidden relative watermark bg-[#FFF1F6]">
        <div className="flex-1 flex flex-col justify-around relative z-10 overflow-hidden">
          {bundle.items.map((item, idx) => (
            <div key={item.id} className={`flex justify-between items-center border-b border-gray-100 last:border-none ${itemVerticalPadding} transition-all`}>
              <div className="flex-1 pr-3">
                <div className={`font-black ${nameFontSize} leading-tight text-gray-950`}>
                  {lang === 'de' ? item.item_name_de : item.item_name_en}
                </div>
                <div className={`flex flex-wrap gap-1 mt-0.5 ${isHighDensity ? 'opacity-90' : ''}`}>
                  {item.allergens_de.split(/[,/]+/).map((alg, aIdx) => {
                    const trimmed = alg.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={aIdx} className={`bg-[#FEACCF] ${allergenFontSize} font-black px-1 py-0.5 rounded-[1px] uppercase text-[#024930] tracking-tighter`}>
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className={`flex flex-col items-center min-w-[85px] text-center transition-transform origin-center ${iconScaleClass}`}>
                <div className="flex flex-wrap justify-center gap-2 mb-1">
                  {getItemIcons(item, isHighDensity)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight text-[#024930] leading-none opacity-80">
                  {item.diet_de}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-[#C197AB] ${footerPadding} px-8 flex justify-between items-center text-[#024930] shrink-0`}>
        <div className="flex flex-col">
          <span className={`${footerDateLabelSize} font-black uppercase tracking-widest opacity-80 leading-none`}>PACKED ON</span>
          <span className={`${footerDateSize} font-black leading-none mt-0.5`}>{packedOn}</span>
        </div>
        <div className={`font-black ${footerBrandSize} tracking-tighter italic leading-none uppercase`}>BELLA&BONA</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = TEXT[lang];
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [deletedBundles, setDeletedBundles] = useState<Bundle[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);

  // Catering State
  const [cateringSelections, setCateringSelections] = useState<Selection[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [cateringDate, setCateringDate] = useState(new Date().toLocaleDateString('en-GB'));

  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toLocaleDateString('en-GB'));
  const [activeTab, setActiveTab] = useState<'generator' | 'database' | 'catering' | 'trash'>('generator');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewType, setPreviewType] = useState<'labels' | 'menu'>('labels'); // New state for preview type
  const fileInputRef = useRef<HTMLInputElement>(null);

  const init = async () => {
    try {
      const all = await DataService.getBundles();
      setBundles(all.filter(b => !b.deleted));
      setDeletedBundles(all.filter(b => b.deleted));
    } catch (e) { }
  };

  useEffect(() => { init(); }, []);

  const filteredBundles = useMemo(() =>
    bundles.filter(b =>
      b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    ), [bundles, searchTerm]);

  const addSelection = (bundleId: string, isCatering = false) => {
    const param = isCatering ? setCateringSelections : setSelections;
    param(prev => {
      const existing = prev.find(s => s.bundleId === bundleId);
      if (existing) return prev.map(s => s.bundleId === bundleId ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { bundleId, quantity: 1 }];
    });
  };

  const moveBundleToTrash = async (bundle: Bundle) => {
    if (!confirm(`Move "${bundle.name_de}" to Trash?`)) return;
    const updated = { ...bundle, deleted: true };

    // Update State locally so UI reflects immediately
    setBundles(prev => prev.filter(b => b.id !== bundle.id));
    setDeletedBundles(prev => [...prev, updated]);

    // Persist
    await DataService.saveBundle(updated);
  };

  const restoreFromTrash = async (bundle: Bundle) => {
    const updated = { ...bundle, deleted: false };

    setDeletedBundles(prev => prev.filter(b => b.id !== bundle.id));
    setBundles(prev => [...prev, updated]);

    await DataService.saveBundle(updated);
  };

  const permanentDelete = async (bundle: Bundle) => {
    if (!confirm(`PERMANENTLY DELETE "${bundle.name_de}"? This cannot be undone.`)) return;
    setDeletedBundles(prev => prev.filter(b => b.id !== bundle.id));
    await DataService.deleteBundle(bundle.id);
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

  const currentSelections = activeTab === 'catering' ? cateringSelections : selections;

  const printGroups = useMemo(() => {
    // Determine which selections to use based on context or if previewing catering
    const logicSelections = (isPreviewing && previewType === 'menu') || activeTab === 'catering'
      ? cateringSelections
      : selections; // Default to generator selections

    // BUT: If we are in "Catering" tab and want to print LABELS, we use cateringSelections.
    // If we are in "Generator" tab, we use selections.

    // To simplify: If we are previewing, use the relevant selections.
    // If not previewing (hidden print div), we might need to handle both? 
    // Actually the hidden print div is for `window.print()`.
    // Currently the structure renders `printGroups` into `.print-only`.
    // We need to know WHICH one to print.

    // While in Catering Tab, User clicks "Print Labels" -> We update state to `printSource='catering'`?
    // Let's rely on `isPreviewing` and `activeTab`. 
    // If `activeTab === 'catering'`, we print catering stuff.

    const targetSelections = (activeTab === 'catering' || (isPreviewing && previewType === 'menu')) ? cateringSelections : selections;

    const allLabels = targetSelections.flatMap(sel => {
      const b = bundles.find(b => b.id === sel.bundleId);
      return b ? Array(sel.quantity).fill(b) : [];
    });
    const groups = [];
    for (let i = 0; i < allLabels.length; i += 4) groups.push(allLabels.slice(i, i + 4));
    return groups;
  }, [selections, cateringSelections, bundles, activeTab, isPreviewing, previewType]);

  // Menu Print Logic
  const MenuPrint = () => {
    const selectedBundles = cateringSelections.map(s => bundles.find(b => b.id === s.bundleId)).filter(Boolean) as Bundle[];

    return (
      <div className="w-[210mm] h-[297mm] bg-white p-[20mm] relative flex flex-col items-center">
        {/* Decorative Header */}
        <div className="w-full text-center border-b-4 border-[#024930] pb-8 mb-8">
          <div className="flex justify-center mb-4 text-[#FEACCF]">
            <ChefHat size={64} strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-black text-[#024930] uppercase tracker-widest mb-2 font-serif">Menu</h1>
          <div className="text-xl text-[#C197AB] font-bold uppercase tracking-[0.3em]">{companyName || 'Special Catering'}</div>
        </div>

        {/* Date */}
        <div className="absolute top-[20mm] right-[20mm] flex flex-col items-end">
          <span className="text-xs font-bold text-[#024930] uppercase tracking-widest">Date</span>
          <span className="text-lg font-serif text-[#024930]">{cateringDate}</span>
        </div>

        {/* Menu Items */}
        <div className="w-full flex-1 flex flex-col gap-6">
          {selectedBundles.map((b, idx) => (
            <div key={idx} className="flex flex-col items-center text-center pb-6 border-b border-gray-100 last:border-none">
              <h2 className="text-2xl font-bold text-[#024930] mb-2">{lang === 'de' ? b.name_de : b.name_en}</h2>
              <div className="text-sm text-gray-500 max-w-[80%] italic leading-relaxed">
                {b.items.map(i => lang === 'de' ? i.item_name_de : i.item_name_en).join(' • ')}
              </div>
              <div className="flex gap-2 mt-2 justify-center">
                {/* We could show allergens here too if needed */}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="w-full text-center mt-auto border-t border-[#FEACCF] pt-6">
          <div className="flex items-center justify-center gap-2 text-[#024930] font-black text-xl italic uppercase">
            <span>Bella</span><span className="text-[#FEACCF]">&</span><span>Bona</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Bon Appétit</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="print-only">
        {previewType === 'menu' && activeTab === 'catering' ? (
          <MenuPrint />
        ) : (
          printGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="label-page-group">
              {group.map((bundle, bIdx) => (
                <div key={bIdx} className="label-card-container">
                  <Label bundle={bundle} lang={lang} packedOn={activeTab === 'catering' ? cateringDate : packedOn} forPrint />
                </div>
              ))}
            </div>
          ))
        )}
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
              <button onClick={() => setActiveTab('catering')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'catering' ? 'bg-[#FEACCF] text-[#024930]' : 'text-slate-400 hover:bg-slate-800'}`}>
                <ChefHat size={20} /><span className="hidden lg:block font-bold">Special Catering</span>
              </button>
              <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'database' ? 'bg-[#FEACCF] text-[#024930]' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Database size={20} /><span className="hidden lg:block font-bold">Database</span>
              </button>
            </nav>

            <div className="p-4">
              <button onClick={() => setActiveTab('trash')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'trash' ? 'bg-red-500/20 text-red-400' : 'text-slate-600 hover:text-red-400 hover:bg-slate-900'}`}>
                <Trash2 size={20} /><span className="hidden lg:block font-bold">Trash</span>
              </button>
            </div>
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
            ) : activeTab === 'catering' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-5 space-y-8">
                  {/* Search & Selection for Catering - Reuse but with cateringSelections */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><ChefHat className="text-[#FEACCF]" /> Event Details</h3>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500">Company Name</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter Company Name" className="w-full bg-slate-950 rounded-xl px-4 py-3 text-white border border-slate-800 focus:ring-2 focus:ring-[#FEACCF] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-slate-500">Event Date</label>
                      <input type="text" value={cateringDate} onChange={e => setCateringDate(e.target.value)} className="w-full bg-slate-950 rounded-xl px-4 py-3 text-white border border-slate-800 focus:ring-2 focus:ring-[#FEACCF] outline-none" />
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:ring-2 focus:ring-[#FEACCF] shadow-xl" />
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3">
                    {filteredBundles.map(bundle => (
                      <div key={bundle.id} onClick={() => addSelection(bundle.id, true)} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-[#FEACCF] hover:bg-slate-800/50 transition-all shadow-lg group">
                        <div className="flex items-center gap-4">
                          <Utensils size={22} className="text-[#FEACCF] group-hover:scale-110 transition-transform" />
                          <div>
                            <p className="font-black text-slate-200">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                          </div>
                        </div>
                        <Plus size={20} className="text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-7">
                  <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col min-h-[600px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <ChefHat size={300} />
                    </div>

                    <div className="flex justify-between mb-10 relative z-10">
                      <div>
                        <h2 className="text-2xl font-black">Catering Menu</h2>
                        <p className="text-slate-500 text-sm">{companyName || 'Untitled Event'} • {cateringDate}</p>
                      </div>
                      {cateringSelections.length > 0 && <button onClick={() => setCateringSelections([])} className="text-red-400 font-bold uppercase text-xs hover:text-red-300">Clear Menu</button>}
                    </div>

                    <div className="flex-1 space-y-4 relative z-10">
                      {cateringSelections.map(sel => {
                        const b = bundles.find(x => x.id === sel.bundleId);
                        if (!b) return null;
                        return (
                          <div key={sel.bundleId} className="flex items-center gap-4 bg-slate-800/80 rounded-xl p-4 border border-slate-700 backdrop-blur-sm">
                            <div className="flex-1">
                              <p className="font-bold text-slate-100">{lang === 'de' ? b.name_de : b.name_en}</p>
                              <p className="text-xs text-slate-500">{b.items.length} items</p>
                            </div>
                            <input type="number" min="1" value={sel.quantity} onChange={e => setCateringSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: parseInt(e.target.value) || 1 } : s))} className="w-16 bg-slate-950 rounded p-2 text-center text-[#FEACCF] font-bold border-none" />
                            <button onClick={() => setCateringSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="text-slate-500 hover:text-red-400"><X size={20} /></button>
                          </div>
                        );
                      })}

                      {cateringSelections.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-500 mt-20">
                          <ChefHat size={64} className="mb-4" />
                          <p className="font-bold">Build your menu</p>
                        </div>
                      )}
                    </div>

                    {cateringSelections.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 gap-4 relative z-10">
                        <button onClick={() => { setPreviewType('menu'); setIsPreviewing(true); }} className="bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                          <FileSpreadsheet size={20} /> Preview Menu (A4)
                        </button>
                        <button onClick={() => { setPreviewType('labels'); setIsPreviewing(true); }} className="bg-[#FEACCF] text-[#024930] font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#ff9ec6] transition-all shadow-lg">
                          <Printer size={20} /> Print Labels (A6)
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : activeTab === 'trash' ? (
              <div className="max-w-4xl mx-auto space-y-8">
                <section className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
                  <h2 className="text-3xl font-black mb-8 text-red-400 flex items-center gap-4"><Trash2 size={32} /> Trash</h2>
                  <div className="space-y-2">
                    {deletedBundles.length === 0 && <p className="text-slate-500 text-center py-10 font-bold">Trash is empty</p>}
                    {deletedBundles.map(b => (
                      <div key={b.id} className="flex justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 items-center opacity-75 hover:opacity-100 transition-all">
                        <span className="font-bold text-slate-400 line-through">{b.name_de}</span>
                        <div className="flex gap-2">
                          <button onClick={() => restoreFromTrash(b)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 text-xs font-bold uppercase"><RotateCcw size={14} /> Restore</button>
                          <button onClick={() => permanentDelete(b)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 text-xs font-bold uppercase"><Trash2 size={14} /> Delete Forever</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
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
                        <button onClick={() => moveBundleToTrash(b)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
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
              {previewType === 'menu' && activeTab === 'catering' ? (
                <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                  <MenuPrint />
                </div>
              ) : (
                printGroups.map((group, idx) => (
                  <div key={idx} className="bg-white shadow-2xl" style={{ width: '210mm', height: '297mm', minHeight: '297mm', minWidth: '210mm' }}>
                    <div className="label-page-group">
                      {group.map((b, bi) => (
                        <div key={bi} className="label-card-container">
                          <Label bundle={b} lang={lang} packedOn={activeTab === 'catering' ? cateringDate : packedOn} forPrint />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
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
