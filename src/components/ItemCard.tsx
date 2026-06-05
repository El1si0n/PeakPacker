import { ExternalLink, Edit2, Trash2, Weight, Tag, CheckCircle2 } from "lucide-react";
import type { Item } from "../types";
import { BrandBadge } from "./BrandBadge";
import { getCategoryIcon } from "../lib/icons";

export function ItemCard({ item, onEdit, onDelete, onBuy }: { item: Item, onEdit?: () => void, onDelete?: () => void, onBuy?: () => void }) {
  return (
    <div className="group flex flex-col bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[16px] overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out">
      {/* Image container */}
      <div className="h-48 bg-[var(--surface-color)] relative flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="text-[var(--text-muted)] opacity-[0.15] transform scale-[5]">
             {getCategoryIcon(item.category)}
          </div>
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
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-lg leading-snug tracking-tight text-[var(--text-color)] hover:text-[var(--color-primary)] transition-colors underline decoration-[var(--border-color)] hover:decoration-[var(--color-primary)] underline-offset-4">
              {item.name}
            </a>
          ) : (
            <h3 className="font-semibold text-lg leading-snug tracking-tight text-[var(--text-color)]">{item.name}</h3>
          )}
          {item.url && (
            <div className="text-[var(--text-muted)] mt-1 opacity-50">
              <ExternalLink size={16} />
            </div>
          )}
        </div>

        {/* Footer actions / metrics */}
        <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-color)]">
              <Weight size={16} className="text-[var(--color-primary)]" />
              <span>{item.weight} <span className="text-[var(--text-muted)] font-normal">g</span></span>
            </div>
            {(item.price ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-[var(--text-color)] font-medium">
                <Tag size={16} className="text-[var(--text-muted)]" />
                <span>{item.price} <span className="text-[var(--text-muted)] font-normal">€</span></span>
              </div>
            )}
          </div>

          {onBuy && (
            <button 
              onClick={onBuy} 
              className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-[10px] text-[13px] font-bold hover:brightness-110 shadow-sm active:scale-95 transition-all flex-shrink-0"
            >
              <CheckCircle2 size={14} /> 
              <span>Acheté</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
