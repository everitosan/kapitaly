import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { sampleRecurring, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { BUILTIN_CATEGORIES, OTHER_CATEGORY_ID } from '@/domain/category';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import { renderWithProviders } from '../../testUtils';
import { CategoryForm } from '../CategoryForm';
import { CategoryList } from '../CategoryList';

const id = (name: string) => BUILTIN_CATEGORIES.find((b) => b.name === name)!.id;
const listProps = () => ({ onBack: jest.fn(), onOpen: jest.fn(), onAdd: jest.fn() });

describe('pantalla Categorías', () => {
  it('primera apertura: las 8 de inicio, "Otro" marcada como fija', async () => {
    await renderWithProviders(<CategoryList {...listProps()} />);
    for (const b of BUILTIN_CATEGORIES) expect(await screen.findByText(b.name)).toBeOnTheScreen();
    expect(screen.getByText('8 activas · para clasificar cada gasto')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Otro, fija' })).toBeOnTheScreen();
    expect(screen.queryByText('TUYAS')).toBeNull();
  });

  it('muestra las tuyas arriba, las ocultas atenuadas y cuántos gastos tiene cada una', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const gym = await repos.categories.create({ name: 'Gimnasio', icon: 'dumbbell' });
    await repos.recurringExpenses.create(sampleRecurring(CASH_METHOD_ID, { categoryId: gym.id }));
    await repos.categories.hide(id('Salud'));
    await renderWithProviders(<CategoryList {...listProps()} />, { repos });
    expect(await screen.findByText('TUYAS')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Salud, oculta' })).toBeOnTheScreen();
    expect(screen.getByText('1 gasto')).toBeOnTheScreen();
    expect(screen.getByText('8 activas · para clasificar cada gasto')).toBeOnTheScreen();
  });
});

describe('crear y editar una categoría', () => {
  it('crea "Gimnasio" con un ícono del set', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(<CategoryForm category={null} onDone={onDone} />);
    await fireEvent.changeText(screen.getByTestId('category-name'), 'Gimnasio');
    await fireEvent.press(screen.getByTestId('icon-dumbbell'));
    await fireEvent.press(screen.getByTestId('save-category'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.categories.list()).find((c) => c.name === 'Gimnasio')).toMatchObject({
      icon: 'dumbbell',
      builtin: false,
    });
  });

  it('no guarda un nombre vacío ni repetido', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<CategoryForm category={null} onDone={onDone} />);
    await fireEvent.press(screen.getByTestId('save-category'));
    expect(await screen.findByText('El nombre es obligatorio')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('category-name'), 'comida');
    await fireEvent.press(screen.getByTestId('save-category'));
    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeOnTheScreen();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('una de inicio: sin nombre editable ni borrar; se oculta y cambia de ícono', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const salud = (await repos.categories.get(id('Salud')))!;
    const onDone = jest.fn();
    await renderWithProviders(<CategoryForm category={salud} onDone={onDone} />, { repos });
    expect(screen.queryByTestId('category-name')).toBeNull();
    expect(screen.queryByTestId('remove-category')).toBeNull();
    await fireEvent.press(screen.getByTestId('icon-pill'));
    await fireEvent(screen.getByTestId('category-visible'), 'valueChange', false);
    await fireEvent.press(screen.getByTestId('save-category'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = await repos.categories.get(id('Salud'));
    expect(saved).toMatchObject({ name: 'Salud', icon: 'pill' });
    expect(saved?.hiddenAt).not.toBeNull();
  });

  it('"Otro" no ofrece ninguna acción de edición', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const otro = (await repos.categories.get(OTHER_CATEGORY_ID))!;
    await renderWithProviders(<CategoryForm category={otro} onDone={jest.fn()} />, { repos });
    expect(screen.queryByTestId('category-name')).toBeNull();
    expect(screen.queryByTestId('icon-dots')).toBeNull();
    expect(screen.queryByTestId('category-visible')).toBeNull();
    expect(screen.queryByTestId('remove-category')).toBeNull();
    expect(screen.queryByTestId('save-category')).toBeNull();
  });

  it('borrar una tuya avisa cuántos gastos pasarán a "Otro"', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const repos = createInMemoryRepositories(testDeps());
    const gym = await repos.categories.create({ name: 'Gimnasio', icon: 'dumbbell' });
    await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, { name: 'Smart Fit', categoryId: gym.id }),
    );
    const onDone = jest.fn();
    await renderWithProviders(<CategoryForm category={gym} onDone={onDone} />, { repos });
    expect(await screen.findByText('Si la borras, 1 gasto pasará a "Otro".')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('remove-category'));
    expect(alert.mock.calls[0][1]).toBe('El gasto que la usa pasará a "Otro".');
    const buttons = alert.mock.calls[0][2] as AlertButton[];
    await buttons.find((b) => b.text === 'Borrar categoría')!.onPress!();
    expect(await repos.categories.get(gym.id)).toBeNull();
    expect(onDone).toHaveBeenCalled();
    alert.mockRestore();
  });
});
