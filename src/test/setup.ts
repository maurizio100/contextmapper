import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

// React Flow measures nodes/viewport with these DOM APIs, which jsdom does
// not implement.
class ResizeObserverStub {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  // React Flow derives node and handle positions from the first resize
  // report; without one, no node is ever "measured" and no edge renders.
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
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

// jsdom doesn't implement the Pointer Events capture API that React Flow's
// draggable handles (nodes, edge control points) call.
Element.prototype.setPointerCapture ??= function setPointerCapture() {};
Element.prototype.releasePointerCapture ??= function releasePointerCapture() {};
Element.prototype.hasPointerCapture ??= function hasPointerCapture() {
  return false;
};

// jsdom parses <dialog> but doesn't implement its modal behaviour; the
// dialogs drive theirs through showModal()/close() + the `open` attribute.
HTMLDialogElement.prototype.showModal ??= function showModal(
  this: HTMLDialogElement
) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function close(
  this: HTMLDialogElement
) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

// jsdom doesn't implement hit-testing; React Flow uses it to resolve which
// handle a connection drag ends over. Tests that drive a connection mock
// this per-case.
document.elementFromPoint ??= () => null;

// jsdom never lays out elements, so every size read is zero. React Flow only
// measures (and renders edges/handles for) a node once it sees a non-zero
// width/height, so without this a node — and a connection drag onto its
// handles — is seen as never "measured".
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 180;
  },
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 80;
  },
});
Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 180,
    bottom: 80,
    width: 180,
    height: 80,
    toJSON() {},
  } as DOMRect;
};
