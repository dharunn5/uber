import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { get } from '../utils/api';

export interface UserModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: 'rider' | 'driver';
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    updatedAt?: string;
  } | null;
}

interface UserContextValue {
  user: UserModel | null;
  isLoading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    setIsLoading(true);
    try {
      const me = await get<UserModel>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(me);
    } catch (_) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo<UserContextValue>(() => ({ user, isLoading, refresh: load }), [user, isLoading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}


