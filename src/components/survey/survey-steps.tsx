"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

export const SURVEY_STEPS: Step[] = [
  { id: 1, title: "部屋情報", description: "設置場所の基本情報" },
  { id: 2, title: "既存エアコン", description: "現在のエアコン状態" },
  { id: 3, title: "電気系統", description: "電源・ブレーカー情報" },
  { id: 4, title: "配管・ドレン", description: "配管ルートと排水" },
  { id: 5, title: "室外機", description: "室外機設置場所" },
  { id: 6, title: "壁面", description: "壁材質・スリーブ" },
  { id: 7, title: "追加工事", description: "追加作業項目" },
  { id: 8, title: "写真", description: "現場写真の撮影" },
  { id: 9, title: "確認", description: "コメント・送信" },
];

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav className="mb-8">
      {/* Mobile: simple progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} / {SURVEY_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {SURVEY_STEPS[currentStep - 1].title}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${(currentStep / SURVEY_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: step list */}
      <div className="hidden sm:block">
        <div className="flex gap-1">
          {SURVEY_STEPS.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex-1 relative group py-2 text-center transition-colors rounded-lg",
                  isCurrent && "bg-primary/10",
                  !isCurrent && !isCompleted && "hover:bg-secondary/60"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      isCurrent &&
                        "bg-primary text-primary-foreground",
                      isCompleted &&
                        !isCurrent &&
                        "bg-chart-3/20 text-chart-3",
                      !isCurrent &&
                        !isCompleted &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] leading-tight",
                      isCurrent
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
