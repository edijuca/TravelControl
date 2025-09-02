import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, LoginUser, RegisterUser } from "@shared/schema";

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      
      try {
        return await apiRequest("GET", "/api/auth/me", undefined, {
          Authorization: `Bearer ${token}`
        });
      } catch (error: any) {
        if (error.message.includes("401") || error.message.includes("403")) {
          localStorage.removeItem("auth_token");
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser): Promise<AuthResponse> => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer login",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser): Promise<AuthResponse> => {
      return apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["auth", "user"], null);
    queryClient.clear();
    toast({
      title: "Logout",
      description: "Logout realizado com sucesso!",
    });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    register: registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    logout,
  };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const token = localStorage.getItem("auth_token");
      return apiRequest("PUT", "/api/auth/profile", profileData, {
        Authorization: `Bearer ${token}`
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "user"], data);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const token = localStorage.getItem("auth_token");
      return apiRequest("POST", "/api/auth/change-password", passwordData, {
        Authorization: `Bearer ${token}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    },
  });

  return {
    updateProfile: updateProfileMutation.mutate,
    updateProfileLoading: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    changePasswordLoading: changePasswordMutation.isPending,
  };
}