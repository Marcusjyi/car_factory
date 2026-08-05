import { cn } from "@/lib/utils";

type Step = {
  label: string;
  number: number | string;
};

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("mx-auto flex max-w-md items-start justify-between", className)}>
      {steps.map((step, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <li key={step.label} className="relative flex flex-1 flex-col items-center">
            {i < steps.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-4 h-px",
                  done || active ? "bg-primary/40" : "bg-border-strong",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-bold",
                active || done
                  ? "bg-primary text-white"
                  : "border border-border-strong bg-white text-text-muted",
              )}
            >
              {step.number}
            </span>
            <span
              className={cn(
                "mt-2 text-center text-xs",
                active ? "font-bold text-text" : "text-text-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
