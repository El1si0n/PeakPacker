import { useState, useEffect } from "react";
import { LogOut, Moon, Sun, Settings, Box, Backpack, Map, X, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { supabase } from "../lib/supabase";

export function UserMenu({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, signOut } = useAuth();
  const { toast, confirm } = useUI();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isMobile = window.innerWidth < 768;
  
  const [stats, setStats] = useState({ items: 0, bags: 0, bivouacs: 0 });
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [currency, setCurrency] = useState(localStorage.getItem('preferred_devise') || '€');
  const [language, setLanguage] = useState(localStorage.getItem('preferred_language') || 'fr');

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem("peakpacker-theme") as "light" | "dark" | null;
    const updateMetaThemeColor = (theme: "light" | "dark") => {
      document.getElementById("theme-color-meta")?.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#ffffff");
    };

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      updateMetaThemeColor(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
      updateMetaThemeColor(initialTheme);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchStats();
    }
  }, [isOpen, user]);

  const fetchStats = async () => {
    if (!user) return;
    const [{ count: iCount }, { count: bCount }, { count: mCount }] = await Promise.all([
      supabase.from("inventory").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("bags").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("bivouac_spots").select("*", { count: "exact", head: true }).eq("user_id", user.id)
    ]);
    setStats({ 
      items: iCount || 0, 
      bags: bCount || 0, 
      bivouacs: mCount || 0 
    });
  };

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("peakpacker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.getElementById("theme-color-meta")?.setAttribute("content", newTheme === "dark" ? "#0a0a0a" : "#ffffff");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ message: "Le mot de passe doit faire au moins 6 caractères.", type: "error" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    
    if (error) {
      toast({ message: "Erreur lors de la modification.", type: "error" });
      console.error(error);
    } else {
      toast({ message: "Mot de passe mis à jour avec succès !", type: "success" });
      setNewPassword("");
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ message: "Veuillez entrer une adresse email valide.", type: "error" });
      return;
    }
    setIsEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setIsEmailLoading(false);
    
    if (error) {
      toast({ message: "Erreur lors de la modification de l'email.", type: "error" });
      console.error(error);
    } else {
      toast({ message: "Veuillez confirmer le lien envoyé à votre nouvelle adresse !", type: "success" });
      setNewEmail("");
    }
  };

  const handleDeleteAccount = () => {
    confirm({
      title: "Suppression de compte",
      message: "Êtes-vous sûr de vouloir supprimer votre compte et tout votre équipement ? Cette action est irréversible.",
      confirmText: "Supprimer",
      onConfirm: async () => {
        const { error } = await supabase.rpc('delete_user');
        
        if (error) {
          toast({ message: "La suppression nécessite une fonction RPC côté Supabase ou les droits admin.", type: "error" });
          console.error(error);
        } else {
          toast({ message: "Votre compte a été supprimé.", type: "success" });
          signOut();
        }
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center lg:items-stretch justify-center lg:justify-end p-0 md:p-4 lg:p-0 bg-black/60 backdrop-blur-sm transition-all" 
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div 
            initial={isMobile ? { opacity: 1 } : { x: "100%" }}
            animate={isMobile ? { opacity: 1 } : { x: 0 }}
            exit={isMobile ? { opacity: 1 } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} 
            className="w-full h-full md:h-auto max-w-none md:max-w-sm bg-[var(--bg-color)] shadow-2xl rounded-none md:rounded-[2rem] lg:rounded-none lg:rounded-l-[2rem] border-0 md:border border-[var(--border-color)] lg:border-y-0 lg:border-r-0 flex flex-col max-h-[100dvh] md:max-h-[85vh] lg:max-h-none lg:h-full overflow-hidden"
          >
            
            <div className="flex p-6 md:p-8 flex-col gap-6 flex-grow overflow-y-auto overscroll-contain">
              {/* Header inside scroll is fine, or sticky */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 shrink-0">
                <h2 className="text-2xl font-bold text-[var(--text-color)] tracking-tight flex items-center gap-3">
                  <Settings size={28} className="text-[var(--color-primary)]" />
                  Mon Espace
                </h2>
                <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface-color)] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Dashboard */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tableau de bord</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center shadow-sm">
                    <Box size={20} className="text-[var(--color-primary)] mb-1" />
                    <span className="text-xl font-black text-[var(--color-primary)]">{stats.items}</span>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{stats.items <= 1 ? 'Item' : 'Items'}</span>
                  </div>
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
                    <Backpack size={20} className="text-[var(--text-muted)] mb-1" />
                    <span className="text-xl font-black text-[var(--text-color)]">{stats.bags}</span>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{stats.bags <= 1 ? 'Sac' : 'Sacs'}</span>
                  </div>
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
                    <Map size={20} className="text-[var(--text-muted)] mb-1" />
                    <span className="text-xl font-black text-[var(--text-color)]">{stats.bivouacs}</span>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{stats.bivouacs <= 1 ? 'Nuit' : 'Nuits'}</span>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Apparence</h3>
                <div className="flex bg-[var(--surface-color)] border border-[var(--border-color)] p-1 rounded-2xl">
                  <button 
                    onClick={() => toggleTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${theme === 'light' ? 'bg-[var(--bg-color)] shadow-sm text-[var(--text-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'}`}
                  >
                    <Sun size={18} />
                    Clair
                  </button>
                  <button 
                    onClick={() => toggleTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${theme === 'dark' ? 'bg-[var(--bg-color)] shadow-sm text-[var(--text-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'}`}
                  >
                    <Moon size={18} />
                    Sombre
                  </button>
                </div>
              </div>

              {/* Preferences (Settings) */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Préférences</h3>
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Devise</span>
                    <div className="relative">
                      <select 
                        value={currency}
                        onChange={(e) => {
                          setCurrency(e.target.value);
                          localStorage.setItem('preferred_devise', e.target.value);
                        }}
                        className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-sm focus:border-[var(--color-primary)] outline-none text-[var(--text-color)] font-bold appearance-none cursor-pointer"
                      >
                        <option value="€">€</option>
                        <option value="$">$</option>
                        <option value="£">£</option>
                        <option value="CHF">CHF</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Langue</span>
                    <div className="relative">
                      <select 
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          localStorage.setItem('preferred_language', e.target.value);
                        }}
                        className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-sm focus:border-[var(--color-primary)] outline-none text-[var(--text-color)] font-bold appearance-none cursor-pointer"
                      >
                        <option value="fr">Français</option>
                        <option value="en">Anglais (Bientôt)</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compte */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Mon Compte</h3>
                <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--text-muted)] font-medium mb-1">Email connecté</span>
                    <span className="text-sm font-bold text-[var(--text-color)] overflow-hidden text-ellipsis">{user?.email}</span>
                  </div>
                  
                  <div className="w-full h-px bg-[var(--border-color)]"></div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Modifier l'adresse email</span>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input 
                          type="email" 
                          placeholder="Nouvelle adresse email"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] outline-none text-[var(--text-color)]"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateEmail}
                        disabled={isEmailLoading || !newEmail}
                        className="bg-[var(--text-color)] text-[var(--bg-color)] text-sm font-bold py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        Changer l'email
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[var(--border-color)] opacity-50"></div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Modifier le mot de passe</span>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input 
                          type="password" 
                          placeholder="Nouveau mot de passe"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] outline-none text-[var(--text-color)]"
                        />
                      </div>
                      <button 
                        onClick={handleUpdatePassword}
                        disabled={isLoading || !newPassword}
                        className="bg-[var(--text-color)] text-[var(--bg-color)] text-sm font-bold py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4 md:px-8 md:pb-4 pt-4 border-t border-[var(--border-color)] flex flex-col gap-3 shrink-0 bg-[var(--bg-color)] z-10">
              <button 
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-3.5 rounded-2xl transition-all"
              >
                <LogOut size={20} />
                Se déconnecter
              </button>
              
              <button 
                onClick={handleDeleteAccount}
                className="text-xs text-[var(--text-muted)] hover:underline hover:text-red-500 text-center opacity-70"
              >
                Supprimer mon compte
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
