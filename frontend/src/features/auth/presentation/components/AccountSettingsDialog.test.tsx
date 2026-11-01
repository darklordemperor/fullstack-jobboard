import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AccountSettingsDialogForm,
  buildUpdateProfilePayload,
} from "./AccountSettingsDialog";

describe("AccountSettingsDialogForm & payload builder", () => {
  it("renders accessible profile and password fields with modern autocomplete and identifier attributes", () => {
    const markup = renderToStaticMarkup(
      <AccountSettingsDialogForm
        titleId="settings-title"
        descriptionId="settings-desc"
        values={{
          name: "Jane Candidate",
          email: "jane@jobboard.com",
          currentPassword: "",
          newPassword: "",
          newPasswordConfirmation: "",
        }}
        fieldErrors={{}}
        errorMessage={null}
        successMessage="Account profile updated."
        isSubmitting={false}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(markup).toContain('id="settings-title"');
    expect(markup).toContain("Account settings");
    expect(markup).toContain("Account profile updated.");
    expect(markup).toContain('autoComplete="name"');
    expect(markup).toContain('autoComplete="email"');
    expect(markup).toContain('autoCorrect="off"');
    expect(markup).toContain('autoCapitalize="off"');
    expect(markup).toContain('spellCheck="false"');
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).toContain('autoComplete="new-password"');
    expect(markup).toContain("Save changes");
  });

  it("omits password fields when password inputs are empty and includes them when provided", () => {
    expect(
      buildUpdateProfilePayload({
        name: "  Jane Updated ",
        email: " jane@jobboard.com ",
        currentPassword: "",
        newPassword: "",
        newPasswordConfirmation: "",
      }),
    ).toEqual({
      name: "Jane Updated",
      email: "jane@jobboard.com",
    });

    expect(
      buildUpdateProfilePayload({
        name: "Jane Updated",
        email: "jane@jobboard.com",
        currentPassword: "password",
        newPassword: "NewSecret123!",
        newPasswordConfirmation: "NewSecret123!",
      }),
    ).toEqual({
      name: "Jane Updated",
      email: "jane@jobboard.com",
      currentPassword: "password",
      newPassword: "NewSecret123!",
      newPasswordConfirmation: "NewSecret123!",
    });
  });
});
