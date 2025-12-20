import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Printer, 
  FileText, 
  Calendar,
  X,
  Edit2,
  Save,
  Info,
  PlusCircle,
  Leaf,
  Sprout,
  Fish,
  Utensils,
  Beef,
  Croissant,
  Soup,
  Database,
  AlertTriangle,
  Tag,
  Check,
  RefreshCw,
  Sparkles,
  Eye,
  Maximize2
} from 'lucide-react';

/**
 * BRAND CONSTANTS
 */
const COLORS = {
  GREEN: '#024930',
  PINK: '#FEACCF',
  FOOTER_BG: '#C197AB', 
};

const DEFAULT_ALLERGENS = [
  { code: 'A', name: 'Gluten' },
  { code: 'B', name: 'Crustaceans' },
  { code: 'C', name: 'Eggs' },
  { code: 'D', name: 'Fish' },
  { code: 'E', name: 'Peanuts' },
  { code: 'F', name: 'Soy' },
  { code: 'G', name: 'Milk/Lactose' },
  { code: 'H', name: 'Nuts' },
  { code: 'L', name: 'Celery' },
  { code: 'M', name: 'Mustard' },
  { code: 'N', name: 'Sesame' },
  { code: 'O', name: 'Sulphites' },
  { code: 'P', name: 'Lupin' },
  { code: 'R', name: 'Molluscs' },
];

const DEMO_BUNDLES: Bundle[] = [
  {
    id: 'demo-1',
    name_de: 'Frühstücks-Box Klassik',
    name_en: 'Breakfast Box Classic',
    created_at: new Date().toISOString(),
    items: [
      { id: 'i1', bundle_id: 'demo-1', item_name_de: 'Buttercroissant', item_name_en: 'Butter Croissant', allergens_de: 'A, C, G', diet_de: 'Vegetarisch', created_at: '' },
      { id: 'i2', bundle_id: 'demo-1', item_name_de: 'Frischer Obstsalat', item_name_en: 'Fresh Fruit Salad', allergens_de: '', diet_de: 'Vegan', created_at: '' },
      { id: 'i3', bundle_id: 'demo-1', item_name_de: 'Griechischer Joghurt', item_name_en: 'Greek Yogurt', allergens_de: 'G', diet_de: 'Vegetarisch', created_at: '' }
    ]
  },
  {
    id: 'demo-2',
    name_de: 'Bella Italia Lunch',
    name_en: 'Bella Italia Lunch',
    created_at: new Date().toISOString(),
    items: [
      { id: 'i4', bundle_id: 'demo-2', item_name_de: 'Penne mit Pesto', item_name_en: 'Penne with Pesto', allergens_de: 'A, G, H', diet_de: 'Vegetarisch', created_at: '' },
      { id: 'i5', bundle_id: 'demo-2', item_name_de: 'Bresaola & Rucola', item_name_en: 'Bresaola & Rocket', allergens_de: '', diet_de: 'Fleisch', created_at: '' }
    ]
  }
];

const getAllergenFullName = (input: string, legend: { code: string, name: string }[]): string => {
  const clean = input.trim().toUpperCase();
  const found = legend.find(a => a.code === clean || a.name.toUpperCase() === clean);
  return found ? found.name : input.trim();
};

