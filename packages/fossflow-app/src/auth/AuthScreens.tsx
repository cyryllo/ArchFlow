// Screens before the editor: create the administrator, log in, change a
// temporary password.
import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi, type User } from './authApi';

const AuthCard = ({ title, intro, children, overlay }: { title: string; intro?: string; children: ReactNode; overlay?: boolean }) => {
  return (
    <div className={overlay ? 'auth-page auth-overlay' : 'auth-page'}>
      <div className="auth-card" role="dialog" aria-label={title}>
        <div className="auth-brand">ArchFlow</div>
        <h1>{title}</h1>
        {intro && <p className="auth-intro">{intro}</p>}
        {children}
      </div>
    </div>
  );
};

// Runs a form action, showing the server's message when it fails
const useSubmit = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
};

export const LoginScreen = ({
  onDone,
  onCancel,
  overlay
}: {
  onDone: (user: User) => void;
  onCancel?: () => void;
  overlay?: boolean;
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useSubmit();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      onDone((await authApi.login(email, password)).user);
    });
  };
  return (
    <AuthCard title={t('auth.loginTitle')} intro={overlay && !onCancel ? t('auth.sessionExpired') : undefined} overlay={overlay}>
      <form onSubmit={submit} className="auth-form">
        <label>
          {t('auth.email')}
          <input type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t('auth.password')}
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-primary" disabled={busy}>
          {t('auth.loginButton')}
        </button>
        {onCancel && (
          <button type="button" className="auth-secondary" onClick={onCancel}>
            {t('auth.continueAsGuest')}
          </button>
        )}
      </form>
      <p className="auth-hint">{t('auth.forgotHint')}</p>
    </AuthCard>
  );
};

export const SetupScreen = ({ onDone }: { onDone: (user: User) => void }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const { busy, error, setError, run } = useSubmit();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== repeat) return setError(t('auth.passwordsDiffer'));
    void run(async () => {
      onDone((await authApi.setup(email, name, password)).user);
    });
  };
  return (
    <AuthCard title={t('auth.setupTitle')} intro={t('auth.setupIntro')}>
      <form onSubmit={submit} className="auth-form">
        <label>
          {t('auth.email')}
          <input type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t('auth.name')}
          <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {t('auth.newPassword')}
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          {t('auth.repeatPassword')}
          <input type="password" autoComplete="new-password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-primary" disabled={busy}>
          {t('auth.setupButton')}
        </button>
      </form>
    </AuthCard>
  );
};

// Shared by the forced change (temporary password) and the account dialog
export const PasswordForm = ({ onDone, submitLabel }: { onDone: (user: User) => void; submitLabel: string }) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const { busy, error, setError, run } = useSubmit();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== repeat) return setError(t('auth.passwordsDiffer'));
    void run(async () => {
      onDone((await authApi.changePassword(current, password)).user);
      setCurrent('');
      setPassword('');
      setRepeat('');
    });
  };
  return (
    <form onSubmit={submit} className="auth-form">
      <label>
        {t('auth.currentPassword')}
        <input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label>
        {t('auth.newPassword')}
        <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        {t('auth.repeatPassword')}
        <input type="password" autoComplete="new-password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <button type="submit" className="auth-primary" disabled={busy}>
        {submitLabel}
      </button>
    </form>
  );
};

export const ForcedPasswordScreen = ({ user, onDone }: { user: User; onDone: (user: User) => void }) => {
  const { t } = useTranslation();
  return (
    <AuthCard title={t('auth.changePasswordTitle')} intro={t('auth.mustChangeIntro', { email: user.email })}>
      <PasswordForm onDone={onDone} submitLabel={t('auth.changePasswordButton')} />
    </AuthCard>
  );
};
