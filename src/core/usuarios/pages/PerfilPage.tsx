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
      <h1 className="font-display text-h1 font-semibold tracking-tight text-ink-900">Meu perfil</h1>
      <p className="text-sm text-ink-500 mt-1">
        Informações básicas da sua conta
      </p>

      <form onSubmit={onSubmit} className="card p-6 mt-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="input-base text-ink-400 cursor-not-allowed"
          />
          <p className="text-xs text-ink-300 mt-1">
            O email não pode ser alterado por aqui.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={carregando}
            className="btn-primary"
          >
            {carregando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}