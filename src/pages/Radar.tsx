import { useState, useEffect } from 'react';
import { 
  Radar as RadarIcon, Plus, ExternalLink, CheckCircle2, Weight, Tag, Trash2, Edit2, Loader2 
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { ItemModal } from "../components/ItemModal";
import { BrandBadge } from "../components/BrandBadge";
import { BRANDS_DIRECTORY as MOCK_BRANDS } from "../lib/brands";
import type { Item } from "../types";

import { getCategoryIcon } from "../lib/icons";

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

function RadarItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onBuy 
}: { 
  item: Item, 
  onEdit: () => void, 
  onDelete: () => void, 
  onBuy: () => void 
}) {
  return (
    <div className="group flex flex-col bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[16px] overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out">
      {/* Image container */}
      <div className="h-48 bg-[var(--surface-color)] relative flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="text-[var(--text-muted)] text-sm font-medium">Aucune image</div>
        )}
        
        {/* Badge catégorie en haut à gauche */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <span className="bg-[var(--bg-color)]/90 backdrop-blur-md text-[var(--text-color)] text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--border-color)] shadow-sm flex items-center gap-1.5">
            {getCategoryIcon(item.category)}
            {item.category}
          </span>
        </div>

        {/* Badge Marque/Logo flottant au centre haut */}
        <BrandBadge brandName={item.brand} />

        {/* Boutons d'action en haut à droite */}
        <div className="absolute top-3 right-3 flex gap-2 flex-wrap justify-end">
          {item.quantity > 1 && (
            <span className="bg-[var(--bg-color)]/90 backdrop-blur-md text-[var(--text-color)] text-xs px-2.5 py-1.5 rounded-full font-bold shadow-sm border border-[var(--border-color)]">
              x{item.quantity}
            </span>
          )}
          <button 
            onClick={onEdit}
            className="p-1.5 bg-[var(--bg-color)]/90 backdrop-blur-md rounded-full text-[var(--text-color)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm border border-[var(--border-color)]"
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 bg-[var(--bg-color)]/90 backdrop-blur-md rounded-full text-[var(--text-color)] hover:text-red-500 hover:border-red-500 transition-all shadow-sm border border-[var(--border-color)] cursor-pointer relative z-10"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-4">
          <h3 className="font-semibold text-lg leading-snug tracking-tight text-[var(--text-color)]">{item.name}</h3>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors mt-1">
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        {/* Footer actions / metrics */}
        <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-color)]">
              <Weight size={16} className="text-[var(--color-primary)]" />
              <span>{item.weight} <span className="text-[var(--text-muted)] font-normal">g</span></span>
            </div>
            {item.price !== undefined && item.price > 0 && (
              <div className="flex items-center gap-1.5 text-[var(--text-color)] font-medium">
                <Tag size={16} className="text-[var(--text-muted)]" />
                <span>{item.price} <span className="text-[var(--text-muted)] font-normal">€</span></span>
              </div>
            )}
          </div>
          
          <button 
            onClick={onBuy} 
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-[10px] text-[13px] font-bold hover:brightness-110 shadow-sm active:scale-95 transition-all flex-shrink-0"
          >
            <CheckCircle2 size={14} /> 
            <span>Acheté</span>
          </button>
        </div>
      </div>
    </div>
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
              Radar
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
        <div className="flex flex-col items-center justify-center flex-grow py-20 text-[var(--text-muted)] text-center px-4">
          <RadarIcon size={48} className="mb-6 opacity-20" />
          <h3 className="text-xl font-medium mb-2 text-[var(--text-color)]">Aucune cible repérée</h3>
          <p className="max-w-sm mx-auto">Commencez à repérer vos futurs achats ou ajoutez une nouvelle pièce.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <RadarItemCard 
              key={item.id} 
              item={item} 
              onEdit={() => { setEditingItem(item); setIsModalOpen(true); }}
              onDelete={() => handleDelete(item.id)}
              onBuy={() => handleBuy(item)}
            />
          ))}
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
