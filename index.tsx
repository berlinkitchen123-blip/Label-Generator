
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
  type?: 'standard' | 'catering';
  company_name?: string; // Metadata from Excel
  date?: string;         // Metadata from Excel
}

interface Selection {
  bundleId: string;
  quantity: number;
}
// --- BRANDING ---
const BRAND_COLOR_PRIMARY = '#024930'; // Bella&Bona Dark Green
const BRAND_COLOR_SECONDARY = '#F8F7F6'; // Cream Background
const BRAND_COLOR_ACCENT = '#FEACCF'; // Baby Pink Accent
const BRAND_COLOR_PINK = '#f895bd'; // Darker Brand Pink

// Logo Component (Base64 Image)
const BRAND_LOGO_B64 = "data:image/png;base64,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";

const BrandLogo = ({ className = "h-12" }: { className?: string }) => (
  <img src={BRAND_LOGO_B64} alt="Bella&Bona" className={`object-contain ${className}`} />
);

// Helper for Allergen Icons (Refined)
// Helper for Allergen Icons (Professional SVG Set - EU 14)
// Helper for Allergen Icons (Premium "Sticker Style" SVG Set - EU 14)
// Helper for Allergen Icons (Professional Line Art - Single Color)
// Helper for Allergen Icons (Photorealistic Images)
const getAllergenIcons = (allergens: string) => {
  if (!allergens) return null;
  const list = allergens.toLowerCase();

  // Using High-Quality Color Icons (External Source: Icons8) for realism
  const IconUrls = {
    gluten: "https://img.icons8.com/color/96/wheat.png",
    crustacean: "https://img.icons8.com/color/96/crab.png",
    egg: "https://img.icons8.com/color/96/egg.png",
    fish: "https://img.icons8.com/color/96/fish.png",
    peanut: "https://img.icons8.com/color/96/peanuts.png",
    soy: "https://img.icons8.com/color/96/soy.png",
    milk: "https://img.icons8.com/color/96/milk-bottle.png",
    nuts: "https://img.icons8.com/color/96/hazelnut.png",
    celery: "https://img.icons8.com/color/96/celery.png",
    mustard: "https://img.icons8.com/color/96/mustard.png",
    sesame: "https://img.icons8.com/color/96/sesame.png",
    sulphites: "https://img.icons8.com/color/96/wine-bottle.png", // Wine contains sulphites
    lupin: "https://img.icons8.com/color/96/bean.png",           // Lupin is a legume/bean
    mollusc: "https://img.icons8.com/color/96/snail.png"         // Snail is a mollusc
  };

  const createIcon = (key: string, url: string, label: string) => (
    <div key={key} className="flex flex-col items-center gap-0.5" title={label}>
      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 p-0.5">
        <img src={url} alt={label} className="w-full h-full object-contain" />
      </div>
      <span className="text-[8px] font-bold text-[#024930] uppercase tracking-wide leading-none">{label}</span>
    </div>
  );

  const foundIcons: React.ReactNode[] = [];

  if (list.includes('gluten') || list.includes('weizen')) foundIcons.push(createIcon('gluten', IconUrls.gluten, 'Gluten'));
  if (list.includes('krebstier') || list.includes('crustacean')) foundIcons.push(createIcon('crustacean', IconUrls.crustacean, 'Crustaceans'));
  if (list.includes('ei') || list.includes('egg')) foundIcons.push(createIcon('egg', IconUrls.egg, 'Egg'));
  if (list.includes('fisch') || list.includes('fish')) foundIcons.push(createIcon('fish', IconUrls.fish, 'Fish'));
  if (list.includes('erdnuss') || list.includes('peanut')) foundIcons.push(createIcon('peanut', IconUrls.peanut, 'Peanuts'));
  if (list.includes('soja') || list.includes('soy')) foundIcons.push(createIcon('soy', IconUrls.soy, 'Soy'));
  if (list.includes('milch') || list.includes('milk') || list.includes('lactose')) foundIcons.push(createIcon('milk', IconUrls.milk, 'Milk'));
  if (list.includes('nuss') || list.includes('nut') || list.includes('mandel')) foundIcons.push(createIcon('nuts', IconUrls.nuts, 'Nuts'));
  if (list.includes('sellerie') || list.includes('celery')) foundIcons.push(createIcon('celery', IconUrls.celery, 'Celery'));
  if (list.includes('senf') || list.includes('mustard')) foundIcons.push(createIcon('mustard', IconUrls.mustard, 'Mustard'));
  if (list.includes('sesam') || list.includes('sesame')) foundIcons.push(createIcon('sesame', IconUrls.sesame, 'Sesame'));
  if (list.includes('schwefel') || list.includes('sulphite')) foundIcons.push(createIcon('sulphites', IconUrls.sulphites, 'Sulphites'));
  if (list.includes('lupin')) foundIcons.push(createIcon('lupin', IconUrls.lupin, 'Lupin'));
  if (list.includes('weichtier') || list.includes('mollusc')) foundIcons.push(createIcon('mollusc', IconUrls.mollusc, 'Molluscs'));

  return foundIcons.length > 0 ? <div className="flex gap-2 flex-wrap justify-center">{foundIcons}</div> : null;
};

