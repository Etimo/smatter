import { create } from "zustand";

type User = {
  id: string;
  username: string;
  email: string;
};

type UserState = {
  setUser: (user: User | null) => void;
  user: User | null;
};

export const useUserStore = create<UserState>()((set) => ({
  setUser: (user: User | null) => set({ user }),
  user: null,
}));
