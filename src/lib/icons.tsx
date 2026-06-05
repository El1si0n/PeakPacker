import { Tent, BedDouble, Backpack, Shirt, Utensils, Apple, Smartphone, Stethoscope, Compass, Pickaxe, Droplets, Bath, Cross } from "lucide-react";

export const getCategoryIcon = (category: string, className?: string) => {
  const defaultClass = className || "text-[var(--text-color)]";
  switch (category) {
    case "Abri": return <Tent size={14} className={defaultClass} />;
    case "Couchage": return <BedDouble size={14} className={defaultClass} />;
    case "Sac": return <Backpack size={14} className={defaultClass} />;
    case "Vêtements": return <Shirt size={14} className={defaultClass} />;
    case "Cuisine": return <Utensils size={14} className={defaultClass} />;
    case "Nourriture": return <Apple size={14} className={defaultClass} />;
    case "Hydratation": return <Droplets size={14} className={defaultClass} />;
    case "Électronique": return <Smartphone size={14} className={defaultClass} />;
    case "Hygiène": return <Bath size={14} className={defaultClass} />;
    case "Secours": return <Cross size={14} className={defaultClass} />;
    case "Accessoires": return <Compass size={14} className={defaultClass} />;
    case "Autre":
    default: return <Pickaxe size={14} className={defaultClass} />;
  }
};
