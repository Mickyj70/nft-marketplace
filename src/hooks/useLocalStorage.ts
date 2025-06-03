'use client';

export function useLocalStorage() {
  // Only access localStorage on the client side
  const isClient = typeof window !== 'undefined';
  
  const getItem = (key: string) => {
    if (!isClient) return null;
    return localStorage.getItem(key);
  };
  
  const setItem = (key: string, value: string) => {
    if (!isClient) return;
    localStorage.setItem(key, value);
  };
  
  const removeItem = (key: string) => {
    if (!isClient) return;
    localStorage.removeItem(key);
  };
  
  return { getItem, setItem, removeItem };
}