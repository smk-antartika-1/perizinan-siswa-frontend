"use client";

import { useAppContext } from "@/context/AppContext";
import { ToastContainer } from "@/components/ui/Modal";

export default function GlobalToasts() {
  const { toasts, removeToast } = useAppContext();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}