const TEXT = {
  de: {
    appTitle: 'Bella&Bona Etiketten-Generator',
    labelGenerator: 'Etiketten-Generator',
    importData: 'Datenbank & Import',
    packedOn: 'Abgepackt am',
    searchPlaceholder: 'Nach Bundles suchen...',
    availableBundles: 'Verfügbare Bundles',
    selectedBundles: 'Ausgewählte Bundles',
    noBundles: 'Keine Bundles gefunden.',
    add: 'Hinzufügen',
    quantity: 'Anzahl',
    clearAll: 'Alle löschen',
    generatePdf: 'PDF generieren',
    previewPdf: 'Vorschau',
    importInstructions: 'Format-Anweisungen',
    importRequired: 'Erforderlich',
    importOptional: 'Optional',
    downloadTemplate: 'Excel-Template herunterladen',
    uploadFile: 'Excel/CSV hochladen',
    allergens: 'Allergene',
    diet: 'Ernährungsform',
    brandName: 'BELLA&BONA',
    successImport: 'Daten erfolgreich importiert!',
    errorImport: 'Fehler beim Importieren.',
    noSelected: 'Noch keine Bundles ausgewählt.',
    createNew: 'Neues Bundle',
    editBundle: 'Bundle bearbeiten',
    saveBundle: 'Speichern',
    deleteBundle: 'Löschen',
    addItem: 'Item hinzufügen',
    bundleName: 'Bundle Name',
    itemName: 'Item Name',
    allergenLegend: 'Allergen-Legende',
    dbStats: 'Datenbank',
    clearDb: 'Löschen',
    confirmClear: 'Alle Daten löschen?',
    manageAllergens: 'Allergene Verwalten',
    allergenCode: 'Code (z.B. X)',
    allergenName: 'Name (z.B. Hafer)',
    addAllergen: 'Hinzufügen',
    selectAllergens: 'Allergene wählen',
    loadDemo: 'Demo Daten laden',
    download: 'Herunterladen',
    close: 'Schließen'
  },
  en: {
    appTitle: 'Bella&Bona Label Generator',
    labelGenerator: 'Label Generator',
    importData: 'Database & Import',
    packedOn: 'Packed On',
    searchPlaceholder: 'Search bundles...',
    availableBundles: 'Available Bundles',
    selectedBundles: 'Selected Bundles',
    noBundles: 'No bundles found.',
    add: 'Add',
    quantity: 'Qty',
    clearAll: 'Clear All',
    generatePdf: 'Generate PDF',
    previewPdf: 'Preview',
    importInstructions: 'Format Instructions',
    importRequired: 'Required',
    importOptional: 'Optional',
    downloadTemplate: 'Download Excel Template',
    uploadFile: 'Upload Excel/CSV',
    allergens: 'Allergens',
    diet: 'Diet Type',
    brandName: 'BELLA&BONA',
    successImport: 'Data imported successfully!',
    errorImport: 'Error importing file.',
    noSelected: 'No bundles selected yet.',
    createNew: 'Create New Bundle',
    editBundle: 'Edit Bundle',
    saveBundle: 'Save Bundle',
    deleteBundle: 'Delete',
    addItem: 'Add Item',
    bundleName: 'Bundle Name',
    itemName: 'Item Name',
    allergenLegend: 'Allergen Legend',
    dbStats: 'Database',
    clearDb: 'Clear DB',
    confirmClear: 'Clear all data?',
    manageAllergens: 'Manage Allergens',
    allergenCode: 'Code (e.g. X)',
    allergenName: 'Name (e.g. Oats)',
    addAllergen: 'Add Allergen',
    selectAllergens: 'Select Allergens',
    loadDemo: 'Load Demo Data',
    download: 'Download',
    close: 'Close'
  }
};

interface BundleItem {
  id: string;
  bundle_id: string;
  item_name_de: string;
  item_name_en: string;
  allergens_de: string;
  diet_de: string;
  created_at: string;
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

const DB_KEY = 'bb_label_db_v3';
const ALLERGEN_KEY = 'bb_allergen_db_v3';

const getInitialData = (): Bundle[] => {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) return JSON.parse(saved);
  return [];
};

const getInitialAllergens = (): { code: string, name: string }[] => {
  const saved = localStorage.getItem(ALLERGEN_KEY);
  if (saved) return JSON.parse(saved);
  return DEFAULT_ALLERGENS;
};

const DietSymbol = ({ type, size = 20 }: { type: string, size?: number }) => {
  const t = type.toLowerCase();
  if (t.includes('vegan')) return <Leaf size={size} strokeWidth={2.5} className="text-green-600" />;
  if (t.includes('vege')) return <Sprout size={size} strokeWidth={2.5} className="text-green-500" />;
  if (t.includes('fish') || t.includes('fisch')) return <Fish size={size} strokeWidth={2.5} className="text-blue-500" />;
  if (t.includes('omni') || t.includes('fleisch') || t.includes('meat')) return <Beef size={size} strokeWidth={2.5} className="text-red-700" />;
  return <Utensils size={size} strokeWidth={2.5} className="text-slate-400" />;
};

