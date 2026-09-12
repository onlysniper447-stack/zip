"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/scan/qr-scanner";
import { haptic } from "@/lib/haptic";
import { useUiStore } from "@/stores/ui-store";

export function ScannerOverlay() {
  const open = useUiStore((s) => s.scannerOpen);
  const setOpen = useUiStore((s) => s.setScannerOpen);
  const router = useRouter();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col bg-black/90 px-6 pt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Scan a ZIP code</p>
            <button
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-full bg-white/10"
              aria-label="Close scanner"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-8">
            <QrScanner
              onPayee={(payee, amount) => {
                haptic("success");
                setOpen(false);
                const search = new URLSearchParams();
                if (payee.kind === "address") search.set("addr", payee.counterparty);
                else search.set("to", payee.counterparty);
                if (amount) search.set("amount", amount);
                router.push(`/tip?${search.toString()}`);
              }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
