import def from "@/assets/nemo-default.png";
import studying from "@/assets/nemo-studying.png";
import celebrating from "@/assets/nemo-celebrating.png";
import sleeping from "@/assets/nemo-sleeping.png";
import { cn } from "@/lib/utils";

export type NemoMood = "default" | "studying" | "celebrating" | "sleeping" | "happy" | "thinking" | "encouraging" | "surprised";
const src: Record<NemoMood, string> = {
  default: def, happy: celebrating, encouraging: def, surprised: def, thinking: studying,
  studying, celebrating, sleeping,
};

export function Nemo({ mood = "default", className, float = false }: { mood?: NemoMood; className?: string; float?: boolean }) {
  return (
    <img
      src={src[mood]}
      alt="Nemo the red octopus"
      width={1024}
      height={1024}
      className={cn("select-none object-contain drop-shadow-sm", float && "animate-float", className)}
      draggable={false}
    />
  );
}

export function EmptyState({ text, mood = "sleeping", action }: { text: string; mood?: NemoMood; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-surface/50 px-6 py-10 text-center">
      <Nemo mood={mood} className="h-20 w-20" />
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
