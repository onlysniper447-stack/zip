"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
          <div className="mx-auto mt-16 size-64 rounded-[2rem] border-2 border-primary/80 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" />
          <p className="mt-8 text-center text-sm text-muted">
            Align the code inside the frame. We never show long account strings — just a handle.
          </p>
          <div className="mt-auto mb-10 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                haptic("success");
                setOpen(false);
                router.push("/tip?to=tunde");
              }}
            >
              Use demo code · $tunde
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
