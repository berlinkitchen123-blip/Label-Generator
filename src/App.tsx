import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Search,
  Printer,
  X,
  Sprout,
  Soup,
  Database as DatabaseIcon,
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
  Utensils,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, child, get, set, remove, update, Database } from 'firebase/database';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';



import * as XLSX from 'xlsx';

const API_KEY = (import.meta as any).env.VITE_API_KEY || "AIzaSyBlB6j_w_-Mb_ughrrz8BDFdiIJEDNTKGM";


const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "label-c61eb.firebaseapp.com",
  databaseURL: "https://label-c61eb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "label-c61eb",
  storageBucket: "label-c61eb.firebasestorage.app",
  messagingSenderId: "168446433946",
  appId: "1:168446433946:web:6536d1d40fb86ee1f61d23"
};

let app: FirebaseApp | undefined;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error('Firebase init failed', e);
}

let db: Database;
let firestoreDb: Firestore;

try {
  if (app) {
    db = getDatabase(app);
    try {
      firestoreDb = getFirestore(app);
    } catch (e) { console.warn("Firestore not loaded", e); }
  }
} catch (e) {
  console.error('Database init failed', e);
}

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
    synced: 'Cloud-Daten geladen',
    dataManagement: 'Datenverwaltung',
    recoverData: 'Daten aus Firestore laden'
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
    synced: 'Cloud data loaded',
    dataManagement: 'Data Management',
    recoverData: 'Recover Data from Firestore',
    gygTab: 'GYG'
  }
};

interface BundleItem {
  id: string;
  item_name_de: string;
  item_name_en: string;
  allergens_de: string;
  diet_de: string;
  category?: string;
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
  service_type?: string;  // Metadata from Excel
}

interface Selection {
  bundleId: string;
  quantity: number;
  selectedItemIds?: string[];
}

interface ImportRow {
  bundle_name_de?: string;
  bundle_name_en?: string;
  item_name_de?: string;
  item_name_en?: string;
  allergens_de?: string;
  diet_de?: string;
  category?: string;
  service?: string;
  type?: string;
  meal?: string;
  D?: string;
  __EMPTY_1?: string;
  __EMPTY_3?: string;
}

// --- BRANDING ---
const BRAND_COLOR_PRIMARY = '#024930'; // Bella&Bona Dark Green
const BRAND_COLOR_SECONDARY = '#F8F7F6'; // Cream Background
const BRAND_COLOR_ACCENT = '#FEACCF'; // Baby Pink Accent
const BRAND_COLOR_PINK = '#f895bd'; // Darker Brand Pink

// Logo Component (Base64 Image)
const BRAND_LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALIAAAAgCAYAAAC2JCIgAAAAAXNSR0IArs4c6QAADTtJREFUeF7tXGuU3VQV/va5M31AsUWgVoS2oJQydiapA5TykAJlJhkBER88lwLLUgQXVBSKsAAXRZagyKsskbeiLIElCEiTO9BSkTeWJneGUt4FWnkVKFKgzNx7tiuZmfSe5OS+ZqyddvLv3uzsJPt8Z2fvs7+zCZY5A9Uegl7FgqWvaS9rafw6REZUqxKUfwNO58vRdZaxL0B1ih5ZeAvtHcsr0t3cXI/tCvskZPNdr+DBZa9XpCNNaMbEERgxZq9UHV38Ihb5q8reo82YBEnbl5UrFhD5tfik08Ni5Etet8+uW2GrEUbChvGLqh3LtHc7tHkLdBf2VNQTuuF4j5Z9v5amaRBipFZOytVoz3WW00HCNrmckO48Mz/EBZqNB7wXi8+TbXxGoGE16LxCOt5P+q4jy1xDhNExPX+UjveDinQfNOULYljdW3FZCZwLx7u4Ih1pQnbTgQJiYaoO5sul659R7h7CNq8DMKucXPw8A6sZPBeOf1Pi2hkTR4gRY+YxMIcIqiNIuRGDF3GXnIWFHa8oY2mZ3QkdzLdK1/9+QlVL42SRyTxX/D+DP2DH/3zJ92turqftCh8ToV6LM3AHO35TORvVDORAcfigBZ6M9tw7EQA3ByC3mmcJgUvSjMvgR9nx9y1nfGEZvwfRSeXk0s5L5tlw/WAyRAdZ5j1EOKxaneHk6Fo3GQuXv1fkTBJAZvBHPMrfGneioNyjViC3NDaLTOZfJWwpec17o/D4yk9LvVO/gNyjmC+Vjj93cwKysMw7QPhuuvHxKTveKACylPFr9ch9Ohl4lx1vXHSfVuMAIWhRtSAukr9YOt65pYAcnJPMFlw/OyBAtozZgujaUs8sC4X90d7xcNVAZvAqgF5SL+ThBErEhcx4nF1v780JyGQbLxNo55LGz2MqHvC8kkDWeGRmZhDpBs0gYExcn+zON+DBzvCTLlqbLoIQERCrBTQzP8Kuv185IIP5Oun6swcCyJVMZgl5Jpzcb6oGMoArpePNiV9IttlOwMHF/zPzG+z648sA+TbpeMdWY9iNNkae2Txa1BfWlHsX3Wc/fo1uEJnRza6XzDFazWOEwJ8TQAa3wvHbQyDbxtUA/Tghw9gTrvd09P/0HUbS6G1zRPiKMpbAa+x4E8sBmZnfZ9ffNowu+44aQwuyjWcINLWkPRl3Stf7XvVAZr5Kuv7pScMbNwF0gvry/BY7/hc3GyC3Ns4UIvOAOpnhE8FQ7MW4QbpeyUSuOiA37SeESHhqKXEIst79IZAtYz6ITo2Nj2THz2ic0t0EHB6TXcWOv0M5IAfnE5/7WoAcJHpj8+sIFK1yMSMH4imx/1aw6+00BOQiC/R71cI25grQr4qNKiXmxpO/YEDY9VRwx0Zi4IFsXgPCKRsCyIg7u1qA3DZld8F1678UwYMzbmHwdCLaVbExaCycpe+mgVmf7A155NTJT7Z5JwHfUYycx1Sq40UE2rrvfwaXzbYHM5AZ6pcYtQC51ThZCPqdClj+mWCaFk+mZYEPRbv/9yEg91qgvx6ZbHMFARMU47/WNZzG17tEdIDyf5lsezADOQwvimPvGoAsbONGgE5UgVxoAzJfE8BFKmh5nnT884eAPBBA1iR6DLzIjjdJ2OYVAJS8oly2PdiBDPAl0vHPDk1bA5DJMr14biEL+fHICFNA3KvmIZxl17eGgDwQQLaMVkHkxgx8N7v+EWg1ThCC1EpbmWx7EAC5K15xY+ZnieirPeFs0SpHtUDWJnr8Mbv+KMxsGC/qhykUCAb+w44Xr/RGQ5FWENEuvwnLuBVEx8WSiRfY8aPAPKVEvWksv9nmuYlPHvNF0vXPg6ZCpQy0xpXoKnsM7mLHH54QTyl2SMiD4OTCIoiwBjzZSwAZ4HkAndf3fLIgG0MuRLVAtpv2EhCPq05hfU2CLGMtEW2phB2yaxdkl8XqGz0SWiAz+K/MND8Wowwnwi0ECipJ0cGMe9n1vtn3B9lGsJyiDASDO4jprrTPguxed3VxaTR8sI2Qa0GWcRcRfUuN6fgoOP7taGgYRhPqPy1eNgrjyBLZthbIjDzH1upDkFLIyTgmbkPJ2Amut2JDAVlSfg/iuicICJf0JPgCOP6FVQO51TxVCMQwhuul44Ule7KMh4koKs6E95I4FlnvNh2O+l2ilpKPRNa/owjIVZOGJMvJcHPPFz/gRgrk14loR9VL8BRk/WdD49vmMgJ2U86XyLYrqWqlTf7g/5C45foH9slsCI8cjBWBriCiMF6Nlhmr9MjCMm8G4XjFVixPh5u7KpyU+uKONlJI9ciljNd3LiilMvNJyOZuUABYA2loUABZm+hxUGwIWFshp0LYxl8AOlK1X3q23R/SEIPbWXYfjeyy9zc0kMEIijPX991XEk1EPj+yGvYb2UYHgabEgDwTbq6HVWibswSgEKLidAgFd7XSOHtn40ssuvbDgmURXbIWGuegALLdaAtkFhQbL0h82PXXD4ZtniOAX8ZkUrPtfgE5CEGYT0TWv/V/COQE+00WCruBCu8Q1a8mIur95M8FF+6tGMhBiXzMNmsTYVhXfhwWdr4dvk9L0zSREU+otkQ3v5vZEkuWdMedbVqMrCMNfU5fE+drpeP/qCi0SMbIzO+ASOGqKg8IeRyc3Eplhm1sMXKrcZ4QdGHM294uHf+o6L9W8xtCQFm0L5Vt62PkyklDzLyW1324HRavWBd+EQY+2dMDub1jOVnGor51cwY/yQV5fMVAbjH3FhkohPte/sY2kS0bGoaJCcM+iwNWFgq7o71jSUVATiENUe+6n0JyDhK5YuLzprpqoeP5SsnnI+vPi4zaMmVHkalL7D6ReUyKb0DoCUWSxPqqSUMFuRfac09uaCAjlqxJ0AwBXhz7GgXkovXg7DtpNZ0mSFypOjP8gx1P2a1EtvkCAbso4QfkKXBySjUwOF/l8lsyQA8onwrRRB8jD/rlN7KNlQT6khrT8RFw/buVL4ltvF9cqg4/vcBxcLwEc62q5TfL2FcQ/TPhoaS0kc2Fa9sb0iOjrWGc4GFvrn8enh9n3iW8bK+wsM0/AFB3mTBfI11fYe7p6AABF0O6nkJcSwfyENdCxUtL01iRET2xW9EhOcy6lYV7As/vKxgUierX5avyyJWw3wZ4HVmzlBrGyL37JskyHyPC9OA9mfFvIij7D5nxHrteQPdUDrKMzoSNmK+WUJdoBSEArAL4RF7Sq3mINBS3su53i3GIyNB9lYjqZBj8BDt+OODFR3Whxf8ByJo9e8VAhmWeKQiXptlFu2cvJdGrxrZyzeot4lufhoBcgQWFZV4Awi8qENWKhHGvJtse9EBumzpBMIfFmJQJnNx8mhIiVWNbKflAZP2Hiq8ZAnIFFiTbuI9Ah1Qgmiqiy7YHPZB7ikBLCTArBrJtzhHA5f2yJfhsOL6y+XcIyBVYlCzjbSIaW4FoOpA12famAGRolyV7zKALLYRt/Amgqra9xY3KzHex6397yCNX09fi4Knbi7pgM656SInDkfXu0SGXLGN5fIeDLtuuatWiNSVGRqENTocTPMeG2OqkxMjBTe2pDQIclugTgNP0tSDLeI6IJiuyKYsLPe+kTWBXsuMrVIGqlt/IMv9GhIgg1DvrFKWb3Dqy1XSYIJEArOwqfDne0KRvcHSlagaWseOF9MdITreLOpX9Zp4uBALOs3IUb80XlnEliE5LyFB+DyzoXN87YsbEETRiTIdm8+nr7HjRpgEql+z13ohs43kCTSoL5Ok7jBRjtv0k6RTkrDjVIZLRlKqDc3EyVjWVvZR2APwMu35z341rKVGHEyKoUrn+VpEefWVPN/Gj/5jxGLteT5uslE5DJRWEJ/lm6fjRrgVhGxcW0xZ7n7WHN5t2WE0/FyQS3Yzi2XZ/SUPhgErZjGzumV7v1d+k9Gl2vajtVaVAFrYZlOXPKQtke+r+8aJJDyjldDg5pRwd6Wo19hSCwoJP8RH/Ivab/Qbm30rX/+mmCmSyzPuJ0FZsRGZ+il1/WjqQzTZBCHc2q8ZXs+3+Ajlcp13njYv6wKUApfzk7ZVg/Fq63llFziS1RK3oTOkWlIiRLeMMQXRZwi4FOQrtuY+1z5lCjwWgNpPpF2kIWMNd+ckR0SPMYmvr/baxemRtosd8o3T9H6YCJC2ujmXb/SEN9XrjxCe51hWWcFJI2aC0P6swtAieRbeXMQ5kYZm3gXB0zCm8yq5fstmNLq5mxoPselGPlZo98kA3MdwogZzGnZCYg6yncAXioCbb/CDeGSiebdfqkcM+bZLPQta/OTGZam1imKeTEw0pqwCysIzLQKQ0bowDWcediG/M0DmHlJxD2fpEG01bWXAerv9I9CK6trLlvpHEH8Lxl4ZiaW1ly+mAfDMi+c9sHo26QrILzrpPOrH4hdUlVbU0NkNkopg/lJWFjxTmVi1tZQMdXR1+RW1lRw03QSLRnEV57lJtdnUtguszT+G+JYmEDS1NYyFEg6I73lZWp6+AVTpClaLnoMadUZ+JullF59Z5j/TZ4b/+OQTGJUAkxQAAAABJRU5ErkJggg==";

