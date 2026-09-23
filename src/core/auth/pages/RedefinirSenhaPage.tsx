import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { atualizarSenha } from '../auth.service';

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);
  const navigate = useNavigate();

  // Efeito para trocar o código da URL por uma sessão válida
  useEffect(() => {
    // O Supabase pode enviar o code na query string (?code=...) ou no hash (#code=...)
    const params = new URLSearchParams(window.location.search);
    let code = params.get('code');

    // Se não achou na query string, tenta no hash
    if (!code && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      code = hashParams.get('code');
    }

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao trocar código por sessão:', error);
            toast.error('Link inválido ou expirado. Solicite um novo.');
            navigate('/login');
          } else {
            setSessaoPronta(true);
          }
        });
    } else {
      // Fallback: verifica se já existe uma sessão ativa
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessaoPronta(true);
        } else {
          toast.error('Link inválido. Solicite um novo email de recuperação.');
          navigate('/login');
        }
      });
    }
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirma) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setCarregando(true);
    try {
      await atualizarSenha(senha);
      toast.success('Senha atualizada com sucesso!');
      navigate('/financeiro', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  }

  // Enquanto a sessão não estiver pronta, mostra um loading
  if (!sessaoPronta) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-border border-t-accent animate-spin" />
          <div className="text-sm text-content-muted">Verificando link…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-[#06121a] mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Definir nova senha</h1>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Nova senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-content-muted mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              className="w-full bg-bg-soft border border-border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/20"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-br from-accent to-[#16a34a] text-[#04120a] font-semibold py-2.5 rounded-lg transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}