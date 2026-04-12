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
    
    const headers = ['name', 'category', 'brand', 'weight', 'price', 'quantity', 'url', 'image_url', 'notes'];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => headers.map(header => {
        let val = (item as any)[header] ?? '';
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"') || val.includes(';')) {
            return `"${val}"`;
          }
        }
        return val;
      }).join(','))
    ].join('\n');
    
    // Ajout du BOM pour qu'Excel lise correctement l'UTF-8 en Europe
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = URL.createObjectURL(blob);
    downloadAnchorNode.download = "peakpacker_inventaire.csv";
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ message: "Inventaire exporté en CSV avec succès !" });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        
        // Parse simple du CSV (y compris avec point-virgule d'Excel)
        const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
        if (rows.length < 2) throw new Error("Fichier vide ou sans données.");
        
        let headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const separator = (headers.length === 1 && rows[0].includes(';')) ? ';' : ',';
        if (separator === ';') {
          headers = rows[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
        }
        
        const insertData = [];
        
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let j = 0; j < r.length; j++) {
            const char = r[j];
            if (char === '"' && r[j+1] === '"') {
              current += '"'; j++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              cols.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current);
          
          const item: any = { user_id: user.id };
          headers.forEach((h, idx) => {
              let val = cols[idx];
              if (val !== undefined) {
                 val = val.trim().replace(/^"|"$/g, '');
                 if (['weight', 'price', 'quantity'].includes(h)) {
                    const parsed = parseFloat(val.replace(',', '.')); // gère les inputs fr , => .
                    item[h] = isNaN(parsed) ? (h==='quantity'?1:0) : parsed;
                 } else {
                    item[h] = val;
                 }
              }
          });
          
          if (item.name) insertData.push(item);
        }
        
        if (insertData.length > 0) {
          const { error } = await supabase.from('inventory').insert(insertData);
          if (error) throw error;
          
          toast({ message: `${insertData.length} objets importés avec succès !` });
          fetchItems();
        } else {
          toast({ message: "Le fichier ne contient aucun équipement valide.", type: "error" });
        }
      } catch (err) {
        console.error(err);
        toast({ message: "Erreur de lecture du fichier CSV.", type: "error" });
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <Box className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)]">
              Inventaire
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">
            Votre base de données d'équipements personnelle.
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
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-12 h-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--color-primary)] transition-all" title="Importer (CSV)">
               <Upload size={20} />
             </button>
             <button onClick={handleExport} className="flex items-center justify-center w-12 h-12 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--color-primary)] transition-all" title="Exporter (CSV)">
               <Download size={20} />
             </button>
             <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleImport} />
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
        <div className="flex flex-col items-center justify-center flex-grow py-20 text-[var(--text-muted)] text-center px-4">
          <Filter size={48} className="mb-6 opacity-20" />
          <h3 className="text-xl font-medium mb-2 text-[var(--text-color)]">Aucun objet trouvé</h3>
          <p className="max-w-sm mx-auto">Essayez de modifier vos filtres ou d'ajouter une nouvelle pièce d'équipement.</p>
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
