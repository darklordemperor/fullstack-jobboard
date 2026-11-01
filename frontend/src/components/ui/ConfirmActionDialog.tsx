"use client";

import { useEffect, useId, useRef } from "react";

export type DialogCloseOutcome = "confirm" | "cancel";

export function resolveDialogCloseOutcome(
  returnValue: string,
): DialogCloseOutcome {
  return returnValue === "confirm" ? "confirm" : "cancel";
}

export function isPointerOutsideDialogRect(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRectReadOnly, "left" | "right" | "top" | "bottom">,
): boolean {
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

export interface ConfirmActionDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export interface ConfirmActionDialogContentProps {
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}

export function ConfirmActionDialogContent({
  titleId,
  descriptionId,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
}: ConfirmActionDialogContentProps) {
  const confirmButtonClassName =
    tone === "danger"
      ? "rounded-md bg-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-200"
      : "rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100";

  return (
    <div className="p-6 text-left text-slate-950">
      <h2 id={titleId} className="text-lg font-bold text-slate-950">
        {title}
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
      <form method="dialog" className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="submit"
          value="cancel"
          autoFocus
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          value="confirm"
          className={confirmButtonClassName}
        >
          {confirmLabel}
        </button>
      </form>
    </div>
  );
}

export function ConfirmActionDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (
      !dialog ||
      typeof HTMLDialogElement === "undefined" ||
      "closedBy" in HTMLDialogElement.prototype
    ) {
      return;
    }

    let pressedOutside = false;

    const handlePointerDown = (event: PointerEvent): void => {
      pressedOutside = isPointerOutsideDialogRect(
        event.clientX,
        event.clientY,
        dialog.getBoundingClientRect(),
      );
    };

    const handlePointerUp = (event: PointerEvent): void => {
      if (
        pressedOutside &&
        isPointerOutsideDialogRect(
          event.clientX,
          event.clientY,
          dialog.getBoundingClientRect(),
        )
      ) {
        dialog.close();
      }
    };

    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("pointerup", handlePointerUp);

    return () => {
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleNativeClose = (): void => {
    const dialog = dialogRef.current;
    const rawValue = dialog?.returnValue ?? "";
    if (dialog) {
      dialog.returnValue = "";
    }

    const outcome = resolveDialogCloseOutcome(rawValue);
    if (outcome === "confirm") {
      void onConfirm();
    } else {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleNativeClose}
      {...({ closedby: "any" } as Record<string, string>)}
      className="m-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
    >
      <ConfirmActionDialogContent
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
      />
    </dialog>
  );
}
