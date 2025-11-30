import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createConsentSlice } from "./consent-store";

const SKIP_PERSIST_KEYS = [];

// Combine all slices into one store
export const useStore = create(
  persist(
    (...args) => ({
      ...createConsentSlice(...args),
    }),
    {
      name: "pipeweave-persist",
      version: parseInt(process.env.NEXT_PUBLIC_STORE_VERSION || "1"),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        // File store
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !SKIP_PERSIST_KEYS.includes(key)
          )
        ),
    }
  )
);

// Legacy exports for backwards compatibility

export const useConsentStore = useStore;
