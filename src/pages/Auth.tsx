import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mountain, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Veuillez entrer votre adresse email.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Lien de réinitialisation envoyé par email !' });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Vérifie tes emails pour confirmer ton compte !' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // La redirection se fait automatiquement via AuthContext si connexion réussie
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col justify-center items-center p-4">
      
      <div className="w-full max-w-sm bg-[var(--surface-color)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm">
        
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
            <Mountain className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-color)]">
            PeakPacker
          </h1>
          <p className="text-[var(--text-muted)] text-sm text-center">
            {isSignUp ? "Crée ton compte" : "Connecte-toi pour retrouver ton sac"}
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-6 text-sm text-center ${
            message.type === 'error' 
              ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--text-color)] px-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between px-1">
              <label className="text-sm font-semibold text-[var(--text-color)]">Mot de passe</label>
              {!isSignUp && (
                <button 
                  type="button" 
                  onClick={handleResetPassword} 
                  className="text-xs font-medium text-[var(--color-primary)] hover:brightness-110 transition-all"
                >
                  Oublié ?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? "S'inscrire" : "Se connecter")}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-sm text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
        >
          {isSignUp 
            ? "Déjà un compte ? Connecte-toi" 
            : "Pas encore de compte ? Inscris-toi"}
        </button>

      </div>

    </div>
  );
}
