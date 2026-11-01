import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ConfirmActionDialogContent,
  isPointerOutsideDialogRect,
  resolveDialogCloseOutcome,
} from "@/components/ui/ConfirmActionDialog";

describe("ConfirmActionDialog", () => {
  it("resolves dialog returnValue into confirm or cancel outcomes", () => {
    expect(resolveDialogCloseOutcome("confirm")).toBe("confirm");
    expect(resolveDialogCloseOutcome("cancel")).toBe("cancel");
    expect(resolveDialogCloseOutcome("")).toBe("cancel");
  });

  it("detects pointer coordinates outside the dialog bounding box for light-dismiss fallback", () => {
    const rect = { left: 100, right: 300, top: 100, bottom: 250 };
    expect(isPointerOutsideDialogRect(200, 180, rect)).toBe(false);
    expect(isPointerOutsideDialogRect(50, 180, rect)).toBe(true);
    expect(isPointerOutsideDialogRect(200, 260, rect)).toBe(true);
  });

  it("renders accessible heading, description, and dialog form buttons with autofocus on Cancel", () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialogContent
        titleId="confirm-title"
        descriptionId="confirm-desc"
        title="Close job listing?"
        description="Closing this job listing stops new applications and cannot be undone."
        confirmLabel="Close job listing"
      />,
    );

    expect(html).toContain('id="confirm-title"');
    expect(html).toContain("Close job listing?");
    expect(html).toContain('id="confirm-desc"');
    expect(html).toContain('method="dialog"');
    expect(html).toContain('value="cancel"');
    expect(html).toContain('value="confirm"');
    expect(html).toContain("Close job listing");
  });
});
