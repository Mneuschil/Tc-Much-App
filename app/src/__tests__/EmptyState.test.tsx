import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../components/ui/EmptyState';

jest.mock('../theme', () => require('./__mocks__/theme'));

describe('EmptyState', () => {
  it('renders title and description', () => {
    const { getByText } = render(
      <EmptyState title="Keine Daten" description="Hier gibt es noch nichts" />,
    );
    expect(getByText('Keine Daten')).toBeTruthy();
    expect(getByText('Hier gibt es noch nichts')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState title="Leer" actionLabel="Erstellen" onAction={onPress} />,
    );
    const button = getByText('Erstellen');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    const { queryByText } = render(<EmptyState title="Leer" />);
    expect(queryByText('Erstellen')).toBeNull();
  });
});
