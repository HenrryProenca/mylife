import { Clock3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePlatformTime } from '@/core/activity/usePlatformTime';

function formatMinutes(minutes: number) {
  if (minutes < 1) return 'menos de 1 min';
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  if (hours === 0) return `${remaining} min`;
  return `${hours}h ${String(remaining).padStart(2, '0')}min`;
}

export default function HomePage() {
  const usage = usePlatformTime();
  const totalMinutes = usage.reduce((total, day) => total + day.minutes, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Início</p>
        <h1 className="mt-2 font-display text-h1 font-semibold tracking-tight">Resumo da semana</h1>
        <p className="mt-1 text-body text-content-secondary">Acompanhe sua presença dentro do MyLife.</p>
      </header>

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-content-secondary">
              <Clock3 className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Tempo na plataforma</span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-content-primary">{formatMinutes(totalMinutes)}</p>
            <p className="mt-1 text-sm text-content-secondary">somado de segunda a domingo</p>
          </div>
        </div>

        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f2d4a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#aab7cc', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a87a1', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}m`} />
              <Tooltip
                cursor={{ fill: 'rgba(118, 164, 255, 0.08)' }}
                contentStyle={{ backgroundColor: '#0c1428', border: '1px solid #1f2d4a', borderRadius: 8 }}
                formatter={(value) => [formatMinutes(Number(value)), 'Tempo']}
              />
              <Bar dataKey="minutes" name="Tempo" fill="#2f63f2" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
