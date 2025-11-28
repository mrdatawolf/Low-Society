import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock socket.io-client globally
vi.mock('socket.io-client', () => {
  return {
    default: vi.fn(),
    io: vi.fn(),
  };
});
