import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('entorno de pruebas', () => {
  it('renderiza un componente de React Native', async () => {
    await render(<Text>Kapitaly Expenses</Text>);
    expect(screen.getByText('Kapitaly Expenses')).toBeTruthy();
  });
});
