import { createContext, useContext, useEffect, useState } from 'react';
import { identityGraphQLService } from '../api/identityGraphQLService';

const UserContext = createContext(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};

const STORAGE_USER = 'user';
const STORAGE_TOKEN = 'token';

const roleToPath = (role) => {
  const map = { ADMIN: 'admin', QUOTER: 'cotizador', SALES: 'comercial', DESIGNER: 'disenador' };
  return map[role] || null;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const savedUser = localStorage.getItem(STORAGE_USER);
        const savedToken = localStorage.getItem(STORAGE_TOKEN);
        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setToken(savedToken);
          setRole(roleToPath(parsed.role));
        }
      } catch (e) {
        console.error('UserProvider load', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const signIn = async (input) => {
    const { data } = await identityGraphQLService.auth.signIn(input);
    const { user: u, token: t } = data;
    localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    localStorage.setItem(STORAGE_TOKEN, t);
    setUser(u);
    setToken(t);
    setRole(roleToPath(u.role));
    return u;
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    setUser(null);
    setToken(null);
    setRole(null);
  };

  const getToken = () => localStorage.getItem(STORAGE_TOKEN);

  return (
    <UserContext.Provider value={{ user, token, role, signIn, signOut, getToken, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
