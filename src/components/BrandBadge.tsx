import { useState } from 'react';
import { BRANDS_DIRECTORY } from '../lib/brands';

export function BrandBadge({ brandName }: { brandName?: string }) {
  const [error, setError] = useState(false);
  
  if (!brandName) return null;

  // Recherche du domaine correspondant à la marque (on ignore la casse)
  const brandData = BRANDS_DIRECTORY.find(b => b.name.toLowerCase() === brandName.toLowerCase());

  if (!brandData || error) {
    // S'il n'y a pas de logo ou erreur de chargement, on affiche un tag au même format neutre que les logos
    return (
      <div className="absolute bottom-3 left-3 bg-white px-2.5 h-8 flex items-center justify-center rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden z-10 transition-transform duration-300 hover:scale-105">
         <span className="text-[10px] font-black uppercase tracking-wider text-black truncate max-w-[120px]">{brandName}</span>
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
