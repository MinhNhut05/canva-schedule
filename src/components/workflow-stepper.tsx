"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STEPPER_LABELS, STEPPER_TOOLTIPS } from "@/lib/messages";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "active" | "error" | "future";

export interface WorkflowStepperProps {
  /** 1-indexed active step (1 = Tải lên, 2 = Trích xuất, ..., 5 = Hoàn thành) */
  activeStep: number;
  /** Step index (1-indexed) that has an error. Null if no error. */
  errorStep?: number | null;
  /** Whether to show a spinner icon in the active step circle */
  activeLoading?: boolean;
  /**
   * Visual theme. "cool" (default) keeps the existing app theme used on the
   * review page; "paper" renders the warm SOHA Travel look used on the upload page.
   */
  variant?: "cool" | "paper";
}

function getStepStatus(
  stepNumber: number,
  activeStep: number,
  errorStep?: number | null,
): StepStatus {
  if (stepNumber === errorStep) return "error";
  if (stepNumber < activeStep) return "completed";
  if (stepNumber === activeStep) return "active";
  return "future";
}

function getTooltipText(errorStep?: number | null): string {
  if (errorStep === 2) return STEPPER_TOOLTIPS.extraction;
  if (errorStep === 4) return STEPPER_TOOLTIPS.canva;
  return "";
}

export function WorkflowStepper({
  activeStep,
  errorStep,
  activeLoading,
  variant = "cool",
}: WorkflowStepperProps) {
  const router = useRouter();

  const tooltipText = getTooltipText(errorStep);

  if (variant === "paper") {
    return (
      <div className="up-stepper">
        {STEPPER_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber, activeStep, errorStep);
          const showConnector = index > 0;
          const prevStatus = getStepStatus(index, activeStep, errorStep);

          const dotContent = (
            <>
              {status === "completed" && <Check size={18} />}
              {status === "active" && activeLoading && (
                <Loader2 size={18} className="up-spin" />
              )}
              {status === "active" && !activeLoading && stepNumber}
              {status === "error" && <AlertTriangle size={18} />}
              {status === "future" && stepNumber}
            </>
          );

          return (
            <Fragment key={label}>
              {showConnector && (
                <div
                  className={cn("up-step-conn", prevStatus === "completed" && "done")}
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  "up-step",
                  status === "completed" && "done",
                  status === "active" && "active",
                  status === "error" && "error",
                )}
              >
                {status === "error" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="up-step-dot" aria-label={label}>
                          {dotContent}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{tooltipText}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="up-step-dot" aria-label={label}>
                    {dotContent}
                  </div>
                )}
                <span className="up-step-lbl">{label}</span>
              </div>
            </Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between px-2 py-3 md:px-4 md:py-4">
      {STEPPER_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const status = getStepStatus(stepNumber, activeStep, errorStep);

        // Connector line before this step (except the first step)
        const showConnector = index > 0;
        const prevStatus = getStepStatus(index, activeStep, errorStep);
        const connectorIsPrimary =
          prevStatus === "completed" || prevStatus === "active";

        const handleCircleClick =
          status === "completed" && stepNumber === 1
            ? () => router.push("/upload")
            : undefined;

        const circleClasses = cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
          status === "completed" && "bg-primary/20 text-primary",
          status === "active" && "bg-primary text-primary-foreground",
          status === "error" && "bg-destructive/20 text-destructive",
          status === "future" && "bg-muted text-muted-foreground",
          status === "completed" && stepNumber === 1 && "cursor-pointer hover:opacity-80",
          status === "completed" && stepNumber > 1 && "cursor-pointer",
          (status === "active" || status === "error" || status === "future") && "cursor-default",
        );

        const labelClasses = cn(
          "mt-1.5 hidden text-xs font-semibold md:block",
          status === "completed" && "text-primary",
          status === "active" && "text-foreground",
          status === "error" && "text-destructive",
          status === "future" && "text-muted-foreground",
        );

        const circleContent = (
          <>
            {status === "completed" && <Check size={16} />}
            {status === "active" && activeLoading && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {status === "active" && !activeLoading && stepNumber}
            {status === "error" && <AlertTriangle size={16} />}
            {status === "future" && stepNumber}
          </>
        );

        const circle =
          status === "error" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    role="presentation"
                    aria-label={label}
                    className={circleClasses}
                  >
                    {circleContent}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : handleCircleClick ? (
            <button
              type="button"
              aria-label={label}
              onClick={handleCircleClick}
              className={circleClasses}
            >
              {circleContent}
            </button>
          ) : (
            <div aria-label={label} className={circleClasses}>
              {circleContent}
            </div>
          );

        return (
          <div key={label} className="flex flex-1 items-start">
            {showConnector && (
              <div
                className={cn(
                  "h-0.5 flex-1 self-center",
                  connectorIsPrimary ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div className="flex flex-col items-center">
              {circle}
              <span className={labelClasses}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
