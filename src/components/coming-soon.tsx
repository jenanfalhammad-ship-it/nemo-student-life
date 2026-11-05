import { Nemo } from "@/components/nemo";
import { useTx } from "@/lib/tx";
export function ComingSoon({ en, ar }: { en: string; ar: string }) {
  const { tx } = useTx();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Nemo mood="sleeping" className="h-24 w-24" />
      <h1 className="text-2xl font-bold">{tx(en, ar)}</h1>
      <p className="text-sm text-muted-foreground">{tx("This page is still being built.", "هذه الصفحة قيد البناء.")}</p>
    </div>
  );
}
