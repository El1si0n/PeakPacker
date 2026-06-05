import { useState, useEffect } from 'react';
import { 
  Radar as RadarIcon, Plus, Loader2 
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { ItemModal } from "../components/ItemModal";
import { BRANDS_DIRECTORY as MOCK_BRANDS } from "../lib/brands";
import type { Item } from "../types";

import { ItemCard } from "../components/ItemCard";
import { EmptyState } from "../components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

function BrandCard({ brand }: { brand: typeof MOCK_BRANDS[0] }) {
  const [error, setError] = useState(false);
  return (
    <a 
      href={brand.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group flex flex-col items-center justify-center gap-2 p-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--color-primary)]/50 hover:shadow-sm transition-all min-w-[90px] flex-shrink-0"
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-[var(--border-color)] group-hover:scale-105 transition-transform duration-300">
        {!error ? (
          <img 
            src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`} 
            alt={brand.name} 
            onError={() => setError(true)}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-[10px] font-bold text-gray-400">{brand.name.substring(0, 2).toUpperCase()}</span>
        )}
      </div>
      <span className="font-semibold text-[10px] text-center text-[var(--text-color)] truncate w-full group-hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
        {brand.name}
      </span>
    </a>
  );
}



export default function Radar() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    fetchRadarItems();
  }, [user]);

  const fetchRadarItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('radar_items')
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
      const { error } = await supabase
        .from('radar_items')
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
      const { error } = await supabase
        .from('radar_items')
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
    fetchRadarItems();
  };

  const handleDelete = async (id: string) => {
    confirm({
      title: "Retirer de la wishlist ?",
      message: "Es-tu sûr de vouloir retirer cet élément de ta wishlist ?",
      confirmText: "Retirer",
      onConfirm: async () => {
        const { error } = await supabase.from('radar_items').delete().eq('id', id);
        if (error) {
          console.error(error);
          toast({ message: "Erreur lors de la suppression.", type: "error" });
        } else {
          toast({ message: "Élément retiré du radar." });
          fetchRadarItems();
        }
      }
    });
  };

  const handleBuy = async (item: Item) => {
    confirm({
      title: "Équipement acheté ?",
      message: `Génial ! Tu as acheté ${item.name} ? Cela va le transférer dans ton Sac / Inventaire.`,
      confirmText: "Oui, transférer",
      onConfirm: async () => {
        if (!user) return;

        // Transférer dans la table inventaire
        const { error: insertError } = await supabase.from('inventory').insert({
          user_id: user.id,
          name: item.name,
          category: item.category,
          brand: item.brand,
          weight: item.weight,
          price: item.price,
          url: item.url,
          image_url: item.image_url,
          quantity: item.quantity,
          notes: "Acheté depuis la Wishlist. " + (item.notes || "")
        });

        if (insertError) {
          console.error(insertError);
          toast({ message: "Erreur lors du transfert : " + insertError.message, type: "error" });
          return;
        }

        // Supprimer du radar
        await supabase.from('radar_items').delete().eq('id', item.id);
        toast({ message: "Équipement transféré dans ton inventaire ! 🎉", type: "success" });
        fetchRadarItems();
      }
    });
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="pt-8 pb-32 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto flex flex-col min-h-screen">
      
      {/* HEADER & HERO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <RadarIcon className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)]">
              Achats
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">
            Repérez, comparez et planifiez vos prochains investissements.
          </p>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          {items.length > 0 && (
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Budget Cible</span>
              <span className="text-2xl font-black text-[var(--text-color)]">{totalPrice.toFixed(0)} €</span>
            </div>
          )}
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-full font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-primary)]/20 w-full md:w-auto"
          >
            <Plus size={20} />
            <span>Ajouter au Radar</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL BRAND SCROLLER */}
      <div className="mb-10 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            Inspirations & Marques
          </h2>
        </div>
        <div className="flex overflow-x-auto overflow-y-hidden items-end gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {MOCK_BRANDS.map(brand => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      </div>

      {/* ITEMS GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 flex-grow">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] opacity-50 mb-4" />
          <p className="text-[var(--text-muted)] font-medium">Analyse du radar...</p>
        </div>
      ) : items.length === 0 ? (
          <EmptyState 
            icon={<RadarIcon size={40} className="stroke-[1.5]" />}
            title="Aucune cible repérée"
            description="Commencez à repérer vos futurs achats (tente, sac de couchage...). Ajoutez-les ici pour comparer les prix et le poids avant de vous décider !"
          />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
              >
                <ItemCard 
                  item={item} 
                  onEdit={() => { setEditingItem(item); setIsModalOpen(true); }}
                  onDelete={() => handleDelete(item.id)}
                  onBuy={() => handleBuy(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL */}
      <ItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
}