const WatermarkPattern = () => (
  <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex flex-wrap justify-around items-center overflow-hidden p-4">
    {Array.from({ length: 15 }).map((_, i) => (
      <React.Fragment key={i}>
        <Croissant size={60} className="rotate-12 mb-6" />
        <Soup size={60} className="-rotate-12 mb-6" />
      </React.Fragment>
    ))}
  </div>
);

const LabelPreview = ({ bundle, date, t, lang, allergens }: { bundle: Bundle, date: string, t: any, lang: 'de' | 'en', allergens: { code: string, name: string }[] }) => {
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-GB';
  const itemCount = bundle.items.length;

  const config = useMemo(() => {
    if (itemCount <= 3) return { title: 28, item: 20, allergen: 10, dietIcon: 26, dietText: 12, spacing: 'py-10 gap-10', divider: true, headerMin: 100 };
    if (itemCount <= 5) return { title: 24, item: 16, allergen: 9, dietIcon: 22, dietText: 11, spacing: 'py-6 gap-6', divider: true, headerMin: 90 };
    if (itemCount <= 7) return { title: 22, item: 13, allergen: 8.5, dietIcon: 18, dietText: 10, spacing: 'py-4 gap-4', divider: true, headerMin: 80 };
    if (itemCount <= 10) return { title: 20, item: 11, allergen: 7.5, dietIcon: 16, dietText: 9, spacing: 'py-3 gap-2.5', divider: false, headerMin: 70 };
    return { title: 18, item: 10, allergen: 7, dietIcon: 14, dietText: 8, spacing: 'py-2 gap-1.5', divider: false, headerMin: 65 };
  }, [itemCount]);

  const displayBundleName = lang === 'de' ? bundle.name_de : bundle.name_en;

  return (
    <div 
      className="flex flex-col relative" 
      style={{ 
        width: '105mm', 
        height: '148.5mm', 
        backgroundColor: '#FFFFFF', 
        color: COLORS.GREEN,
        boxSizing: 'border-box',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}
    >
      <WatermarkPattern />
      <div className="brand-green text-white relative z-10 shadow-md flex flex-col justify-center px-6" style={{ minHeight: `${config.headerMin}px` }}>
        <h1 className="font-black uppercase tracking-tight text-center leading-[1.1]" style={{ fontSize: `${config.title}px` }}>
          {displayBundleName}
        </h1>
      </div>
      <div className="h-1.5 brand-pink w-full relative z-10"></div>

      <div className={`flex-1 relative z-10 flex flex-col justify-start px-8 ${config.spacing} overflow-hidden`}>
        {bundle.items.map((item, idx) => {
          const displayItemName = lang === 'de' ? item.item_name_de : item.item_name_en;
          return (
            <div key={item.id} className="relative w-full flex flex-col">
              {idx > 0 && config.divider && (
                <div className="w-full flex items-center gap-2 opacity-10 mb-2">
                  <div className="flex-1 border-t border-brand-green"></div>
                  <div className="w-1 h-1 rounded-full brand-pink"></div>
                  <div className="flex-1 border-t border-brand-green"></div>
                </div>
              )}
              
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-black leading-[1.1] text-slate-900 mb-1" style={{ fontSize: `${config.item}px` }}>
                    {displayItemName}
                  </p>
                  {item.allergens_de && (
                    <div className="flex flex-wrap gap-1">
                      {item.allergens_de.split(',').map((a, i) => (
                         <span 
                           key={i} 
                           className="brand-pink text-[#024930] px-1.5 py-0.5 rounded-sm font-extrabold shadow-sm whitespace-nowrap uppercase tracking-wider leading-none" 
                           style={{ fontSize: `${config.allergen}px` }}
                         >
                          {getAllergenFullName(a, allergens)}
                         </span>
                      ))}
                    </div>
                  )}
                </div>

                {item.diet_de && (
                  <div className="shrink-0 flex flex-col items-center pt-0.5 min-w-[55px]">
                    <div className="p-1 bg-white rounded-full shadow-sm border border-slate-50 mb-0.5">
                      <DietSymbol type={item.diet_de} size={config.dietIcon} />
                    </div>
                    <span 
                      className="uppercase font-black tracking-widest text-[#024930] bg-pink-100/60 px-1.5 py-0.5 rounded shadow-sm text-center w-full leading-none" 
                      style={{ fontSize: `${config.dietText}px` }}
                    >
                      {item.diet_de}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-10 py-4 border-t border-slate-100 flex justify-between items-center relative z-10" style={{ backgroundColor: COLORS.FOOTER_BG }}>
        <div className="flex flex-col">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-700 mb-0.5">{t.packedOn}</p>
          <p className="text-sm font-black text-brand-green leading-none">
            {new Date(date).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black tracking-tighter text-brand-green leading-none uppercase">
            {t.brandName.split('&')[0]}<span className="text-brand-pink">&</span>{t.brandName.split('&')[1]}
          </p>
        </div>
      </div>
    </div>
  );
};

const BundleEditor = ({ bundle, allergens, onSave, onCancel, t }: { 
  bundle?: Bundle, 
  allergens: {code: string, name: string}[],
  onSave: (bundle: Bundle) => void, 
  onCancel: () => void,
  t: any 
}) => {
  const [formData, setFormData] = useState<Bundle>(bundle || {
    id: Math.random().toString(36).substr(2, 9),
    name_de: '',
    name_en: '',
    items: [],
    created_at: new Date().toISOString()
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Math.random().toString(36).substr(2, 9),
        bundle_id: prev.id,
        item_name_de: '',
        item_name_en: '',
        allergens_de: '',
        diet_de: '',
        created_at: new Date().toISOString()
      }]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: keyof BundleItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const toggleAllergen = (itemId: string, allergenCode: string) => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item) return;

    let current = item.allergens_de.split(',').map(s => s.trim()).filter(Boolean);
    if (current.includes(allergenCode)) {
      current = current.filter(c => c !== allergenCode);
    } else {
      current.push(allergenCode);
    }
    updateItem(itemId, 'allergens_de', current.join(', '));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-black text-brand-pink uppercase tracking-tight">{bundle ? t.editBundle : t.createNew}</h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition p-2"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.bundleName} (DE)</label>
              <input type="text" value={formData.name_de} onChange={e => setFormData({...formData, name_de: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.bundleName} (EN)</label>
              <input type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"/>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">{t.addItem}s</h3>
              <button onClick={addItem} className="flex items-center gap-2 text-xs font-bold brand-pink text-brand-green px-4 py-2 rounded-xl transition hover:brightness-110"><Plus size={14} /> {t.addItem}</button>
            </div>
            <div className="space-y-6">
              {formData.items.map((item) => (
                <div key={item.id} className="bg-slate-800/30 border border-slate-700 p-6 rounded-2xl relative group">
                  <button onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition"><Trash2 size={18} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.itemName} (DE)</label>
                      <input type="text" value={item.item_name_de} onChange={e => updateItem(item.id, 'item_name_de', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.itemName} (EN)</label>
                      <input type="text" value={item.item_name_en} onChange={e => updateItem(item.id, 'item_name_en', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">{t.selectAllergens}</label>
                      <div className="flex flex-wrap gap-2">
                        {allergens.map(a => {
                          const isSelected = item.allergens_de.split(',').map(s => s.trim()).includes(a.code);
                          return (
                            <button 
                              key={a.code} 
                              onClick={() => toggleAllergen(item.id, a.code)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition ${isSelected ? 'brand-pink text-brand-green' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                            >
                              {isSelected && <Check size={10} />}
                              {a.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.diet}</label>
                      <select 
                        value={item.diet_de} 
                        onChange={e => updateItem(item.id, 'diet_de', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">None</option>
                        <option value="Vegetarisch">Vegetarisch</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Fleisch">Meat / Fleisch</option>
                        <option value="Fisch">Fish / Fisch</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-4">
          <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-bold">Cancel</button>
          <button onClick={() => onSave(formData)} className="brand-pink text-brand-green px-10 py-3 rounded-xl font-black shadow-lg hover:brightness-110">Save Bundle</button>
        </div>
      </div>
    </div>
  );
};

const PreviewModal = ({ blobUrl, onClose, onDownload, t }: { blobUrl: string, onClose: () => void, onDownload: () => void, t: any }) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="brand-pink p-2.5 rounded-2xl"><Eye size={24} className="text-brand-green" /></div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{t.previewPdf}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onDownload} className="flex items-center gap-3 brand-green text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all">
              <Download size={18} /> {t.download}
            </button>
            <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition bg-slate-800 rounded-2xl">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-950 p-6 relative">
          <iframe src={blobUrl} className="w-full h-full rounded-2xl border border-slate-800 shadow-inner" />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [bundles, setBundles] = useState<Bundle[]>(getInitialData);
  const [allergens, setAllergens] = useState<{ code: string, name: string }[]>(getInitialAllergens);
  const [page, setPage] = useState<'generator' | 'import'>('generator');
  const [lang, setLang] = useState<'de' | 'en'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null | 'new'>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const [newAllergenCode, setNewAllergenCode] = useState('');
  const [newAllergenName, setNewAllergenName] = useState('');

  const t = (TEXT as any)[lang];

  useEffect(() => { localStorage.setItem(DB_KEY, JSON.stringify(bundles)); }, [bundles]);
  useEffect(() => { localStorage.setItem(ALLERGEN_KEY, JSON.stringify(allergens)); }, [allergens]);

  // Cleanup preview URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const filteredBundles = useMemo(() => {
    return bundles.filter(b => 
      b.name_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bundles, searchTerm]);

  const addBundleSelection = (id: string, qty: number = 1) => {
    setSelections(prev => {
      const exists = prev.find(s => s.bundleId === id);
      if (exists) return prev;
      return [...prev, { bundleId: id, quantity: qty }];
    });
  };

  const removeSelection = (id: string) => setSelections(prev => prev.filter(s => s.bundleId !== id));
  const updateQuantity = (id: string, qty: number) => setSelections(prev => prev.map(s => s.bundleId === id ? { ...s, quantity: Math.max(1, qty) } : s));

  const saveBundle = (updatedBundle: Bundle) => {
    setBundles(prev => {
      const exists = prev.find(b => b.id === updatedBundle.id);
      if (exists) return prev.map(b => b.id === updatedBundle.id ? updatedBundle : b);
      return [updatedBundle, ...prev];
    });
    setEditingBundle(null);
  };

  const deleteBundle = (id: string) => {
    if (window.confirm("Delete this bundle?")) {
      setBundles(prev => prev.filter(b => b.id !== id));
      setSelections(prev => prev.filter(s => s.bundleId !== id));
    }
  };

  const loadDemoData = () => {
    setBundles(DEMO_BUNDLES);
  };

  const clearDatabase = () => {
    if (window.confirm(t.confirmClear)) {
      setBundles([]);
      setSelections([]);
      localStorage.removeItem(DB_KEY);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        const XLSX = (window as any).XLSX;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) return;

        const bundleMap = new Map<string, Bundle>();
        jsonData.forEach(row => {
          const norm: any = {};
          Object.keys(row).forEach(k => norm[k.toLowerCase().trim()] = row[k]);
          const bName = norm.bundle_name_de;
          if (!bName) return;

          let bundle = bundleMap.get(bName);
          if (!bundle) {
            bundle = {
              id: Math.random().toString(36).substr(2, 9),
              name_de: bName,
              name_en: norm.bundle_name_en || bName,
              created_at: new Date().toISOString(),
              items: []
            };
            bundleMap.set(bName, bundle);
          }
          bundle.items.push({
            id: Math.random().toString(36).substr(2, 9),
            bundle_id: bundle.id,
            item_name_de: norm.item_name_de || "",
            item_name_en: norm.item_name_en || "",
            allergens_de: String(norm.allergens_de || ""),
            diet_de: norm.diet_de || "",
            created_at: new Date().toISOString()
          });
        });

        const newBundlesList = Array.from(bundleMap.values());
        setBundles(prev => {
          const updated = [...prev];
          newBundlesList.forEach(nb => {
            const idx = updated.findIndex(b => b.name_de === nb.name_de);
            if (idx > -1) updated[idx] = nb;
            else updated.unshift(nb);
          });
          return updated;
        });

        alert(t.successImport);
        setPage('generator');
      } catch (err) {
        alert(t.errorImport);
      }
    };
    reader.readAsBinaryString(file);
  };

  const generatePDF = async (shouldDownload: boolean = false) => {
    if (selections.length === 0) return;
    setIsGenerating(true);
    
    // Revoke previous blob if any
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    
    const { jsPDF } = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const flatLabels: Bundle[] = [];
    selections.forEach(sel => {
      const bundle = bundles.find(b => b.id === sel.bundleId);
      if (bundle) for (let i = 0; i < sel.quantity; i++) flatLabels.push(bundle);
    });

    const renderContainer = document.getElementById('pdf-render-container')!;
    
    for (let i = 0; i < flatLabels.length; i++) {
      const bundle = flatLabels[i];
      const labelEl = document.createElement('div');
      renderContainer.appendChild(labelEl);
      const root = createRoot(labelEl);
      root.render(<LabelPreview bundle={bundle} date={packedOn} t={t} lang={lang} allergens={allergens} />);
      
      // Delay to ensure rendering completes
      await new Promise(resolve => setTimeout(resolve, 850));
      
      const canvas = await html2canvas(labelEl, { 
        scale: 2.5, 
        useCORS: true, 
        width: 396.85, 
        height: 561.26, 
        logging: false 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const x = (i % 2) * 105;
      const y = (Math.floor(i / 2) % 2) * 148.5;
      
      if (i > 0 && i % 4 === 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', x, y, 105, 148.5);
      renderContainer.removeChild(labelEl);
    }
    
    if (shouldDownload) {
      pdf.save(`BellaBona_Labels_${packedOn}.pdf`);
    } else {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    }
    
    setIsGenerating(false);
  };

  const handleAddAllergen = () => {
    if (!newAllergenCode || !newAllergenName) return;
    setAllergens(prev => {
      const exists = prev.find(a => a.code.toUpperCase() === newAllergenCode.toUpperCase());
      if (exists) return prev.map(a => a.code.toUpperCase() === newAllergenCode.toUpperCase() ? { ...a, name: newAllergenName } : a);
      return [...prev, { code: newAllergenCode.toUpperCase(), name: newAllergenName }];
    });
    setNewAllergenCode('');
    setNewAllergenName('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <div id="pdf-render-container"></div>
      
      {editingBundle && (
        <BundleEditor 
          allergens={allergens} 
          bundle={editingBundle === 'new' ? undefined : editingBundle} 
          onSave={saveBundle} 
          onCancel={() => setEditingBundle(null)} 
          t={t} 
        />
      )}

      {previewBlobUrl && (
        <PreviewModal 
          blobUrl={previewBlobUrl} 
          onClose={() => setPreviewBlobUrl(null)} 
          onDownload={() => generatePDF(true)}
          t={t}
        />
      )}
      
      <nav className="brand-green text-white px-8 py-5 flex flex-col md:flex-row items-center justify-between shadow-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="brand-pink text-brand-green p-2.5 rounded-2xl shadow-inner"><FileText size={28} strokeWidth={2.5} /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Bella<span className="text-brand-pink">&</span>Bona</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Label Engine v2.2</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-green-900/30 p-1 rounded-2xl flex border border-green-800/50 backdrop-blur-sm">
            <button onClick={() => setPage('generator')} className={`px-5 py-2 rounded-xl text-sm font-black transition-all duration-300 ${page === 'generator' ? 'brand-pink text-brand-green scale-105 shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t.labelGenerator}</button>
            <button onClick={() => setPage('import')} className={`px-5 py-2 rounded-xl text-sm font-black transition-all duration-300 ${page === 'import' ? 'brand-pink text-brand-green scale-105 shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t.importData}</button>
          </div>
          <div className="ml-4 flex items-center bg-slate-800 p-1 rounded-full border border-slate-700">
             <button onClick={() => setLang('de')} className={`px-3 py-1.5 text-xs rounded-full transition ${lang === 'de' ? 'bg-white text-black font-black' : 'text-slate-500'}`}>DE</button>
             <button onClick={() => setLang('en')} className={`px-3 py-1.5 text-xs rounded-full transition ${lang === 'en' ? 'bg-white text-black font-black' : 'text-slate-500'}`}>EN</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 animate-fade-in">
        {page === 'generator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{t.packedOn}</label>
                      <input type="date" value={packedOn} onChange={(e) => setPackedOn(e.target.value)} className="w-full pl-6 pr-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-brand-pink transition-all font-bold"/>
                    </div>
                    <div className="flex-[2] relative">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{t.searchPlaceholder}</label>
                      <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:border-brand-pink transition-all font-bold"/>
                      </div>
                    </div>
                    <button onClick={() => setEditingBundle('new')} className="brand-green text-white p-4 rounded-2xl hover:brightness-110 shadow-xl transition-all active:scale-95"><PlusCircle size={24} /></button>
                  </div>
                </div>
                <div className="divide-y divide-slate-800/50 h-[600px] overflow-y-auto">
                  {filteredBundles.map(bundle => (
                    <div key={bundle.id} className="p-6 hover:bg-slate-800/30 transition-all flex items-center justify-between group">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-black text-slate-100 text-xl tracking-tight">{lang === 'de' ? bundle.name_de : bundle.name_en}</h3>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingBundle(bundle)} className="p-2 bg-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-600 transition-all"><Edit2 size={14} /></button>
                            <button onClick={() => deleteBundle(bundle.id)} className="p-2 bg-red-900/20 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/40 transition-all"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">{lang === 'de' ? bundle.name_en : bundle.name_de}</p>
                      </div>
                      <button onClick={() => addBundleSelection(bundle.id)} className="brand-pink text-brand-green px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-105 transition-all shadow-md active:scale-95">{t.add}</button>
                    </div>
                  ))}
                  {filteredBundles.length === 0 && (
                    <div className="p-24 text-center">
                      <div className="mb-6 flex justify-center text-slate-800"><Database size={64} /></div>
                      <p className="text-slate-600 font-black uppercase tracking-widest text-sm mb-8">{t.noBundles}</p>
                      {bundles.length === 0 && (
                        <button onClick={loadDemoData} className="inline-flex items-center gap-2 brand-pink/10 text-brand-pink border border-brand-pink/20 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-pink/20 transition-all">
                          <Sparkles size={16} /> {t.loadDemo}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col">
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col h-full sticky top-32 max-h-[760px]">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="font-black text-brand-pink uppercase text-xs tracking-[0.2em]">{t.selectedBundles}</h2>
                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black">{selections.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selections.map(sel => {
                    const bundle = bundles.find(b => b.id === sel.bundleId);
                    if (!bundle) return null;
                    return (
                      <div key={sel.bundleId} className="flex items-center justify-between p-5 bg-slate-800/40 rounded-3xl border border-slate-700/50 group animate-fade-in">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-black text-sm truncate text-slate-200">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                          <div className="flex items-center gap-2 mt-3">
                             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Qty:</label>
                             <input type="number" value={sel.quantity} onChange={(e) => updateQuantity(sel.bundleId, parseInt(e.target.value) || 1)} className="w-16 bg-slate-900 border border-slate-700 rounded-xl text-center text-sm font-black py-1 text-brand-pink"/>
                          </div>
                        </div>
                        <button onClick={() => removeSelection(sel.bundleId)} className="text-slate-700 group-hover:text-red-500 transition-colors p-2"><X size={20} /></button>
                      </div>
                    );
                  })}
                  {selections.length === 0 && <div className="p-12 text-center text-slate-700 font-bold text-sm italic opacity-40">{t.noSelected}</div>}
                </div>
                <div className="p-8 border-t border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      disabled={selections.length === 0 || isGenerating} 
                      onClick={() => generatePDF(false)} 
                      className="flex-1 brand-pink text-brand-green py-5 rounded-3xl font-black text-lg uppercase tracking-widest disabled:opacity-20 shadow-2xl hover:brightness-110 transition-all active:scale-[0.98] relative overflow-hidden flex items-center justify-center gap-3"
                    >
                      {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <><Eye size={20} /> {t.previewPdf}</>}
                    </button>
                    <button 
                      disabled={selections.length === 0 || isGenerating} 
                      onClick={() => generatePDF(true)} 
                      className="flex-1 brand-green text-white py-5 rounded-3xl font-black text-lg uppercase tracking-widest disabled:opacity-20 shadow-2xl hover:brightness-110 transition-all active:scale-[0.98] relative overflow-hidden flex items-center justify-center gap-3"
                    >
                      {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <><Download size={20} /> {t.download}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full brand-pink"></div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-10">{t.importData}</h2>
                  <div className="space-y-8">
                    <div className="bg-slate-800/30 p-8 rounded-[2rem] border border-slate-800">
                      <h3 className="font-black mb-6 text-brand-pink flex items-center gap-3 uppercase text-xs tracking-[0.2em]"><Info size={18} /> {t.importInstructions}</h3>
                      <div className="text-[11px] text-slate-400 space-y-4 font-mono bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <p className="opacity-50 tracking-widest">EXPECTED COLUMNS:</p>
                        <p className="text-brand-pink break-all leading-relaxed font-bold">bundle_name_de, bundle_name_en, item_name_de, item_name_en, allergens_de, diet_de, quantity, packed_on</p>
                      </div>
                      <div className="mt-10 flex flex-col sm:flex-row gap-5">
                        <button onClick={handleFileUpload as any} className="flex-1 hidden"><input type="file" id="csv-upload" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} /></button>
                        <label htmlFor="csv-upload" className="flex-1 brand-pink text-brand-green py-4 rounded-2xl font-black text-center cursor-pointer hover:brightness-110 transition shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest"><Upload size={20} /> {t.uploadFile}</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl">
                   <h3 className="font-black mb-10 text-white uppercase text-xs tracking-[0.2em] flex items-center gap-3"><Tag size={20} className="text-brand-pink" /> {t.manageAllergens}</h3>
                   <div className="bg-slate-800/30 p-8 rounded-[2rem] border border-slate-800 mb-10">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                       <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{t.allergenCode}</label>
                         <input type="text" placeholder="X" value={newAllergenCode} onChange={e => setNewAllergenCode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-sm text-white font-bold outline-none focus:border-brand-pink"/>
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{t.allergenName}</label>
                         <input type="text" placeholder="Special Nut Mix" value={newAllergenName} onChange={e => setNewAllergenName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-sm text-white font-bold outline-none focus:border-brand-pink"/>
                       </div>
                     </div>
                     <button onClick={handleAddAllergen} className="w-full py-4 rounded-2xl brand-pink text-brand-green font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                       <Plus size={16} /> {t.addAllergen}
                     </button>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {allergens.map(item => (
                      <div key={item.code} className="group flex gap-3 items-center bg-slate-800/20 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative">
                        <span className="brand-pink text-brand-green font-black px-2 py-1 rounded-xl text-[10px] min-w-[28px] text-center">{item.code}</span>
                        <span className="text-slate-300 font-bold text-[10px] truncate pr-6">{item.name}</span>
                        <button onClick={() => setAllergens(allergens.filter(a => a.code !== item.code))} className="absolute right-3 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl">
                  <h3 className="font-black mb-8 text-white uppercase text-xs tracking-[0.2em] flex items-center gap-3"><Database size={18} className="text-brand-pink" /> {t.dbStats}</h3>
                  <div className="bg-slate-800/30 p-10 rounded-[2.5rem] text-center space-y-3 border border-slate-800">
                    <p className="text-6xl font-black text-brand-pink tracking-tighter">{bundles.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{t.availableBundles}</p>
                  </div>
                  <button onClick={clearDatabase} className="w-full mt-10 border border-red-900/20 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/10 transition flex items-center justify-center gap-2"><Trash2 size={14} /> {t.clearDb}</button>
                </div>

                <div className="bg-brand-green/10 p-10 rounded-[2.5rem] border border-brand-green/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-green rotate-12"><Croissant size={80} /></div>
                  <div className="flex items-center gap-4 text-brand-pink mb-6 relative z-10">
                    <AlertTriangle size={28} />
                    <p className="font-black uppercase text-xs tracking-[0.2em]">Pro Tip</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-bold italic opacity-80 relative z-10">
                    "The bundle system automatically saves your data. Every time you import new data, it is added to the list on the left for easy access."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);