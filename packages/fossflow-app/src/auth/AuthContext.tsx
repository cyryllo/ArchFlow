// Who is using ArchFlow, and the screens before the editor: creating the
// administrator, logging in, a forced password change. Without logins
// (no server, desktop app, AUTH_MODE=none) it lets everything through.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { storageManager, UNAUTHORIZED_EVENT, type AuthStatus } from '../services/storageService';
import { authApi, type User } from './authApi';
import { ForcedPasswordScreen, LoginScreen, SetupScreen } from './AuthScreens';
import './auth.css';

export interface AuthInfo {
  // 'none' = no logins: everyone may do everything
  mode: 'none' | 'local';
  user: User | null;
  // Public access without logging in: design, but save only in the browser
  guest: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  showLogin: () => void;
  updateUser: (user: User) => void;
}

const noLogins: AuthInfo = {
  mode: 'none',
  user: null,
  guest: false,
  canEdit: true,
  isAdmin: false,
  logout: async () => {},
  showLogin: () => {},
  updateUser: () => {}
};

const AuthContext = createContext<AuthInfo>(noLogins);

export const useAuth = () => {
  return useContext(AuthContext);
};

type Screen = 'loading' | 'setup' | 'login' | 'password' | 'app';

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<Screen>('loading');
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  // The session expired while working: log in again over the editor
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      // A share link (/view/<token>) opens read-only for anyone, logged in or not
      if (window.location.pathname.includes('/view/')) {
        storageManager.setGuest(true);
        return setScreen('app');
      }
      const s = await storageManager.serverAuthStatus();
      if (cancelled) return;
      setStatus(s);
      if (!s || s.mode !== 'local') return setScreen('app');
      try {
        const { user: me } = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setScreen(me.mustChangePassword ? 'password' : 'app');
      } catch {
        if (cancelled) return;
        if (s.setupRequired) return setScreen('setup');
        if (s.publicAccess) {
          storageManager.setGuest(true);
          setGuest(true);
          return setScreen('app');
        }
        setScreen('login');
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      if (screen === 'app' && !guest && status?.mode === 'local') setOverlay(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [screen, guest, status]);

  const loggedIn = useCallback(
    (me: User) => {
      setUser(me);
      setOverlay(false);
      if (guest) {
        // A guest who logs in switches from browser storage to the server
        window.location.reload();
        return;
      }
      setScreen(me.mustChangePassword ? 'password' : 'app');
    },
    [guest]
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    window.location.reload();
  }, []);

  const showLogin = useCallback(() => {
    setOverlay(true);
  }, []);

  if (screen === 'loading') return <div className="auth-page" />;
  if (screen === 'setup') return <SetupScreen onDone={loggedIn} />;
  if (screen === 'login') return <LoginScreen onDone={loggedIn} />;
  if (screen === 'password' && user) {
    return (
      <ForcedPasswordScreen
        user={user}
        onDone={(me) => {
          setUser(me);
          setScreen('app');
        }}
      />
    );
  }

  const info: AuthInfo =
    status?.mode === 'local'
      ? {
          mode: 'local',
          user,
          guest,
          // Guests design freely (saving only in the browser); viewers only look
          canEdit: guest || (!!user && user.role !== 'viewer'),
          isAdmin: user?.role === 'admin',
          logout,
          showLogin,
          updateUser: setUser
        }
      : noLogins;

  return (
    <AuthContext.Provider value={info}>
      {children}
      {overlay && (
        <LoginScreen
          overlay
          onDone={loggedIn}
          onCancel={
            guest
              ? () => {
                  setOverlay(false);
                }
              : undefined
          }
        />
      )}
    </AuthContext.Provider>
  );
};
