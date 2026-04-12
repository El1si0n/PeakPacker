import { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, SlidersHorizontal, ArrowDownAZ, Weight, Tag, Box, Loader2, Download, Upload } from "lucide-react";
import type { Item, Category } from "../types";
import { ItemCard } from "../components/ItemCard";
import { ItemModal } from "../components/ItemModal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";

const CATEGORIES: Category[] = [
  "Sac", "Abri", "Couchage", "Vêtements", "Cuisine", 
  "Nourriture", "Hygiène/Secours", "Électronique", "Accessoires", "Autre"
];

export default function Inventaire() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "Tous">("Tous");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "weight-asc" | "weight-desc" | "price-asc" | "price-desc">("name");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setItems(data as Item[]);
    }
    setLoading(false);
  };

  const handleSave = async (itemData: Partial<Item>) => {
    if (!user) return;

    if (itemData.id) {
      // Update
      const { error } = await supabase
        .from('inventory')
        .update({
          name: itemData.name,
          category: itemData.category,
          brand: itemData.brand,
          weight: itemData.weight,
          price: itemData.price || 0,
          url: itemData.url,
          image_url: itemData.image_url,
          quantity: itemData.quantity || 1,
          notes: itemData.notes
        })
        .eq('id', itemData.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          name: itemData.name,
          category: itemData.category,
          brand: itemData.brand,
          weight: itemData.weight,
          price: itemData.price || 0,
          url: itemData.url,
          image_url: itemData.image_url,
          quantity: itemData.quantity || 1,
          notes: itemData.notes
        });

      if (error) throw error;
    }
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    confirm({
      title: "Supprimer cet équipement ?",
      message: "Cette action est irréversible et retirera cet équipement de vos sacs.",
      confirmText: "Supprimer",
      onConfirm: async () => {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
        if (error) {
          toast({ message: "Erreur lors de la suppression.", type: "error" });
          console.error(error);
        } else {
          toast({ message: "Équipement supprimé avec succès." });
          fetchItems();
        }
      }
    });
  };

  const handleExport = () => {
    if (items.length === 0) return;
    const exportData = items.map((item: any) => { 
       const { id, created_at, user_id, ...rest } = item; 
       return rest; 
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "peakpacker_inventory.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ message: "Inventaire exporté avec succès !" });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && json.length > 0) {
          const insertData = json.map(item => ({
             ...item,
             user_id: user.id
          }));
          const { error } = await supabase.from('inventory').insert(insertData);
          if (error) throw error;
          
          toast({ message: `${json.length} objets importés avec succès !` });
          fetchItems();
        } else {
          toast({ message: "Le fichier ne contient aucun équipement valide.", type: "error" });
        }
      } catch (err) {
        console.error(err);
        toast({ message: "Erreur de lecture du fichier JSON.", type: "error" });
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "weight-asc") return a.weight - b.weight;
    if (sortBy === "weight-desc") return b.weight - a.weight;
    if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="pt-8 pb-32 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto min-h-screen flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Box className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)]">
              Inventaire
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">
            Votre base de données d'équipement ({items.length} objets)
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col mb-8 relative">
        <div className="flex flex-row gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-[var(--text-muted)]" />
            </div>
            <input
              type="text"
              className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-full pl-12 pr-4 h-[52px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
              placeholder="Rechercher (ex: Tente, Réchaud...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Buttons Filtre toggle */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex flex-shrink-0 items-center justify-center gap-2 px-5 h-[52px] rounded-full border transition-all font-medium ${
              isFiltersOpen || selectedCategory !== "Tous" || sortBy !== "name"
                ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent shadow-md"
                : "bg-[var(--surface-color)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
            }`}
          >
            <SlidersHorizontal size={20} />
            <span className="hidden sm:inline">Filtres</span>
          </button>

          {/* Add Button */}
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex flex-shrink-0 items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-5 h-[52px] rounded-full font-medium hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
          
          {/* Import/Export */}
          <div className="hidden md:flex gap-2 ml-1">
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-12 h-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--color-primary)] transition-all" title="Importer (JSON)">
               <Upload size={20} />
             </button>
             <button onClick={handleExport} className="flex items-center justify-center w-12 h-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--color-primary)] transition-all" title="Exporter (JSON)">
               <Download size={20} />
             </button>
             <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </div>

        {/* Expandable Filter/Sort Zone */}
        {isFiltersOpen && (
          <div className="mt-4 p-5 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Catégorie</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("Tous")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      selectedCategory === "Tous"
                        ? "bg-[var(--color-primary)] text-white border-transparent"
                        : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    Tous
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selectedCategory === cat
                          ? "bg-[var(--color-primary)] text-white border-transparent"
                          : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                 <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Trier par</h3>
                 <div className="flex flex-wrap gap-2">
                   {/* Name */}
                   <button
                     onClick={() => setSortBy("name")}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                       sortBy === "name"
                         ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent"
                         : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                     }`}
                   >
                     <ArrowDownAZ size={16} /> Alphabétique
                   </button>
                   
                   {/* Weight */}
                   <button
                     onClick={() => setSortBy("weight-asc")}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                       sortBy === "weight-asc"
                         ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent"
                         : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                     }`}
                   >
                     <Weight size={16} /> Le plus léger
                   </button>
                   <button
                     onClick={() => setSortBy("weight-desc")}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                       sortBy === "weight-desc"
                         ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent"
                         : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                     }`}
                   >
                     <Weight size={16} /> Le plus lourd
                   </button>

                   {/* Price */}
                   <button
                     onClick={() => setSortBy("price-asc")}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                       sortBy === "price-asc"
                         ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent"
                         : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                     }`}
                   >
                     <Tag size={16} /> Moins cher
                   </button>
                   <button
                     onClick={() => setSortBy("price-desc")}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                       sortBy === "price-desc"
                         ? "bg-[var(--text-color)] text-[var(--bg-color)] border-transparent"
                         : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--text-muted)]"
                     }`}
                   >
                     <Tag size={16} /> Le plus cher
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20 flex-grow">
          <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredItems.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onEdit={() => { setEditingItem(item); setIsModalOpen(true); }}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow py-20 text-[var(--text-muted)]">
          <Filter size={48} className="mb-6 opacity-20" />
          <h3 className="text-xl font-medium mb-2 text-[var(--text-color)]">Aucun objet trouvé</h3>
          <p>Essayez de modifier vos filtres ou d'ajouter une nouvelle pièce d'équipement.</p>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      <ItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
}
