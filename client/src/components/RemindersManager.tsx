import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Trash2, Plus } from 'lucide-react';
import { getAllReminders, saveReminder, deleteReminder } from '@/lib/db';
import { Reminder } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

export function RemindersManager() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await getAllReminders();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      toast.error('Erro ao carregar lembretes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual') => {
    try {
      const now = Date.now();
      const frequencyMs = {
        monthly: 30 * 24 * 60 * 60 * 1000,
        quarterly: 90 * 24 * 60 * 60 * 1000,
        biannual: 180 * 24 * 60 * 60 * 1000,
        annual: 365 * 24 * 60 * 60 * 1000,
      };

      const reminder: Reminder = {
        id: nanoid(),
        testType: 'all',
        frequency,
        nextDueDate: now + frequencyMs[frequency],
        enabled: true,
        createdAt: now,
      };

      await saveReminder(reminder);
      setReminders([...reminders, reminder]);
      toast.success(`Lembrete adicionado: a cada ${frequency === 'monthly' ? '1 mes' : frequency === 'quarterly' ? '3 meses' : frequency === 'biannual' ? '6 meses' : '1 ano'}`);
    } catch (error) {
      console.error('Failed to add reminder:', error);
      toast.error('Erro ao adicionar lembrete');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id);
      setReminders(reminders.filter((r) => r.id !== id));
      toast.success('Lembrete removido');
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast.error('Erro ao remover lembrete');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensalmente',
      quarterly: 'A cada 3 meses',
      biannual: 'A cada 6 meses',
      annual: 'Anualmente',
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-6">
        <div className="text-center py-8">
          <p className="text-gray-300">Carregando lembretes...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Lembretes</h2>
      </div>

      <div className="space-y-4 mb-6">
        {reminders.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum lembrete configurado. Adicione um para acompanhar seus testes!</p>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between bg-black/20 rounded-lg p-4 border border-purple-500/20"
            >
              <div>
                <p className="text-white font-semibold">{getFrequencyLabel(reminder.frequency)}</p>
                <p className="text-xs text-gray-400">Proximo: {formatDate(reminder.nextDueDate)}</p>
              </div>
              <Button
                onClick={() => handleDeleteReminder(reminder.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-300 font-semibold mb-3">Adicionar novo lembrete:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleAddReminder('monthly')}
            className="bg-purple-600/50 hover:bg-purple-600 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Mensal
          </Button>
          <Button
            onClick={() => handleAddReminder('quarterly')}
            className="bg-purple-600/50 hover:bg-purple-600 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            3 Meses
          </Button>
          <Button
            onClick={() => handleAddReminder('biannual')}
            className="bg-purple-600/50 hover:bg-purple-600 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            6 Meses
          </Button>
          <Button
            onClick={() => handleAddReminder('annual')}
            className="bg-purple-600/50 hover:bg-purple-600 text-white text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Anual
          </Button>
        </div>
      </div>
    </Card>
  );
}
