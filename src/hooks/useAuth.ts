import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  full_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        username_input: username,
        password_input: password
      });

      if (error) throw error;
      
      if (!data) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data)
        .single();

      if (userError) throw userError;
      
      setUser(userData);
      localStorage.setItem('currentUserId', data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUserId');
  };

  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('currentUserId');
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        localStorage.removeItem('currentUserId');
        setUser(null);
      } else {
        setUser(data);
      }
    } catch (error) {
      localStorage.removeItem('currentUserId');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };
};