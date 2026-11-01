import { describe, expect, it } from "vitest";
import { AuthRequestError } from "@/features/auth/application/errors/AuthRequestError";
import type { User } from "@/features/auth/domain/entities/User";
import { createAuthStore, type AuthUseCasePort } from "./authStore";

const sampleUser: User = {
  id: 11,
  name: "Jane Candidate",
  email: "jane@example.com",
  role: "jobseeker",
  createdAt: "2026-10-30T00:00:00.000000Z",
};

function makeFakeUseCases(
  overrides: Partial<AuthUseCasePort> = {},
): AuthUseCasePort {
  return {
    loginUser: { execute: async () => sampleUser },
    registerUser: { execute: async () => sampleUser },
    getCurrentUser: { execute: async () => sampleUser },
    updateProfile: {
      execute: async (data) => ({
        ...sampleUser,
        name: data.name,
        email: data.email,
      }),
    },
    logoutUser: { execute: async () => undefined },
    ...overrides,
  };
}

describe("authStore state management", () => {
  it("hydrates the user via getCurrentUser and deduplicates concurrent loadUser calls", async () => {
    let callCount = 0;
    const store = createAuthStore(
      makeFakeUseCases({
        getCurrentUser: {
          execute: async () => {
            callCount += 1;
            await new Promise((resolve) => setTimeout(resolve, 10));
            return sampleUser;
          },
        },
      }),
    );

    const [first, second] = await Promise.all([
      store.getState().loadUser(),
      store.getState().loadUser(),
    ]);

    expect(callCount).toBe(1);
    expect(first).toEqual(sampleUser);
    expect(second).toEqual(sampleUser);
    expect(store.getState().status).toBe("authenticated");
    expect(store.getState().user).toEqual(sampleUser);
  });

  it("transitions to guest on 401 and unavailable on network error", async () => {
    const unauthorizedStore = createAuthStore(
      makeFakeUseCases({
        getCurrentUser: {
          execute: async () => {
            throw new AuthRequestError("Unauthenticated.", 401);
          },
        },
      }),
    );

    await expect(unauthorizedStore.getState().loadUser()).resolves.toBeNull();
    expect(unauthorizedStore.getState().status).toBe("guest");
    expect(unauthorizedStore.getState().user).toBeNull();

    const offlineStore = createAuthStore(
      makeFakeUseCases({
        getCurrentUser: {
          execute: async () => {
            throw new Error("Network failure");
          },
        },
      }),
    );

    await expect(offlineStore.getState().loadUser()).resolves.toBeNull();
    expect(offlineStore.getState().status).toBe("unavailable");
  });

  it("clears the authenticated user and resets state to guest on logout", async () => {
    let logoutCalled = false;
    const store = createAuthStore(
      makeFakeUseCases({
        logoutUser: {
          execute: async () => {
            logoutCalled = true;
          },
        },
      }),
    );

    await store.getState().login({
      email: "jane@example.com",
      password: "password",
    });
    expect(store.getState().status).toBe("authenticated");

    await store.getState().logout();
    expect(logoutCalled).toBe(true);
    expect(store.getState().status).toBe("guest");
    expect(store.getState().user).toBeNull();
    expect(store.getState().isLoggingOut).toBe(false);
  });

  it("updates the authenticated user profile in store state", async () => {
    const store = createAuthStore(makeFakeUseCases());

    await store.getState().loadUser();
    const updated = await store.getState().updateProfile({
      name: "Jane Updated",
      email: "jane.updated@example.com",
    });

    expect(updated.name).toBe("Jane Updated");
    expect(store.getState().user?.name).toBe("Jane Updated");
    expect(store.getState().user?.email).toBe("jane.updated@example.com");
    expect(store.getState().status).toBe("authenticated");
  });
});
