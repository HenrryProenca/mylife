import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/core/auth/useAuth';

const STORAGE_PREFIX = 'mylife:tempo-plataforma:';

type DailyUsage = Record<string, number>;

function readUsage(userId: string): DailyUsage {
  const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as DailyUsage;
  } catch {
    return {};
  }
}

function saveUsage(userId: string, usage: DailyUsage) {
  window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(usage));
}

export function usePlatformTime() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<DailyUsage>({});

  useEffect(() => {
    if (!user) return undefined;

    let lastMeasuredAt = Date.now();
    setUsage(readUsage(user.id));

    const flush = () => {
      const elapsedMinutes = (Date.now() - lastMeasuredAt) / 60000;
      if (elapsedMinutes <= 0) return;
      const today = new Date().toISOString().slice(0, 10);
      const current = readUsage(user.id);
      const next = { ...current, [today]: (current[today] ?? 0) + elapsedMinutes };
      saveUsage(user.id, next);
      setUsage(next);
      lastMeasuredAt = Date.now();
    };

    const interval = window.setInterval(flush, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else lastMeasuredAt = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  return useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        minutes: usage[key] ?? 0,
      };
    });
  }, [usage]);
}
