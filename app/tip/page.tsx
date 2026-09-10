import { Suspense } from "react";
import { TipFlow } from "@/components/tip/tip-flow";
import { Skeleton } from "@/components/ui/skeleton";

export default function TipPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-5 pt-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      }
    >
      <TipFlow />
    </Suspense>
  );
}
