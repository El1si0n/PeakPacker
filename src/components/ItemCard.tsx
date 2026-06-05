import { ExternalLink, Trash2, Weight, Tag } from "lucide-react";
import type { Item } from "../types";
import { BrandBadge } from "./BrandBadge";
import { getCategoryIcon } from "../lib/icons";

export function ItemCard({ item, onEdit, onDelete }: { item: Item, onEdit?: () => void, onDelete?: () => void }) {
  return (
    <div className="group flex flex-col bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[16px] overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out">
      {/* Image container */}
      <div 
        className={`h-48 bg-[var(--surface-color)] relative flex items-center justify-center overflow-hidden ${onEdit ? 'cursor-pointer' : ''}`}
        onClick={onEdit}
      >
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="text-[var(--text-muted)] opacity-[0.15] transform scale-[5]">
             {getCategoryIcon(item.category)}
          </div>
        )}
        
        {/* Badge catégorie en haut à gauche */}
        <div className="absolute top-3 left-3 flex gap-2 z-10" title={item.category}>
          <span className="bg-[var(--bg-color)]/90 backdrop-blur-md text-[var(--text-color)] [&>svg]:!text-[var(--text-color)] text-xs font-semibold p-1.5 rounded-full border border-[var(--border-color)] shadow-sm flex items-center justify-center">
            {getCategoryIcon(item.category)}
          </span>
        </div>

        {/* Badge Marque/Logo flottant au centre haut */}
        <BrandBadge brandName={item.brand} />


      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-4">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-lg leading-snug tracking-tight text-[var(--text-color)] hover:text-[var(--color-primary)] transition-colors hover:underline">
              {item.name}
            </a>
          ) : (
            <h3 className="font-semibold text-lg leading-snug tracking-tight text-[var(--text-color)]">{item.name}</h3>
          )}
          {item.url && (
            <div className="text-[var(--text-muted)] mt-1 flex-shrink-0" title="Ce produit possède un lien">
              <ExternalLink size={16} />
            </div>
          )}
        </div>

        {/* Footer actions / metrics */}
        <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-color)]">
              <Weight size={16} className="text-[var(--color-primary)]" />
              <span>{item.weight} <span className="text-[var(--text-muted)] font-normal">g</span></span>
            </div>
            {item.price && (
              <div className="flex items-center gap-1.5 text-[var(--text-color)] font-medium">
                <Tag size={16} className="text-[var(--text-muted)]" />
                <span>{item.price} <span className="text-[var(--text-muted)] font-normal">€</span></span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.quantity > 1 && (
              <span className="text-[var(--text-color)] text-xs font-bold bg-[var(--surface-color)] border border-[var(--border-color)] px-2 py-0.5 rounded-md">
                x{item.quantity}
              </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-1.5 text-[var(--text-color)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