// Helper for Diet Icons (Refined)
const getDietIcons = (diet: string, showLabel = true) => {
  const d = diet.toLowerCase();
  const style = "flex items-center gap-1.5 px-3 py-1 rounded-full border border-current shadow-sm";

  if (d.includes('vegan')) return <div className={`${style} text-green-700 bg-green-50`}><Leaf size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Vegan'}</span></div>;
  if (d.includes('vegetarisch')) return <div className={`${style} text-green-600 bg-green-50`}><Sprout size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Veggie'}</span></div>;
  if (d.includes('fish') || d.includes('fisch')) return <div className={`${style} text-blue-600 bg-blue-50`}><Fish size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Fish'}</span></div>;
  if (d.includes('meat') || d.includes('fleisch') || d.includes('beef')) return <div className={`${style} text-red-800 bg-red-50`}><span className="text-lg leading-none">🥩</span><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Meat'}</span></div>;
  return null;
};

const CateringItemLabel: React.FC<{ item: BundleItem, lang: 'de' | 'en', forPrint?: boolean }> = ({ item, lang, forPrint }) => {
  const hasAllergens = !!item.allergens_de;

  return (
    <div
      className={`relative bg-white flex flex-col justify-between p-0 overflow-hidden ${!forPrint ? 'shadow-xl w-[105mm] h-[148.5mm]' : 'w-full h-full'}`}
      style={{ width: forPrint ? '105mm' : undefined, height: forPrint ? '148.5mm' : undefined }}
    >
      {/* Top: Brand Header */}
      <div className="bg-[#024930] h-20 w-full flex items-center justify-center">
        <BrandLogo className="h-8 brightness-0 invert" />
      </div>

      {/* Middle: Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 text-center">
        {/* Diet Badge */}
        <div className="mb-4 scale-125">
          {getDietIcons(item.diet_de)}
        </div>

        {/* Dish Name - Maximized */}
        <h2 className="text-4xl leading-snug font-serif font-bold text-[#024930] uppercase mb-4">
          {lang === 'de' ? item.item_name_de : item.item_name_en}
        </h2>

        <div className="w-16 h-[1px] bg-slate-300" />
      </div>

      {/* Bottom: Allergens Section (Only if exists) */}
      {hasAllergens && (
        <div className="bg-[#FFF1F6] min-h-[90px] border-t border-[#FEACCF] p-6 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase font-bold text-[#024930] tracking-[0.2em] mb-2 opacity-70">Allergens</span>
          <div className="flex flex-col items-center gap-1">
            {getAllergenIcons(item.allergens_de)}
          </div>
        </div>
      )}
      {!hasAllergens && <div className="h-10 w-full bg-white" />} {/* Spacer if empty */}
    </div>
  );
};

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

