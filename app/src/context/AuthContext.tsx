// ==========================================================================
// Contexto de autenticação.
//   • Consulta /auth/config para saber se o login é exigido pelo servidor.
//   • Mantém o usuário logado (token no localStorage via lib/api).
//   • Reage ao evento "sopsi:unauthorized" (resposta 401) deslogando.
// ==========================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import apiClient, { getToken, setToken } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  /** Carregamento inicial (config + validação do token). */
  ready: boolean;
  /** O servidor exige autenticação? */
  authRequired: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Bootstrap: descobre se há auth e valida o token existente.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cfg = await apiClient.auth.config();
        if (!alive) return;
        setAuthRequired(cfg.authRequired);
        if (cfg.authRequired && getToken()) {
          try {
            const me = await apiClient.auth.me();
            if (alive) setUser(me.user);
          } catch {
            if (alive) setToken(null);
          }
        }
      } catch {
        /* sem backend: segue como não autenticado */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Resposta 401 em qualquer chamada → desloga.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("sopsi:unauthorized", handler);
    return () => window.removeEventListener("sopsi:unauthorized", handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.auth.login(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ready, authRequired, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
