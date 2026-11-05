import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

// React Flow measures nodes/viewport with these DOM APIs, which jsdom does
// not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverStub,
});

class DOMMatrixReadOnlyStub {
  m22: number;
  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([^)]+)\)/);
    this.m22 = scale ? parseFloat(scale[1]) : 1;
  }
}

Object.defineProperty(globalThis, 'DOMMatrixReadOnly', {
  writable: true,
  configurable: true,
  value: DOMMatrixReadOnlyStub,
});
