/**
 * Zustand store for cart and wishlist state.
 * Syncs counts from the server after mutations.
 */
import { create } from 'zustand';

interface CartStore {
  itemCount: number;
  wishlistCount: number;
  setCartCount: (n: number) => void;
  setWishlistCount: (n: number) => void;
  incrementCart: () => void;
  decrementCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  itemCount: 0,
  wishlistCount: 0,
  setCartCount: (n) => set({ itemCount: n }),
  setWishlistCount: (n) => set({ wishlistCount: n }),
  incrementCart: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrementCart: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
}));
