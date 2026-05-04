import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// localStorage mock — Object.keys() 지원
const makeStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    // Object.keys(localStorage) 가 동작하도록
    [Symbol.iterator]: function* () { yield* Object.keys(store); },
    _getStore: () => store,
  };
};

const localStorageMock = makeStorage();
const sessionStorageMock = makeStorage();

// Object.keys() 가 실제 키를 반환하도록 Proxy 사용
const makeProxy = (mock: ReturnType<typeof makeStorage>) =>
  new Proxy(mock, {
    ownKeys: () => Object.keys(mock._getStore()),
    getOwnPropertyDescriptor: (_t, key) => {
      if (key in mock._getStore()) return { enumerable: true, configurable: true, value: mock._getStore()[key as string] };
      return Object.getOwnPropertyDescriptor(mock, key);
    },
  });

Object.defineProperty(window, 'localStorage',  { value: makeProxy(localStorageMock),  writable: false });
Object.defineProperty(window, 'sessionStorage', { value: makeProxy(sessionStorageMock), writable: false });

// crypto.subtle mock
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(async (_algo: string, data: ArrayBuffer) => data),
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});

afterEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});
