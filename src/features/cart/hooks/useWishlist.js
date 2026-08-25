import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as wishlistApi from '../../../api/services/wishlist.api';
import * as cartApi from '../../../api/services/cart.api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useUserDetails } from '../../users/hooks/useUsers';

const LS_WISHLIST_KEY = "guestWishlist";

const readLS = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState ? JSON.parse(serializedState) : [];
  } catch (err) {
    return [];
  }
};

const writeLS = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {}
};

// ----------------------
// QUERIES
// ----------------------
export const useWishlist = () => {
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;
  const isGuest = !isSignedIn;

  return useQuery({
    queryKey: ['wishlist', user?.id || 'guest'],
    queryFn: () => {
      if (isGuest) {
        return readLS(LS_WISHLIST_KEY);
      }
      return wishlistApi.getWishlist(dbUserId);
    },
    enabled: isGuest || !!dbUserId,
    staleTime: 60 * 1000,
  });
};

// ----------------------
// MUTATIONS
// ----------------------
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();

  return useMutation({
    mutationFn: async ({ product, variant }) => {
      if (!isSignedIn) {
        const guestWishlist = readLS(LS_WISHLIST_KEY) || [];
        const existing = guestWishlist.some((item) => (item.variantId ?? item.variant?.id) === variant.id);
        if (existing) return guestWishlist;
        
        const newWishlist = [...guestWishlist, { product, variant, variantId: variant.id }];
        writeLS(LS_WISHLIST_KEY, newWishlist);
        return newWishlist;
      }
      
      return wishlistApi.addToWishlist({ productId: product.id, variantId: variant.id });
    },
    onSuccess: (_, { product, variant }) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id || 'guest'] });
      if (window.toast) window.window.toast.success(`${product.name} (${variant.name || variant.size}) added to wishlist.`);
    }
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async (variant) => {
      if (!isSignedIn) {
        const guestWishlist = readLS(LS_WISHLIST_KEY) || [];
        const newWishlist = guestWishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        return newWishlist;
      }
      return wishlistApi.removeFromWishlist({ userId: dbUserId, variantId: variant.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id || 'guest'] });
      if (window.toast) window.window.toast.info(`Item removed from wishlist.`);
    },
  });
};

export const useClearWishlist = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        writeLS(LS_WISHLIST_KEY, []);
        return [];
      }
      return wishlistApi.clearWishlist(dbUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id || 'guest'] });
      if (window.toast) window.window.toast.info("Wishlist cleared.");
    },
  });
};

export const useToggleWishlist = () => {
  const { data: wishlist = [] } = useWishlist();
  const { mutateAsync: addToWishlist } = useAddToWishlist();
  const { mutateAsync: removeFromWishlist } = useRemoveFromWishlist();

  return useMutation({
    mutationFn: async ({ product, variant }) => {
      const isAlreadyInWishlist = wishlist?.some(
        (item) => (item.variantId ?? item.variant?.id) === variant.id
      );

      if (isAlreadyInWishlist) {
        await removeFromWishlist(variant);
      } else {
        await addToWishlist({ product, variant });
      }
    }
  });
};

export const useMoveFromWishlistToCart = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async ({ product, variant }) => {
      // 1. Add to cart
      if (!isSignedIn) {
        const guestCart = readLS("guestCart") || [];
        const existing = guestCart.find((i) => i.variant.id === variant.id);
        let newCart;
        if (existing) {
          newCart = guestCart.map((item) =>
            item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          newCart = [...guestCart, { product, variant, quantity: 1 }];
        }
        writeLS("guestCart", newCart);

        // 2. Remove from wishlist
        const guestWishlist = readLS(LS_WISHLIST_KEY) || [];
        const newWishlist = guestWishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        
        return { cart: newCart, wishlist: newWishlist };
      }
      
      await cartApi.addToCart({ productId: product.id, variantId: variant.id, quantity: 1 });
      await wishlistApi.removeFromWishlist({ userId: dbUserId, variantId: variant.id });
      return true;
    },
    onSuccess: (_, { product, variant }) => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id || 'guest'] });
      if (window.toast) window.window.toast.success(`${product.name} (${variant.name || variant.size}) moved to cart.`);
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Failed to move item to cart.");
    }
  });
};
