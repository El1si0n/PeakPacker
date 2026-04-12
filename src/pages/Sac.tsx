import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { 
  Plus, Trash2, Weight, Shirt, Droplet, Archive, Backpack, X, 
  Search, Filter, SlidersHorizontal, ArrowDownAZ, Tag, ChevronLeft, Minus, Share2
} from "lucide-react";
import type { Item, PackItem, Category, PackConfig } from "../types";
import { getCategoryIcon } from "../lib/icons";

import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { BAG_ICONS, getBagIcon } from "../lib/bagIcons";

const CATEGORIES: Category[] = [
  "Sac", "Abri", "Couchage", "Vêtements", "Cuisine", 
  "Nourriture", "Hygiène/Secours", "Électronique", "Accessoires", "Autre"
];

const COLORS = ['#FF5A00', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'];

function IconPicker({ currentIcon, onChange }: { currentIcon?: string, onChange: (iconName: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const CurrentIconCmp = getBagIcon(currentIcon);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] transition-all cursor-pointer flex-shrink-0 group shadow-sm z-10"
        title="Changer l'icône du sac"
      >
        <CurrentIconCmp size={24} className="group-hover:scale-110 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-max bg-[var(--surface-color)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-3xl shadow-xl shadow-black/10 z-50 p-3 animate-in fade-in slide-in-from-top-2 grid grid-cols-4 gap-2">
          {Object.entries(BAG_ICONS).map(([name, IconCmp]) => (
            <button
              key={name}
              onClick={() => { onChange(name); setIsOpen(false); }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentIcon === name || (!currentIcon && name === 'Backpack') ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20' : 'text-[var(--text-color)] hover:bg-[var(--bg-color)] hover:text-[var(--color-primary)] bg-[var(--bg-color)]/50 border border-transparent hover:border-[var(--border-color)]'}`}
            >
              <IconCmp size={22} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function Sac() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [configs, setConfigs] = useState<PackConfig[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  // States for Detailed View
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategory, setModalCategory] = useState<Category | "Tous">("Tous");
  const [modalIsFiltersOpen, setModalIsFiltersOpen] = useState(false);
  const [modalSortBy, setModalSortBy] = useState<"name" | "weight-asc" | "weight-desc" | "price-asc" | "price-desc">("name");

  const formatWeight = (g: number) => {
    if (g >= 1000) return (g / 1000).toFixed(2) + " kg";
    return g + " g";
  }

  // Fetch Data
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch Inventory
    const { data: invData } = await supabase.from('inventory').select('*').eq('user_id', user.id);
    setInventoryItems((invData as Item[]) || []);

    // Fetch Bags
    const { data: bagsData } = await supabase
      .from('bags')
      .select('*, bag_items(*, item:inventory(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (bagsData) {
      const parsedConfigs: PackConfig[] = bagsData.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        items: b.bag_items.map((bi: any) => ({
          id: bi.id,
          item: bi.item as Item,
          isConsumable: bi.is_consumable,
          isWorn: bi.is_worn,
          quantity: bi.quantity
        }))
      }));
      setConfigs(parsedConfigs);
    }
  };

  const handleCreateBag = async () => {
    if (!user) return;
    const { data } = await supabase.from('bags').insert({ name: "Nouveau Sac", user_id: user.id }).select().single();
    if (data) {
      const newConf: PackConfig = { id: data.id, name: data.name, items: [] };
      setConfigs([newConf, ...configs]);
      setSelectedConfigId(data.id);
    }
  };

  const activeConfigIndex = configs.findIndex(c => c.id === selectedConfigId);
  const activeConfig = activeConfigIndex !== -1 ? configs[activeConfigIndex] : null;
  const packItems = activeConfig ? activeConfig.items : [];

  const metrics = useMemo(() => {
    let base = 0;
    let consumable = 0;
    let worn = 0;

    packItems.forEach(pi => {
      const itemWeight = pi.item?.weight || 0;
      const w = itemWeight * pi.quantity;
      if (pi.isWorn) {
        worn += w;
      } else if (pi.isConsumable) {
        consumable += w;
      } else {
        base += w;
      }
    });

    return { 
        base, 
        consumable, 
        totalOnBack: base + consumable,
        worn
    };
  }, [packItems]);

  const chartData = useMemo(() => {
    const categoriesMap = new Map<string, number>();
    packItems.forEach(pi => {
      if (!pi.isWorn) {
        const cat = pi.item?.category || "Autre";
        const itemWeight = pi.item?.weight || 0;
        categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + (itemWeight * pi.quantity));
      }
    });
    return Array.from(categoriesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [packItems]);

  // MENU VIEW
  if (!selectedConfigId || !activeConfig) {
    return (
      <div className="pt-8 pb-32 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto min-h-screen flex flex-col">
        {/* HEADER */}
        <div className="mb-10 flex flex-col items-start gap-1">
          <div className="flex items-center gap-3 mb-2">
            <Backpack className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)]">
              Configurations
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">
            Gérez le contenu de vos sacs et optimisez votre poids d'expédition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nouveau */}
          <div 
            onClick={handleCreateBag}
            className="bg-transparent border-2 border-dashed border-[var(--color-primary)]/50 rounded-3xl p-6 sm:p-8 flex flex-[0_0_auto] sm:flex-col items-center sm:justify-center cursor-pointer hover:bg-[var(--color-primary)]/5 transition-all text-[var(--color-primary)] h-auto min-h-[120px] sm:h-[240px] group gap-4 sm:gap-0"
          >
            <div className="w-12 h-12 flex-shrink-0 sm:w-16 sm:h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="sm:hidden" />
              <Plus size={32} className="hidden sm:block" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl">Créer un nouveau sac</h3>
          </div>

          {/* Cards */}
          {configs.map(config => {
            const configWeight = config.items.reduce((sum, pi) => sum + (!pi.isWorn ? (pi.item?.weight || 0) * pi.quantity : 0), 0);
            return (
              <div 
                key={config.id}
                onClick={() => setSelectedConfigId(config.id)}
                className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 flex flex-col cursor-pointer hover:border-[var(--color-primary)] hover:shadow-xl hover:shadow-[var(--color-primary)]/10 transition-all h-auto min-h-[140px] sm:h-[240px] group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 transform translate-x-2 -translate-y-2 sm:translate-x-4 sm:-translate-y-4 group-hover:scale-110 group-hover:opacity-20 transition-all">
                  {(() => {
                    const CardIcon = getBagIcon(config.icon);
                    return <CardIcon className="w-16 h-16 sm:w-[100px] sm:h-[100px]" />;
                  })()}
                </div>
                <h3 className="font-bold text-xl sm:text-2xl mb-1 z-10 text-[var(--text-color)] truncate pr-8 pt-1">{config.name}</h3>
                <p className="text-[var(--text-muted)] text-sm sm:text-base font-medium z-10 mb-auto">{config.items.length} équipement{config.items.length > 1 && 's'}</p>
                <div className="mt-4 sm:mt-8 flex items-end justify-between z-10 w-full border-t border-[var(--border-color)] pt-3 sm:pt-4">
                  <span className="text-[var(--text-muted)] font-bold text-xs sm:text-sm uppercase">Poids embarqué</span>
                  <span className="text-2xl sm:text-3xl font-black text-[var(--color-primary)]">{formatWeight(configWeight)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ACTIVE CONFIG VIEW LAYER


  const handleNameUpdate = async (newName: string) => {
    if (!activeConfig) return;
    await supabase.from('bags').update({ name: newName }).eq('id', activeConfig.id);
  };

  const handleIconUpdate = async (newIcon: string) => {
    if (!activeConfig) return;
    const newConfigs = [...configs];
    newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], icon: newIcon };
    setConfigs(newConfigs);
    
    try {
      await supabase.from('bags').update({ icon: newIcon }).eq('id', activeConfig.id);
    } catch (e) {
      console.error(e);
    }
  };

  const updateBagItemDb = async (id: string, updates: any) => {
    await supabase.from('bag_items').update(updates).eq('id', id);
  };

  const modalFilteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(modalSearch.toLowerCase());
    const matchesCategory = modalCategory === "Tous" || item.category === modalCategory;
    const isAlreadyInPack = packItems.some(pi => pi.item.id === item.id);
    
    return matchesSearch && matchesCategory && !isAlreadyInPack;
  }).sort((a, b) => {
    if (modalSortBy === "weight-asc") return a.weight - b.weight;
    if (modalSortBy === "weight-desc") return b.weight - a.weight;
    if (modalSortBy === "price-asc") return (a.price || 0) - (b.price || 0);
    if (modalSortBy === "price-desc") return (b.price || 0) - (a.price || 0);
    return a.name.localeCompare(b.name);
  });

  const toggleModifier = (id: string, field: "isConsumable" | "isWorn") => {
    const newItems = packItems.map(pi => pi.id === id ? { ...pi, [field]: !pi[field] } : pi);
    const newConfigs = [...configs];
    newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], items: newItems };
    setConfigs(newConfigs);
    
    updateBagItemDb(id, { [field === "isConsumable" ? "is_consumable" : "is_worn"]: newItems.find(i=>i.id===id)?.[field] });
  }

  const updateQuantity = (id: string, delta: number) => {
    const pi = packItems.find(p => p.id === id);
    if (!pi) return;
    const newQ = Math.max(1, pi.quantity + delta);
    
    const newItems = packItems.map(p => p.id === id ? { ...p, quantity: newQ } : p);
    const newConfigs = [...configs];
    newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], items: newItems };
    setConfigs(newConfigs);

    updateBagItemDb(id, { quantity: newQ });
  }

  const removeItem = async (id: string) => {
    const newItems = packItems.filter(p => p.id !== id);
    const newConfigs = [...configs];
    newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], items: newItems };
    setConfigs(newConfigs);

    await supabase.from('bag_items').delete().eq('id', id);
  }

  const handleTrashBag = async () => {
    if (!activeConfig) return;
    
    confirm({
      title: "Supprimer la configuration ?",
      message: "Es-tu sûr de vouloir supprimer cette configuration de sac ?",
      confirmText: "Supprimer",
      onConfirm: async () => {
        setConfigs(configs.filter(c => c.id !== activeConfig.id));
        setSelectedConfigId(null);
        await supabase.from('bags').delete().eq('id', activeConfig.id);
        toast({ message: "Configuration supprimée avec succès." });
      }
    });
  }

  const handleSharePack = async () => {
    if (!activeConfig) return;
    const shareId = crypto.randomUUID();
    
    // We stringify and upload the snapshot of the pack to the public table
    const { error } = await supabase.from('public_shared_packs').insert({
      id: shareId,
      name: activeConfig.name,
      user_id: user?.id,
      data: activeConfig.items
    });

    if (error) {
      console.error(error);
      toast({ message: "Erreur lors de la création du lien de partage.", type: "error" });
    } else {
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ message: "Lien public généré et copié dans ton presse-papier !", type: "success", duration: 5000 });
    }
  };

  const addItemToPack = async (item: Item) => {
    if (!activeConfig) return;
    // Si l'équipement est déjà dans le sac, on incrémente juste la quantité
    const existing = packItems.find(pi => pi.item.id === item.id);
    if (existing) {
      updateQuantity(existing.id, 1);
      return;
    }

    const isConsumable = item.category === "Nourriture" || (item.category === "Cuisine" && item.name.includes("gaz"));
    const isWorn = item.category === "Vêtements" && item.name.includes("Chaussures");

    const { data } = await supabase.from('bag_items').insert({
      bag_id: activeConfig.id,
      inventory_id: item.id,
      is_consumable: isConsumable,
      is_worn: isWorn,
      quantity: 1
    }).select('*, item:inventory(*)').single();

    if (data) {
      const newItem: PackItem = {
        id: data.id,
        item: data.item as Item,
        isConsumable: data.is_consumable,
        isWorn: data.is_worn,
        quantity: data.quantity
      };
      
      const newItems = [...packItems, newItem];
      const newConfigs = [...configs];
      newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], items: newItems };
      setConfigs(newConfigs);
    }
  }

  return (
    <div className="pt-8 pb-32 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto min-h-screen flex flex-col">
      {/* HEADER DETAILED VIEW */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 border-b border-[var(--border-color)] pb-6">
        <div className="flex-grow w-full">
          <button 
            onClick={() => setSelectedConfigId(null)}
            className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-80 transition-opacity font-bold mb-4"
          >
            <ChevronLeft size={20} />
            Retour aux configurations
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3 md:gap-4 flex-grow min-w-0">
              <IconPicker 
                currentIcon={activeConfig.icon} 
                onChange={handleIconUpdate} 
              />
              <input 
                type="text" 
                value={activeConfig.name}
                onChange={(e) => {
                  const newConfigs = [...configs];
                  newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], name: e.target.value };
                  setConfigs(newConfigs);
                }}
                onBlur={(e) => handleNameUpdate(e.target.value)}
                className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-color)] bg-transparent border-none outline-none focus:ring-0 p-0 hover:bg-[var(--surface-color)]/50 focus:bg-[var(--surface-color)] rounded-xl transition-colors min-w-0 flex-grow"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
              <button
                onClick={handleSharePack}
                className="text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors p-3 rounded-full cursor-pointer"
                title="Générer un lien public"
              >
                <Share2 size={24} />
              </button>
              <button
                onClick={handleTrashBag}
                className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors p-3 rounded-full cursor-pointer"
                title="Supprimer la configuration"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN : Metrics & Chart */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          {/* Key Metrics Cards */}
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-1">Poids de base</span>
                <span className="text-3xl font-bold text-[var(--text-color)]">{formatWeight(metrics.base)}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Archive className="text-emerald-500" size={24} />
              </div>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
               <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-1">Consommables</span>
                <span className="text-3xl font-bold text-[var(--text-color)]">{formatWeight(metrics.consumable)}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Droplet className="text-blue-500" size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
               <div className="flex flex-col">
                <span className="text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-1">TOTAL SUR LE DOS</span>
                <span className="text-4xl font-black text-[var(--color-primary)]">{formatWeight(metrics.totalOnBack)}</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
                <Weight className="text-[var(--color-primary)]" size={24} />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm flex flex-col relative">
            <h3 className="font-semibold text-lg z-10 mb-2 text-center sm:text-left">Répartition par catégorie</h3>
            
            <div className="w-full h-[180px] mt-4 animate-in zoom-in-95 fade-in duration-500 relative">
              {/* Central Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                {activeIndex !== -1 && chartData[activeIndex] ? (
                  <>
                    <span className="text-xl font-bold text-[var(--text-color)] drop-shadow-sm">{formatWeight(chartData[activeIndex].value)}</span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{chartData[activeIndex].name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-bold text-[var(--text-color)] drop-shadow-sm">{formatWeight(metrics.base)}</span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Base</span>
                  </>
                )}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* @ts-ignore */}
                  <Pie
                    data={chartData}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    isAnimationActive={false}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    stroke="var(--bg-color)"
                    strokeWidth={2}
                    paddingAngle={2}
                    dataKey="value"
                    style={{ outline: "none" }}
                  >
                    {chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        style={{ outline: 'none', cursor: 'pointer' }}
                        className="transition-all duration-300 hover:brightness-110" 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="mt-8 hidden sm:grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-2 gap-y-3 px-2">
              {chartData.map((entry, index) => (
                <div 
                  key={entry.name} 
                  className={`flex flex-col gap-0.5 cursor-pointer transition-opacity duration-200 p-2 rounded-xl hover:bg-[var(--surface-color)] ${activeIndex === index || activeIndex === -1 ? 'opacity-100' : 'opacity-40'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide truncate">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-color)] pl-4">{formatWeight(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN : Item List */}
        <div className="lg:w-2/3 flex flex-col">
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[24px] shadow-sm flex flex-col">
            
            <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between bg-[var(--surface-color)] rounded-t-[24px]">
              <h2 className="text-xl font-bold">Contenu du sac ({packItems.length})</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-full font-medium hover:opacity-90 active:scale-95 transition-all text-sm shadow-md shadow-[var(--color-primary)]/20 w-full sm:w-auto"
              >
                <Plus size={18} />
                <span>Ajouter</span>
              </button>
            </div>

            <div className="p-2 sm:p-3">
              <div className="w-full">
                {packItems.length === 0 && (
                  <div className="text-center py-20 text-[var(--text-muted)]">
                    <p>Votre sac est complètement vide.</p>
                  </div>
                )}

                {/* Items Grouped by Category */}
                <div className="flex flex-col gap-6 mt-2">
                  {CATEGORIES.map((cat) => {
                    const itemsInCat = packItems.filter(pi => pi.item.category === cat);
                    if (itemsInCat.length === 0) return null;
                    const catWeight = itemsInCat.reduce((sum, pi) => sum + (pi.isWorn ? 0 : ((pi.item?.weight || 0) * pi.quantity)), 0);
                    
                    return (
                      <div key={cat} className="flex flex-col gap-3">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 px-3 pb-2 border-b border-[var(--border-color)]">
                          <div className="text-[var(--text-muted)]">
                            {getCategoryIcon(cat)}
                          </div>
                          <h3 className="font-bold text-sm tracking-wide text-[var(--text-color)]">{cat}</h3>
                          <div className="ml-auto flex items-center justify-center bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] font-semibold text-xs rounded-full px-2.5 py-0.5 shadow-sm">
                            {formatWeight(catWeight)}
                          </div>
                        </div>

                        {/* Items in Category */}
                        <div className="flex flex-col gap-2">
                          {itemsInCat.map((pi) => {
                            const showConsumable = pi.item?.category === "Nourriture" || pi.item?.category === "Cuisine";
                            const showWorn = pi.item?.category === "Vêtements";
                            const totalItemWeight = (pi.item?.weight || 0) * pi.quantity;

                            return (
                              <div key={pi.id} className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-3 py-3 bg-[var(--bg-color)] rounded-[20px] border ${pi.isWorn ? 'border-[var(--border-color)] opacity-80' : 'border-[var(--border-color)]'} transition-all`}>
                                
                                {/* Name & Icon */}
                                <div className="flex items-center gap-3 overflow-hidden flex-grow xl:max-w-xs">
                                  <div className="w-10 h-10 rounded-[14px] bg-[var(--surface-color)] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {pi.item.image_url ? (
                                      <img src={pi.item.image_url} alt={pi.item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-[var(--text-muted)] scale-90">
                                        {getCategoryIcon(pi.item.category)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 pr-4 flex flex-col justify-center">
                                    <p className="font-bold text-base truncate text-[var(--text-color)]" title={pi.item.name}>{pi.item.name}</p>
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between lg:justify-end gap-3 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-0 border-[var(--border-color)] w-full lg:w-auto">
                                  
                                  {/* Right side modifiers */}
                                  <div className="flex items-center gap-2 mr-auto lg:mr-4">
                                    {showConsumable && (
                                      <button 
                                        onClick={() => toggleModifier(pi.id, "isConsumable")}
                                        className={`w-9 h-9 flex justify-center items-center rounded-full transition-colors ${pi.isConsumable ? 'bg-blue-500/10 border border-blue-500 text-blue-500' : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-color)]'}`}
                                        title="Consommable (exclut du Poids de Base)"
                                      >
                                        <Droplet size={16} />
                                      </button>
                                    )}

                                    {showWorn && (
                                      <button 
                                        onClick={() => toggleModifier(pi.id, "isWorn")}
                                        className={`w-9 h-9 flex justify-center items-center rounded-full transition-colors ${pi.isWorn ? 'bg-emerald-500/10 border border-emerald-500 text-emerald-500' : 'bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-color)]'}`}
                                        title="Porté sur soi (exclut du Sac)"
                                      >
                                        <Shirt size={16} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 lg:gap-3">
                                    <div className={`font-semibold text-sm w-12 text-right ${pi.isWorn ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-color)]'}`}>
                                      {formatWeight(totalItemWeight)}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full px-1 py-1 flex-shrink-0">
                                      <button 
                                        onClick={() => updateQuantity(pi.id, -1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--bg-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-all disabled:opacity-30"
                                        disabled={pi.quantity <= 1}
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className="w-5 text-center font-bold text-xs select-none">{pi.quantity}</span>
                                      <button 
                                        onClick={() => updateQuantity(pi.id, 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--bg-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-all"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>

                                    <button 
                                      onClick={() => removeItem(pi.id)}
                                      className="flex-shrink-0 p-2 text-[var(--text-muted)] rounded-full opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL POUR AJOUTER */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
           {/* ... Same modal ... I'll restore it directly from original code structure here */}
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)] w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] zoom-in-95 animate-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--surface-color)]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search size={24} className="text-[var(--text-muted)] hidden sm:block" />
                Ajouter depuis l'inventaire
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-muted)] transition-colors"
              >
                 <X size={20} />
              </button>
            </div>
            
            {/* Modal Filters */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col gap-3">
              <div className="flex flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-[var(--text-muted)]" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-full pl-11 pr-4 py-3 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all text-sm"
                    placeholder="Rechercher..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setModalIsFiltersOpen(!modalIsFiltersOpen)}
                  className={`flex flex-shrink-0 items-center justify-center gap-2 px-4 py-3 rounded-full border transition-all text-sm font-medium ${
                    modalIsFiltersOpen || modalCategory !== "Tous" || modalSortBy !== "name"
                      ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent shadow-md"
                      : "bg-[var(--surface-color)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <SlidersHorizontal size={18} />
                  <span className="hidden sm:inline">Filtres</span>
                </button>
              </div>

              {/* Expandable modal filters */}
              {modalIsFiltersOpen && (
                <div className="mt-2 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-inner transition-all animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Catégorie</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setModalCategory("Tous")}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            modalCategory === "Tous"
                              ? "bg-[var(--color-primary)] text-white border-transparent"
                              : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"
                          }`}
                        >
                          Tous
                        </button>
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setModalCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                              modalCategory === cat
                                ? "bg-[var(--color-primary)] text-white border-transparent"
                                : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Trier par</h3>
                      <div className="flex flex-wrap gap-1.5">
                         <button
                           onClick={() => setModalSortBy("name")}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${modalSortBy === "name" ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent" : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"}`}
                         ><ArrowDownAZ size={14} /> Alpha</button>
                         <button
                           onClick={() => setModalSortBy("weight-asc")}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${modalSortBy === "weight-asc" ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent" : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"}`}
                         ><Weight size={14} /> + Léger</button>
                         <button
                           onClick={() => setModalSortBy("weight-desc")}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${modalSortBy === "weight-desc" ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent" : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"}`}
                         ><Weight size={14} /> + Lourd</button>
                         <button
                           onClick={() => setModalSortBy("price-asc")}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${modalSortBy === "price-asc" ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent" : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"}`}
                         ><Tag size={14} /> - Cher</button>
                         <button
                           onClick={() => setModalSortBy("price-desc")}
                           className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${modalSortBy === "price-desc" ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent" : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)]"}`}
                         ><Tag size={14} /> + Cher</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal List */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3 flex-grow">
               {modalFilteredItems.length > 0 ? modalFilteredItems.map(item => (
                 <div key={item.id} className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-2xl hover:border-[var(--color-primary)]/50 transition-colors bg-[var(--surface-color)]/50 group gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                           <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                           <div className="text-[var(--text-muted)]">{getCategoryIcon(item.category)}</div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[var(--text-color)] text-sm truncate">{item.name}</span>
                        <span className="text-xs text-[var(--text-muted)] font-medium truncate">{item.category} • {formatWeight(item.weight)}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      <button 
                        onClick={() => addItemToPack(item)}
                        className="px-4 py-2 bg-[var(--text-color)] text-[var(--bg-color)] rounded-[14px] font-medium text-sm flex items-center justify-center hover:opacity-80 transition-opacity shadow-sm"
                      >
                        <Plus size={16} className="mr-1" />
                        Ajouter
                      </button>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)]">
                   <Filter size={32} className="mb-3 opacity-20" />
                   <p className="text-sm font-medium">Aucun équipement disponible.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
