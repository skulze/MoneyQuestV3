import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Security test utilities
const testXSSVulnerability = (component: React.ReactElement, inputSelector: string) => {
  render(component);
  const input = screen.getByLabelText(inputSelector) || screen.getByRole('textbox');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(\'XSS\')" />',
    '<svg onload="alert(\'XSS\')" />',
  ];

  xssPayloads.forEach(payload => {
    fireEvent.change(input, { target: { value: payload } });
    fireEvent.blur(input);

    // Verify that the payload is either sanitized or escaped
    expect(document.body.innerHTML).not.toContain('<script>');
    expect(document.body.innerHTML).not.toContain('javascript:');
    expect(document.body.innerHTML).not.toContain('onerror=');
    expect(document.body.innerHTML).not.toContain('onload=');
  });
};

const testSQLInjectionInputs = (component: React.ReactElement, inputSelector: string) => {
  render(component);
  const input = screen.getByLabelText(inputSelector) || screen.getByRole('textbox');

  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; DELETE FROM accounts; --",
    "1'; UPDATE users SET balance=999999; --",
    "' UNION SELECT * FROM sensitive_data --",
  ];

  sqlPayloads.forEach(payload => {
    fireEvent.change(input, { target: { value: payload } });
    fireEvent.blur(input);

    // Verify input validation rejects malicious SQL patterns
    const errorMessage = screen.queryByText(/invalid/i) || screen.queryByText(/error/i);
    if (!errorMessage) {
      // Should at least sanitize the input
      expect(input.value).not.toContain('DROP TABLE');
      expect(input.value).not.toContain('DELETE FROM');
      expect(input.value).not.toContain('UPDATE');
      expect(input.value).not.toContain('UNION SELECT');
    }
  });
};

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should enforce password complexity requirements', () => {
      // Mock password input component
      const PasswordInput = ({ onChange }: { onChange: (value: string) => void }) => (
        <input
          aria-label="password"
          type="password"
          onChange={(e) => {
            const value = e.target.value;
            // Password requirements: 8+ chars, uppercase, lowercase, digit, symbol
            const hasLength = value.length >= 8;
            const hasUpper = /[A-Z]/.test(value);
            const hasLower = /[a-z]/.test(value);
            const hasDigit = /\d/.test(value);
            const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value);

            if (hasLength && hasUpper && hasLower && hasDigit && hasSymbol) {
              onChange(value);
            }
          }}
        />
      );

      const weakPasswords = [
        'password',      // No uppercase, digits, symbols
        'Password',      // No digits, symbols
        'Password1',     // No symbols
        'Pass1!',        // Too short
        'PASSWORD1!',    // No lowercase
        'password1!',    // No uppercase
      ];

      weakPasswords.forEach(password => {
        let isValid = false;
        render(<PasswordInput onChange={() => { isValid = true; }} />);

        const input = screen.getByLabelText('password');
        fireEvent.change(input, { target: { value: password } });

        expect(isValid).toBeFalsy();
      });
    });

    it('should prevent brute force attacks with rate limiting simulation', () => {
      let attemptCount = 0;
      const maxAttempts = 5;

      const LoginComponent = () => {
        const handleLogin = () => {
          attemptCount++;
          if (attemptCount > maxAttempts) {
            throw new Error('Too many attempts. Please try again later.');
          }
        };

        return (
          <button onClick={handleLogin} aria-label="login">
            Login
          </button>
        );
      };

      render(<LoginComponent />);
      const loginButton = screen.getByLabelText('login');

      // Simulate multiple failed attempts
      for (let i = 0; i < maxAttempts; i++) {
        fireEvent.click(loginButton);
      }

      // The next attempt should be blocked
      expect(() => fireEvent.click(loginButton)).toThrow('Too many attempts');
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize transaction descriptions against XSS', () => {
      const TransactionForm = () => {
        const [description, setDescription] = React.useState('');

        return (
          <div>
            <input
              aria-label="description"
              value={description}
              onChange={(e) => {
                // Basic XSS prevention
                const sanitized = e.target.value
                  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
                setDescription(sanitized);
              }}
            />
            <div data-testid="preview">{description}</div>
          </div>
        );
      };

      render(<TransactionForm />);
      const input = screen.getByLabelText('description');

      fireEvent.change(input, {
        target: { value: '<script>alert("XSS")</script>Groceries' }
      });

      const preview = screen.getByTestId('preview');
      expect(preview.textContent).toBe('Groceries');
      expect(preview.textContent).not.toContain('<script>');
    });

    it('should validate numeric inputs for amount fields', () => {
      const AmountInput = ({ onChange }: { onChange: (value: number) => void }) => {
        const [error, setError] = React.useState('');

        return (
          <div>
            <input
              aria-label="amount"
              type="text"
              onChange={(e) => {
                const value = e.target.value;

                // Validate numeric input with proper bounds
                if (!/^\d*\.?\d*$/.test(value)) {
                  setError('Invalid amount format');
                  return;
                }

                const numValue = parseFloat(value);
                if (numValue < 0) {
                  setError('Amount cannot be negative');
                  return;
                }

                if (numValue > 1000000) {
                  setError('Amount exceeds maximum limit');
                  return;
                }

                setError('');
                onChange(numValue);
              }}
            />
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      let validValue = 0;
      render(<AmountInput onChange={(v) => { validValue = v; }} />);

      const input = screen.getByLabelText('amount');

      // Test invalid inputs
      const invalidInputs = [
        'abc',           // Non-numeric
        '-100',          // Negative
        '1000001',       // Exceeds limit
        '100.50.25',     // Invalid format
        '$100',          // Contains currency symbol
      ];

      invalidInputs.forEach(invalidInput => {
        fireEvent.change(input, { target: { value: invalidInput } });
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Test valid input
      fireEvent.change(input, { target: { value: '125.50' } });
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });
  });

  describe('Data Protection Security', () => {
    it('should mask sensitive data in console logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const sensitiveData = {
        accountNumber: '1234567890',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        password: 'MySecretPassword123!',
      };

      // Simulate logging function that should mask sensitive data
      const safelog = (data: any) => {
        const sanitized = JSON.stringify(data, (key, value) => {
          if (typeof value === 'string') {
            // Mask credit card numbers
            if (/\d{4}-\d{4}-\d{4}-\d{4}/.test(value)) {
              return value.replace(/\d{4}-\d{4}-\d{4}-(\d{4})/, '****-****-****-$1');
            }
            // Mask SSN
            if (/\d{3}-\d{2}-\d{4}/.test(value)) {
              return value.replace(/\d{3}-\d{2}-(\d{4})/, '***-**-$1');
            }
            // Mask passwords
            if (key.toLowerCase().includes('password')) {
              return '***REDACTED***';
            }
            // Mask long account numbers
            if (key.toLowerCase().includes('account') && /^\d{8,}$/.test(value)) {
              return value.slice(0, 4) + '****' + value.slice(-2);
            }
          }
          return value;
        });
        console.log(sanitized);
      };

      safelog(sensitiveData);

      const loggedContent = consoleSpy.mock.calls[0][0];
      expect(loggedContent).toContain('12****90');           // Masked account
      expect(loggedContent).toContain('***-**-6789');       // Masked SSN
      expect(loggedContent).toContain('****-****-****-1111'); // Masked credit card
      expect(loggedContent).toContain('***REDACTED***');    // Masked password

      consoleSpy.mockRestore();
    });

    it('should prevent localStorage from storing sensitive data', () => {
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const secureStorage = {
        set: (key: string, value: any) => {
          const sensitiveKeys = ['password', 'token', 'secret', 'key', 'ssn', 'creditcard'];
          const isSensitive = sensitiveKeys.some(sensitiveKey =>
            key.toLowerCase().includes(sensitiveKey)
          );

          if (isSensitive) {
            console.warn(`Attempt to store sensitive data in localStorage blocked: ${key}`);
            return false;
          }

          localStorage.setItem(key, JSON.stringify(value));
          return true;
        }
      };

      // Test that sensitive data is blocked
      expect(secureStorage.set('userPassword', 'secret123')).toBe(false);
      expect(secureStorage.set('authToken', 'abc123')).toBe(false);
      expect(secureStorage.set('apiKey', 'key123')).toBe(false);

      // Test that non-sensitive data is allowed
      expect(secureStorage.set('userPreferences', { theme: 'dark' })).toBe(true);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Security', () => {
    it('should implement session timeout', () => {
      jest.useFakeTimers();

      let isSessionValid = true;
      const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

      const SessionManager = () => {
        React.useEffect(() => {
          const timeoutId = setTimeout(() => {
            isSessionValid = false;
          }, SESSION_TIMEOUT);

          return () => clearTimeout(timeoutId);
        }, []);

        return (
          <div data-testid="session-status">
            {isSessionValid ? 'Active' : 'Expired'}
          </div>
        );
      };

      render(<SessionManager />);

      expect(screen.getByTestId('session-status')).toHaveTextContent('Active');

      // Fast forward time beyond session timeout
      jest.advanceTimersByTime(SESSION_TIMEOUT + 1000);

      expect(isSessionValid).toBe(false);

      jest.useRealTimers();
    });
  });
});