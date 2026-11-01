"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isPointerOutsideDialogRect } from "@/components/ui/ConfirmActionDialog";
import type { UpdateProfileData } from "@/features/auth/application/dto/AuthCredentials";
import { AuthRequestError } from "@/features/auth/application/errors/AuthRequestError";
import type { User } from "@/features/auth/domain/entities/User";

export interface AccountSettingsFormValues {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export function buildUpdateProfilePayload(
  values: AccountSettingsFormValues,
): UpdateProfileData {
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const hasPasswordChange =
    values.newPassword.length > 0 ||
    values.currentPassword.length > 0 ||
    values.newPasswordConfirmation.length > 0;

  return {
    name: trimmedName,
    email: trimmedEmail,
    ...(hasPasswordChange
      ? {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          newPasswordConfirmation: values.newPasswordConfirmation,
        }
      : {}),
  };
}

export interface AccountSettingsDialogFormProps {
  titleId: string;
  descriptionId: string;
  values: AccountSettingsFormValues;
  fieldErrors: Record<string, string[]>;
  errorMessage: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  onChange: (field: keyof AccountSettingsFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function AccountSettingsDialogForm({
  titleId,
  descriptionId,
  values,
  fieldErrors,
  errorMessage,
  successMessage,
  isSubmitting,
  onChange,
  onSubmit,
  onClose,
}: AccountSettingsDialogFormProps) {
  return (
    <div className="p-6 text-left text-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-lg font-bold text-slate-950">
            Account settings
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-600">
            Update your display name, email address, or account password.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-900"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <output className="mt-4 block rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-950">
          {successMessage}
        </output>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="account-profile-name"
            className="block text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            Full name
          </label>
          <input
            id="account-profile-name"
            name="name"
            type="text"
            required
            maxLength={255}
            autoComplete="name"
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
          />
          {fieldErrors.name?.[0] ? (
            <p className="mt-1 text-xs font-medium text-rose-700">
              {fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="account-profile-email"
            className="block text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            Email address
          </label>
          <input
            id="account-profile-email"
            name="email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
          />
          {fieldErrors.email?.[0] ? (
            <p className="mt-1 text-xs font-medium text-rose-700">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">
            Change password (optional)
          </legend>

          <div>
            <label
              htmlFor="account-current-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Current password
            </label>
            <input
              id="account-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(event) =>
                onChange("currentPassword", event.target.value)
              }
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            {fieldErrors.currentPassword?.[0] ? (
              <p className="mt-1 text-xs font-medium text-rose-700">
                {fieldErrors.currentPassword[0]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="account-new-password"
                className="block text-xs font-semibold text-slate-700"
              >
                New password
              </label>
              <input
                id="account-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={values.newPassword}
                onChange={(event) =>
                  onChange("newPassword", event.target.value)
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              {fieldErrors.newPassword?.[0] ? (
                <p className="mt-1 text-xs font-medium text-rose-700">
                  {fieldErrors.newPassword[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="account-confirm-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="account-confirm-password"
                name="newPasswordConfirmation"
                type="password"
                autoComplete="new-password"
                value={values.newPasswordConfirmation}
                onChange={(event) =>
                  onChange("newPasswordConfirmation", event.target.value)
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export interface AccountSettingsDialogProps {
  isOpen: boolean;
  user: User;
  onUpdateProfile: (data: UpdateProfileData) => Promise<User>;
  onClose: () => void;
}

export function AccountSettingsDialog({
  isOpen,
  user,
  onUpdateProfile,
  onClose,
}: AccountSettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const [values, setValues] = useState<AccountSettingsFormValues>({
    name: user.name,
    email: user.email,
    currentPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
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

  const handleFieldChange = (
    field: keyof AccountSettingsFormValues,
    value: string,
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await onUpdateProfile(
        buildUpdateProfilePayload(values),
      );
      setValues({
        name: updatedUser.name,
        email: updatedUser.email,
        currentPassword: "",
        newPassword: "",
        newPasswordConfirmation: "",
      });
      setSuccessMessage("Account profile updated.");
    } catch (error) {
      if (error instanceof AuthRequestError) {
        setFieldErrors(error.fieldErrors);
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not update your account profile.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      {...({ closedby: "any" } as Record<string, string>)}
      className="m-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
    >
      <AccountSettingsDialogForm
        titleId={titleId}
        descriptionId={descriptionId}
        values={values}
        fieldErrors={fieldErrors}
        errorMessage={errorMessage}
        successMessage={successMessage}
        isSubmitting={isSubmitting}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        onClose={onClose}
      />
    </dialog>
  );
}
