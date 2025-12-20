
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

/**
 * DATA SERVICE LAYER (Firebase Ready)
 * Swap localStorage with Firebase calls here.
 * Fix: Initialize the DataService constant to resolve the 'must be initialized' error.
 */
const DataService = {
  getBundles: (): Bundle[] => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to fetch bundles", e);
      return [];
    }
  },
  saveBundles: (bundles: Bundle[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(bundles));
  },
  getAllergens: () => {
    try {
      const data = localStorage.getItem(ALLERGEN_KEY);
      return data ? JSON.parse(data) : DEFAULT_ALLERGENS;
    } catch (e) {
      return DEFAULT_ALLERGENS;
    }
  },
  saveAllergens: (allergens: { code: string; name: string }[]) => {
    localStorage.setItem(ALLERGEN_KEY, JSON.stringify(allergens));
  },
  clearAll: () => {
    localStorage.removeItem(DB_KEY);
  },
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = TEXT[lang];
  
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [allergens, setAllergens] = useState<{code: string, name: string}[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'generator' | 'database'>('generator');
  
  const [isEditingBundle, setIsEditingBundle] = useState<Bundle | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    setBundles(DataService.getBundles());
    setAllergens(DataService.getAllergens());
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
      if (existing) {
        return prev.map(s => s.bundleId === bundleId ? { ...s, quantity: s.quantity + 1 } : s);
      }
      return [...prev, { bundleId, quantity: 1 }];
    });
  };

  const removeSelection = (bundleId: string) => {
    setSelections(prev => prev.filter(s => s.bundleId !== bundleId));
  };

  const updateQuantity = (bundleId: string, qty: number) => {
    setSelections(prev => prev.map(s => s.bundleId === bundleId ? { ...s, quantity: Math.max(1, qty) } : s));
  };

  const handleLoadDemo = () => {
    const demo: Bundle[] = [
      {
        id: 'demo-1',
        name_de: 'Italian Business Lunch',
        name_en: 'Italian Business Lunch',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'i1',
            bundle_id: 'demo-1',
            item_name_de: 'Penne Arrabbiata mit Parmesan',
            item_name_en: 'Penne Arrabbiata with Parmesan',
            allergens_de: 'A, G',
            diet_de: 'Vegetarisch',
            created_at: new Date().toISOString()
          },
          {
            id: 'i2',
            bundle_id: 'demo-1',
            item_name_de: 'Gemischter Blattsalat',
            item_name_en: 'Mixed Leaf Salad',
            allergens_de: 'M',
            diet_de: 'Vegan',
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'demo-2',
        name_de: 'Asian Power Bowl',
        name_en: 'Asian Power Bowl',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'i3',
            bundle_id: 'demo-2',
            item_name_de: 'Tofu-Curry mit Reis',
            item_name_en: 'Tofu Curry with Rice',
            allergens_de: 'F, E',
            diet_de: 'Vegan',
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
    setBundles(demo);
    DataService.saveBundles(demo);
  };

  const renderLabel = (bundle: Bundle, qty: number) => {
    return Array.from({ length: qty }).map((_, i) => (
      <div key={`${bundle.id}-${i}`} className="w-[100mm] h-[62mm] bg-white border border-gray-200 p-4 mb-4 shadow-sm flex flex-col justify-between print:shadow-none print:mb-0 print:border-none">
        <div className="flex justify-between items-start mb-2 border-b-2" style={{ borderColor: COLORS.GREEN }}>
          <span className="font-black text-xl tracking-tighter" style={{ color: COLORS.GREEN }}>{t.brandName}</span>
          <div className="text-right text-[10px] uppercase font-bold text-gray-500">
            {t.packedOn}: {packedOn}
          </div>
        </div>

        <div className="flex-1 overflow-hidden space-y-2 py-1">
          {bundle.items.map(item => (
            <div key={item.id} className="border-l-4 pl-2 py-0.5" style={{ borderColor: COLORS.PINK }}>
              <div className="font-bold text-sm leading-tight text-gray-800">
                {lang === 'de' ? item.item_name_de : item.item_name_en}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="text-[9px] font-bold px-1 rounded bg-gray-100 uppercase text-gray-600">
                    {item.diet_de}
                 </span>
                 <span className="text-[9px] text-gray-400 font-medium">
                    {t.allergens}: {item.allergens_de}
                 </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[8px] leading-[1.2] text-gray-400 border-t pt-1 flex flex-wrap gap-x-2">
          {allergens.map(a => (
            <span key={a.code}>{a.code}: {a.name}</span>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.PINK }}>
            <Sprout size={24} color={COLORS.GREEN} />
          </div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: COLORS.GREEN }}>{t.appTitle}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setLang('de')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'de' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              DE
            </button>
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              EN
            </button>
          </div>
          
          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-[#024930] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Printer size={16} />
              {t.labelGenerator}
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'database' ? 'bg-[#024930] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Database size={16} />
              {t.importData}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        {activeTab === 'generator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Bundle Selection */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-black flex items-center gap-2" style={{ color: COLORS.GREEN }}>
                     <Calendar size={20} />
                     {t.packedOn}
                   </h2>
                   <input 
                    type="date" 
                    value={packedOn}
                    onChange={(e) => setPackedOn(e.target.value)}
                    className="border-2 border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FEACCF]"
                   />
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#FEACCF]"
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 px-2">{t.availableBundles}</h3>
                  {filteredBundles.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic">{t.noBundles}</div>
                  ) : (
                    filteredBundles.map(bundle => (
                      <div key={bundle.id} className="group bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-pink-100 rounded-xl p-4 transition-all flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-800">{lang === 'de' ? bundle.name_de : bundle.name_en}</div>
                          <div className="text-[10px] text-gray-400">{bundle.items.length} Items</div>
                        </div>
                        <button 
                          onClick={() => addSelection(bundle.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#024930] shadow-sm hover:bg-[#FEACCF] transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right: Selected & Preview */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-lg font-black" style={{ color: COLORS.GREEN }}>{t.selectedBundles} ({selections.length})</h2>
                   <div className="flex gap-2">
                    <button 
                      onClick={() => setSelections([])}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      {t.clearAll}
                    </button>
                    <button 
                      onClick={() => setIsPreviewing(true)}
                      disabled={selections.length === 0}
                      className="bg-[#FEACCF] text-[#024930] font-bold px-4 py-2 rounded-lg text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Eye size={16} />
                      {t.previewPdf}
                    </button>
                   </div>
                </div>

                <div className="flex-1 space-y-4">
                  {selections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">{t.noSelected}</p>
                    </div>
                  ) : (
                    selections.map(sel => {
                      const bundle = bundles.find(b => b.id === sel.bundleId);
                      if (!bundle) return null;
                      return (
                        <div key={sel.bundleId} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{lang === 'de' ? bundle.name_de : bundle.name_en}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[200px]">
                              {bundle.items.map(i => lang === 'de' ? i.item_name_de : i.item_name_en).join(', ')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{t.quantity}</span>
                            <input 
                              type="number" 
                              value={sel.quantity}
                              onChange={(e) => updateQuantity(sel.bundleId, parseInt(e.target.value) || 1)}
                              className="w-12 text-center font-black text-[#024930] focus:outline-none"
                            />
                          </div>

                          <button 
                            onClick={() => removeSelection(sel.bundleId)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {selections.length > 0 && (
                  <div className="mt-8 pt-6 border-t flex justify-end">
                    <button 
                      onClick={() => window.print()}
                      className="bg-[#024930] text-white font-black px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-3"
                    >
                      <Printer size={20} />
                      {t.generatePdf}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black mb-1" style={{ color: COLORS.GREEN }}>{t.importData}</h2>
                  <p className="text-gray-400 text-sm">Verwalte deine Produkt-Bundles und Importe.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleLoadDemo}
                    className="px-4 py-2 text-sm font-bold border-2 border-pink-100 text-[#C197AB] rounded-xl hover:bg-pink-50"
                  >
                    {t.loadDemo}
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm(t.confirmClear)) {
                        DataService.clearAll();
                        setBundles([]);
                      }
                    }}
                    className="px-4 py-2 text-sm font-bold border-2 border-red-100 text-red-400 rounded-xl hover:bg-red-50"
                  >
                    {t.clearDb}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                      <FileText size={24} />
                   </div>
                   <div className="text-2xl font-black text-emerald-700">{bundles.length}</div>
                   <div className="text-emerald-600/60 font-bold uppercase tracking-widest text-[10px]">{t.availableBundles}</div>
                </div>
                <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100 cursor-pointer group hover:bg-pink-100 transition-colors">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#FEACCF] mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                   </div>
                   <div className="text-lg font-black text-pink-700">{t.uploadFile}</div>
                   <div className="text-pink-600/60 font-bold uppercase tracking-widest text-[10px]">Excel / CSV Support</div>
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="font-black text-gray-800 px-2">{t.availableBundles}</h3>
                 {bundles.map(bundle => (
                   <div key={bundle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                         <Soup size={20} />
                       </div>
                       <div>
                         <div className="font-bold text-gray-800">{bundle.name_de}</div>
                         <div className="text-xs text-gray-400">{bundle.items.length} Items</div>
                       </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-[#024930] hover:bg-white rounded-lg transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const next = bundles.filter(b => b.id !== bundle.id);
                            setBundles(next);
                            DataService.saveBundles(next);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   </div>
                 ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Preview Modal Overlay */}
      {isPreviewing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-white w-full max-w-[120mm] rounded-3xl shadow-2xl flex flex-col max-h-full">
            <div className="px-8 py-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-black">{t.previewPdf}</h2>
              <button 
                onClick={() => setIsPreviewing(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-gray-100 flex flex-col items-center gap-4">
              {selections.map(sel => {
                const bundle = bundles.find(b => b.id === sel.bundleId);
                return bundle ? renderLabel(bundle, sel.quantity) : null;
              })}
            </div>

            <div className="p-8 border-t bg-white rounded-b-3xl flex justify-between gap-4">
               <button 
                onClick={() => setIsPreviewing(false)}
                className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600"
               >
                 {t.close}
               </button>
               <button 
                onClick={() => window.print()}
                className="flex-1 bg-[#024930] text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg"
               >
                 <Printer size={20} />
                 {t.generatePdf}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="py-12 px-8 text-white mt-12" style={{ backgroundColor: COLORS.FOOTER_BG }}>
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start">
             <div className="text-3xl font-black mb-2 tracking-tighter">BELLA & BONA</div>
             <p className="text-white/60 text-sm">Efficient labeling for corporate catering excellence.</p>
          </div>
          <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-white/80">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Internal Wiki</a>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
           &copy; {new Date().getFullYear()} Bella & Bona GmbH. All rights reserved.
        </div>
      </footer>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #preview-area, #preview-area * {
            visibility: visible;
          }
          .fixed, header, footer, nav, button, input {
            display: none !important;
          }
          .container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          main {
            padding: 0 !important;
          }
          /* Custom layout for labels in print */
          @page {
            size: 100mm 62mm;
            margin: 0;
          }
          .bg-white {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FEACCF;
          border-radius: 10px;
        }
      `}</style>

      {/* Ghost div for print content */}
      <div id="preview-area" className="hidden print:block fixed inset-0 bg-white">
        {selections.map(sel => {
          const bundle = bundles.find(b => b.id === sel.bundleId);
          return bundle ? renderLabel(bundle, sel.quantity) : null;
        })}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
