import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartApi from '../../../api/services/cart.api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useUserDetails } from '../../users/hooks/useUsers';

export const LS_CART_KEY = "guestCart";
export const LS_BUY_NOW_KEY = "buyNowItem";
export const LS_SAVED_KEY = "guestSavedItems";

const readLS = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : (key === LS_BUY_NOW_KEY ? null : []);
  } catch (err) {
    return key === LS_BUY_NOW_KEY ? null : [];
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
export const useCart = () => {
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;
  const isGuest = !isSignedIn;

  return useQuery({
    queryKey: ['cart', user?.id || 'guest'],
    queryFn: () => {
      if (isGuest) {
        return readLS(LS_CART_KEY);
      }
      return cartApi.getCart(dbUserId);
    },
    enabled: isGuest || !!dbUserId,
    staleTime: 60 * 1000,
  });
};

export const useSavedItems = () => {
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;
  const isGuest = !isSignedIn;

  return useQuery({
    queryKey: ['savedItems', user?.id || 'guest'],
    queryFn: () => {
      if (isGuest) {
        return readLS(LS_SAVED_KEY);
      }
      return cartApi.getSavedItems(dbUserId);
    },
    enabled: isGuest || !!dbUserId,
    staleTime: 60 * 1000,
  });
};

export const usePricePreview = (requestBody) => {
  return useQuery({
    queryKey: ['pricePreview', requestBody],
    queryFn: () => cartApi.getPricePreview(requestBody),
    enabled: !!requestBody && requestBody.cartItems?.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
};


// ----------------------
// MUTATIONS
// ----------------------
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();

  return useMutation({
    mutationFn: async ({ product, variant, quantity }) => {
      const qtyToAdd = Number(quantity || 1);
      
      if (!isSignedIn) {
        const guestCart = readLS(LS_CART_KEY) || [];
        const existing = guestCart.find((i) => i.variant.id === variant.id);
        let newCart;
        if (existing) {
          newCart = guestCart.map((item) =>
            item.variant.id === variant.id ? { ...item, quantity: item.quantity + qtyToAdd } : item
          );
        } else {
          newCart = [...guestCart, { product, variant, quantity: qtyToAdd }];
        }
        writeLS(LS_CART_KEY, newCart);
        return newCart; // Returning new state simulates success
      }
      
      return cartApi.addToCart({ productId: product.id, variantId: variant.id, quantity: qtyToAdd });
    },
    onSuccess: (_, { product, variant }) => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'guest'] });
      if (window.toast) window.window.toast.success(`${product.name} (${variant.name || variant.size}) added to cart.`);
    },
    onError: () => {
      if (window.toast) window.window.toast.error(`Failed to add item to cart.`);
    }
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async ({ variant, quantity }) => {
      if (!isSignedIn) {
        const guestCart = readLS(LS_CART_KEY) || [];
        const newCart = guestCart.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity } : item
        );
        writeLS(LS_CART_KEY, newCart);
        return newCart;
      }
      return cartApi.updateCartQuantity({ userId: dbUserId, variantId: variant.id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'guest'] });
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Failed to update quantity.");
    }
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async (variant) => {
      if (!isSignedIn) {
        const guestCart = readLS(LS_CART_KEY) || [];
        const newCart = guestCart.filter((item) => item.variant.id !== variant.id);
        writeLS(LS_CART_KEY, newCart);
        return newCart;
      }
      return cartApi.removeFromCart({ userId: dbUserId, variantId: variant.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'guest'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        writeLS(LS_CART_KEY, []);
        return [];
      }
      return cartApi.clearCart(dbUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'guest'] });
    },
  });
};

// --- Custom Bundle ---
export const useAddCustomBundle = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();

  return useMutation({
    mutationFn: async ({ templateVariantId, contentVariantIds }) => {
      if (!isSignedIn) throw new Error("Please log in to build a bundle.");
      return cartApi.addCustomBundle({ templateVariantId, contentVariantIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      if (window.toast) window.window.toast.success("Custom bundle added to cart!");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.message || "Failed to add bundle to cart.");
    }
  });
};

