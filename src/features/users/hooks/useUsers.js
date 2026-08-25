import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../../../api/services/users.api';
import { useUser } from '@clerk/clerk-react';

// ----------------------
// QUERIES
// ----------------------

export const useUserAddresses = (userId) => {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      const data = await usersApi.getUserAddresses(userId);
      return Array.isArray(data.data) ? data.data : [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserDetails = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  return useQuery({
    queryKey: ['userdetails', user?.id],
    queryFn: async () => {
      try {
        const data = await usersApi.getMe();
        return { ...data, isNew: false };
      } catch (err) {
        if (err.response?.status === 404 && user) {
          // User doesn't exist, create them
          const clerkId = user.id;
          const email = user.primaryEmailAddress?.emailAddress;
          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

          const postData = await usersApi.syncUser({ name, email, clerkId });
          return { ...postData, isNew: true };
        }
        throw err;
      }
    },
    enabled: isLoaded && isSignedIn && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// ----------------------
// MUTATIONS
// ----------------------

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateUser,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      if (window.toast) window.window.toast.success("Profile updated successfully");
    },
    onError: (error) => {
      const msg = error.response?.data?.error || error.response?.data?.message || "Failed to update profile";
      if (window.toast) window.window.toast.error(msg);
    }
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.addAddress,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] });
      if (window.toast) window.window.toast.success("Address added successfully");
    },
    onError: (error) => {
      const msg = error.response?.data?.msg || "Failed to add address";
      if (window.toast) window.window.toast.error(msg);
    }
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateAddress,
    onSuccess: (data, variables) => {
      // Invalidate both addresses list and specific address if needed
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      if (window.toast) window.window.toast.success("Address updated successfully");
    },
    onError: (error) => {
      const msg = error.response?.data?.msg || "Failed to update address";
      if (window.toast) window.window.toast.error(msg);
    }
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      if (window.toast) window.window.toast.success("Address deleted successfully");
    },
    onError: (error) => {
      if (window.toast) window.window.toast.error("Failed to delete address");
    }
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.setDefaultAddress,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] });
      if (window.toast) window.window.toast.success("Default address updated");
    },
    onError: (error) => {
      if (window.toast) window.window.toast.error("Failed to set default address");
    }
  });
};
