import React, { useState, useEffect } from 'react';
import type { Item, Category } from '../types';
import { X, Save, Loader2, Link as LinkIcon, Image as ImageIcon, Weight, Tag, Pencil, Grid, PackagePlus, Info, UploadCloud, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BRANDS_DIRECTORY } from '../lib/brands';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryIcon } from '../lib/icons';

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
    weight: 100, // Better default
    price: 0,
    url: '',
    image_url: '',
    quantity: 1,
    notes: '',
    currency: localStorage.getItem('preferred_devise') || '€'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'Autre',
        weight: 100,
        price: 0,
        url: '',
        image_url: '',
        quantity: 1,
        notes: '',
        currency: localStorage.getItem('preferred_devise') || '€'
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sécurité : au lieu de faire crasher Supabase car la colonne "currency" n'existe pas,
      // on l'ajoute dans les notes si c'est différent de l'Euro, puis on le supprime de l'objet.
      const dataToSave = { ...formData } as any;
      if (dataToSave.currency && dataToSave.currency !== '€') {
        const deviseNote = `[Prix payé en ${dataToSave.currency}]`;
        dataToSave.notes = dataToSave.notes ? `${deviseNote}\n${dataToSave.notes}` : deviseNote;
      }
      delete dataToSave.currency;

      await onSave(dataToSave);
      
      // Cleanup de l'ancienne image de storage si elle a été changée
      if (initialData?.image_url && initialData.image_url !== formData.image_url) {
        if (initialData.image_url.includes('/storage/v1/object/public/images/')) {
          const matches = initialData.image_url.match(/public\/images\/(.+)$/);
          if (matches && matches[1]) {
             await supabase.storage.from('images').remove([matches[1]]).catch(console.error);
          }
        }
      }
      
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6">
          {/* OVERLAY */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* MODAL WINDOW */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="bg-[var(--surface-color)] sm:rounded-3xl w-full max-w-4xl sm:shadow-2xl sm:border border-[var(--border-color)] flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-6 pb-4 flex justify-between items-center border-b border-[var(--border-color)] shrink-0 bg-[var(--surface-color)] z-20">
              <h2 className="text-2xl font-bold text-[var(--text-color)] tracking-tight flex items-center gap-3">
                {initialData ? <Pencil size={28} className="text-[var(--color-primary)]" /> : <PackagePlus size={28} className="text-[var(--color-primary)]" />}
                {initialData ? 'Modifier l\'équipement' : 'Nouvel équipement'}
              </h2>
              <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface-color)] rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto flex-grow custom-scrollbar">
              <form id="item-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* 1. SECTION PRINCIPALE */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Informations principales</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-color)]">Nom du produit <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)]"
                        placeholder="ex: Hubba Hubba NX"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-color)] flex justify-between">
                        Marque
                      </label>
                      <input 
                        type="text" 
                        list="brands-list"
                        value={formData.brand || ''}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)]"
                        placeholder="MSR, Osprey, Decathlon..."
                      />
                      <datalist id="brands-list">
                        {BRANDS_DIRECTORY.map(brand => (
                          <option key={brand.name} value={brand.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* 2. SECTION MÉTRIQUES & CATÉGORIE */}
                <div className="flex flex-col gap-4 pt-5 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Grid size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Détails techniques</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2 order-1 md:order-1">
                      <label className="text-sm font-semibold text-[var(--text-color)]">Catégorie <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          required
                          value={formData.category}
                          onChange={(e) => handleChange('category', e.target.value as Category)}
                          className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)] appearance-none"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 order-3 md:order-2">
                      <label className="text-sm font-semibold text-[var(--text-color)]">Poids</label>
                      <div className="relative">
                        <input 
                          required
                          type="number" 
                          min="0"
                          value={formData.weight || ''}
                          onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                          className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl pl-4 pr-10 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)]"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">g</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 order-4 md:order-3">
                      <label className="text-sm font-semibold text-[var(--text-color)]">Prix</label>
                      <div className="relative flex items-center">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                          className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl pl-4 pr-[3.5rem] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)]"
                        />
                        <select
                          value={(formData as any).currency || '€'}
                          onChange={(e) => handleChange('currency' as keyof Item, e.target.value)}
                          className="absolute right-3 h-full bg-transparent pl-2 outline-none font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-color)] appearance-none"
                        >
                          <option value="€">€</option>
                          <option value="$">$</option>
                          <option value="£">£</option>
                          <option value="CHF">CHF</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 order-2 md:order-4">
                      <label className="text-sm font-semibold text-[var(--text-color)]">Quantité</label>
                      <div className="flex items-center h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 transition-all">
                        <button 
                          type="button" 
                          onClick={() => handleChange('quantity', Math.max(1, (formData.quantity || 1) - 1))}
                          className="px-4 py-3 text-[var(--text-muted)] hover:bg-[var(--surface-color)] hover:text-[var(--text-color)] transition-colors font-bold"
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          value={formData.quantity || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleChange('quantity', isNaN(val) ? '' : val);
                          }}
                          onBlur={() => {
                            if (!formData.quantity || formData.quantity < 1) handleChange('quantity', 1);
                          }}
                          className="w-full text-center bg-transparent py-3 outline-none font-bold text-[var(--text-color)] min-w-0"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleChange('quantity', (formData.quantity || 1) + 1)}
                          className="px-4 py-3 text-[var(--text-muted)] hover:bg-[var(--surface-color)] hover:text-[var(--color-primary)] transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SECTION MEDIAS */}
                <div className="flex flex-col gap-4 pt-5 border-t border-[var(--border-color)]">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
                        <LinkIcon size={16} /> URL Boutique
                      </label>
                      <input 
                        type="url" 
                        value={formData.url || ''}
                        onChange={(e) => handleChange('url', e.target.value)}
                        className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 outline-none focus:border-[var(--color-primary)] transition-all text-sm text-[var(--text-color)]"
                        placeholder="https://decathlon.fr/..."
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
                        <ImageIcon size={16} /> URL Image
                      </label>
                      <input 
                        type="url" 
                        value={formData.image_url || ''}
                        onChange={(e) => handleChange('image_url', e.target.value)}
                        className="w-full h-[52px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 outline-none focus:border-[var(--color-primary)] transition-all text-sm text-[var(--text-color)]"
                        placeholder="https://image-url.com/produit.jpg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[var(--text-color)]">Notes & État</label>
                    <textarea 
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-[var(--text-color)] resize-none"
                      placeholder="Taille M, petite usure sur le côté droit, acheté en 2023..."
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* Footer with Save */}
            <div className="p-6 bg-[var(--surface-color)] border-t border-[var(--border-color)] flex-shrink-0 z-20">
              <button 
                type="submit"
                form="item-form"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white font-black text-lg py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--color-primary)]/20"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} />{initialData ? 'Enregistrer les modifications' : 'Ajouter à mon inventaire'}</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