const BrandLogo = ({ className = "h-12" }: { className?: string }) => (
  <div className={`font-serif font-bold tracking-tight select-none flex items-center justify-center leading-none ${className}`} style={{ fontFamily: '"Bona Nova", serif' }}>
    <span style={{ fontSize: 'inherit' }}>BELLABONA</span>
  </div>
);

// Helper for Allergen Icons (Refined)
// Helper for Allergen Icons (Professional SVG Set - EU 14)
// Helper for Allergen Icons (Premium "Sticker Style" SVG Set - EU 14)
// Helper for Allergen Icons (Professional Line Art - Single Color)
// Helper for Allergen Icons (Photorealistic Images)
const getAllergenIcons = (allergens: string, variant: 'card' | 'menu' = 'card') => {
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
    sulphites: "https://img.icons8.com/color/96/wine-bottle.png",
    lupin: "https://img.icons8.com/color/96/bean.png",
    mollusc: "https://img.icons8.com/color/96/snail.png"
  };

  const createIcon = (key: string, url: string, label: string) => {
    if (variant === 'menu') {
      return (
        <div key={key} className="w-5 h-5 p-0.5 bg-white rounded-full border border-gray-100 shadow-sm" title={label}>
          <img src={url} alt={label} className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div key={key} className="flex flex-col items-center gap-0.5" title={label}>
        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 p-0.5">
          <img src={url} alt={label} className="w-full h-full object-contain" />
        </div>
        <span className="text-[8px] font-bold text-[#024930] uppercase tracking-wide leading-none">{label}</span>
      </div>
    );
  };

  const foundIcons: React.ReactNode[] = [];

  // Helper to check for multiple terms
  const has = (...terms: string[]) => terms.some(t => t.length === 1 ? new RegExp(`\\b${t}\\b`).test(list) : list.includes(t));

  // A: Gluten
  if (has('gluten', 'weizen', 'wheat', 'a')) foundIcons.push(createIcon('gluten', IconUrls.gluten, 'Gluten'));
  // B: Crustaceans
  if (has('krebstier', 'crustacean', 'krebs', 'b')) foundIcons.push(createIcon('crustacean', IconUrls.crustacean, 'Crustaceans'));
  // C: Egg
  if (has('ei', 'egg', 'c')) foundIcons.push(createIcon('egg', IconUrls.egg, 'Egg'));
  // D: Fish
  if (has('fisch', 'fish', 'd')) foundIcons.push(createIcon('fish', IconUrls.fish, 'Fish'));
  // E: Peanut
  if (has('erdnuss', 'peanut', 'e')) foundIcons.push(createIcon('peanut', IconUrls.peanut, 'Peanuts'));
  // F: Soy
  if (has('soja', 'soy', 'f')) foundIcons.push(createIcon('soy', IconUrls.soy, 'Soy'));
  // G: Milk
  if (has('milch', 'milk', 'lactose', 'laktose', 'g')) foundIcons.push(createIcon('milk', IconUrls.milk, 'Milk'));
  // H: Nuts
  if (has('nuss', 'nut', 'mandel', 'haselnuss', 'walnuss', 'h')) foundIcons.push(createIcon('nuts', IconUrls.nuts, 'Nuts'));
  // L: Celery
  if (has('sellerie', 'celery', 'l')) foundIcons.push(createIcon('celery', IconUrls.celery, 'Celery'));
  // M: Mustard
  if (has('senf', 'mustard', 'm')) foundIcons.push(createIcon('mustard', IconUrls.mustard, 'Mustard'));
  // N: Sesame
  if (has('sesam', 'sesame', 'n')) foundIcons.push(createIcon('sesame', IconUrls.sesame, 'Sesame'));
  // O: Sulphites
  if (has('schwefel', 'sulphite', 'sulfite', 'o')) foundIcons.push(createIcon('sulphites', IconUrls.sulphites, 'Sulphites'));
  // P: Lupin
  if (has('lupin', 'p')) foundIcons.push(createIcon('lupin', IconUrls.lupin, 'Lupin'));
  // R: Molluscs
  if (has('weichtier', 'mollusc', 'r')) foundIcons.push(createIcon('mollusc', IconUrls.mollusc, 'Molluscs'));

  return foundIcons.length > 0 ? <div className={`flex gap-2 flex-wrap ${variant === 'card' ? 'justify-center' : 'justify-end'}`}>{foundIcons}</div> : null;
};

