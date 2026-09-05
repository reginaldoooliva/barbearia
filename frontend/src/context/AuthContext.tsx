import React, { createContext, useContext, useState } from 'react';
import { setItemAsync, deleteItemAsync } from '../services/storage';
import { api } from '../services/api';

type Papel = 'CLIENTE' | 'PROPRIETARIO';

interface AuthContextType {
  papel: Papel | null;
  logando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [papel, setPapel] = useState<Papel | null>(null);
  const [logando, setLogando] = useState(false);

  async function login(email: string, senha: string) {
    setLogando(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      await setItemAsync('token', data.access_token);
      setPapel(data.papel);
    } finally {
      setLogando(false);
    }
  }

  async function register(nome: string, email: string, senha: string) {
    setLogando(true);
    try {
      const { data } = await api.post('/auth/register', { nome, email, senha, papel: 'CLIENTE' });
      await setItemAsync('token', data.access_token);
      setPapel(data.papel);
    } finally {
      setLogando(false);
    }
  }

  async function logout() {
    await deleteItemAsync('token');
    setPapel(null);
  }

  return (
    <AuthContext.Provider value={{ papel, logando, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
