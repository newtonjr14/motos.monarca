import {
  alterarSenha as apiAlterarSenha,
  editarPerfil as apiEditarPerfil,
  login as apiLogin,
  logout as apiLogout,
  perfil as apiPerfil,
  type IdiomaUsuario,
  type PerfilAutenticado,
  type PerfilUsuario,
} from "@/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearAuthTokens, getAccessToken, loadStoredTokens, setAuthTokens, setUnauthorizedHandler } from "./tokens";

type AuthContextValue = {
  user: PerfilAutenticado | null;
  loading: boolean;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  alterarSenha: (senhaAtual: string, senhaNova: string) => Promise<void>;
  editarPerfil: (nome: string, idioma: IdiomaUsuario) => Promise<void>;
  hasPermission: (codigo: string) => boolean;
  perfilLabel: (perfil: PerfilUsuario) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PerfilAutenticado | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    clearAuthTokens();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await apiPerfil();
    setUser(profile);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthTokens();
      setUser(null);
    });
    loadStoredTokens();
    void (async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        await refreshProfile();
      } catch {
        clearAuthTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const login = useCallback(async (loginValue: string, senha: string) => {
    const tokens = await apiLogin(loginValue, senha);
    setAuthTokens(tokens.accessToken, tokens.refreshToken);
    await refreshProfile();
  }, [refreshProfile]);

  const alterarSenha = useCallback(async (senhaAtual: string, senhaNova: string) => {
    await apiAlterarSenha(senhaAtual, senhaNova);
    await logout();
  }, [logout]);

  const editarPerfil = useCallback(async (nome: string, idioma: IdiomaUsuario) => {
    const updated = await apiEditarPerfil(nome, idioma);
    setUser(updated);
  }, []);

  const hasPermission = useCallback(
    (codigo: string) => user?.permissoes.includes(codigo) ?? false,
    [user],
  );

  const perfilLabel = useCallback((perfil: PerfilUsuario) => {
    const map: Record<PerfilUsuario, string> = {
      administrador: "Administrador",
      gestor: "Gestor",
      operador: "Operador",
      vendedor: "Vendedor",
    };
    return map[perfil] ?? perfil;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshProfile,
      alterarSenha,
      editarPerfil,
      hasPermission,
      perfilLabel,
    }),
    [user, loading, login, logout, refreshProfile, alterarSenha, editarPerfil, hasPermission, perfilLabel],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
