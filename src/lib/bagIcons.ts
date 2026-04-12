import { Backpack, Mountain, Tent, Compass, Map, Sun, Snowflake, Briefcase, Activity, Target, Flame, Camera } from "lucide-react";
import type { ElementType } from "react";

export const BAG_ICONS: Record<string, ElementType> = {
  Backpack, 
  Mountain, 
  Tent, 
  Compass, 
  Map, 
  Sun, 
  Snowflake, 
  Briefcase, 
  Activity, 
  Target,
  Flame,
  Camera
};

export const getBagIcon = (iconName?: string | null): ElementType => {
  if (iconName && BAG_ICONS[iconName]) return BAG_ICONS[iconName];
  return Backpack;
};
