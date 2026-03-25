"use client";

import { Button } from "@/components/ui/button";

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

interface ReviewActionsProps {
  isApproving: boolean;
  isApproved: boolean;
  hasDraft: boolean;
  onApprove: () => void;
}

export function ReviewActions({
  isApproving,
  isApproved,
  hasDraft,
  onApprove,
}: ReviewActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] md:left-60">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-end">
        <Button
          onClick={onApprove}
          disabled={isApproving || isApproved || !hasDraft}
          className="gap-2 bg-[#1E3B8A] px-6 py-2.5 text-base font-semibold text-white hover:bg-[#1E3B8A]/90 focus-visible:ring-2 focus-visible:ring-[#1E3B8A]"
        >
          {isApproving ? (
            <>
              <SpinnerIcon />
              Dang xu ly...
            </>
          ) : isApproved ? (
            "Da duyet"
          ) : (
            "Xac nhan & Tao Canva"
          )}
        </Button>
      </div>
    </div>
  );
}