const Label: React.FC<{ bundle: Bundle, lang: 'de' | 'en', packedOn: string, forPrint?: boolean, variant?: 'standard' | 'catering' }> = ({ bundle, lang, packedOn, forPrint, variant = 'standard' }) => {
  const getItemIcons = (item: BundleItem, isHighDensity: boolean, colorClass: string = "text-slate-700") => {
    const diet = item.diet_de.toLowerCase();
    const allergens = item.allergens_de.toLowerCase();

    // Catering uses fixed size mostly
    const size = variant === 'catering' ? 20 : (isHighDensity ? 22 : 32);
    const icons: React.ReactNode[] = [];

    // 1. Diet-based Icons
    if (diet.includes('vegan')) {
      icons.push(<Leaf size={size} className={variant === 'catering' ? "text-[#024930]" : "text-green-600"} key="vegan" />);
    } else if (diet.includes('vegetarisch')) {
      icons.push(<Sprout size={size} className={variant === 'catering' ? "text-[#024930]" : "text-green-500"} key="veggie" />);
    } else if (diet.includes('fish') || diet.includes('fisch')) {
      icons.push(<Fish size={size} className={variant === 'catering' ? "text-[#024930]" : "text-blue-500"} key="fish" />);
    } else if (diet.includes('meat') || diet.includes('fleisch') || diet.includes('beef')) {
      icons.push(<div className={variant === 'catering' ? "text-lg grayscale" : (isHighDensity ? "text-xl" : "text-3xl")} key="meat">🥩</div>);
    }

    // 2. Allergen-based Icons (Catering: maybe just text or minimal icons? Let's use text for catering mostly, icons for standard)
    if (variant === 'standard') {
      if (allergens.includes('gluten') || allergens.includes('weizen')) icons.push(<Wheat size={size} className="text-amber-600" key="gluten" />);
      if (allergens.includes('egg') || allergens.includes('ei')) icons.push(<Egg size={size} className="text-amber-500" key="egg" />);
      if (allergens.includes('lactose') || allergens.includes('milch')) icons.push(<Milk size={size} className="text-blue-400" key="milk" />);
      if (allergens.includes('soja') || allergens.includes('soy')) icons.push(<Bean size={size} className="text-green-700" key="soy" />);
      if (allergens.includes('nuss') || allergens.includes('nut') || allergens.includes('mandel') || allergens.includes('hazel')) icons.push(<Nut size={size} className="text-amber-800" key="nut" />);
      if (icons.length === 0) icons.push(<Soup size={size} className="text-blue-500" key="fallback" />);
    }

    return icons;
  };

  // --- CATERING VARIANT DESIGN ---
  if (variant === 'catering') {
    return (
      <div
        className={`relative bg-white flex flex-col items-center justify-between p-8 text-center border-[1px] border-gray-200 overflow-hidden ${!forPrint ? 'shadow-xl w-[105mm] h-[148.5mm]' : 'w-full h-full'}`}
        style={{ width: forPrint ? '105mm' : undefined, height: forPrint ? '148.5mm' : undefined, fontFamily: 'serif' }}
      >
        {/* Elegant Border Frame */}
        <div className="absolute inset-4 border-2 border-[#024930] opacity-20 pointer-events-none" />
        <div className="absolute inset-5 border border-[#024930] opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="mt-8 z-10 w-full flex flex-col items-center">
          <span className="text-[10px] uppercase font-sans tracking-[0.3em] text-[#024930] opacity-60 mb-2">Special Selection</span>
          <h2 className="text-3xl font-bold text-[#024930] leading-tight uppercase font-serif px-4">
            {lang === 'de' ? bundle.name_de : bundle.name_en}
          </h2>
          <div className="w-16 h-[2px] bg-[#FEACCF] mt-4 mb-2" />
        </div>

        {/* Body: Items List */}
        <div className="flex-1 flex flex-col justify-center items-center gap-4 w-full px-6 z-10">
          {bundle.items.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-lg font-medium text-slate-800 italic font-serif">
                {lang === 'de' ? item.item_name_de : item.item_name_en}
              </span>
              <div className="flex items-center gap-2 mt-1">
                {getItemIcons(item, false)}
                <span className="text-[10px] uppercase font-sans tracking-widest text-[#024930] border border-[#024930] px-1.5 py-0.5 rounded-sm opacity-50">
                  {item.allergens_de || 'No Allergens'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mb-8 z-10 flex flex-col items-center">
          <span className="font-sans text-[9px] uppercase tracking-widest text-slate-400 mb-1">Prepared Fresh</span>
          <span className="font-serif text-[#024930] italic">Bella&Bona Kitchen</span>
        </div>
      </div>
    );
  }

  // --- STANDARD VARIANT DESIGN (Existing) ---
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
      <div className={`bg-[#024930] ${headerPadding} px-6 flex flex-col items-center justify-center ${headerMinHeight} shrink-0 border-b-2 border-[#FEACCF] gap-1`}>
        <BrandLogo className="h-6 brightness-0 invert" />
        <h2 className={`text-white text-center font-black ${headerTitleSize} uppercase tracking-wider leading-tight`}>
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h2>
      </div>

      <div className="flex-1 px-8 py-0.5 flex flex-col overflow-hidden relative watermark bg-[#F8F7F6]">
        <div className="flex-1 flex flex-col justify-around relative z-10 overflow-hidden">
          {bundle.items.map((item, idx) => (
            <div key={item.id} className={`flex justify-between items-center border-b border-gray-100 last:border-none ${itemVerticalPadding} transition-all`}>
              <div className="flex-1 pr-3">
                <div className={`font-black ${nameFontSize} leading-tight text-gray-950`}>
                  {lang === 'de' ? item.item_name_de : item.item_name_en}
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
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
  const [previewType, setPreviewType] = useState<'labels' | 'menu' | 'review-a4' | 'review-a6'>('labels'); // New state for preview type
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
    bundles.filter(b => {
      const matchesSearch = b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.name_en.toLowerCase().includes(searchTerm.toLowerCase());
      const isCatering = b.type === 'catering';
      if (activeTab === 'catering') return matchesSearch && isCatering;
      if (activeTab === 'generator') return matchesSearch && !isCatering;
      return matchesSearch;
    }), [bundles, searchTerm, activeTab]);

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
          if (!bundleMap[nameDe].type) {
            bundleMap[nameDe].type = String(row.type || 'standard').toLowerCase().includes('catering') ? 'catering' : 'standard';
          }
          if (!bundleMap[nameDe].type) {
            bundleMap[nameDe].type = String(row.type || 'standard').toLowerCase().includes('catering') ? 'catering' : 'standard';
          }

          // CAPTURE METADATA (Company & Date) from the first row that has them
          const rowCompany = String(row.company_name || '').trim();
          const rowDate = String(row.date || '').trim();
          if (rowCompany) setCompanyName(rowCompany);
          if (rowDate) setCateringDate(rowDate);
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

  // Menu Print Logic (A4) - Refined Grouping
  const MenuPrint = () => {
    // 1. Flatten all items from selected bundles
    const allItems: BundleItem[] = [];
    cateringSelections.forEach(s => {
      const b = bundles.find(x => x.id === s.bundleId);
      if (b) {
        // Add items quantity times? Usually menu just lists unique items available.
        // Let's assume the menu lists UNIQUE items available.
        allItems.push(...b.items);
      }
    });

    // 2. Deduplicate items by name
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.item_name_de, item])).values());

    // 3. Group by Diet Type (Item Type)
    const grouped: Record<string, BundleItem[]> = {};
    const order = ['Vegan', 'Vegetarisch', 'Vegetarian', 'Fish', 'Fisch', 'Meat', 'Fleisch', 'Beef'];

    uniqueItems.forEach(item => {
      // Normalize diet string for grouping header
      let diet = item.diet_de || 'Other';
      // Simple normalization
      if (diet.toLowerCase().includes('vegan')) diet = 'Vegan';
      else if (diet.toLowerCase().includes('vegetarisch')) diet = 'Vegetarian';
      else if (diet.toLowerCase().includes('fish') || diet.toLowerCase().includes('fisch')) diet = 'Fish';
      else if (diet.toLowerCase().includes('meat') || diet.toLowerCase().includes('fleisch')) diet = 'Meat';

      if (!grouped[diet]) grouped[diet] = [];
      grouped[diet].push(item);
    });

    // Sort groups by defined order
    const sortedGroups = Object.keys(grouped).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      // if not found, push to end
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return (
      <div
        className="w-[210mm] h-[297mm] relative flex flex-col items-center py-[15mm] px-[15mm] overflow-hidden bg-[#F8F7F6]" // Pink Background
      >
        {/* Colorful Watermark Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <ChefHat size={600} color="#00543A" />
        </div>

        {/* Main Border Frame */}
        <div className="absolute inset-4 border border-[#FEACCF] opacity-50 pointer-events-none rounded-3xl" />
        <div className="absolute inset-6 border border-[#FEACCF] opacity-30 pointer-events-none rounded-2xl" />

        {/* Header */}
        <div className="flex flex-col items-center w-full mb-12 mt-4 z-10">
          <div className="w-full flex justify-center py-4 border-b-2 border-[#FEACCF]/20">
            <BrandLogo className="h-16" />
          </div>
        </div>

        {/* Menu Content - Grouped by Type */}
        <div className="flex-1 w-full pl-8 pr-8 flex flex-col z-10">
          {sortedGroups.map((groupTitle, idx) => (
            <div key={idx} className="flex flex-col w-full mb-10 last:mb-0">
              {/* Item Type Header with Lines */}
              <div className="flex items-center gap-6 mb-6">
                <div className="h-[2px] bg-[#FEACCF] flex-1"></div>
                <h2 className="text-2xl font-black text-[#024930] uppercase font-serif tracking-[0.25em] px-4 bg-[#F8F7F6]">
                  {lang === 'de' ? (
                    groupTitle === 'Vegetarian' ? 'VEGETARISCH' :
                      groupTitle === 'Meat' ? 'FLEISCH' :
                        groupTitle === 'Fish' ? 'FISCH' :
                          groupTitle
                  ) : groupTitle}
                </h2>
                <div className="h-[2px] bg-[#FEACCF] flex-1"></div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-6 w-full">
                {grouped[groupTitle].map((item, iIdx) => (
                  <div key={iIdx} className="flex flex-col w-full group">
                    <div className="flex justify-between items-baseline w-full">
                      <div className="flex-1">
                        <span className="text-xl font-bold text-[#024930] leading-tight tracking-wide">
                          {(lang === 'de' ? item.item_name_de : item.item_name_en).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getAllergenIcons(item.allergens_de)}
                      </div>
                    </div>
                    {/* Dotted Leader */}
                    <div className="border-b-2 border-dotted border-[#024930]/20 w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="w-full text-center mt-auto pt-6 border-t border-[#024930]/10 z-10">
          <p className="text-[#024930] font-bold text-sm tracking-widest uppercase opacity-70">Bella & Bona • Freshly Prepared for You</p>
        </div>

        {/* Force Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  };

  // Review Print Component
  const ReviewPrint: React.FC<{ size: 'A4' | 'A6' }> = ({ size }) => {
    // A4: 210mm x 297mm
    // A6: 105mm x 148.5mm
    const dim = size === 'A4' ? { w: '210mm', h: '297mm' } : { w: '105mm', h: '148.5mm' };
    const titleSize = size === 'A4' ? 'text-7xl mb-24' : 'text-3xl mb-12'; // Scaled down for A6
    const subSize = size === 'A4' ? 'text-5xl leading-tight mb-20' : 'text-xl leading-tight mb-8';
    const qrSize = size === 'A4' ? 'w-[400px] h-[400px]' : 'w-[150px] h-[150px]';
    const logoSize = size === 'A4' ? 'text-5xl' : 'text-2xl';

    return (
      <div
        className="flex flex-col items-center text-center bg-[#FEACCF] relative font-sans p-10 overflow-hidden"
        style={{ width: dim.w, height: dim.h }}
      >
        {/* Company Name Header */}
        <h1 className={`${titleSize} font-black text-[#024930] uppercase mt-10 tracking-wide`}>
          {companyName || 'COMPANY NAME'}
        </h1>

        {/* Call to Action */}
        <h2 className={`${subSize} font-bold text-[#024930] uppercase tracking-wide`}>
          RATE YOUR LUNCH<br />WITH US
        </h2>

        {/* QR Code Container */}
        <div className="bg-white p-4">
          {/* Placeholder QR Code - user can replace standard QR URL here */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=000000&bgcolor=ffffff&data=https://bellabona.com/review`}
            className={qrSize}
            alt="Review QR"
          />
        </div>

        {/* Footer Brand */}
        <div className={`mt-auto font-black ${logoSize} text-[#024930] uppercase tracking-tighter mb-4`}>
          BELLABONA
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="print-only">
        {previewType === 'menu' && activeTab === 'catering' ? (
          <>
            <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
              <MenuPrint />
            </div>
            <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
              <ReviewPrint size="A4" />
            </div>
          </>
        ) : (
          // Label View (A6) Logic
          // If Catering, we Flatten Print Groups per Item
          activeTab === 'catering' && previewType === 'labels' ? (
            (() => {
              // Flatten all items from all selections
              const allItems: any[] = cateringSelections.flatMap(sel => {
                const b = bundles.find(x => x.id === sel.bundleId);
                if (!b) return [];
                return Array(sel.quantity).fill(b).flatMap(() => b.items);
              });

              // Add Review Card at the end
              allItems.push({ isReviewCard: true });

              // 1. Group items into pages of 4
              const pages = [];
              for (let i = 0; i < allItems.length; i += 4) {
                pages.push(allItems.slice(i, i + 4));
              }

              // 2. Render each A4 page
              return (
                <>
                  {pages.map((pageItems, pIdx) => (
                    <div key={pIdx} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2" style={{ pageBreakAfter: 'always', margin: 0, padding: 0 }}>
                      {pageItems.map((item, iIdx) => (
                        <div key={iIdx} className="w-[105mm] h-[148.5mm] overflow-hidden flex items-center justify-center">
                          {item.isReviewCard ? <ReviewPrint size="A6" /> : <CateringItemLabel item={item} lang={lang} forPrint />}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              );
            })()
          ) : previewType === 'review-a4' ? (
            <ReviewPrint size="A4" />
          ) : previewType === 'review-a6' ? (
            <ReviewPrint size="A6" />
          ) : (
            // Standard Bundle Labels Preview
            printGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="label-page-group mb-12" style={{ breakAfter: 'always' }}>
                {group.map((bundle, bIdx) => (
                  <div key={bIdx} className="label-card-container">
                    <Label bundle={bundle} lang={lang} packedOn={packedOn} forPrint variant="standard" />
                  </div>
                ))}
              </div>
            ))
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
                          ```
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
                      const template = [{ 'type': 'Standard', 'company_name': 'Acme Corp', 'date': '12.12.2025', 'bundle_name_de': 'Brunch Set', 'bundle_name_en': 'Brunch Set', 'item_name_de': 'Croissant', 'item_name_en': 'Croissant', 'allergens_de': 'Gluten, Eier', 'diet_de': 'Vegetarisch' }];
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

      {
        isPreviewing && (
          <div className="no-print fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 overflow-y-auto">
            <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col border border-slate-800 shadow-2xl">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">Print Preview</h2>
                <button onClick={() => setIsPreviewing(false)} className="text-white bg-slate-800 p-2 rounded-xl hover:bg-slate-700"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-950 flex flex-col items-center gap-16">
                {/* Content Area */}
                {previewType === 'menu' && activeTab === 'catering' ? (
      <div className="print-only">
        {previewType === 'menu' && activeTab === 'catering' ? (
          <>
            <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
              <MenuPrint />
            </div>
            <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
              <ReviewPrint size="A4" />
            </div>
          </>
        ) : (
          // Label View (A6) Logic
          // If Catering, we Flatten Print Groups per Item
          activeTab === 'catering' && previewType === 'labels' ? (
            (() => {
              // Flatten all items from all selections
              const allItems: any[] = cateringSelections.flatMap(sel => {
                const b = bundles.find(x => x.id === sel.bundleId);
                if (!b) return [];
                return Array(sel.quantity).fill(b).flatMap(() => b.items);
              });
              
              // Add Review Card at the end
              allItems.push({ isReviewCard: true });

              // 1. Group items into pages of 4
              const pages = [];
              for (let i = 0; i < allItems.length; i += 4) {
                pages.push(allItems.slice(i, i + 4));
              }

              // 2. Render each A4 page
              return (
                <>
                  {pages.map((pageItems, pIdx) => (
                    <div key={pIdx} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2" style={{ pageBreakAfter: 'always', margin: 0, padding: 0 }}>
                      {pageItems.map((item, iIdx) => (
                        <div key={iIdx} className="w-[105mm] h-[148.5mm] overflow-hidden flex items-center justify-center">
                          {item.isReviewCard ? <ReviewPrint size="A6" /> : <CateringItemLabel item={item} lang={lang} forPrint />}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              );
            })()
                ) : activeTab === 'catering' && previewType === 'labels' ? (
                  // Catering Items Grid (4 per page)
                  (() => {
                    const allItems: any[] = cateringSelections.flatMap(sel => {
                      const b = bundles.find(x => x.id === sel.bundleId);
                      if (!b) return [];
                      return Array(sel.quantity).fill(b).flatMap(() => b.items);
                    });
                    
                    // Add Review Card
                    allItems.push({ isReviewCard: true });

                    const pages = [];
                    for (let i = 0; i < allItems.length; i += 4) {
                      pages.push(allItems.slice(i, i + 4));
                    }

                    return pages.map((pageItems, pIdx) => (
                      <div key={pIdx} className="bg-white shadow-2xl origin-top scale-[0.6] mb-12" style={{ width: '210mm', height: '297mm', display: 'grid', gridTemplateColumns: '105mm 105mm', gridTemplateRows: '148.5mm 148.5mm' }}>
                        {pageItems.map((item, iIdx) => (
                          <div key={iIdx} style={{ width: '105mm', height: '148.5mm' }}>
                            {item.isReviewCard ? <ReviewPrint size="A6" /> : <CateringItemLabel item={item} lang={lang} forPrint />}
                          </div>
                        ))}
                      </div>
                    ));
                  })()
                ) : (
                  // Standard Bundles
                  printGroups.map((group, idx) => (
                    <div key={idx} className="bg-white shadow-2xl mb-12 scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                      <div className="label-page-group">
                        {group.map((b, bi) => (
                          <div key={bi} className="label-card-container">
                            <Label bundle={b} lang={lang} packedOn={packedOn} forPrint variant="standard" />
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
            )
      }
          </>
        );
};


      const root = document.getElementById('root');
      if (root) createRoot(root).render(<App />);