// Helper for Diet Icons (Refined)
const getDietIcons = (diet: string, showLabel = true) => {
  const d = diet.toLowerCase();
  const style = "flex items-center gap-1.5 px-3 py-1 rounded-full border border-current shadow-sm";

  if (d.includes('vegan')) return <div className={`${style} text-green-700 bg-green-50`}><Leaf size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Vegan'}</span></div>;
  if (d.includes('vegetarisch') || d.includes('vegetarian')) return <div className={`${style} text-green-600 bg-green-50`}><Sprout size={16} /><span className="text-[10px] font-bold uppercase tracking-wider">{showLabel && 'Veggie'}</span></div>;
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
        <BrandLogo className="text-3xl font-black brightness-0 invert" />
      </div>

      {/* Middle: Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 text-center">
        {/* Diet Badge */}
        <div className="mb-4 scale-125">
          {getDietIcons(item.diet_de)}
        </div>

        {/* Dish Name - Maximized */}
        <h2 className="text-3xl leading-snug font-serif font-bold text-[#024930] uppercase mb-4">
          {lang === 'de' ? item.item_name_de : item.item_name_en}
        </h2>

        <div className="w-16 h-[1px] bg-slate-300" />
      </div>

      {/* Bottom: Allergens Section (Only if exists) */}
      {hasAllergens && (
        <div className="bg-[#FFF1F6] min-h-[90px] border-t border-[#FEACCF] p-6 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-[#024930] tracking-[0.2em] mb-2 opacity-70">Allergens</span>
          <div className="flex flex-col items-center gap-1">
            {getAllergenIcons(item.allergens_de, 'card')}
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
      // 1. Try Realtime Database First
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `bundles`));

      if (snapshot.exists()) {
        const data = snapshot.val();
        const bundles = Object.values(data) as Bundle[];
        bundles.sort((a, b) => a.name_de.localeCompare(b.name_de));
        localStorage.setItem(DB_KEY, JSON.stringify(bundles));
        return bundles;
      }

      // 2. If RTDB is empty, Auto-Migrate from Firestore
      console.log("RTDB empty, attempting auto-migration from Firestore...");
      if (firestoreDb) {
        try {
          const querySnapshot = await getDocs(collection(firestoreDb, "bundles"));
          if (!querySnapshot.empty) {
            const bundles: Bundle[] = [];
            const updates: any = {};
            querySnapshot.forEach((doc) => {
              const data = doc.data() as Bundle;
              bundles.push(data);
              updates['bundles/' + data.id] = data;
            });

            bundles.sort((a, b) => a.name_de.localeCompare(b.name_de));

            // Save to RTDB for next time
            await update(ref(db), updates);
            localStorage.setItem(DB_KEY, JSON.stringify(bundles));
            return bundles;
          }
        } catch (migrationError) {
          console.warn("Auto-migration failed:", migrationError);
        }
      }

      localStorage.setItem(DB_KEY, JSON.stringify([]));
      return [];
    } catch (e) {
      console.error("Fetch Error:", e);
      const data = localStorage.getItem(DB_KEY);
      const bundles = data ? JSON.parse(data) : [];
      return bundles.sort((a: Bundle, b: Bundle) => a.name_de.localeCompare(b.name_de));
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
      await set(ref(db, 'bundles/' + bundle.id), bundle);
    } catch (e) { }
  },
  saveBundles: async (bundles: Bundle[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(bundles));

    try {
      // CRITICAL: First delete ALL existing bundles to ensure complete replacement
      await remove(ref(db, 'bundles'));

      // Then save the new bundles
      const updates: any = {};
      bundles.forEach(b => {
        updates['bundles/' + b.id] = b;
      });

      await update(ref(db), updates);
    } catch (e) { }
  },
  deleteBundle: async (id: string) => {
    try {
      await remove(ref(db, 'bundles/' + id));
    } catch (e) { }
  },
  migrateFromFirestore: async () => {
    if (!firestoreDb) throw new Error("Firestore not initialized");
    const querySnapshot = await getDocs(collection(firestoreDb, "bundles"));
    const updates: any = {};
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Bundle;
      updates['bundles/' + data.id] = data;
      count++;
    });

    if (count > 0) {
      await update(ref(db), updates);
    }
    return count;
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

  // --- CATERING VARIANT DESIGN (REFINED) ---
  if (variant === 'catering') {
    return (
      <div
        className={`relative bg-white flex flex-col items-center justify-between p-10 text-center text-slate-900 border-[1px] border-gray-100 overflow-hidden ${!forPrint ? 'shadow-xl w-[105mm] h-[148.5mm]' : 'w-full h-full'}`}
        style={{ width: forPrint ? '105mm' : undefined, height: forPrint ? '148.5mm' : undefined, fontFamily: 'serif' }}
      >
        {/* Elegant Frame */}
        <div className="absolute inset-3 border border-[#024930] pointer-events-none" />
        <div className="absolute inset-4 border border-[#024930] opacity-30 pointer-events-none" />

        {/* Header - Classic */}
        <div className="mt-8 z-10 w-full flex flex-col items-center">
          <BrandLogo className="h-6 mb-4 opacity-80" />
          <h2 className="text-3xl font-bold text-[#024930] leading-tight font-serif px-6 underline decoration-[#FEACCF] decoration-2 underline-offset-8">
            {lang === 'de' ? bundle.name_de : bundle.name_en}
          </h2>
        </div>

        {/* Body: Items List - Clean & Spaced */}
        <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full px-8 z-10">
          {bundle.items.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-xl font-medium text-slate-800 italic font-serif leading-snug">
                {lang === 'de' ? item.item_name_de : item.item_name_en}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] uppercase font-sans tracking-[0.2em] text-[#024930] border-b border-[#024930]/20 pb-0.5">
                  {item.allergens_de || 'No Allergens'}
                </span>
                {getItemIcons(item, false)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer - minimal */}
        <div className="mb-6 z-10 flex flex-col items-center">
          <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-[#024930] mb-1">Bon Appétit</span>
        </div>
      </div>
    );
  }

  // --- STANDARD VARIANT DESIGN (REFINED) ---
  const itemCount = bundle.items.length;
  const isHighDensity = itemCount >= 5;
  const isExtremeDensity = itemCount >= 9;

  // Typography scaling - slightly larger base
  const nameFontSize = itemCount === 1 ? 'text-[32px]' :
    itemCount <= 3 ? 'text-[24px]' :
      itemCount <= 5 ? 'text-[20px]' :
        itemCount === 6 ? 'text-[18px]' :
          itemCount <= 8 ? 'text-[14px]' : 'text-[12px]';

  const itemVerticalPadding = itemCount === 1 ? 'py-8' :
    itemCount <= 3 ? 'py-5' :
      itemCount === 4 ? 'py-3' :
        itemCount <= 6 ? 'py-2' :
          itemCount <= 8 ? 'py-1' : 'py-0.5';

  const allergenFontSize = itemCount > 6 ? 'text-[8px]' : 'text-[10px]';

  return (
    <div
      className={`label-card text-slate-900 flex flex-col overflow-hidden relative ${!forPrint ? 'shadow-2xl border border-slate-700 rounded-lg h-[148.5mm] w-[105mm]' : 'h-full w-full'}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        color: '#000',
        width: forPrint ? '105mm' : undefined,
        height: forPrint ? '148.5mm' : undefined
      }}
    >
      {/* Header - Dark Green with White Text */}
      <div className="bg-[#024930] py-3 px-6 flex flex-col items-center justify-center min-h-[55px] shrink-0 border-b-[3px] border-[#FEACCF]">
        <h2 className="text-white text-center font-serif font-bold text-[18px] uppercase tracking-[0.2em] leading-tight">
          {lang === 'de' ? bundle.name_de : bundle.name_en}
        </h2>
      </div>

      {/* Body - Clean White */}
      <div className="flex-1 px-8 py-2 flex flex-col overflow-hidden relative bg-white">
        <div className="flex-1 flex flex-col justify-center relative z-10 overflow-hidden">
          {bundle.items.map((item, idx) => (
            <div key={item.id} className={`flex justify-between items-center border-b border-gray-100 last:border-none ${itemVerticalPadding}`}>
              <div className="flex-1 pr-4">
                {/* Dish Name: Serif, Elegant - Size tuned for A6 */}
                <div className={`font-serif font-medium ${nameFontSize} leading-[1.1] text-slate-900 mb-0.5`}>
                  {lang === 'de' ? item.item_name_de : item.item_name_en}
                </div>
                {/* Allergens */}
                <div className="flex flex-wrap gap-1">
                  {item.allergens_de.split(/[,/]+/).map((alg, aIdx) => {
                    const trimmed = alg.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={aIdx} className={`text-[#024930] ${allergenFontSize} font-bold px-1 py-[0.5px] rounded-[1px] uppercase tracking-wider border border-[#FEACCF]/50 bg-[#F8F7F6]`}>
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[50px] ml-2">
                <div className="flex gap-1 mb-1">{getItemIcons(item, isHighDensity)}</div>
                <span className="text-[9px] uppercase tracking-widest text-[#024930] font-bold">{item.diet_de}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Baby Pink with Dark Green Text - BELLABONA */}
      <div className="bg-[#FEACCF] py-2 px-8 flex justify-between items-center shrink-0 border-t border-[#024930]/10">
        <div className="flex flex-col">
          <span className="text-[7px] uppercase tracking-[0.2em] text-[#024930]/80 font-bold">Packed On</span>
          <span className="text-[11px] font-mono text-[#024930] font-bold">{packedOn}</span>
        </div>
        <div className="flex flex-col items-end">
          {/* Logo in text form for strict crispness */}
          {/* Logo in text form for strict crispness */}
          <BrandLogo className="text-xl text-[#024930] h-[auto]" />
        </div>
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

  const [cateringSelections, setCateringSelections] = useState<Selection[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [cateringDate, setCateringDate] = useState(new Date().toLocaleDateString('de-DE'));
  const [serviceType, setServiceType] = useState('LUNCH');

  const [searchTerm, setSearchTerm] = useState('');
  const [packedOn, setPackedOn] = useState(new Date().toLocaleDateString('en-GB'));
  const [activeTab, setActiveTab] = useState<'generator' | 'database' | 'catering' | 'trash' | 'gyg'>('generator');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewType, setPreviewType] = useState<'labels' | 'menu' | 'review-a4' | 'review-a6' | 'explode-a6'>('labels'); 
  
  // Smart GYG Mealtime State
  const [selectedGygMealtime, setSelectedGygMealtime] = useState(() => {
    const hours = new Date().getHours();
    return hours < 11 ? 'BRUNCH' : 'LUNCH';
  });

  // Auto-load Daily Menu Effect (Universal)
  useEffect(() => {
    if (activeTab === 'gyg' || activeTab === 'catering') {
      const isGYG = activeTab === 'gyg';
      
      const dayMatches = bundles.filter((b: Bundle) => {
        const isCurrentDate = b.date === cateringDate;
        const belongsToStore = isGYG 
          ? (b.company_name?.toLowerCase().includes('gyg') || b.company_name?.toLowerCase().includes('getyourguide'))
          : !(b.company_name?.toLowerCase().includes('gyg') || b.company_name?.toLowerCase().includes('getyourguide'));
        
        // For GYG, also match mealtime
        const mealMatch = isGYG ? b.service_type === selectedGygMealtime : true;
        
        return isCurrentDate && belongsToStore && mealMatch;
      });
      
      if (dayMatches.length > 0) {
        const newSelections = dayMatches.map((m: Bundle) => ({ bundleId: m.id, quantity: 1, selectedItemIds: m.items.map((i: BundleItem) => i.id) }));
        setCateringSelections(newSelections);
        if (dayMatches[0].company_name) setCompanyName(dayMatches[0].company_name);
        if (dayMatches[0].service_type && isGYG) setServiceType(dayMatches[0].service_type);
      } else {
        setCateringSelections([]); // Clear if no matches for that date
      }
    }
  }, [activeTab, cateringDate, selectedGygMealtime, bundles]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const init = async () => {
    try {
      const all = await DataService.getBundles();
      setBundles(all.filter(b => !b.deleted));
      setDeletedBundles(all.filter(b => b.deleted));
    } catch (e) { }
  };

  useEffect(() => {
    init();

    // Recover Catering Session
    const saved = localStorage.getItem('bb_catering_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.cateringSelections) setCateringSelections(session.cateringSelections);
        if (session.companyName) setCompanyName(session.companyName);
        if (session.cateringDate) setCateringDate(session.cateringDate);
        if (session.serviceType) setServiceType(session.serviceType);
        if (session.activeTab) setActiveTab(session.activeTab);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const session = {
      cateringSelections,
      companyName,
      cateringDate,
      serviceType,
      activeTab
    };
    localStorage.setItem('bb_catering_session', JSON.stringify(session));
  }, [cateringSelections, companyName, cateringDate, serviceType, activeTab]);

  const [expandedAvailable, setExpandedAvailable] = useState<string[]>([]);
  const toggleAvailableExpand = (bundleId: string) => {
    setExpandedAvailable(prev =>
      prev.includes(bundleId) ? prev.filter(id => id !== bundleId) : [...prev, bundleId]
    );
  };

  const filteredBundles = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return bundles.filter(b => {
      // 1. Check Bundle Name
      const nameMatches = b.name_de.toLowerCase().includes(s) || b.name_en.toLowerCase().includes(s);

      // 2. Deep Search across ITEMS (including category)
      const itemMatches = b.items.some(i =>
        i.item_name_de.toLowerCase().includes(s) ||
        i.item_name_en.toLowerCase().includes(s) ||
        (i.category && i.category.toLowerCase().includes(s))
      );

      const matchesSearch = nameMatches || itemMatches;

      // 3. Tab-specific filtering
      if (b.type === 'standard' || !b.company_name) {
        return activeTab === 'generator' && matchesSearch;
      }

      const isCatering = b.type === 'catering' || !!b.company_name || !!b.date;
      if (activeTab === 'catering' || activeTab === 'gyg') return matchesSearch && isCatering;

      return matchesSearch;
    });
  }, [bundles, searchTerm, activeTab]);

  const [expandedSelections, setExpandedSelections] = useState<string[]>([]);
  const toggleExpand = (bundleId: string) => {
    setExpandedSelections(prev =>
      prev.includes(bundleId) ? prev.filter(id => id !== bundleId) : [...prev, bundleId]
    );
  };
  const toggleItemSelection = (bundleId: string, itemId: string, isCatering: boolean) => {
    const set = isCatering ? setCateringSelections : setSelections;
    set(prev => prev.map(s => {
      if (s.bundleId !== bundleId) return s;
      const b = bundles.find(x => x.id === bundleId);
      if (!b) return s;
      let current = s.selectedItemIds || b.items.map(i => i.id);
      if (current.includes(itemId)) {
        current = current.filter(id => id !== itemId);
      } else {
        current = [...current, itemId];
      }
      return { ...s, selectedItemIds: current.length === b.items.length ? undefined : current };
    }));
  };

  const addSelection = (bundleId: string, isCatering = false) => {
    const param = isCatering ? setCateringSelections : setSelections;
    param((prev: Selection[]) => {
      const existing = prev.find((s: Selection) => s.bundleId === bundleId);
      if (existing) return prev.map((s: Selection) => s.bundleId === bundleId ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { bundleId, quantity: 1 }];
    });

    // Auto-update global metadata when selecting for Catering/GYG
    if (isCatering) {
      const b = bundles.find(x => x.id === bundleId);
      if (b) {
        if (b.date) setCateringDate(b.date);
        if (b.company_name) setCompanyName(b.company_name);
        if (b.service_type) setServiceType(b.service_type as any);
      }
    }
  };

  const moveBundleToTrash = async (bundle: Bundle) => {
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

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImport(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as ImportRow[];
        const allCells = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let foundDate = '';
        let foundCompany = '';
        let foundService = '';

        // 1. Deep search for metadata
        allCells.forEach(rowArr => {
          rowArr.forEach(cell => {
            const val = String(cell || '').trim();
            if (!foundDate && (val.match(/\d{2}\.\d{2}\.\d{4}/) || val.match(/\d{2}\/\d{2}\/\d{4}/))) {
              foundDate = val;
            }
            if (!foundCompany && (val.toLowerCase().includes('getyourguide') || val.toLowerCase().includes('gyg'))) {
              foundCompany = val;
            }
            if (!foundService) {
              const u = val.toUpperCase();
              if (u.includes('LUNCH') || u.includes('MITTAG')) foundService = 'LUNCH';
              else if (u.includes('BRUNCH')) foundService = 'BRUNCH';
              else if (u.includes('BREAKFAST') || u.includes('FRÜHST')) foundService = 'BREAKFAST';
              else if (u.includes('DINNER') || u.includes('ABEND')) foundService = 'DINNER';
            }
          });
        });

        // 2. Map Column Indices Robustly
        let colMap = { nameDe: -1, nameEn: -1, itemDe: -1, itemEn: -1, allergens: -1, diet: -1, type: -1, company: -1, date: -1, category: -1 };
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(allCells.length, 20); i++) {
          const row = allCells[i];
          const rowStr = JSON.stringify(row).toLowerCase();
          if ((rowStr.includes('item') || rowStr.includes('bundle')) && (rowStr.includes('de') || rowStr.includes('en'))) {
            headerRowIdx = i;
            row.forEach((cell, cIdx) => {
              const v = String(cell || '').toLowerCase().trim();
              if (v.includes('bundle') && v.includes('de')) colMap.nameDe = cIdx;
              else if (v.includes('bundle') && v.includes('en')) colMap.nameEn = cIdx;
              else if (v.includes('item') && v.includes('de')) colMap.itemDe = cIdx;
              else if (v.includes('item') && v.includes('en')) colMap.itemEn = cIdx;
              else if (v.includes('allergen')) colMap.allergens = cIdx;
              else if (v.includes('diet') || v.includes('ernährung') || v.includes('veg')) colMap.diet = cIdx;
              else if (v.includes('type') || v.includes('art')) colMap.type = cIdx;
              else if (v.includes('company_name') || v.includes('firma') || v.includes('kunde')) colMap.company = cIdx;
              else if (v.includes('date') || v.includes('datum')) colMap.date = cIdx;
              else if (v.includes('category') || v.includes('kategorie')) colMap.category = cIdx;
            });
            break;
          }
        }

        // Fallback to standard sheet_to_json if manual mapping failed
        const bundleMap: Record<string, Bundle> = {};
        const processRow = (row: any, isArray: boolean) => {
          const getValue = (keyArray: number[], keyProp: string) => {
            if (isArray) {
              for (const idx of keyArray) if (idx >= 0 && row[idx]) return String(row[idx]).trim();
              return '';
            }
            return String(row[keyProp] || '').trim();
          };

          const itemDe = getValue([colMap.itemDe], 'item_name_de');
          if (!itemDe) return;

          const rowComp = getValue([colMap.company], 'company_name') || foundCompany || 'Standard';
          let rowDate = getValue([colMap.date], 'date') || foundDate;
          
          // Format date consistently if it's a date object
          if (rowDate && !isNaN(Date.parse(rowDate))) {
            const d = new Date(rowDate);
            rowDate = d.toLocaleDateString('de-DE');
          }

          let rowService = getValue([colMap.type], 'service_type') || foundService || 'LUNCH';
          if (rowService.toLowerCase().includes('brunch')) rowService = 'BRUNCH';
          else if (rowService.toLowerCase().includes('lunch') || rowService.toLowerCase().includes('mittag')) rowService = 'LUNCH';

          // Create a unique key for grouping: Date + Company + Mealtime
          // This allows multiple items on the same day/mealtime to be grouped into one bundle (Menu)
          const groupingKey = `${rowDate}_${rowComp}_${rowService}`.toUpperCase();

          const nameDe = getValue([colMap.nameDe], 'bundle_name_de') || `${rowComp} ${rowService} (${rowDate})`;
          const nameEn = getValue([colMap.nameEn], 'bundle_name_en') || nameDe;

          if (!bundleMap[groupingKey]) {
            bundleMap[groupingKey] = {
              id: generateSafeId(),
              name_de: nameDe,
              name_en: nameEn,
              items: [],
              date: rowDate,
              company_name: rowComp,
              service_type: rowService,
              type: 'catering'
            };
          }

          bundleMap[groupingKey].items.push({
            id: generateSafeId(),
            item_name_de: itemDe,
            item_name_en: getValue([colMap.itemEn], 'item_name_en') || itemDe,
            allergens_de: getValue([colMap.allergens], 'allergens_de'),
            diet_de: getValue([colMap.diet], 'diet_de'),
            category: getValue([colMap.category], 'category')
          });

          // If manual 'type' column says 'Standard', override the grouping to be a standard bundle
          const typeVal = getValue([colMap.type, 0], 'type').toLowerCase();
          if (typeVal.includes('bundle')) {
            bundleMap[groupingKey].type = 'standard';
          }
        };

        if (headerRowIdx >= 0) {
          allCells.slice(headerRowIdx + 1).forEach(r => processRow(r, true));
        } else {
          rows.forEach(r => processRow(r, false));
        }

        const newBundles = Object.values(bundleMap);

        // Merge with existing bundles instead of replacing
        const mergedBundles = [...bundles];
        newBundles.forEach(nb => {
          const idx = mergedBundles.findIndex(b => b.name_de.trim().toLowerCase() === nb.name_de.trim().toLowerCase());
          if (idx >= 0) {
            // Update existing bundle
            mergedBundles[idx] = { ...nb, id: mergedBundles[idx].id }; // Keep the old ID for stability
          } else {
            // Add as new bundle
            mergedBundles.push(nb);
          }
        });

        setBundles(mergedBundles);
        await DataService.saveBundles(mergedBundles);
        alert(t.successImport);
      } catch (err) { alert(t.errorImport); }
      finally {
        setIsProcessingImport(false);
        // Reset file input to allow re-uploading the same file
        if (e.target) e.target.value = '';
      }
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
      const b = bundles.find(bundle => bundle.id === sel.bundleId);
      if (!b) return [];
      const filteredBundle = {
        ...b,
        items: sel.selectedItemIds ? b.items.filter(i => sel.selectedItemIds?.includes(i.id)) : b.items
      };
      return Array(sel.quantity).fill(filteredBundle);
    });
    const groups = [];
    for (let i = 0; i < allLabels.length; i += 4) groups.push(allLabels.slice(i, i + 4));
    return groups;
  }, [selections, cateringSelections, bundles, activeTab, isPreviewing, previewType]);

  // Menu Print Logic (A4) - Premium Redesign
  const MenuPrint = () => {
    // 1. Group by Service Type (Brunch, Lunch, etc.) based on Bundle Name
    const services: Record<string, BundleItem[]> = {};

    cateringSelections.forEach(s => {
      const b = bundles.find(x => x.id === s.bundleId);
      if (b) {
        let serviceType = 'Lunch'; // Default
        const name = (b.name_de + ' ' + b.name_en).toLowerCase();
        if (name.includes('brunch') || name.includes('frühstück')) serviceType = 'Brunch';
        else if (name.includes('dinner') || name.includes('abendessen')) serviceType = 'Dinner';
        else if (name.includes('snack') || name.includes('fingerfood')) serviceType = 'Snacks';

        if (!services[serviceType]) services[serviceType] = [];
        const itemsToPrint = s.selectedItemIds
          ? b.items.filter(item => s.selectedItemIds?.includes(item.id))
          : b.items;
        services[serviceType].push(...itemsToPrint);
      }
    });

    // Helper to group items by Diet within a Service
    const analyzeService = (items: BundleItem[]) => {
      const uniqueItems = Array.from(new Map(items.map(item => [item.item_name_de.toLowerCase(), item])).values());
      const grouped: Record<string, BundleItem[]> = {};
      const order = ['Vegan', 'Vegetarisch', 'Vegetarian', 'Fish', 'Fisch', 'Meat', 'Fleisch', 'Beef'];

      uniqueItems.forEach(item => {
        let diet = item.diet_de || 'Other';
        if (diet.toLowerCase().includes('vegan')) diet = 'Vegan';
        else if (diet.toLowerCase().includes('vegetarisch')) diet = 'Vegetarian';
        else if (diet.toLowerCase().includes('fish') || diet.toLowerCase().includes('fisch')) diet = 'Fish';
        else if (diet.toLowerCase().includes('meat') || diet.toLowerCase().includes('fleisch')) diet = 'Meat';

        if (!grouped[diet]) grouped[diet] = [];
        grouped[diet].push(item);
      });

      const sortedGroups = Object.keys(grouped).sort((a, b) => {
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });

      return { grouped, sortedGroups, itemCount: uniqueItems.length };
    };

    return (
      <>
        {Object.keys(services).sort().map((service, pageIdx) => {
          const { grouped, sortedGroups, itemCount } = analyzeService(services[service]);
          // Dynamic Layout Calculation - Ratio Based
          const clamp = (min: number, val: number, max: number) => Math.min(Math.max(min, val), max);

          // Continuous Ratio Scaling (Fixed to 20px as requested)
          const baseSize = 20;
          const gapSize = clamp(4, baseSize * 0.6, 24);
          const colGapVal = clamp(32, baseSize * 4, 100);
          const mbVal = clamp(24, baseSize * 3.5, 120);

          const titleStyle = { fontSize: `${baseSize * 1.3}px`, lineHeight: '1.2' };
          const itemStyle = { fontSize: `${baseSize}px`, lineHeight: '1.3' };
          const listStyle = { gap: `${gapSize}px` };
          const groupStyle = { marginBottom: `${mbVal}px`, breakInside: "avoid" as const };
          const columnsStyle = { columnGap: `${colGapVal}px` };

          const contentJustify = itemCount < 30 ? 'justify-center' : 'justify-start';

          return (
            <div key={service} className="w-[210mm] h-[297mm] relative flex flex-col bg-white overflow-hidden page-break-after-always" style={{ fontFamily: "'Bona Nova', serif", pageBreakAfter: 'always' }}>

              {/* Professional Double Border */}
              <div className="absolute inset-4 border-4 border-double border-[#024930] pointer-events-none z-10" />

              {/* Header */}
              {/* Header - Minimalist & Grand */}
              <div className="flex flex-col items-center w-full pt-16 pb-8 z-20 px-16 text-center mx-auto max-w-[90%]">
                {/* Brand Logo - Doubled Size (Text Based) */}
                <BrandLogo className="text-8xl mb-6 text-[#024930] leading-none" />
                {companyName && (
                  <h1 className="text-8xl font-black text-[#024930] uppercase tracking-widest leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {companyName}
                  </h1>
                )}
                <div className="w-32 h-1.5 bg-[#024930] mt-4 mb-2"></div>
              </div>

              {/* Menu Content - 2 Column Clean Layout */}
              <div className={`flex-1 w-full px-16 py-10 z-20 relative overflow-hidden flex flex-col ${contentJustify}`}>
                <div className="w-full columns-2 h-auto" style={columnsStyle}>
                  {sortedGroups.map((groupTitle, idx) => (
                    <div key={idx} className="w-full" style={groupStyle}>
                      {/* Section Header */}
                      <div className="flex items-center mb-4 border-b-2 border-[#024930]/20 pb-1">
                        <h3 className="font-bold text-[#024930] uppercase tracking-widest" style={{ ...titleStyle, fontFamily: "'Playfair Display', serif" }}>
                          {lang === 'de' ? (groupTitle === 'Vegetarian' ? 'Vegetarisch' : groupTitle === 'Meat' ? 'Fleisch' : groupTitle === 'Fish' ? 'Fisch' : groupTitle) : groupTitle}
                        </h3>
                      </div>

                      {/* Items List */}
                      <div className="flex flex-col items-start" style={listStyle}>
                        {grouped[groupTitle].map((item, iIdx) => (
                          <div key={iIdx} className="w-full flex items-baseline gap-3 group">
                            {/* Scaled Bullet based on font size */}
                            <div className="rounded-full bg-[#024930]/40 shrink-0 group-hover:bg-[#024930] transition-colors" style={{ width: `${baseSize * 0.25}px`, height: `${baseSize * 0.25}px`, marginTop: `${baseSize * 0.5}px` }} />
                            <span className="font-bold text-[#1a1a1a] text-left" style={itemStyle}>
                              {lang === 'de' ? item.item_name_de : item.item_name_en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="absolute bottom-6 w-full text-center z-20">
                <p className="text-sm text-[#024930]/60 uppercase tracking-widest" style={{ fontFamily: "'Bona Nova', serif" }}>Bellabona • Berlin Kitchen</p>
              </div>

              <style>{`
                @media print {
                  @page { size: A4; margin: 0; }
                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                  .page-break-after-always { page-break-after: always !important; }
                }
              `}</style>
            </div>
          );
        })}
      </>
    );
  };

  // --- GYG PRINT SYSTEM (Strict adherence to images) ---

  const GYGCoverPage = () => {
    // Priority: 1. Detected from Excel, 2. Extracted from Bundle Name
    let service = serviceType || 'LUNCH';
    if (service === 'LUNCH' && cateringSelections.length > 0) {
      const b = bundles.find((x: Bundle) => x.id === cateringSelections[0].bundleId);
      if (b) {
        const name = (b.name_de + ' ' + b.name_en).toLowerCase();
        if (name.includes('brunch')) service = 'BRUNCH';
        if (name.includes('breakfast')) service = 'BREAKFAST';
      }
    }

    return (
      <div className="w-[210mm] h-[297mm] bg-[#FEACCF] relative flex flex-col items-center justify-center p-20 text-[#024930] box-border" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@page { margin: 0; size: A4; }`}</style>
        <div className="text-center">
          <h1 className="text-7xl font-black mb-2 tracking-tighter leading-none uppercase">
            {companyName || 'GetYourGuide'}
          </h1>
          <p className="text-3xl font-bold mb-6 opacity-90 tracking-tight uppercase">Deutschland</p>
          <div className="flex items-center gap-6 justify-center">
            <span className="text-4xl font-black tracking-widest">{service}</span>
            <span className="text-4xl font-light opacity-40">|</span>
            <span className="text-4xl font-black tracking-widest">{cateringDate}</span>
          </div>
        </div>

        <div className="absolute bottom-12 right-12">
          <span className="text-4xl font-black tracking-tighter opacity-80 text-[#024930]">BELLABONA</span>
        </div>
      </div>
    );
  };
  const GYGMenuPrint = () => {
    const allItems: BundleItem[] = cateringSelections.flatMap((s: Selection) => {
      const b = bundles.find((x: Bundle) => x.id === s.bundleId);
      if (!b) return [];
      const itemsToPrint = s.selectedItemIds
        ? b.items.filter(item => s.selectedItemIds?.includes(item.id))
        : b.items;
      // Respect quantity: multiply items by quantity
      return Array(s.quantity).fill(b).flatMap(() => itemsToPrint);
    }).filter(item => (item.item_name_de || item.item_name_en));

    // Deduplicate for Menu Summary only
    const menuItems = Array.from(new Map(allItems.map(item => [item.item_name_de.toLowerCase().trim(), item])).values());
    const totalItems = menuItems.length;

    const categories: Record<string, BundleItem[]> = {
      'MAIN DISHES': [],
      'SUPPLEMENT': [],
      'SIDE': [],
      'DESSERTS': []
    };

    menuItems.forEach(item => {
      const explicitCat = (item.category || '').toUpperCase();
      if (explicitCat.includes('MAIN')) {
        categories['MAIN DISHES'].push(item);
      } else if (explicitCat.includes('SUPPLEMENT')) {
        categories['SUPPLEMENT'].push(item);
      } else if (explicitCat.includes('SIDE')) {
        categories['SIDE'].push(item);
      } else if (explicitCat.includes('DESSERT')) {
        categories['DESSERTS'].push(item);
      } else {
        // Fallback to keyword search
        const name = (item.item_name_de + ' ' + item.item_name_en).toLowerCase();
        if (name.includes('baklava') || name.includes('fruit') || name.includes('dessert') || name.includes('cake') || name.includes('pudding')) {
          categories['DESSERTS'].push(item);
        } else if (name.includes('salad') || name.includes('farro') || name.includes('side') || name.includes('rice') || name.includes('pita') || name.includes('couscous')) {
          categories['SIDE'].push(item);
        } else {
          categories['MAIN DISHES'].push(item);
        }
      }
    });

    // More aggressive scaling for 10+ items
    const isMany = totalItems > 7;
    const isCrowded = totalItems > 10;
    const isPacked = totalItems > 12;

    const fontSizeTitle = isPacked ? 'text-lg' : (isCrowded ? 'text-xl' : 'text-2xl');
    const fontSizeItem = isPacked ? 'text-base' : (isCrowded ? 'text-lg' : 'text-xl');
    const fontSizeAllergen = isPacked ? 'text-[9px]' : (isCrowded ? 'text-[10px]' : 'text-[12px]');

    const spacingCategory = isPacked ? 'mb-2' : (isCrowded ? 'mb-4' : 'mb-8');
    const spacingItem = isPacked ? 'py-1' : (isCrowded ? 'py-1.5' : 'py-3');
    const categoryPadding = isPacked ? 'py-1' : 'py-2';
    const containerPadding = isPacked ? 'p-8 pb-4' : 'p-12';

    return (
      <div className={`w-[210mm] h-[297mm] bg-[#FEACCF] relative flex flex-col ${containerPadding} text-[#024930] box-border overflow-hidden`} style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Header Removed as requested to save space */}

        <div className={`flex-1 flex flex-col ${totalItems < 6 ? 'justify-around' : 'justify-start space-y-2'} overflow-hidden mt-4`}>
          {Object.entries(categories).map(([catName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={catName} className={`w-full max-w-4xl mx-auto ${spacingCategory}`}>
                <div className={`border-t-[2px] border-b-[2px] border-[#024930] ${categoryPadding} mb-3`}>
                  <h2 className={`${fontSizeTitle} font-black text-center tracking-[0.4em] uppercase`}>{catName}</h2>
                </div>
                <div className={`${isPacked ? 'space-y-1' : 'space-y-3'} px-6`}>
                  {items.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-start border-b border-[#024930]/10 ${spacingItem} last:border-0 px-4`}>
                      <div className="flex flex-col flex-1 pr-6">
                        <span className="text-[9px] font-black opacity-70 leading-none mb-0.5">{item.diet_de.toUpperCase()}</span>
                        <h3 className={`${fontSizeItem} font-black tracking-tight uppercase leading-tight`}>
                          {lang === 'de' ? (item.item_name_de || item.item_name_en) : (item.item_name_en || item.item_name_de)}
                        </h3>
                      </div>
                      <div className="text-right max-w-[250px] shrink-0">
                        <p className="text-[8px] font-black uppercase mb-0.5 leading-none opacity-50">Allergens:</p>
                        <p className={`${fontSizeAllergen} font-bold opacity-90 leading-tight uppercase`}>
                          {item.allergens_de || 'None'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cleaner Footer Branding */}
        <div className={`mt-4 ${isPacked ? 'pt-2' : 'pt-4'} border-t border-[#024930]/10 flex justify-between items-center shrink-0`}>
          <span className="text-xl font-bold opacity-60 tracking-wider font-sans">{cateringDate}</span>
          <span className="text-3xl font-black tracking-tighter opacity-80">BELLABONA</span>
        </div>
      </div>
    );
  };

  const GYGRatingPage = () => {
    let service = serviceType || 'LUNCH';
    if (service === 'LUNCH' && cateringSelections.length > 0) {
      const b = bundles.find((x: Bundle) => x.id === cateringSelections[0].bundleId);
      if (b) {
        const name = (b.name_de + ' ' + b.name_en).toLowerCase();
        if (name.includes('brunch')) service = 'BRUNCH';
        if (name.includes('breakfast')) service = 'BREAKFAST';
      }
    }

    return (
      <div className="w-[210mm] h-[297mm] bg-[#FEACCF] relative flex flex-col items-center justify-center p-24 text-[#024930] box-border overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="absolute top-20 text-center">
          <h1 className="text-[80px] font-black tracking-[-0.05em] leading-none uppercase">{companyName || 'GetYourGuide'}</h1>
        </div>

        <div className="text-center flex flex-col items-center gap-20">
          <h2 className="text-[72px] font-black tracking-tight leading-[0.95] uppercase max-w-4xl text-center">
            RATE YOUR {service}<br />WITH US
          </h2>

          <div className="p-0">
            <img
              src={service === 'BRUNCH' ? "./gyg_brunch_qr.png" : "./review_qr.png"}
              alt="Review QR"
              className="w-80 h-80"
              style={{ mixBlendMode: 'normal' }}
            />
          </div>
        </div>

        <div className="absolute bottom-16 right-16">
          <span className="text-5xl font-black tracking-tighter opacity-100">BELLABONA</span>
        </div>
      </div>
    );
  };

  const GYGItemLabels = () => {
    const allItems: BundleItem[] = cateringSelections.flatMap((s: Selection) => {
      const b = bundles.find((x: Bundle) => x.id === s.bundleId);
      if (!b) return [];
      const itemsToPrint = s.selectedItemIds
        ? b.items.filter(item => s.selectedItemIds?.includes(item.id))
        : b.items;
      // Respect quantity for labels as well
      return Array(s.quantity).fill(b).flatMap(() => itemsToPrint);
    });

    // Curated color palette for variety and readability
    const palette = [
      { bg: '#FEACCF', text: '#024930' }, // Signature Pink
      { bg: '#024930', text: '#FEACCF' }, // Teal
      { bg: '#FFD700', text: '#024930' }, // Yellow
      { bg: '#FF7F50', text: '#FFFFFF' }, // Coral
      { bg: '#4682B4', text: '#FFFFFF' }, // SteelBlue
      { bg: '#2E8B57', text: '#F0FFF0' }, // SeaGreen
      { bg: '#8B4513', text: '#FFFFFF' }, // SaddleBrown
      { bg: '#CD5C5C', text: '#FFFFFF' }, // IndianRed
      { bg: '#DAA520', text: '#FDF5E6' }, // Goldenrod
      { bg: '#483D8B', text: '#E6E6FA' }, // DarkSlateBlue
      { bg: '#BC8F8F', text: '#2F4F4F' }, // RosyBrown
      { bg: '#DDA0DD', text: '#4B0082' }, // Plum
    ];

    return (
      <>
        {allItems.map((item: BundleItem, idx: number) => {
          // Simple deterministic "random" based on index
          const colorPair = palette[idx % palette.length];
          const bgColor = colorPair.bg;
          const textColor = colorPair.text;
          const dietDisplay = item.diet_de.toUpperCase();

          return (
            <div key={idx} className="w-[210mm] h-[297mm] relative flex flex-col items-center justify-center p-20 box-border overflow-hidden page-break-after-always" style={{ backgroundColor: bgColor, color: textColor, fontFamily: "'Inter', sans-serif" }}>
              <div className="absolute top-24 w-full px-20">
                <div className="border-t-[4px] border-b-[4px] py-8" style={{ borderColor: textColor }}>
                  <h2 className="text-5xl font-black text-center tracking-[0.3em] uppercase">
                    {item.category ? item.category.toUpperCase() : (dietDisplay.includes('MEAT') ? 'MEAT MAIN' : (dietDisplay.includes('VEGAN') ? 'VEGAN' : dietDisplay))}
                  </h2>
                </div>
              </div>

              <div className="text-center w-full max-w-[95%] flex flex-col items-center mt-12">
                <div className="inline-block px-12 border-b-[6px] pb-6 mb-12" style={{ borderColor: textColor }}>
                  <h1 className="text-6xl font-black uppercase tracking-tighter leading-[1.1]">
                    {lang === 'de' ? item.item_name_de : item.item_name_en}
                  </h1>
                </div>

                <div className="space-y-3">
                  <p className="text-2xl font-black tracking-tight uppercase">Allergens | Contains:</p>
                  <p className="text-2xl font-bold opacity-80 uppercase max-w-2xl mx-auto leading-tight">
                    {item.allergens_de || 'None'}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-16 right-16">
                <span className="text-4xl font-black tracking-tighter opacity-80">BELLABONA</span>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Review Print Component
  const ReviewPrint: React.FC<{ size: 'A4' | 'A6' }> = ({ size }: { size: 'A4' | 'A6' }) => {
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

        {/* QR Code - Custom */}
        <div className="p-0">
          <img
            src="./review_qr.png"
            className={qrSize}
            alt="Review QR"
            style={{ mixBlendMode: 'normal' }}
          />
        </div>

        {/* Footer Brand */}
        <div className={`mt-auto font-black ${logoSize} text-[#024930] uppercase tracking-tighter mb-4`}>
          BELLABONA
        </div>
      </div>
    );
  };


  const renderMainContent = () => {
    if (previewType === 'menu' && (activeTab === 'catering' || activeTab === 'gyg')) {
      return (
        <>
          {activeTab === 'gyg' ? (
            <>
              <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
                <GYGCoverPage />
              </div>
              <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
                <GYGMenuPrint />
              </div>
              <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
                <GYGRatingPage />
              </div>
              <GYGItemLabels />
            </>
          ) : (
            <>
              <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
                <MenuPrint />
              </div>
              <div style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
                <ReviewPrint size="A4" />
              </div>
            </>
          )}
        </>
      );
    }

    if ((activeTab === 'catering' || activeTab === 'gyg') && previewType === 'labels') {
      const allItems = cateringSelections.flatMap((sel: Selection) => {
        const b = bundles.find((x: Bundle) => x.id === sel.bundleId);
        if (!b) return [];
        const itemsToPrint = sel.selectedItemIds
          ? b.items.filter(item => sel.selectedItemIds?.includes(item.id))
          : b.items;
        return Array(sel.quantity).fill(b).flatMap(() => itemsToPrint);
      });
      const pages = [];
      for (let i = 0; i < allItems.length; i += 4) pages.push(allItems.slice(i, i + 4));

      return (
        <>
          {pages.map((pageItems: BundleItem[], pIdx: number) => (
            <div key={pIdx} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2" style={{ pageBreakAfter: 'always', margin: 0, padding: 0 }}>
              {pageItems.map((item: BundleItem, iIdx: number) => (
                <div key={iIdx} className="w-[105mm] h-[148.5mm] overflow-hidden flex items-center justify-center">
                  <CateringItemLabel item={item} lang={lang} forPrint />
                </div>
              ))}
            </div>
          ))}
          {/* Include the QR/Review page at the end of the labels as requested */}
          <div className="w-[210mm] h-[297mm]" style={{ pageBreakAfter: 'always' }}>
            {activeTab === 'gyg' ? <GYGRatingPage /> : <ReviewPrint size="A4" />}
          </div>
        </>
      );
    }

    if (previewType === 'review-a4') return <ReviewPrint size="A4" />;
    if (previewType === 'review-a6') return <ReviewPrint size="A6" />;
    if (previewType === 'explode-a6') return renderExplodedItems();

    return (
      <>
        {printGroups.map((group: Bundle[], groupIdx: number) => (
          <div key={groupIdx} className="label-page-group mb-12" style={{ breakAfter: 'always' }}>
            {group.map((bundle: Bundle, bIdx: number) => (
              <div key={bIdx} className="label-card-container">
                <Label bundle={bundle} lang={lang} packedOn={packedOn} forPrint variant="standard" />
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  const renderExplodedItems = () => {
    const allItems = selections.flatMap((sel: Selection) => {
      const b = bundles.find((x: Bundle) => x.id === sel.bundleId);
      if (!b) return [];
      const itemsToPrint = sel.selectedItemIds
        ? b.items.filter((item: BundleItem) => sel.selectedItemIds?.includes(item.id))
        : b.items;
      return Array(sel.quantity).fill(b).flatMap(() => itemsToPrint);
    });

    const pages = [];
    for (let i = 0; i < allItems.length; i += 4) {
      pages.push(allItems.slice(i, i + 4));
    }

    return (
      <>
        {pages.map((pageItems: BundleItem[], pIdx: number) => (
          <div key={pIdx} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2" style={{ pageBreakAfter: 'always', margin: 0, padding: 0 }}>
            {pageItems.map((item: BundleItem, iIdx: number) => (
              <div key={iIdx} className="w-[105mm] h-[148.5mm] overflow-hidden flex items-center justify-center">
                <CateringItemLabel item={item} lang={lang} forPrint />
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };


  return (
    <>
      <div className="hidden print:block">
        {renderMainContent()}


      </div>

      <div className="print:hidden min-h-screen flex flex-col bg-[#F8F7F6] text-[#024930]">
        <div className="flex flex-1">
          <aside className="w-20 lg:w-64 bg-[#024930] border-r border-[#024930] flex flex-col shadow-2xl z-20">
            <div className="p-6 border-b border-[#F8F7F6]/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEACCF] flex items-center justify-center shadow-lg">
                <Sprout size={24} color="#024930" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-black text-sm text-white tracking-widest">BELLA&BONA</h1>
                <p className="text-[9px] text-[#FEACCF] uppercase font-bold tracking-wider">Label Factory</p>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <button onClick={() => setActiveTab('generator')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'generator' ? 'bg-[#FEACCF] text-[#024930] shadow-lg translate-x-1' : 'text-[#F8F7F6]/60 hover:text-white hover:bg-white/5'}`}>
                <Printer size={20} /><span className="hidden lg:block">Generator</span>
              </button>
              <button onClick={() => setActiveTab('catering')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'catering' ? 'bg-[#FEACCF] text-[#024930] shadow-lg translate-x-1' : 'text-[#F8F7F6]/60 hover:text-white hover:bg-white/5'}`}>
                <ChefHat size={20} /><span className="hidden lg:block">Special Catering</span>
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'database' ? 'bg-[#FEACCF] text-[#024930] shadow-lg translate-x-1' : 'text-[#F8F7F6]/60 hover:text-white hover:bg-white/5'}`}
              >
                <DatabaseIcon size={20} /><span className="hidden lg:block">Database</span>
              </button>
              <button
                onClick={() => setActiveTab('gyg')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'gyg' ? 'bg-[#FEACCF] text-[#024930] shadow-lg translate-x-1' : 'text-[#F8F7F6]/60 hover:text-white hover:bg-white/5'}`}
              >
                <FileSpreadsheet size={20} /><span className="hidden lg:block">GYG Menu</span>
              </button>
            </nav>

            <div className="p-4">
              <button onClick={() => setActiveTab('trash')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'trash' ? 'bg-red-500/20 text-red-200 shadow-lg' : 'text-[#F8F7F6]/40 hover:text-red-300 hover:bg-red-500/10'}`}>
                <Trash2 size={20} /><span className="hidden lg:block">Trash</span>
              </button>
            </div>
            <div className="p-4 border-t border-[#F8F7F6]/10 space-y-4">
              <div className="hidden lg:block px-2">
                <label className="text-[10px] uppercase text-[#F8F7F6]/50 font-bold tracking-wider">Packed On</label>
                <input type="text" value={packedOn} onChange={e => setPackedOn(e.target.value)} className="w-full bg-[#033b26] rounded-lg px-3 py-2 text-white text-xs mt-1 border-none focus:ring-2 focus:ring-[#FEACCF]" />
              </div>
              <div className="flex bg-[#033b26] rounded-lg p-1">
                <button onClick={() => setLang('de')} className={`flex-1 py-1.5 text-xs rounded-md transition-all font-bold ${lang === 'de' ? 'bg-[#FEACCF] text-[#024930] shadow-sm' : 'text-[#F8F7F6]/50 hover:text-white'}`}>DE</button>
                <button onClick={() => setLang('en')} className={`flex-1 py-1.5 text-xs rounded-md transition-all font-bold ${lang === 'en' ? 'bg-[#FEACCF] text-[#024930] shadow-sm' : 'text-[#F8F7F6]/50 hover:text-white'}`}>EN</button>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-8 lg:p-12">
            {activeTab === 'generator' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-5 space-y-8">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#024930]/40" size={20} />
                    <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white rounded-2xl pl-14 pr-6 py-4 text-sm text-[#024930] border-none focus:ring-2 focus:ring-[#FEACCF] shadow-xl placeholder:text-[#024930]/20" />
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
                    {filteredBundles.map(bundle => {
                      const isExp = expandedAvailable.includes(bundle.id);
                      return (
                        <div key={bundle.id} className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-transparent hover:border-[#FEACCF]/30">
                          <div className="p-5 flex items-center justify-between cursor-pointer group" onClick={() => toggleAvailableExpand(bundle.id)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#F8F7F6] flex items-center justify-center group-hover:bg-[#FEACCF] transition-colors">
                                {isExp ? <ChevronUp size={20} className="text-[#024930]" /> : <Soup size={20} className="text-[#024930]" />}
                              </div>
                              <div>
                                <p className="font-black text-[#024930] text-sm">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                                <p className="text-[10px] font-bold text-[#024930]/40 uppercase tracking-wider">{bundle.items.length} item{bundle.items.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); addSelection(bundle.id); }}
                              className="w-10 h-10 rounded-xl bg-[#024930]/5 text-[#024930] hover:bg-[#024930] hover:text-white transition-all flex items-center justify-center shadow-sm"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          {isExp && (
                            <div className="bg-[#F8F7F6]/50 p-4 pt-0 space-y-2 max-h-40 overflow-y-auto border-t border-[#024930]/5">
                              {bundle.items.map(item => {
                                const isMatch = searchTerm && (item.item_name_de.toLowerCase().includes(searchTerm.toLowerCase()) || item.item_name_en.toLowerCase().includes(searchTerm.toLowerCase()));
                                return (
                                  <div key={item.id} className={`text-[11px] py-1 px-2 rounded font-bold ${isMatch ? 'bg-[#FEACCF]/40 text-[#024930]' : 'text-[#024930]/60'}`}>
                                    {lang === 'de' ? item.item_name_de : item.item_name_en}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="xl:col-span-7">
                  <section className="bg-white rounded-3xl p-8 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                      <Sprout size={400} />
                    </div>
                    <div className="flex justify-between mb-10 relative z-10">
                      <h2 className="text-2xl font-black text-[#024930]">Selected <span className="text-[#FEACCF]">{selections.length}</span></h2>
                      {selections.length > 0 && <button onClick={() => setSelections([])} className="text-red-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500">Clear All</button>}
                    </div>
                    <div className="flex-1 space-y-4 relative z-10">
                      {selections.map(sel => {
                        const b = bundles.find(x => x.id === sel.bundleId);
                        if (!b) return null;
                        const isExpanded = expandedSelections.includes(sel.bundleId);
                        return (
                          <div key={sel.bundleId} className="flex flex-col bg-[#F8F7F6] rounded-xl border border-[#F8F7F6] hover:border-[#FEACCF]/50 transition-all overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                              <button onClick={() => toggleExpand(sel.bundleId)} className="text-[#024930]/40 hover:text-[#024930]">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                              <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(sel.bundleId)}>
                                <p className="font-bold text-[#024930]">{lang === 'de' ? b.name_de : b.name_en}</p>
                                <p className="text-[10px] font-black text-[#024930]/40 uppercase tracking-widest">{sel.selectedItemIds ? sel.selectedItemIds.length : b.items.length} of {b.items.length} items</p>
                              </div>
                              <input type="number" min="1" value={sel.quantity} onChange={(e) => setSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: parseInt(e.target.value) || 1 } : s))} className="w-16 bg-white rounded-lg p-2 text-center text-[#024930] font-black border-none shadow-sm focus:ring-2 focus:ring-[#FEACCF]" />
                              <button onClick={() => setSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="text-[#024930]/20 hover:text-red-400 px-2"><X size={20} /></button>
                            </div>
                            {isExpanded && (
                              <div className="bg-white/50 p-4 pt-0 space-y-2 border-t border-[#024930]/5 max-h-48 overflow-y-auto">
                                {b.items.map(item => (
                                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-[#FEACCF]/10 rounded-lg transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={!sel.selectedItemIds || sel.selectedItemIds.includes(item.id)}
                                      onChange={() => toggleItemSelection(sel.bundleId, item.id, false)}
                                      className="rounded text-[#024930] focus:ring-[#FEACCF]"
                                    />
                                    <span className="text-[11px] font-bold text-[#024930]/70 group-hover:text-[#024930] flex-1 flex justify-between items-center">
                                      <span>{lang === 'de' ? item.item_name_de : item.item_name_en}</span>
                                      {item.category && <span className="text-[9px] opacity-40 uppercase font-black">{item.category}</span>}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {selections.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-[#024930] mt-20">
                          <Printer size={64} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest">No bundles selected</p>
                        </div>
                      )}
                    </div>
                    {selections.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-[#F8F7F6] flex justify-between items-center">
                        <button onClick={() => setIsPreviewing(true)} className="flex items-center gap-2 text-[#024930] font-bold hover:text-[#FEACCF] transition-colors">
                          <Eye size={20} /> Preview
                        </button>
                        <button onClick={() => window.print()} className="bg-[#024930] text-white font-black px-10 py-4 rounded-xl flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-xs">
                          <Printer size={20} /> Print A4 Grid
                        </button>
                        <button
                          onClick={() => { setPreviewType('explode-a6'); setIsPreviewing(true); }}
                          className="bg-[#FEACCF] text-[#024930] font-black px-10 py-4 rounded-xl flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-xs"
                        >
                          <BookOpen size={20} /> Separate A6
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
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#024930]/40" size={20} />
                    <input type="text" placeholder="Search menu items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white rounded-2xl pl-14 pr-6 py-4 text-sm text-[#024930] border-none focus:ring-2 focus:ring-[#FEACCF] shadow-xl placeholder:text-[#024930]/20" />
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3">
                    {filteredBundles.map(bundle => {
                      const isExp = expandedAvailable.includes(bundle.id);
                      return (
                        <div key={bundle.id} className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-transparent hover:border-[#FEACCF]/30">
                          <div className="p-5 flex items-center justify-between cursor-pointer group" onClick={() => toggleAvailableExpand(bundle.id)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#F8F7F6] flex items-center justify-center group-hover:bg-[#FEACCF] transition-colors">
                                {isExp ? <ChevronUp size={20} className="text-[#024930]" /> : <Utensils size={20} className="text-[#024930]" />}
                              </div>
                              <div>
                                <p className="font-black text-[#024930] text-sm">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                                <p className="text-[10px] text-[#024930]/50 uppercase font-black tracking-wider">{bundle.company_name || 'Catering Bundle'} • {bundle.date || 'No Date'}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); addSelection(bundle.id, true); }}
                              className="w-10 h-10 rounded-xl bg-[#024930]/5 text-[#024930] hover:bg-[#024930] hover:text-white transition-all flex items-center justify-center shadow-sm"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          {isExp && (
                            <div className="bg-[#F8F7F6]/50 p-4 pt-0 space-y-2 max-h-40 overflow-y-auto border-t border-[#024930]/5">
                              {bundle.items.map(item => {
                                const isMatch = searchTerm && (item.item_name_de.toLowerCase().includes(searchTerm.toLowerCase()) || item.item_name_en.toLowerCase().includes(searchTerm.toLowerCase()));
                                return (
                                  <div key={item.id} className={`text-[11px] py-1 px-2 rounded font-bold ${isMatch ? 'bg-[#FEACCF]/40 text-[#024930]' : 'text-[#024930]/60'}`}>
                                    {lang === 'de' ? item.item_name_de : item.item_name_en}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="xl:col-span-7">
                  <section className="bg-white rounded-3xl p-8 flex flex-col min-h-[600px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                      <ChefHat size={300} />
                    </div>

                    <div className="flex justify-between items-center mb-10 relative z-10 bg-[#F8F7F6] p-4 rounded-2xl border border-[#024930]/5">
                      <div className="flex items-center gap-4">
                        <button 
                         onClick={() => {
                            const d = new Date(cateringDate.split('.').reverse().join('-'));
                            d.setDate(d.getDate() - 1);
                            setCateringDate(d.toLocaleDateString('de-DE'));
                         }}
                         className="w-10 h-10 rounded-xl bg-white border border-[#024930]/5 flex items-center justify-center text-[#024930] hover:bg-[#FEACCF] transition-all shadow-sm"
                        >
                           <ChevronDown className="rotate-90" size={18} />
                        </button>
                        <div>
                          <p className="text-[10px] font-black text-[#024930]/40 uppercase tracking-widest leading-none mb-1">Catering Date</p>
                          <h2 className="text-xl font-black text-[#024930] leading-none">{cateringDate}</h2>
                        </div>
                        <button 
                         onClick={() => {
                            const d = new Date(cateringDate.split('.').reverse().join('-'));
                            d.setDate(d.getDate() + 1);
                            setCateringDate(d.toLocaleDateString('de-DE'));
                         }}
                         className="w-10 h-10 rounded-xl bg-white border border-[#024930]/5 flex items-center justify-center text-[#024930] hover:bg-[#FEACCF] transition-all shadow-sm"
                        >
                           <ChevronDown className="-rotate-90" size={18} />
                        </button>
                      </div>
                      <div className="flex gap-4">
                        {cateringSelections.length > 0 && (
                          <button 
                            onClick={() => { setPreviewType('review-a6'); setIsPreviewing(true); }}
                            className="bg-[#024930] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                          >
                            <BookOpen size={16} /> Print QR Cards (A6)
                          </button>
                        )}
                        {cateringSelections.length > 0 && <button onClick={() => setCateringSelections([])} className="text-red-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 bg-white border border-red-100 px-4 rounded-xl">Clear</button>}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 relative z-10">
                      {cateringSelections.map(sel => {
                        const b = bundles.find(x => x.id === sel.bundleId);
                        if (!b) return null;
                        const isExpanded = expandedSelections.includes(sel.bundleId);
                        return (
                          <div key={sel.bundleId} className="flex flex-col bg-[#F8F7F6] rounded-xl border border-[#F8F7F6] hover:border-[#FEACCF]/50 transition-all overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                              <button onClick={() => toggleExpand(sel.bundleId)} className="text-[#024930]/40 hover:text-[#024930]">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                              <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(sel.bundleId)}>
                                <p className="font-bold text-[#024930]">{lang === 'de' ? b.name_de : b.name_en}</p>
                                <p className="text-[10px] text-[#024930]/50 uppercase font-black tracking-wider">{sel.selectedItemIds ? sel.selectedItemIds.length : b.items.length} of {b.items.length} items</p>
                              </div>
                              <input type="number" min="1" value={sel.quantity} onChange={(e) => setCateringSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: parseInt(e.target.value) || 1 } : s))} className="w-16 bg-white rounded-lg p-2 text-center text-[#024930] font-black border-none shadow-sm focus:ring-2 focus:ring-[#FEACCF]" />
                              <button onClick={() => setCateringSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="text-[#024930]/20 hover:text-red-400 px-2"><X size={20} /></button>
                            </div>
                            {isExpanded && (
                              <div className="bg-white/50 p-4 pt-0 space-y-2 border-t border-[#024930]/5 max-h-48 overflow-y-auto">
                                {b.items.map(item => (
                                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-[#FEACCF]/10 rounded-lg transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={!sel.selectedItemIds || sel.selectedItemIds.includes(item.id)}
                                      onChange={() => toggleItemSelection(sel.bundleId, item.id, true)}
                                      className="rounded text-[#024930] focus:ring-[#FEACCF]"
                                    />
                                    <span className="text-[11px] font-bold text-[#024930]/70 group-hover:text-[#024930] flex-1 flex justify-between items-center">
                                      <span>{lang === 'de' ? item.item_name_de : item.item_name_en}</span>
                                      {item.category && <span className="text-[9px] opacity-40 uppercase font-black">{item.category}</span>}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {cateringSelections.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-[#024930] mt-20">
                          <ChefHat size={64} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest">Build your menu</p>
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
            ) : activeTab === 'gyg' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-12 mb-6">
                  <div className="bg-[#FEACCF]/20 p-6 rounded-3xl border border-[#FEACCF]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#024930] flex items-center justify-center shadow-xl">
                        <BookOpen size={32} className="text-[#FEACCF]" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-[#024930]">GYG Smart Portal</h2>
                        <p className="text-[#024930]/60 font-bold uppercase tracking-widest text-xs mt-1">Daily Menu Auto-Pilot</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-white/50 shadow-inner">
                      <button 
                         onClick={() => {
                            const d = new Date(cateringDate.split('.').reverse().join('-'));
                            d.setDate(d.getDate() - 1);
                            setCateringDate(d.toLocaleDateString('de-DE'));
                         }}
                         className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#024930] hover:bg-[#FEACCF] transition-all"
                      >
                         <ChevronUp className="-rotate-90" size={20} />
                      </button>
                      
                      <div className="px-4 text-center min-w-[140px]">
                         <p className="text-[10px] font-black text-[#024930]/40 uppercase tracking-widest">Selected Date</p>
                         <p className="text-lg font-black text-[#024930]">{cateringDate}</p>
                      </div>

                      <button 
                         onClick={() => {
                            const d = new Date(cateringDate.split('.').reverse().join('-'));
                            d.setDate(d.getDate() + 1);
                            setCateringDate(d.toLocaleDateString('de-DE'));
                         }}
                         className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#024930] hover:bg-[#FEACCF] transition-all"
                      >
                         <ChevronUp className="rotate-90" size={20} />
                      </button>
                    </div>

                    <div className="flex gap-2 bg-[#024930]/5 p-2 rounded-2xl">
                      <button 
                        onClick={() => setSelectedGygMealtime('BRUNCH')}
                        className={`px-6 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${selectedGygMealtime === 'BRUNCH' ? 'bg-[#024930] text-white shadow-lg' : 'text-[#024930]/40 hover:text-[#024930]'}`}
                      >
                        BRUNCH
                      </button>
                      <button 
                        onClick={() => setSelectedGygMealtime('LUNCH')}
                        className={`px-6 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${selectedGygMealtime === 'LUNCH' ? 'bg-[#024930] text-white shadow-lg' : 'text-[#024930]/40 hover:text-[#024930]'}`}
                      >
                        LUNCH
                      </button>
                    </div>

                    <div className="text-right hidden xl:block">
                      <p className="text-sm font-black text-[#024930]">Status</p>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${cateringSelections.length > 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {cateringSelections.length > 0 ? '✓ Menu Loaded' : '⚠ No Menu Data'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-5 space-y-8">
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-3">
                    <div className="bg-[#024930] p-4 rounded-2xl mb-4 shadow-lg border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <DatabaseIcon className="text-[#FEACCF]" size={18} />
                        <h3 className="text-white font-black text-xs uppercase tracking-widest">Master Schedule</h3>
                      </div>
                      <div className="space-y-2">
                        {bundles
                          .filter((b: Bundle) => b.company_name?.toLowerCase().includes('gyg') || b.company_name?.toLowerCase().includes('getyourguide'))
                          .filter((b: Bundle, i: number, self: Bundle[]) => self.findIndex((t: Bundle) => t.date === b.date && t.service_type === b.service_type) === i) // Unique Date + Mealtime
                          .sort((a: Bundle, b: Bundle) => {
                            const dateA = new Date((a.date || '').split('.').reverse().join('-')).getTime();
                            const dateB = new Date((b.date || '').split('.').reverse().join('-')).getTime();
                            return dateA - dateB;
                          })
                          .slice(0, 5) // Show next 5
                          .map((b: Bundle) => (
                            <button 
                              key={b.id}
                              onClick={() => {
                                setCateringDate(b.date || '');
                                setSelectedGygMealtime(b.service_type || 'LUNCH');
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${cateringDate === b.date && selectedGygMealtime === b.service_type ? 'bg-[#FEACCF] text-[#024930]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                            >
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase opacity-60">{b.date}</p>
                                <p className="text-xs font-black">{b.service_type}</p>
                              </div>
                              <ChevronUp className="rotate-90 opacity-40" size={14} />
                            </button>
                          ))
                        }
                        {bundles.filter((b: Bundle) => b.company_name?.toLowerCase().includes('gyg')).length === 0 && (
                          <p className="text-white/40 text-[10px] font-bold text-center py-4">No schedule uploaded yet. <br/>Upload your Excel master plan.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Search size={14} className="text-[#024930]/40" />
                      <h3 className="text-[#024930]/40 font-black text-[10px] uppercase tracking-widest">Manual Item Search</h3>
                    </div>
                    {filteredBundles.map((bundle: Bundle) => {
                      const isExp = expandedAvailable.includes(bundle.id);
                      return (
                        <div key={bundle.id} className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-transparent hover:border-[#FEACCF]/30">
                          <div className="p-5 flex items-center justify-between cursor-pointer group" onClick={() => toggleAvailableExpand(bundle.id)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#F8F7F6] flex items-center justify-center group-hover:bg-[#FEACCF] transition-colors">
                                {isExp ? <ChevronUp size={20} className="text-[#024930]" /> : <Utensils size={20} className="text-[#024930]" />}
                              </div>
                              <div>
                                <p className="font-black text-[#024930] text-sm">{lang === 'de' ? bundle.name_de : bundle.name_en}</p>
                                <p className="text-[10px] font-bold text-[#024930]/40 uppercase tracking-widest">{bundle.items.length} dishes</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); addSelection(bundle.id, true); }}
                              className="w-10 h-10 rounded-xl bg-[#024930]/5 text-[#024930] hover:bg-[#024930] hover:text-white transition-all flex items-center justify-center shadow-sm"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          {isExp && (
                            <div className="bg-[#F8F7F6]/50 p-4 pt-0 space-y-2 max-h-40 overflow-y-auto border-t border-[#024930]/5">
                              {bundle.items.map((item: BundleItem) => {
                                const isMatch = searchTerm && (item.item_name_de.toLowerCase().includes(searchTerm.toLowerCase()) || item.item_name_en.toLowerCase().includes(searchTerm.toLowerCase()));
                                return (
                                  <div key={item.id} className={`text-[11px] py-1 px-2 rounded font-bold ${isMatch ? 'bg-[#FEACCF]/40 text-[#024930]' : 'text-[#024930]/60'}`}>
                                    {lang === 'de' ? item.item_name_de : item.item_name_en}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="xl:col-span-7">
                  <section className="bg-white rounded-3xl p-8 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                      <BookOpen size={300} />
                    </div>
                    <div className="flex justify-between mb-10 relative z-10">
                      <h2 className="text-2xl font-black text-[#024930]">Selected Items <span className="text-[#FEACCF]">({cateringSelections.length})</span></h2>
                      {cateringSelections.length > 0 && <button onClick={() => setCateringSelections([])} className="text-red-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500">Clear Menu</button>}
                    </div>

                    <div className="flex-1 space-y-4 relative z-10">
                      {cateringSelections.map(sel => {
                        const b = bundles.find(x => x.id === sel.bundleId);
                        if (!b) return null;
                        const isExpanded = expandedSelections.includes(sel.bundleId);
                        return (
                          <div key={sel.bundleId} className="flex flex-col bg-[#F8F7F6] rounded-xl border border-[#F8F7F6] hover:border-[#FEACCF]/50 transition-all overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                              <button onClick={() => toggleExpand(sel.bundleId)} className="text-[#024930]/40 hover:text-[#024930]">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                              <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(sel.bundleId)}>
                                <p className="font-bold text-[#024930]">{lang === 'de' ? b.name_de : b.name_en}</p>
                                <p className="text-[10px] text-[#024930]/50 uppercase font-black tracking-wider">{sel.selectedItemIds ? sel.selectedItemIds.length : b.items.length} of {b.items.length} items</p>
                              </div>
                              <input type="number" min="1" value={sel.quantity} onChange={(e) => setCateringSelections(prev => prev.map(s => s.bundleId === sel.bundleId ? { ...s, quantity: parseInt(e.target.value) || 1 } : s))} className="w-16 bg-white rounded-lg p-2 text-center text-[#024930] font-black border-none shadow-sm focus:ring-2 focus:ring-[#FEACCF]" />
                              <button onClick={() => setCateringSelections(prev => prev.filter(s => s.bundleId !== sel.bundleId))} className="text-[#024930]/20 hover:text-red-400 px-2"><X size={20} /></button>
                            </div>
                            {isExpanded && (
                              <div className="bg-white/50 p-4 pt-0 space-y-2 border-t border-[#024930]/5 max-h-48 overflow-y-auto">
                                {b.items.map(item => (
                                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-[#FEACCF]/10 rounded-lg transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={!sel.selectedItemIds || sel.selectedItemIds.includes(item.id)}
                                      onChange={() => toggleItemSelection(sel.bundleId, item.id, true)}
                                      className="rounded text-[#024930] focus:ring-[#FEACCF]"
                                    />
                                    <span className="text-[11px] font-bold text-[#024930]/70 group-hover:text-[#024930] flex-1 flex justify-between items-center">
                                      <span>{lang === 'de' ? item.item_name_de : item.item_name_en}</span>
                                      {item.category && <span className="text-[9px] opacity-40 uppercase font-black">{item.category}</span>}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {cateringSelections.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-[#024930] mt-20">
                          <BookOpen size={64} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest text-center">Your GYG selections will appear here</p>
                        </div>
                      )}
                    </div>

                    {cateringSelections.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-[#024930]/10 flex justify-end relative z-10">
                        <button onClick={() => { setPreviewType('menu'); setIsPreviewing(true); }} className="bg-[#024930] text-white font-black px-12 py-5 rounded-2xl flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm">
                          <Printer size={24} /> Print GYG Menu
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : activeTab === 'trash' ? (
              <div className="max-w-4xl mx-auto space-y-8">
                <section className="bg-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                  <h2 className="text-3xl font-black mb-8 text-red-400 flex items-center gap-4 relative z-10"><Trash2 size={32} /> Trash</h2>
                  <div className="space-y-2 relative z-10">
                    {deletedBundles.length === 0 && <p className="text-[#024930]/40 text-center py-10 font-bold uppercase tracking-widest">Trash is empty</p>}
                    {deletedBundles.map(b => (
                      <div key={b.id} className="flex justify-between p-4 bg-white rounded-lg border border-[#F8F7F6] items-center opacity-75 hover:opacity-100 transition-all hover:shadow-md">
                        <span className="font-bold text-[#024930]/60 line-through">{b.name_de}</span>
                        <div className="flex gap-2">
                          <button onClick={() => restoreFromTrash(b)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#024930]/10 text-[#024930] hover:bg-[#024930]/20 text-xs font-bold uppercase"><RotateCcw size={14} /> Restore</button>
                          <button onClick={() => permanentDelete(b)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-400 hover:bg-red-200 text-xs font-bold uppercase"><Trash2 size={14} /> Delete Forever</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <section className="bg-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <DatabaseIcon size={400} />
                  </div>
                  <h2 className="text-3xl font-black mb-8 text-[#024930]">{t.dataManagement}</h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-10 relative z-10">
                    <div onClick={() => {
                      const template = [
                        { 'Type': 'Bundle', 'Bundle Name DE': 'Mix Box', 'Bundle Name EN': 'Mix Box', 'Item Name DE': 'Produckt A', 'Item Name EN': 'Product A', 'Diet': 'Vegan', 'Allergens': 'None' },
                        { 'Type': 'Catering', 'Company': 'GYG', 'Date': '12.12.2025', 'Bundle Name DE': 'Lunch Set', 'Bundle Name EN': 'Lunch Set', 'Item Name DE': 'Meal 1', 'Item Name EN': 'Meal 1', 'Diet': 'Meat', 'Allergens': 'Gluten' }
                      ];
                      const ws = XLSX.utils.json_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Labels");
                      XLSX.writeFile(wb, "BellaBona_Template.xlsx");
                    }} className="bg-[#F8F7F6] p-8 rounded-2xl border-2 border-dashed border-[#024930]/10 cursor-pointer hover:border-[#FEACCF] transition-all group hover:bg-white hover:shadow-lg">
                      <FileSpreadsheet size={32} className="text-[#024930] mb-4 group-hover:scale-110 transition-transform" />
                      <p className="font-bold text-[#024930]">Download Template</p>
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="bg-[#F8F7F6] p-8 rounded-2xl border-2 border-dashed border-[#024930]/10 cursor-pointer hover:border-[#FEACCF] transition-all relative group hover:bg-white hover:shadow-lg">
                      {isProcessingImport && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl z-20"><Loader2 className="animate-spin text-[#FEACCF]" size={32} /></div>}
                      <Upload size={32} className="text-[#FEACCF] mb-4 group-hover:scale-110 transition-transform" />
                      <p className="font-bold text-[#024930]">Upload Excel</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileUpload} />
                    </div>
                  </div>

                  <div className="mb-10 text-center">
                    <button
                      onClick={async () => {
                        if (confirm("⚠️ SYNC OLD DATA?\n\nThis will look for your old data in Firestore and safely merge it with your current database.\n\nContinue?")) {
                          setIsMigrating(true);
                          try {
                            const count = await DataService.migrateFromFirestore();
                            alert(`Success! Successfully merged ${count} bundles from your old database.`);
                            // Explicitly trigger a re-fetch of bundles
                            await init();
                          } catch (e: any) {
                            console.error("Migration error", e);
                            if (e.message && e.message.includes("Missing or insufficient permissions")) {
                              alert("BLOCKED BY FIREBASE RULES! \n\nYou must allow read access to your old database.\n\n1. Go to Firebase Console > Firestore > Rules\n2. Set: allow read: if true;\n3. Publish\n\nI will open the rules page for you now.");
                              window.open("https://console.firebase.google.com/u/0/project/label-c61eb/firestore/rules", "_blank");
                            } else {
                              alert("Sync failed: " + e.message);
                            }
                          } finally {
                            setIsMigrating(false);
                          }
                        }
                      }}
                      className="bg-[#024930] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-3"
                      disabled={isMigrating}
                    >
                      {isMigrating ? <Loader2 className="animate-spin" /> : <DatabaseIcon size={20} />}
                      {isMigrating ? "Syncing..." : "Recover & Merge Old Data"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`⚠️ CLEAR ALL BUNDLES?\n\nThis will permanently delete ALL ${bundles.length} bundles from the database.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) return;
                        try {
                          // Delete from Firebase RTDB
                          await remove(ref(db, 'bundles'));
                          // Clear local state
                          setBundles([]);
                          localStorage.removeItem('bb_label_db_v7_perfect');
                          alert('✅ All bundles have been cleared!');
                        } catch (e: any) {
                          alert('❌ Error clearing bundles: ' + e.message);
                        }
                      }}
                      className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold ml-2"
                    >
                      🗑️ Clear All Bundles
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 relative z-10">
                    {bundles.slice().sort((a, b) => a.name_de.localeCompare(b.name_de)).map(b => (
                      <div key={b.id} className="flex justify-between p-4 bg-white rounded-lg border border-[#F8F7F6] items-center hover:bg-[#F8F7F6] transition-colors shadow-sm">
                        <span className="font-bold text-[#024930]">{lang === 'de' ? b.name_de : b.name_en}</span>
                        <button onClick={() => moveBundleToTrash(b)} className="text-[#024930]/40 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
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
        <React.Fragment>
          {/* Force re-render on lang change or content change */}
          <div className="print:hidden fixed inset-0 z-[200] bg-[#024930]/90 backdrop-blur-xl flex items-center justify-center p-8 overflow-y-auto" key={`${lang}-${previewType}-${activeTab}`}>
            <div className="bg-[#F8F7F6] w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-[#024930]/10 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="bg-[#024930]/5 p-3 rounded-xl">
                    <Printer className="text-[#024930] w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#024930]">Print Preview</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-sans text-slate-500">Checking layout for</span>
                      <span className="text-xs bg-[#FEACCF]/20 px-2 py-0.5 rounded text-[#024930] uppercase font-bold tracking-wider">{previewType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsPreviewing(false)} className="px-6 py-3 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">
                    Close
                  </button>
                  {previewType === 'labels' && (
                    <button
                      onClick={() => window.print()}
                      className="bg-[#FEACCF] hover:bg-[#ffbfe0] text-[#024930] font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#FEACCF]/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                      <BookOpen size={20} /> Print Label Sheets
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="bg-[#024930] hover:bg-[#035e3e] text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-[#024930]/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Printer size={20} /> Print Now
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-[#F8F7F6] p-8 flex justify-center items-start">
                {/* Render Correct Preview */}
                {previewType === 'menu' && (activeTab === 'catering' || activeTab === 'gyg') ? (
                  <div className="flex flex-col gap-12">
                    {activeTab === 'gyg' ? (
                      <>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                          <GYGCoverPage />
                        </div>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                          <GYGMenuPrint />
                        </div>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                          <GYGRatingPage />
                        </div>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: 'auto' }}>
                          <GYGItemLabels />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                          <MenuPrint />
                        </div>
                        <div className="bg-white shadow-2xl scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                          <ReviewPrint size="A4" />
                        </div>
                      </>
                    )}
                  </div>
                ) : activeTab === 'catering' ? (
                  // Catering Previews (Labels + Review Card)
                  (() => {
                    const allItems: (BundleItem | { isReviewCard: boolean })[] = cateringSelections.flatMap((sel: Selection) => {
                      const b = bundles.find((x: Bundle) => x.id === sel.bundleId);
                      if (!b) return [];
                      return Array(sel.quantity).fill(b).flatMap(() => b.items);
                    });
                    allItems.push({ isReviewCard: true });

                    const pages = [];
                    for (let i = 0; i < allItems.length; i += 4) {
                      pages.push(allItems.slice(i, i + 4));
                    }

                    return (
                      <div className="flex flex-col gap-12 pb-12">
                        {pages.map((pageItems: (BundleItem | { isReviewCard: boolean })[], pIdxIdx: number) => (
                          <div key={pIdxIdx} className="bg-white shadow-2xl origin-top scale-[0.6]" style={{ width: '210mm', height: '297mm', display: 'grid', gridTemplateColumns: '105mm 105mm', gridTemplateRows: '148.5mm 148.5mm' }}>
                            {pageItems.map((item: any, iIdx: number) => (
                              <div key={iIdx} style={{ width: '105mm', height: '148.5mm' }}>
                                {('isReviewCard' in item) ? <ReviewPrint size="A6" /> : <CateringItemLabel item={item} lang={lang} forPrint />}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : previewType === 'explode-a6' ? (
                  // Separate A6 Item Labels Preview
                  (() => {
                    const allItems = selections.flatMap(sel => {
                      const b = bundles.find(x => x.id === sel.bundleId);
                      if (!b) return [];
                      return Array(sel.quantity).fill(b).flatMap(() => b.items);
                    });

                    const pages = [];
                    for (let i = 0; i < allItems.length; i += 4) {
                      pages.push(allItems.slice(i, i + 4));
                    }

                    return (
                      <div className="flex flex-col gap-12 pb-12">
                        {pages.map((pageItems, pIdx) => (
                          <div key={pIdx} className="bg-white shadow-2xl origin-top scale-[0.6]" style={{ width: '210mm', height: '297mm', display: 'grid', gridTemplateColumns: '105mm 105mm', gridTemplateRows: '148.5mm 148.5mm' }}>
                            {pageItems.map((item, iIdx) => (
                              <div key={iIdx} style={{ width: '105mm', height: '148.5mm' }}>
                                <CateringItemLabel item={item} lang={lang} forPrint />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  // Standard Labels Preview
                  <div className="flex flex-col gap-12">
                    {printGroups.map((group, idx) => (
                      <div key={idx} className="bg-white shadow-2xl mb-12 scale-[0.6] origin-top" style={{ width: '210mm', height: '297mm' }}>
                        <div className="label-page-group">
                          {group.map((b, bi) => (
                            <div key={bi} className="label-card-container">
                              <Label bundle={b} lang={lang} packedOn={packedOn} forPrint variant="standard" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </>
  );
};


export default App;
