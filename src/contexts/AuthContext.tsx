import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../services/supabase';
import { Agent } from '../types';
import { getDefaultPermissionsForRole } from '../utils/permissions';

function looksLikeBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function verifyPassword(inputPassword: string, storedPassword: string) {
  if (inputPassword === storedPassword) {
    return true;
  }

  if (!looksLikeBcryptHash(storedPassword)) {
    return false;
  }

  try {
    return await bcrypt.compare(inputPassword, storedPassword);
  } catch (error) {
    console.error('Erreur lors de la verification du hash du mot de passe:', error);
    return false;
  }
}

interface AuthContextType {
  agent: Agent | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialiser l'agent à partir du localStorage au montage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Charger depuis localStorage
        const storedAgent = localStorage.getItem('auth_agent');
        if (storedAgent) {
          const parsedAgent = JSON.parse(storedAgent);
          setAgent(parsedAgent);
          console.log('✓ Agent restauré depuis localStorage:', parsedAgent.nom);
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement de la session:', err);
        localStorage.removeItem('auth_agent');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sauvegarder agent dans localStorage chaque fois qu'il change
  useEffect(() => {
    if (agent) {
      localStorage.setItem('auth_agent', JSON.stringify(agent));
    }
  }, [agent]);

  // Authentification avec email et vérification du mot de passe
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('agents')
        .select('id, nom, email, role, region, permission, created_at, created_by, password')
        .ilike('email', email.trim())
        .single();

      if (dbError || !data) {
        setError('Email non trouvé dans le système');
        return;
      }

      // Vérifier le mot de passe
      if (!password) {
        setError('Le mot de passe est requis');
        return;
      }

      const storedPassword = data.password;

      if (!storedPassword) {
        setError('Mot de passe non configuré pour cet agent');
        return;
      }

      // Accepte le texte brut actuel et reste compatible si des mots de passe sont hashés plus tard.
      const isPasswordValid = await verifyPassword(password, storedPassword);

      if (!isPasswordValid) {
        setError('Mot de passe incorrect');
        return;
      }

      const resolvedPermissions = data.permission || JSON.stringify(getDefaultPermissionsForRole(data.role) || {});

      // Email et mot de passe corrects - enregistrer l'agent
      const agentData: Agent = {
        id: data.id,
        nom: data.nom,
        email: data.email,
        role: data.role,
        region: data.region,
        password: storedPassword,
        permission: resolvedPermissions,
        created_at: data.created_at,
        created_by: data.created_by,
      };

      setAgent(agentData);
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  // Déconnexion
  const signOut = useCallback(async () => {
    setAgent(null);
    localStorage.removeItem('auth_agent');
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ agent, loading, signInWithEmail, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
