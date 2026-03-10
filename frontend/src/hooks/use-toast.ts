import { useCallback, useState } from "react";

export interface ToastData {
  id: string | number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  // Allow any extra props to pass through to <Toast>
  [key: string]: unknown;
}

interface UseToastResult {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: ToastData["id"]) => void;
}

export function useToast(): UseToastResult {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...toast },
    ]);
  }, []);

  const removeToast = useCallback((id: ToastData["id"]) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

