import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useConvites } from '../hooks/useConvites';
import type { ConvitePapel } from '../convites.types';

export function FamilyInviteForm() {
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<ConvitePapel>('membro');
  const { criarConvite, isCreating } = useConvites();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !emailLimpo.includes('@')) {
      toast.error('Informe um email válido.');
      return;
    }

    try {
      const convite = await criarConvite({ email_convidado: emailLimpo, papel });
      setEmail('');
      const link = `${window.location.origin}/aceitar-convite?token=${convite.token}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Convite criado. Link copiado — envie para a pessoa.');
      } catch {
        toast.success('Convite criado. Copie o link na lista abaixo.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar o convite.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="label-base">Email do convidado</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="esposa@exemplo.com"
          className="input-base"
          disabled={isCreating}
        />
      </label>

      <label className="sm:w-48">
        <span className="label-base">Papel</span>
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as ConvitePapel)}
          className="input-base"
          disabled={isCreating}
        >
          <option value="membro">Membro</option>
          <option value="admin">Administrador</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isCreating}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        {isCreating ? 'Convidando...' : 'Convidar'}
      </button>
    </form>
  );
}
