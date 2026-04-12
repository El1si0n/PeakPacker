import React, { useState, useEffect } from 'react';
import type { Item, Category } from '../types';
import { X, Save, Loader2 } from 'lucide-react';
import { BRANDS_DIRECTORY } from '../lib/brands';
import { useUI } from '../contexts/UIContext';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<Item>) => Promise<void>;
  initialData?: Item | null;
}

const CATEGORIES: Category[] = [
  "Sac", "Abri", "Couchage", "Vêtements", "Cuisine", 
  "Nourriture", "Hygiène/Secours", "Électronique", "Accessoires", "Autre"
];

export function ItemModal({ isOpen, onClose, onSave, initialData }: ItemModalProps) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    brand: '',
    category: 'Autre',
    weight: 0,
    price: 0,
    url: '',
    image_url: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'Autre',
        weight: 0,
        price: 0,
        url: '',
        image_url: '',
        quantity: 1,
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
      toast({ message: "Erreur lors de la sauvegarde.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Item, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--surface-color)] rounded-3xl w-full max-w-lg shadow-2xl border border-[var(--border-color)] flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)] shrink-0">
            <h2 className="text-xl font-bold text-[var(--text-color)]">
              {initialData ? 'Modifier le matériel' : 'Ajouter du matériel'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-color)]">Nom de l'équipement *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="ex: Tente Hubba Hubba NX"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-color)]">Marque</label>
                <input 
                  type="text" 
                  list="brands-list"
                  value={formData.brand || ''}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="ex: MSR, Osprey..."
                />
                <datalist id="brands-list">
                  {BRANDS_DIRECTORY.map(brand => (
                    <option key={brand.name} value={brand.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--text-color)]">Catégorie *</label>
              <select 
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value as Category)}
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-color)]">Poids (grammes) *</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  value={formData.weight || ''}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-color)]">Prix (€)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-color)]">Quantité</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.quantity || 1}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--text-color)]">URL Produit</label>
              <input 
                type="url" 
                value={formData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--text-color)]">URL de l'image</label>
              <input 
                type="url" 
                value={formData.image_url || ''}
                onChange={(e) => handleChange('image_url', e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="https://..."
              />
            </div>
            
            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-sm font-semibold text-[var(--text-color)]">Notes personnelles</label>
              <textarea 
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                placeholder="État, taille..."
              />
            </div>

            <div className="pt-4 mt-2 pb-4 border-t border-[var(--border-color)] shrink-0">
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} />{initialData ? 'Enregistrer' : 'Ajouter'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
