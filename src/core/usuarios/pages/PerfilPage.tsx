    import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth/useAuth';

export default function PerfilPage() {
  const { perfil, user, refreshPerfil } = useAuth();
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (perfil) setNome(perfil.nome);
  }, [perfil]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCarregando(true);
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ nome })
        .eq('id', user.id);
      if (error) throw error;
      await refreshPerfil();
      toast.success('Perfil atualizado!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
      <p className="text-sm text-content-muted mt-1">
        Informações básicas da sua conta
      </p>

      <form onSubmit={onSubmit} className="card p-6 mt-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm text-content-muted cursor-not-allowed"
          />
          <p className="text-xs text-content-faint mt-1">
            O email não pode ser alterado por aqui.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={carregando}
            className="bg-gradient-to-br from-accent to-[#16a34a] text-[#04120a] font-semibold px-4 py-2 rounded-lg transition hover:brightness-105 disabled:opacity-60"
          >
            {carregando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}