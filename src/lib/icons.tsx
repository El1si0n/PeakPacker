import { Tent, BedDouble, Backpack, Shirt, Utensils, Apple, Smartphone, Stethoscope, Compass, Pickaxe } from "lucide-react";

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Abri": return <Tent size={14} className="text-[var(--text-muted)]" />;
    case "Couchage": return <BedDouble size={14} className="text-[var(--text-muted)]" />;
    case "Sac": return <Backpack size={14} className="text-[var(--text-muted)]" />;
    case "Vêtements": return <Shirt size={14} className="text-[var(--text-muted)]" />;
    case "Cuisine": return <Utensils size={14} className="text-[var(--text-muted)]" />;
    case "Nourriture": return <Apple size={14} className="text-[var(--text-muted)]" />;
    case "Électronique": return <Smartphone size={14} className="text-[var(--text-muted)]" />;
    case "Hygiène/Secours": return <Stethoscope size={14} className="text-[var(--text-muted)]" />;
    case "Accessoires": return <Compass size={14} className="text-[var(--text-muted)]" />;
    case "Autre":
    default: return <Pickaxe size={14} className="text-[var(--text-muted)]" />;
  }
};
