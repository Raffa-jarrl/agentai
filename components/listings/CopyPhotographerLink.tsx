"use client";
import { toast } from "sonner";

export function CopyPhotographerLink({ link }: { link: string }) {
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(link);
        toast.success("קישור לצלם הועתק!");
      }}
      className="text-sm text-brand-blue hover:underline"
    >
      העתק קישור לצלם
    </button>
  );
}
