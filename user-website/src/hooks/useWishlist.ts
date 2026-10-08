/**
 * useWishlist – shared hook for wishlist toggle logic.
 *
 * Fetches the current wishlist from the server (once, cached by React Query),
 * exposes a Set of wishlisted product IDs, and provides a `toggle` function
 * that optimistically updates the cache so every ProductCard across all pages
 * stays in sync without an extra network round-trip.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { wishlistApi, type WishlistItem } from '../api/services';
import { useAuth } from '../context/AuthContext';

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlist items (only when logged in)
  const { data: items = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.get,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set of product IDs that are currently wishlisted
  const wishlistedIds = new Set(items.map((i) => i.product_id));

  /**
   * Toggle the wishlist state for a product.
   * Uses optimistic update so the UI flips instantly.
   */
  const toggle = async (productId: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save items');
      return;
    }

    const isCurrentlyWishlisted = wishlistedIds.has(productId);

    // ── Optimistic update ──────────────────────────────────────────────────
    queryClient.setQueryData<WishlistItem[]>(['wishlist'], (old = []) =>
      isCurrentlyWishlisted
        ? old.filter((i) => i.product_id !== productId)
        : [
            ...old,
            {
              wishlist_item_id: Date.now(), // temporary id
              product_id: productId,
              name: '',
              metal_type: '',
              purity: null,
              primary_image_url: null,
              price: null,
              in_stock: true,
            },
          ]
    );

    try {
      if (isCurrentlyWishlisted) {
        await wishlistApi.remove(productId);
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(productId);
        toast.success('Added to wishlist');
      }
      // Refresh to get accurate data from server (e.g. full product details)
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.error('Could not update wishlist');
    }
  };

  return { wishlistedIds, toggle };
}
