// The administrator's panel: users, settings (public access, API access for
// everyone) and all API tokens.
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { adminApi, type AdminSettings, type ApiToken, type Role, type User } from './authApi';
import { SecretBox, formatDate } from './AccountDialog';

const ROLES: Role[] = ['admin', 'editor', 'viewer'];

const UsersTab = () => {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [apiAccess, setApiAccess] = useState(false);

  const load = () => {
    adminApi
      .users()
      .then(setUsers)
      .catch((e: Error) => {
        setError(e.message);
      });
  };
  useEffect(load, []);

  // Runs a change and reloads the list; the server's message on failure
  const act = (p: Promise<unknown>) => {
    setError('');
    p.then(load).catch((e: Error) => {
      setError(e.message);
    });
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    adminApi
      .addUser(email, name, role, apiAccess)
      .then((r) => {
        setSecret({ email: r.user.email, password: r.temporaryPassword });
        setEmail('');
        setName('');
        load();
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  };

  return (
    <>
      <form className="auth-inline-form" onSubmit={add}>
        <input type="email" placeholder={t('auth.email')} required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label={t('admin.role')}>
          {ROLES.map((r) => {
            return (
              <option key={r} value={r}>
                {t(`auth.role.${r}`)}
              </option>
            );
          })}
        </select>
        <label className="auth-check">
          <input type="checkbox" checked={apiAccess} onChange={(e) => setApiAccess(e.target.checked)} />
          {t('admin.apiAccess')}
        </label>
        <button type="submit" className="auth-primary">
          {t('admin.addUser')}
        </button>
      </form>
      {error && <div className="auth-error">{error}</div>}
      {secret && (
        <SecretBox
          title={t('admin.temporaryPassword', { email: secret.email })}
          secret={secret.password}
          hint={t('admin.temporaryPasswordHint')}
        />
      )}
      <table className="auth-table">
        <thead>
          <tr>
            <th>{t('admin.user')}</th>
            <th>{t('admin.role')}</th>
            <th>{t('admin.apiAccess')}</th>
            <th>{t('admin.lastLogin')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const self = u.id === me?.id;
            return (
              <tr key={u.id} className={u.disabled ? 'auth-disabled' : undefined}>
                <td>
                  {u.email}
                  <div className="auth-muted">
                    {u.name}
                    {u.disabled ? ` · ${t('admin.disabled')}` : ''}
                  </div>
                </td>
                <td>
                  <select
                    value={u.role}
                    disabled={self}
                    aria-label={t('admin.role')}
                    onChange={(e) => act(adminApi.updateUser(u.id, { role: e.target.value as Role }))}
                  >
                    {ROLES.map((r) => {
                      return (
                        <option key={r} value={r}>
                          {t(`auth.role.${r}`)}
                        </option>
                      );
                    })}
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={t('admin.apiAccess')}
                    checked={u.apiAccess || u.role === 'admin'}
                    disabled={u.role === 'admin'}
                    onChange={(e) => act(adminApi.updateUser(u.id, { apiAccess: e.target.checked }))}
                  />
                </td>
                <td>{formatDate(u.lastLoginAt, i18n.language)}</td>
                <td>
                  <div className="auth-actions">
                  <button
                    type="button"
                    onClick={() => {
                      adminApi
                        .resetPassword(u.id)
                        .then((r) => {
                          setSecret({ email: u.email, password: r.temporaryPassword });
                        })
                        .catch((e: Error) => {
                          setError(e.message);
                        });
                    }}
                  >
                    {t('admin.resetPassword')}
                  </button>
                  {!self && (
                    <button type="button" onClick={() => act(adminApi.updateUser(u.id, { disabled: !u.disabled }))}>
                      {u.disabled ? t('admin.enable') : t('admin.disable')}
                    </button>
                  )}
                  {!self && (
                    <button
                      type="button"
                      className="auth-danger"
                      onClick={() => {
                        if (window.confirm(t('admin.deleteConfirm', { email: u.email }))) act(adminApi.deleteUser(u.id));
                      }}
                    >
                      {t('admin.delete')}
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const SettingsTab = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    adminApi
      .settings()
      .then(setSettings)
      .catch((e: Error) => {
        setError(e.message);
      });
  }, []);
  const change = (c: Partial<AdminSettings>) => {
    adminApi
      .updateSettings(c)
      .then(setSettings)
      .catch((e: Error) => {
        setError(e.message);
      });
  };
  if (!settings) return error ? <div className="auth-error">{error}</div> : null;
  return (
    <div className="auth-settings">
      {error && <div className="auth-error">{error}</div>}
      <label className="auth-setting">
        <input type="checkbox" checked={settings.publicAccess} onChange={(e) => change({ publicAccess: e.target.checked })} />
        <span>
          <strong>{t('admin.publicAccess')}</strong>
          <span className="auth-muted">{t('admin.publicAccessHint')}</span>
        </span>
      </label>
      <label className="auth-setting">
        <input type="checkbox" checked={settings.apiAccessForAll} onChange={(e) => change({ apiAccessForAll: e.target.checked })} />
        <span>
          <strong>{t('admin.apiAccessForAll')}</strong>
          <span className="auth-muted">{t('admin.apiAccessForAllHint')}</span>
        </span>
      </label>
    </div>
  );
};

const TokensTab = () => {
  const { t, i18n } = useTranslation();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [error, setError] = useState('');
  const load = () => {
    adminApi
      .tokens()
      .then(setTokens)
      .catch((e: Error) => {
        setError(e.message);
      });
  };
  useEffect(load, []);
  if (tokens.length === 0) return <p className="auth-intro">{error || t('admin.noTokens')}</p>;
  return (
    <>
      {error && <div className="auth-error">{error}</div>}
      <table className="auth-table">
        <thead>
          <tr>
            <th>{t('admin.user')}</th>
            <th>{t('account.tokenColumn')}</th>
            <th>{t('account.scope')}</th>
            <th>{t('account.lastUsed')}</th>
            <th>{t('account.expires')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tokens.map((tok) => {
            return (
              <tr key={tok.id}>
                <td>{tok.user}</td>
                <td>
                  {tok.name}
                  <div className="auth-muted">{tok.prefix}…</div>
                </td>
                <td>{tok.scope === 'write' ? t('account.scopeWrite') : t('account.scopeRead')}</td>
                <td>{formatDate(tok.lastUsedAt, i18n.language)}</td>
                <td>{tok.expiresAt ? formatDate(tok.expiresAt, i18n.language) : t('account.never')}</td>
                <td>
                  <button
                    type="button"
                    className="auth-danger"
                    onClick={() => {
                      if (!window.confirm(t('account.revokeConfirm', { name: tok.name }))) return;
                      adminApi
                        .revokeToken(tok.id)
                        .then(load)
                        .catch((e: Error) => {
                          setError(e.message);
                        });
                    }}
                  >
                    {t('account.revoke')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export const AdminDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'users' | 'settings' | 'tokens'>('users');
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog auth-dialog auth-dialog-wide" role="dialog" aria-label={t('admin.title')} onClick={(e) => e.stopPropagation()}>
        <div className="auth-dialog-head">
          <h2>{t('admin.title')}</h2>
          <button type="button" className="auth-close" onClick={onClose} aria-label={t('dialog.load.btnClose')}>
            ×
          </button>
        </div>
        <div className="auth-tabs" role="tablist">
          {(['users', 'settings', 'tokens'] as const).map((k) => {
            return (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'active' : undefined} onClick={() => setTab(k)}>
                {t(`admin.tab.${k}`)}
              </button>
            );
          })}
        </div>
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'tokens' && <TokensTab />}
      </div>
    </div>
  );
};
