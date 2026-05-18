import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { MapPin, Star, Calendar, Plus, Tent, X, Save, Map, Trash2, Pencil, Sun, Cloud, CloudRain, Snowflake, Wind, Layers, UploadCloud, Check, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type BivouacLog = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  date: string;
  rating: number; // 1 to 5
  description: string;
  image_url?: string;
  companions?: string;
  weather?: string;
};

const WEATHER_ICONS: Record<string, any> = {
  Sun: <Sun size={18} />,
  Cloud: <Cloud size={18} />,
  CloudRain: <CloudRain size={18} />,
  Snowflake: <Snowflake size={18} />,
  Wind: <Wind size={18} />
};

// Custom map marker using Tailwind and CSS variables
const createBivouacIcon = (isHovered: boolean = false) => new L.DivIcon({
  html: `<div style="background-color: color-mix(in srgb, var(--surface-color) 90%, transparent); backdrop-filter: blur(8px); color: var(--color-primary); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); border: 1px solid ${isHovered ? 'var(--color-primary)' : 'var(--border-color)'}; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); transform: ${isHovered ? 'scale(1.05)' : 'scale(1)'};"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/></svg></div>`,
  className: "bg-transparent border-none",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

// Component to handle map clicks and dynamically adding logs
function MapInteraction({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.setView(position, map.getZoom(), { animate: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [position, map]);
  return null;
}

function MapSizeInvalidator({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate its canvas size after the CSS layout transition completes
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 300)
    ];
    return () => timers.forEach(clearTimeout);
  }, [isExpanded, map]);
  
  // Also fix resize issues on window resize
  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  return null;
}

export default function Bivouac() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [logs, setLogs] = useState<BivouacLog[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [gpsInput, setGpsInput] = useState("");
  const [mapStyle, setMapStyle] = useState<"voyager" | "satellite" | "topo">("voyager");
  
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    rating: 5,
    companions: "",
    description: "",
    image_url: "",
    weather: "Sun"
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ message: "L'image ne doit pas dépasser 5mo.", type: "error" });
      return;
    }

    try {
      setIsUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast({ message: "Image importée avec succès ! 🎉" });
      
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ message: "Erreur d'import. Le bucket 'images' est-il bien public ?", type: "error" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;
    const { data } = await supabase.from('bivouac_spots').select('*').eq('user_id', user.id);
    if (data) setLogs(data as BivouacLog[]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setDraftLocation({ lat, lng });
    setGpsInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setShowDrawer(true);
    setActiveLogId(null);
    setEditingLogId(null);
    setFormData({ title: "", date: new Date().toISOString().split('T')[0], rating: 5, companions: "", description: "", image_url: "", weather: "Sun"});
  };

  const handleMarkerClick = (id: string) => {
    setActiveLogId(id);
    setShowDrawer(false);
    setEditingLogId(null);
    setDraftLocation(null);
  };

  const editLog = (id: string) => {
    const logToEdit = logs.find(l => l.id === id);
    if (!logToEdit) return;
    
    setEditingLogId(id);
    setShowDrawer(true);
    setActiveLogId(null);
    setDraftLocation({ lat: logToEdit.lat, lng: logToEdit.lng });
    setGpsInput(`${logToEdit.lat.toFixed(4)}, ${logToEdit.lng.toFixed(4)}`);
    setFormData({
      title: logToEdit.title || "",
      description: logToEdit.description || "",
      rating: logToEdit.rating || 5,
      date: logToEdit.date || new Date().toISOString().split('T')[0],
      companions: logToEdit.companions || "",
      image_url: logToEdit.image_url || "",
      weather: logToEdit.weather || "Sun"
    });
  };

  const deleteLog = async (id: string) => {
    const logToDelete = logs.find(l => l.id === id);
    confirm({
      title: "Supprimer ce spot ?",
      message: "Cette action est irréversible et effacera toutes les informations liées à ce spot.",
      confirmText: "Supprimer",
      onConfirm: async () => {
        setLogs(logs.filter(l => l.id !== id));
        setActiveLogId(null);
        await supabase.from('bivouac_spots').delete().eq('id', id);
        
        if (logToDelete?.image_url && logToDelete.image_url.includes('/storage/v1/object/public/images/')) {
          const matches = logToDelete.image_url.match(/public\/images\/(.+)$/);
          if (matches && matches[1]) {
            supabase.storage.from('images').remove([matches[1]]).catch(console.warn);
          }
        }
        
        toast({ message: "Spot supprimé avec succès." });
      }
    });
  };

  const handleSave = async () => {
    if (!user || !draftLocation || !formData.title.trim()) return;
    
    const newLog = {
      user_id: user.id,
      lat: draftLocation.lat,
      lng: draftLocation.lng,
      title: formData.title,
      description: formData.description,
      rating: formData.rating,
      date: formData.date,
      companions: formData.companions,
      image_url: formData.image_url,
      weather: formData.weather
    };

    try {
      if (editingLogId) {
        // Cleanup old image if changed
        const oldLog = logs.find(l => l.id === editingLogId);
        if (oldLog?.image_url && oldLog.image_url !== formData.image_url) {
          if (oldLog.image_url.includes('/storage/v1/object/public/images/')) {
            const matches = oldLog.image_url.match(/public\/images\/(.+)$/);
            if (matches && matches[1]) {
              supabase.storage.from('images').remove([matches[1]]).catch(console.warn);
            }
          }
        }
        
        const { data } = await supabase.from('bivouac_spots').update(newLog).eq('id', editingLogId).select().single();
        if (data) {
          setLogs(logs.map(l => l.id === editingLogId ? (data as BivouacLog) : l));
          setShowDrawer(false);
          setDraftLocation(null);
          setEditingLogId(null);
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], rating: 5, companions: "", description: "", image_url: "", weather: "Sun"});
          setActiveLogId(data.id);
        }
      } else {
        const { data } = await supabase.from('bivouac_spots').insert(newLog).select().single();
        if (data) {
          setLogs([...logs, data as BivouacLog]);
          setShowDrawer(false);
          setDraftLocation(null);
          setEditingLogId(null);
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], rating: 5, companions: "", description: "", image_url: "", weather: "Sun"});
          setActiveLogId(data.id);
        }
      }
    } catch (e) {
      console.error("Error saving log, please check DB schema", e);
      toast({ message: "Erreur de sauvegarde. (Vérifiez la colonne weather)" });
    }
  };

  return (
    <div className="pt-8 pb-32 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto flex flex-col min-h-[100dvh]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 flex-shrink-0">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-3 pt-1">
            <Map className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)] pb-1">
              Carnet de Bivouac
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg flex items-center gap-2">
            Tracez, documentez et revivez vos expéditions.
          </p>
        </div>
        <button 
          onClick={() => {
            setActiveLogId(null);
            setEditingLogId(null);
            setDraftLocation(null);
            setGpsInput("");
            setFormData({ title: "", date: new Date().toISOString().split('T')[0], rating: 5, companions: "", description: "", image_url: "", weather: "Sun" });
            setShowDrawer(true);
          }}
          className="flex flex-shrink-0 items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Ajouter un spot</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0 relative">
        
        {/* LEFT/BOTTOM: Drawer / Log Info */}
        {(activeLogId || showDrawer) && (
          <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:static z-40 bg-[var(--bg-color)] lg:bg-transparent p-0 lg:p-0">
            
            {activeLogId && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[2rem] shadow-xl flex flex-col mx-0 max-h-[80vh] overflow-y-auto">
                {/* Image header if available */}
                {logs.find(l => l.id === activeLogId)?.image_url ? (
                  <div className="h-48 relative w-full flex-shrink-0">
                    <img src={logs.find(l => l.id === activeLogId)?.image_url} alt="Camp" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                      <h2 className="text-2xl font-bold text-white leading-tight pr-10">
                        {logs.find(l => l.id === activeLogId)?.title}
                      </h2>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1 z-10 transition-all bg-black/40 p-1.5 rounded-full backdrop-blur-md">
                      <button onClick={() => activeLogId && editLog(activeLogId)} className="hover:bg-white/20 text-white flex items-center justify-center rounded-full transition-all h-9 w-9" title="Modifier">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => activeLogId && deleteLog(activeLogId)} className="hover:bg-red-500/80 text-white flex items-center justify-center rounded-full transition-all h-9 w-9" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                      <div className="w-px h-5 bg-white/30 mx-1"></div>
                      <button onClick={() => setActiveLogId(null)} className="hover:bg-white/20 text-white flex items-center justify-center rounded-full transition-all h-9 w-9">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 pb-5 border-b border-[var(--border-color)] flex items-start justify-between flex-shrink-0 gap-4">
                    <h2 className="text-2xl font-bold text-[var(--text-color)] leading-tight flex-grow pt-1">
                      {logs.find(l => l.id === activeLogId)?.title}
                    </h2>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => activeLogId && editLog(activeLogId)} className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-all h-9 w-9 rounded-full hover:bg-[var(--surface-color)] flex items-center justify-center" title="Modifier">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => activeLogId && deleteLog(activeLogId)} className="text-[var(--text-muted)] hover:text-red-500 transition-all h-9 w-9 rounded-full hover:bg-red-500/10 flex items-center justify-center" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                      <button onClick={() => setActiveLogId(null)} className="text-[var(--text-color)] hover:bg-[var(--border-color)] bg-[var(--border-color)]/50 transition-all h-9 w-9 rounded-full flex items-center justify-center ml-1">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium bg-[var(--bg-color)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                      <Calendar size={16} />
                      {new Date(logs.find(l => l.id === activeLogId)?.date || "").toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full">
                      {WEATHER_ICONS[logs.find(l => l.id === activeLogId)?.weather || "Sun"]}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-full">
                      <Star size={16} fill="currentColor" />
                      {logs.find(l => l.id === activeLogId)?.rating} / 5
                    </div>
                  </div>

                  {logs.find(l => l.id === activeLogId)?.companions && (
                    <div className="flex flex-col gap-2">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Compagnons</h3>
                       <p className="font-medium text-[var(--text-color)] bg-[var(--surface-color)] p-3 rounded-xl border border-[var(--border-color)]">
                         {logs.find(l => l.id === activeLogId)?.companions}
                       </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Coordonnées</h3>
                    <p className="font-mono text-sm bg-[var(--bg-color)] p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between text-[var(--text-color)]">
                      <span>{logs.find(l => l.id === activeLogId)?.lat.toFixed(4)}, {logs.find(l => l.id === activeLogId)?.lng.toFixed(4)}</span>
                      <MapPin size={16} className="text-[var(--color-primary)]" />
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Journal de bord</h3>
                    <p className="text-[var(--text-color)] leading-relaxed p-4 bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] text-sm whitespace-pre-wrap min-h-[100px]">
                      {logs.find(l => l.id === activeLogId)?.description || "Aucune note pour ce site de bivouac."}
                    </p>
                  </div>
                </div>
              </div>
            )}

             {showDrawer && !activeLogId && (
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-3xl md:rounded-[2rem] shadow-xl flex flex-col mx-0">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)] flex-shrink-0">
                  <h2 className="text-2xl font-bold text-[var(--text-color)] tracking-tight flex items-center gap-3">
                    <Tent size={28} className="text-[var(--color-primary)]" />
                    {editingLogId ? 'Modifier le spot' : 'Nouveau spot'}
                  </h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-color)] rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-5 flex-grow">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Nom du lieu *</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        placeholder="Ex: Lac d'Aubert" 
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all text-[var(--text-color)]" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Localisation (GPS)</label>
                      <input 
                        type="text" 
                        value={gpsInput}
                        onChange={(e) => {
                          setGpsInput(e.target.value);
                          const parts = e.target.value.split(',');
                          if(parts.length === 2) {
                            const lat = parseFloat(parts[0]);
                            const lng = parseFloat(parts[1]);
                            if(!isNaN(lat) && !isNaN(lng)) setDraftLocation({lat, lng});
                          } else {
                            // Automatically try space separation if comma isn't used
                            const spaceParts = e.target.value.trim().split(/\s+/);
                            if(spaceParts.length === 2) {
                              const lat = parseFloat(spaceParts[0]);
                              const lng = parseFloat(spaceParts[1]);
                              if(!isNaN(lat) && !isNaN(lng)) setDraftLocation({lat, lng});
                            }
                          }
                        }}
                        placeholder="Ex: 46.22, 2.21" 
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-mono text-sm text-[var(--text-color)]" 
                      />
                    </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Compagnons</label>
                    <input 
                      type="text" 
                      value={formData.companions} 
                      onChange={e => setFormData({...formData, companions: e.target.value})} 
                      placeholder="Ex: Avec Jean et Marie" 
                      className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-full text-[var(--text-color)]" 
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Date</label>
                      <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-full text-[var(--text-color)]" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-[0.5]">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Note / 5</label>
                      <input 
                        type="number" 
                        min="1" max="5" 
                        value={formData.rating} 
                        onChange={e => setFormData({...formData, rating: parseInt(e.target.value) || 3})} 
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-full text-[var(--text-color)]" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Météo</label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(WEATHER_ICONS).map(w => (
                        <button
                          key={w}
                          onClick={() => setFormData({...formData, weather: w})}
                          className={`flex items-center justify-center w-11 h-11 rounded-full border transition-all ${formData.weather === w ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--color-primary)]/20 shadow-md' : 'bg-[var(--bg-color)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--color-primary)]'}`}
                        >
                          {WEATHER_ICONS[w]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex justify-between items-center pl-2">
                      <span>Photo de couverture</span>
                      {isUploadingImage && <Loader2 size={12} className="animate-spin text-[var(--color-primary)]" />}
                    </label>
                    <div className="flex flex-col gap-2">
                        {/* Zone Drop/Upload */}
                        <div className="relative">
                          <label className={`w-full flex items-center justify-center gap-2 h-[52px] bg-[var(--surface-color)] border-2 border-dashed ${formData.image_url && !formData.image_url.startsWith('https://') ? 'border-[var(--color-primary)]' : 'border-[var(--border-color)]'} rounded-2xl cursor-pointer hover:border-[var(--color-primary)] transition-all overflow-hidden relative`}>
                            {formData.image_url ? (
                              <>
                                <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                                <span className="relative z-10 font-bold text-[var(--color-primary)] flex items-center gap-2"><Check size={16} /> Importée</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={20} className="text-[var(--text-muted)]" />
                                <span className="text-sm font-medium text-[var(--text-muted)]">Prendre photo / Importer</span>
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                            />
                          </label>
                          
                          {formData.image_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData({...formData, image_url: ''});
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--bg-color)] backdrop-blur-md rounded-full text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors z-20 shadow-sm border border-[var(--border-color)]"
                              title="Retirer l'image"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        {/* URL Manuelle */}
                        <input 
                          type="url" 
                          value={formData.image_url} 
                          onChange={e => setFormData({...formData, image_url: e.target.value})} 
                          className="w-full h-[40px] bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl px-3 outline-none focus:border-[var(--color-primary)] transition-all text-sm text-[var(--text-color)]"
                          placeholder="Ou coller une URL..."
                        />
                      </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-grow">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pl-2">Notes & Souvenirs</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Racontez votre expérience, météo, difficulté..." 
                      className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-4 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all w-full min-h-[140px] shrink-0 resize-none text-[var(--text-color)]"
                    ></textarea>
                  </div>
                </div>

                <div className="flex-shrink-0 mt-6 pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={!formData.title.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--text-color)] text-[var(--bg-color)] px-5 py-3.5 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT: Map Container */}
        <div className={`z-0 flex-grow min-h-[50dvh] md:min-h-[400px] lg:min-h-[600px] border border-[var(--border-color)] rounded-3xl shadow-sm overflow-hidden relative ${(!activeLogId && !showDrawer) ? 'w-full block' : 'hidden lg:block lg:w-2/3'}`}>
          {/* Subtle map overlay gradient for premium feel */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] z-10"></div>
          
          <div className="absolute top-4 left-4 z-[400] flex gap-3 flex-wrap">
            <div className="bg-[var(--surface-color)]/90 backdrop-blur border border-[var(--border-color)] px-4 h-[44px] rounded-full flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[var(--text-color)]">
              <Tent size={18} />
              <span className="font-bold text-sm text-[var(--text-color)]">{logs.length} Nuits</span>
            </div>
            <div className="bg-[var(--surface-color)]/90 backdrop-blur border border-[var(--border-color)] px-4 h-[44px] rounded-full flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[var(--text-color)]">
              <Star size={18} />
              <span className="font-bold text-sm text-[var(--text-color)]">
                {logs.length > 0 ? (logs.reduce((acc, l) => acc + l.rating, 0) / logs.length).toFixed(1) : "-"} Moyenne
              </span>
            </div>
          </div>

          <button 
            onClick={() => setMapStyle(mapStyle === "voyager" ? "topo" : mapStyle === "topo" ? "satellite" : "voyager")}
            className="absolute top-4 right-4 z-[400] bg-[var(--surface-color)]/90 backdrop-blur border border-[var(--border-color)] w-[44px] h-[44px] flex items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[var(--text-color)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all group"
            title="Changer de fond de carte"
          >
            <Layers size={20} className="group-active:scale-95 transition-transform" />
          </button>

          <MapContainer 
            center={[44.1, 3.1]} // Default map center (France/Alpsish)
            zoom={6} 
            zoomControl={false}
            attributionControl={false}
            className="absolute inset-0 bg-[#1a1a1a] z-0"
          >
            <ZoomControl position="bottomright" />
            
            {mapStyle === "voyager" ? (
              <TileLayer
                attribution=""
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
            ) : mapStyle === "satellite" ? (
              <TileLayer
                attribution=""
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution=""
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              />
            )}
            
            <MapInteraction onMapClick={handleMapClick} />

            {/* Render Saved Logs */}
            {logs.map(log => (
              <Marker 
                key={log.id} 
                position={[log.lat, log.lng]} 
                icon={createBivouacIcon(activeLogId === log.id)}
                eventHandlers={{ click: () => handleMarkerClick(log.id) }}
              >
                {/* No default popup since we use the left drawer/sidebar for viewing! */}
              </Marker>
            ))}

            {/* Render Draft Marker */}
            {draftLocation && showDrawer && (
              <Marker 
                position={[draftLocation.lat, draftLocation.lng]} 
                icon={createBivouacIcon(true)}
              >
              </Marker>
            )}
            
            <MapSizeInvalidator isExpanded={!!activeLogId || showDrawer} />
            <MapViewUpdater position={
              draftLocation && showDrawer ? [draftLocation.lat, draftLocation.lng] 
              : activeLogId ? [logs.find(l => l.id === activeLogId)?.lat || 0, logs.find(l => l.id === activeLogId)?.lng || 0] 
              : null
            } />
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
