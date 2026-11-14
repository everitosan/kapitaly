import { waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { sampleMethod, sampleRecurring, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';

import { renderWithProviders } from '../../testUtils';
import { useReminderSync } from '../useReminderSync';

const mock = Notifications as unknown as {
  __reset: () => void;
  __state: {
    scheduled: { identifier: string; content: { title: string } }[];
    permission: { granted: boolean; canAskAgain: boolean; status: string };
  };
};

/** 14/11/2026 a las 9:00, hora local. */
const NOW = () => new Date(2026, 10, 14, 9, 0);

function Sync() {
  useReminderSync({ now: NOW, delayMs: 0 });
  return null;
}

const scheduledIds = () => mock.__state.scheduled.map((n) => n.identifier);

beforeEach(() => {
  mock.__reset();
  mock.__state.permission = { granted: true, canAskAgain: true, status: 'granted' };
});

describe('useReminderSync', () => {
  it('nuevo recurrente: con el aviso de cobros encendido se agenda su día', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(sampleMethod({ openingBalanceCents: 0 }));
    await repos.reminderSettings.update({ chargesOn: true });
    await renderWithProviders(<Sync />, { repos });
    await waitFor(() => expect(mock.__state.scheduled).toEqual([]));

    await repos.recurringExpenses.create(
      sampleRecurring(bbva.id, { name: 'Gimnasio', anchorDate: '2026-11-25' }),
    );

    await waitFor(() => expect(scheduledIds()).toContain('charges|2026-11-25'));
    const gym = mock.__state.scheduled.find((n) => n.identifier === 'charges|2026-11-25');
    expect(gym?.content.title).toBe('Hoy se cobra Gimnasio');
  });

  it('apagar un aviso cancela todo lo que tenía agendado', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.reminderSettings.update({ dailyOn: true, idleOn: true });
    await renderWithProviders(<Sync />, { repos });
    await waitFor(() => expect(scheduledIds()).toEqual(['daily', 'idle|1', 'idle|2', 'idle|3']));

    await repos.reminderSettings.update({ dailyOn: false });
    await waitFor(() => expect(scheduledIds()).toEqual(['idle|1', 'idle|2', 'idle|3']));

    await repos.reminderSettings.update({ idleOn: false });
    await waitFor(() => expect(scheduledIds()).toEqual([]));
  });

  it('sin permiso no agenda nada aunque haya avisos encendidos', async () => {
    mock.__state.permission = { granted: false, canAskAgain: false, status: 'denied' };
    const repos = createInMemoryRepositories(testDeps());
    await repos.reminderSettings.update({ dailyOn: true });
    await renderWithProviders(<Sync />, { repos });
    await new Promise((r) => setTimeout(r, 20));
    expect(scheduledIds()).toEqual([]);
  });
});
