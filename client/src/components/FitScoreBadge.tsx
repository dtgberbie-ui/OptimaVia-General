import { cn } from "@/lib/utils";

export function FitScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
  
  if (score >= 85) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (score >= 60) {
    colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
  } else {
    colorClass = "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 transition-all",
      colorClass
    )}>
      <span className="text-lg font-bold leading-none">{score}</span>
      <span className="text-[9px] uppercase tracking-wide font-semibold mt-0.5">Fit</span>
    </div>
  );
}
