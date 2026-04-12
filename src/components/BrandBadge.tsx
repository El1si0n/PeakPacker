import { useState } from 'react';
import { BRANDS_DIRECTORY } from '../lib/brands';

export function BrandBadge({ brandName }: { brandName?: string }) {
  const [error, setError] = useState(false);
  
  if (!brandName) return null;

  // Recherche du domaine correspondant à la marque (on ignore la casse)
  const brandData = BRANDS_DIRECTORY.find(b => b.name.toLowerCase() === brandName.toLowerCase());

  if (!brandData || error) {
    // S'il n'y a pas de logo ou erreur de chargement, on affiche juste le texte en haut en petit format orange
    return (
      <div className="absolute bottom-3 left-3 bg-[var(--surface-color)]/90 backdrop-blur-md px-3 py-1 rounded-[10px] shadow-sm border border-[var(--color-primary)]/20 z-10 hidden sm:block">
         <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] opacity-80">{brandName}</span>
      </div>
    );
  }

  // S'il y a un logo correspondant dans l'annuaire
  return (
    <div className="absolute bottom-3 left-3 w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden z-10 transition-transform duration-300 hover:scale-110" title={brandData.name}>
      <img 
        src={`https://www.google.com/s2/favicons?domain=${brandData.domain}&sz=64`} 
        alt={brandName} 
        onError={() => setError(true)}
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
}