// --- Saved For Later ---
export const useSaveForLater = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();

  return useMutation({
    mutationFn: async (item) => {
      if (!isSignedIn) {
        const savedItems = readLS(LS_SAVED_KEY) || [];
        const existing = savedItems.find(i => i.variant.id === (item.variant?.id || item.variantId));
        if (!existing) writeLS(LS_SAVED_KEY, [...savedItems, item]);
        
        const guestCart = readLS(LS_CART_KEY) || [];
        writeLS(LS_CART_KEY, guestCart.filter(i => i.variant.id !== (item.variant?.id || item.variantId)));
        return;
      }
      return cartApi.saveForLater({ variantId: item.variant?.id || item.variantId, quantity: item.quantity });
    },
    onMutate: async (item) => {
      const cartKey = ['cart', user?.id || 'guest'];
      const savedKey = ['savedItems', user?.id || 'guest'];
      await queryClient.cancelQueries({ queryKey: cartKey });
      await queryClient.cancelQueries({ queryKey: savedKey });
      
      const prevCart = queryClient.getQueryData(cartKey);
      const prevSaved = queryClient.getQueryData(savedKey);
      
      queryClient.setQueryData(cartKey, old => (old || []).filter(i => (i.variant?.id || i.variantId) !== (item.variant?.id || item.variantId)));
      queryClient.setQueryData(savedKey, old => {
        const existing = (old || []).find(i => (i.variant?.id || i.variantId) === (item.variant?.id || item.variantId));
        if (existing) return old.map(i => (i.variant?.id || i.variantId) === (item.variant?.id || item.variantId) ? { ...i, quantity: i.quantity + (item.quantity||1) } : i);
        return [...(old || []), item];
      });
      return { prevCart, prevSaved, cartKey, savedKey };
    },
    onError: (err, item, context) => {
      if (context?.prevCart) queryClient.setQueryData(context.cartKey, context.prevCart);
      if (context?.prevSaved) queryClient.setQueryData(context.savedKey, context.prevSaved);
      if (window.toast) window.window.toast.error("Failed to save for later");
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context.cartKey });
      queryClient.invalidateQueries({ queryKey: context.savedKey });
    },
    onSuccess: () => {
      if (window.toast) window.window.toast.success("Saved for later");
    }
  });
};

export const useMoveSavedToCart = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();

  return useMutation({
    mutationFn: async (item) => {
      if (!isSignedIn) {
        const guestCart = readLS(LS_CART_KEY) || [];
        const existing = guestCart.find(i => i.variant.id === (item.variant?.id || item.variantId));
        if (existing) {
          writeLS(LS_CART_KEY, guestCart.map(i => i.variant.id === (item.variant?.id || item.variantId) ? { ...i, quantity: i.quantity + (item.quantity||1) } : i));
        } else {
          writeLS(LS_CART_KEY, [...guestCart, { ...item, quantity: item.quantity||1 }]);
        }
        
        const savedItems = readLS(LS_SAVED_KEY) || [];
        writeLS(LS_SAVED_KEY, savedItems.filter(i => i.variant.id !== (item.variant?.id || item.variantId)));
        return;
      }
      return cartApi.moveSavedToCart({ variantId: item.variant?.id || item.variantId, quantity: item.quantity });
    },
    onMutate: async (item) => {
      const cartKey = ['cart', user?.id || 'guest'];
      const savedKey = ['savedItems', user?.id || 'guest'];
      await queryClient.cancelQueries({ queryKey: cartKey });
      await queryClient.cancelQueries({ queryKey: savedKey });
      
      const prevCart = queryClient.getQueryData(cartKey);
      const prevSaved = queryClient.getQueryData(savedKey);
      
      queryClient.setQueryData(savedKey, old => (old || []).filter(i => (i.variant?.id || i.variantId) !== (item.variant?.id || item.variantId)));
      queryClient.setQueryData(cartKey, old => {
        const existing = (old || []).find(i => (i.variant?.id || i.variantId) === (item.variant?.id || item.variantId));
        if (existing) return old.map(i => (i.variant?.id || i.variantId) === (item.variant?.id || item.variantId) ? { ...i, quantity: i.quantity + (item.quantity||1) } : i);
        return [...(old || []), item];
      });
      return { prevCart, prevSaved, cartKey, savedKey };
    },
    onError: (err, item, context) => {
      if (context?.prevCart) queryClient.setQueryData(context.cartKey, context.prevCart);
      if (context?.prevSaved) queryClient.setQueryData(context.savedKey, context.prevSaved);
      if (window.toast) window.window.toast.error("Failed to move to cart");
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context.cartKey });
      queryClient.invalidateQueries({ queryKey: context.savedKey });
    },
    onSuccess: () => {
      if (window.toast) window.window.toast.success("Moved back to cart");
    }
  });
};

export const useRemoveSavedItem = () => {
  const queryClient = useQueryClient();
  const { isSignedIn, user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;

  return useMutation({
    mutationFn: async (variantId) => {
      if (!isSignedIn) {
        const savedItems = readLS(LS_SAVED_KEY) || [];
        writeLS(LS_SAVED_KEY, savedItems.filter(i => (i.variant?.id || i.variantId) !== variantId));
        return;
      }
      return cartApi.removeSavedItem({ userId: dbUserId, variantId });
    },
    onMutate: async (variantId) => {
      const savedKey = ['savedItems', user?.id || 'guest'];
      await queryClient.cancelQueries({ queryKey: savedKey });
      const prevSaved = queryClient.getQueryData(savedKey);
      queryClient.setQueryData(savedKey, old => (old || []).filter(i => (i.variant?.id || i.variantId) !== variantId));
      return { prevSaved, savedKey };
    },
    onError: (err, variantId, context) => {
      if (context?.prevSaved) queryClient.setQueryData(context.savedKey, context.prevSaved);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context.savedKey });
    }
  });
};
