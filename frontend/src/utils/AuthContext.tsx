import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '../graphql/queries';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  storageUsed: number;
  storageQuota: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  
  const { data, loading, error } = useQuery(ME_QUERY, {
    skip: !token,
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    } else if (error && token) {
      // Token is invalid, logout
      logout();
    }
  }, [data, error, token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isLoading: loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};