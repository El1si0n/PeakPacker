import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, Weight, ExternalLink, Mountain } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getCategoryIcon } from '../lib/icons';
import { BRANDS_DIRECTORY } from '../lib/brands';

const COLORS = ['#FF5A00', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'];

export default function SharePack() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [packData, setPackData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedPack = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('public_shared_packs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Sac introuvable");

        setPackData(data);
      } catch (err: any) {
        setError(err.message || "Impossible de charger ce sac");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSharedPack();
  }, [id]);

  const { base, consumable, worn } = useMemo(() => {
    if (!packData || !packData.data) return { base: 0, consumable: 0, worn: 0 };
    let base = 0, consumable = 0, worn = 0;
    packData.data.forEach((pi: any) => {
      const w = (pi.item?.weight || 0) * pi.quantity;
      if (pi.isWorn) worn += w;
      else if (pi.isConsumable) consumable += w;
      else base += w;
    });
    return { base, consumable, worn };
  }, [packData]);

  const chartData = useMemo(() => {
    if (!packData || !packData.data) return [];
    const categoriesMap = new Map<string, number>();
    packData.data.forEach((pi: any) => {
      if (!pi.isWorn) {
        const cat = pi.item?.category || "Autre";
        const w = (pi.item?.weight || 0) * pi.quantity;
        categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + w);
      }
    });
    return Array.from(categoriesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [packData]);

  const groupedItems = useMemo(() => {
    if (!packData || !packData.data) return [];
    const groups: Record<string, any[]> = {};
    packData.data.forEach((pi: any) => {
      if (pi.isWorn) return;
      const cat = pi.item?.category || "Autre";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(pi);
    });
    return Object.entries(groups).sort((a,b) => b[1].length - a[1].length);
  }, [packData]);

  const formatWeight = (g: number) => g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${Math.round(g)} g`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !packData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-color)] p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">Oups !</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md">
          {error || "Ce sac n'existe plus ou le lien est invalide."}
        </p>
        <Link to="/" className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-full font-bold">
          Créer mon propre sac sur PeakPacker
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pb-24">
      {/* Header Banner */}
      <div className="bg-[var(--surface-color)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
              <Mountain className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--text-color)]">PeakPacker</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-color)] mb-2 tracking-tight">
            {packData.name}
          </h1>
          <p className="text-[var(--text-muted)] mb-8">Partagé depuis l'application PeakPacker</p>
          
          <div className="flex items-end justify-center gap-2 mb-4">
            <span className="text-6xl sm:text-7xl font-black text-[var(--color-primary)] tracking-tighter leading-none">
              {formatWeight(base)}
            </span>
          </div>
          <span className="font-bold text-[var(--text-muted)] uppercase tracking-widest text-sm mt-2">Poids de base</span>
          
          {/* Side metrics */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-[var(--border-color)] justify-center w-full max-w-md">
            <div className="flex flex-col">
              <span className="text-[var(--text-color)] font-bold text-xl">{formatWeight(consumable)}</span>
              <span className="text-[var(--text-muted)] text-xs uppercase font-semibold">Consommables</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-color)] font-bold text-xl">{formatWeight(worn)}</span>
              <span className="text-[var(--text-muted)] text-xs uppercase font-semibold">Porté sur soi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 items-start">
        {/* Chart Column */}
        <div className="w-full md:w-1/3 flex flex-col sticky top-8">
          <h3 className="font-bold mb-6 text-lg text-[var(--text-color)] border-b border-[var(--border-color)] pb-2">Répartition</h3>
          <div className="h-64 w-full relative -mx-4 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-[var(--text-muted)] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Emporté</span>
                <span className="block text-[var(--text-color)] font-black text-lg sm:text-xl">{formatWeight(base + consumable)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {chartData.map((data, index) => (
              <div key={data.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="font-medium text-[var(--text-color)] flex items-center gap-1.5">
                    {getCategoryIcon(data.name)} {data.name}
                  </span>
                </div>
                <span className="font-bold text-[var(--text-muted)]">{formatWeight(data.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* List Column */}
        <div className="w-full md:w-2/3 flex flex-col gap-8">
          {groupedItems.map(([category, items]) => {
            const catWeight = items.reduce((sum, pi) => sum + (pi.item?.weight || 0) * pi.quantity, 0);
            return (
              <div key={category} className="flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-2">
                  <h3 className="font-bold text-lg text-[var(--text-color)] flex items-center gap-2">
                    {getCategoryIcon(category)} {category}
                  </h3>
                  <span className="font-bold text-[var(--color-primary)]">{formatWeight(catWeight)}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {items.map(pi => (
                    <div key={pi.id} className="flex items-center justify-between bg-[var(--surface-color)] border border-[var(--border-color)] p-3 rounded-2xl relative overflow-hidden group">
                      
                      {/* Left: Brand logo & name */}
                      <div className="flex items-center gap-4 z-10 w-2/3">
                        {pi.item?.brand ? (() => {
                          const brandData = BRANDS_DIRECTORY.find(b => b.name.toLowerCase() === pi.item.brand?.toLowerCase());
                          return (
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-[var(--border-color)] overflow-hidden">
                              {brandData ? (
                                <img src={`https://www.google.com/s2/favicons?domain=${brandData.domain}&sz=64`} alt={pi.item.brand} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                <span className="text-[8px] font-black uppercase text-[var(--color-primary)]">{pi.item.brand.substring(0, 3)}</span>
                              )}
                            </div>
                          );
                        })() : (
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
                            {getCategoryIcon(pi.item?.category || "Autre")}
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          {pi.item?.brand && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] opacity-80">{pi.item.brand}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-color)] truncate">{pi.item?.name}</span>
                            {pi.quantity > 1 && (
                              <span className="text-xs font-bold bg-[var(--border-color)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">x{pi.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Weight and Link */}
                      <div className="flex items-center gap-3 z-10">
                        <span className="font-bold text-[var(--text-color)] flex items-center gap-1">
                          <Weight size={14} className="text-[var(--text-muted)]" />
                          {pi.item?.weight * pi.quantity}g
                        </span>
                        {pi.item?.url && (
                          <a href={pi.item.url} target="_blank" rel="noreferrer" className="p-2 bg-[var(--bg-color)] rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="max-w-4xl mx-4 lg:mx-auto mt-16 mb-8 p-6 sm:p-10 bg-[var(--surface-color)]/80 backdrop-blur-md rounded-[2rem] border border-[var(--border-color)] flex flex-col md:flex-row items-center gap-8 justify-between shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-[var(--color-primary)] rounded-[20px] flex items-center justify-center shadow-xl shadow-[var(--color-primary)]/20">
            <Mountain className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-black text-2xl sm:text-3xl text-[var(--text-color)] mb-2 tracking-tight">Crée ton propre sac</h3>
            <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-lg leading-relaxed">
              PeakPacker est l'application pour les randonneurs qui permet de gérer ton inventaire, configurer tes sacs, et bien plus encore comme organiser ton bivouac.
            </p>
          </div>
        </div>
        
        <Link to="/" className="w-full md:w-auto px-8 py-4 bg-[var(--color-primary)] text-white font-bold text-base sm:text-lg rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[var(--color-primary)]/20 whitespace-nowrap text-center flex-shrink-0">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
