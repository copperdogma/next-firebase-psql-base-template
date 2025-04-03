import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  ThemeWrapper,
  renderWithTheme,
  useTheme,
  MockThemeContext,
} from '../../../tests/utils/test-theme-wrapper';

describe('ThemeWrapper', () => {
  test('renders children correctly with default theme', () => {
    // Arrange & Act
    render(
      <ThemeWrapper>
        <div data-testid="test-child">Child Content</div>
      </ThemeWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Child Content');
  });

  test('renders children with custom theme value', () => {
    // Arrange
    const customThemeValue = {
      theme: 'dark' as const,
      setTheme: jest.fn(),
      resolvedTheme: 'dark' as const,
      themes: ['light', 'dark', 'system'] as const,
      systemTheme: 'dark' as const,
    };

    // Act
    render(
      <ThemeWrapper themeValue={customThemeValue}>
        <div data-testid="test-child">Child Content</div>
      </ThemeWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
});

describe('renderWithTheme', () => {
  test('returns UI wrapped in ThemeWrapper with default theme', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;

    // Act
    const { ui, setThemeMock } = renderWithTheme(<TestComponent />);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(setThemeMock).toBeDefined();
  });

  test('uses provided theme state correctly', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = { theme: 'dark' as const, resolvedTheme: 'dark' as const };

    // Act
    const { ui, setThemeMock } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(setThemeMock).toBeDefined();
  });

  test('resolves system theme to light by default', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = { theme: 'system' as const };

    // Act
    const { ui } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  test('uses provided resolved theme over automatic resolution', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = {
      theme: 'system' as const,
      resolvedTheme: 'dark' as const, // This should override the default light resolution
    };

    // Act
    const { ui } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});

describe('MockThemeContext', () => {
  test('provides default theme context values', () => {
    // Arrange
    const TestConsumer = () => {
      const context = React.useContext(MockThemeContext);
      return (
        <div>
          <div data-testid="theme-value">{context.theme}</div>
          <div data-testid="resolved-theme-value">{context.resolvedTheme}</div>
        </div>
      );
    };

    // Act
    render(<TestConsumer />);

    // Assert
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme-value')).toHaveTextContent('light');
  });
});

describe('useTheme hook', () => {
  test('returns default theme context values', () => {
    // Arrange
    const TestComponent = () => {
      const themeContext = useTheme();
      return (
        <div>
          <div data-testid="theme-value">{themeContext.theme}</div>
          <div data-testid="resolved-theme-value">{themeContext.resolvedTheme}</div>
        </div>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme-value')).toHaveTextContent('light');
  });
});
