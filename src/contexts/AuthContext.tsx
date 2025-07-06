import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'faculty' | 'admin'
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSessionAndListen() {
      // Get initial session (updated to Supabase v2)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setLoading(false);
      }

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }

    getSessionAndListen();
  }, []);

  const loadProfile = async (user: User) => {
    try {
      // Try to get profile from 'users' table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(
          'id, email, role, full_name, department, academic_year, student_id, created_at'
        )
        .eq('id', user.id)
        .single();

      if (userProfile && !profileError) {
        setProfile(userProfile);
      } else {
        // If profile not found, create from user metadata
        const role = user.user_metadata?.role || 'student';
        const fullName = user.user_metadata?.full_name || '';
        const validRole = ['faculty', 'student', 'admin'].includes(role)
          ? (role as 'faculty' | 'student' | 'admin')
          : 'student';

        const profileData: UserProfile = {
          id: user.id,
          email: user.email!,
          role: validRole,
          full_name: fullName,
          created_at: new Date().toISOString(),
        };

        // Insert into users table
        const { data: insertedProfile, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email!,
              role: validRole,
              full_name: fullName,
            },
          ])
          .select()
          .single();

        if (!insertError && insertedProfile) {
          setProfile(insertedProfile);
        } else {
          setProfile(profileData);
        }
      }
    } catch (error) {
      // On error fallback to metadata profile
      const role = user.user_metadata?.role || 'student';
      const validRole = ['faculty', 'student', 'admin'].includes(role)
        ? (role as 'faculty' | 'student' | 'admin')
        : 'student';

      const profileData: UserProfile = {
        id: user.id,
        email: user.email!,
        role: validRole,
        full_name: user.user_metadata?.full_name || '',
        created_at: new Date().toISOString(),
      };
      setProfile(profileData);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        // Profile loads via auth state listener
        return { error: null };
      }

      return { error: new Error('Unknown sign in error') };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'faculty' | 'admin'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        try {
          const { error: insertError } = await supabase.from('users').insert([
            {
              id: data.user.id,
              email,
              role,
              full_name: fullName,
            },
          ]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
          }
        } catch (insertError) {
          console.error('Error creating user profile:', insertError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error: dbError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      const { error: authError } = await supabase.auth.updateUser({
        data: updates,
      });

      const error = dbError || authError;

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
