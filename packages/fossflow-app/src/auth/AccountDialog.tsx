// The user's own account: password and personal API/MCP tokens.
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { authApi, type ApiToken } from './authApi';
import { PasswordForm } from './AuthScreens';

export const formatDate = (iso: string | null | undefined, lang: string) => {
  return iso ? new Date(iso).toLocaleDateString(lang) : '—';
};

// Shows a secret once, with a copy button and how to use it in Claude Code
export const SecretBox = ({ title, secret, hint, command }: { title: string; secret: string; hint: string; command?: string }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState('');
  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
    });
  };
  return (
    <div className="auth-secret">
      <strong>{title}</strong>
      <div className="auth-secret-row">
        <code>{secret}</code>
        <button type="button" onClick={() => copy(secret, 'secret')}>
          {copied === 'secret' ? t('account.copied') : t('account.copy')}
        </button>
      </div>
      <p>{hint}</p>
      {command && (
        <>
          <p>{t('account.claudeCodeHint')}</p>
          <div className="auth-secret-row">
            <code className="auth-command">{command}</code>
            <button type="button" onClick={() => copy(command, 'command')}>
              {copied === 'command' ? t('account.copied') : t('account.copy')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const TokensSection = () => {
  const { t, i18n } = useTranslation();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'write'>('write');
  const [days, setDays] = useState('');
  const [created, setCreated] = useState<ApiToken | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    authApi
      .tokens()
      .then(setTokens)
      .catch((e: Error) => {
        setError(e.message);
      });
  };
  useEffect(load, []);

  const create = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    authApi
      .createToken(name, scope, days ? Number(days) : null)
      .then((tok) => {
        setCreated(tok);
        setName('');
        load();
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  };

  const revoke = (tok: ApiToken) => {
    if (!window.confirm(t('account.revokeConfirm', { name: tok.name }))) return;
    authApi
      .revokeToken(tok.id)
      .then(load)
      .catch((err: Error) => {
        setError(err.message);
      });
  };

  const mcpUrl = `${window.location.origin}/mcp`;
  return (
    <>
      <p className="auth-intro">{t('account.tokensIntro')}</p>
      <form className="auth-inline-form" onSubmit={create}>
        <input placeholder={t('account.tokenName')} required value={name} onChange={(e) => setName(e.target.value)} />
        <select value={scope} onChange={(e) => setScope(e.target.value as 'read' | 'write')} aria-label={t('account.scope')}>
          <option value="write">{t('account.scopeWrite')}</option>
          <option value="read">{t('account.scopeRead')}</option>
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} aria-label={t('account.expires')}>
          <option value="">{t('account.never')}</option>
          <option value="30">{t('account.days', { count: 30 })}</option>
          <option value="90">{t('account.days', { count: 90 })}</option>
          <option value="365">{t('account.days', { count: 365 })}</option>
        </select>
        <button type="submit" className="auth-primary">
          {t('account.createToken')}
        </button>
      </form>
      {error && <div className="auth-error">{error}</div>}
      {created?.token && (
        <SecretBox
          title={t('account.newToken', { name: created.name })}
          secret={created.token}
          hint={t('account.tokenOnce')}
          command={`claude mcp add --transport http archflow --scope user ${mcpUrl} --header "Authorization: Bearer ${created.token}"`}
        />
      )}
      {tokens.length > 0 && (
        <table className="auth-table">
          <thead>
            <tr>
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
                  <td>
                    {tok.name}
                    <div className="auth-muted">{tok.prefix}…</div>
                  </td>
                  <td>{tok.scope === 'write' ? t('account.scopeWrite') : t('account.scopeRead')}</td>
                  <td>{formatDate(tok.lastUsedAt, i18n.language)}</td>
                  <td>{tok.expiresAt ? formatDate(tok.expiresAt, i18n.language) : t('account.never')}</td>
                  <td>
                    <button type="button" className="auth-danger" onClick={() => revoke(tok)}>
                      {t('account.revoke')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
};

export const AccountDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog auth-dialog" role="dialog" aria-label={t('account.title')} onClick={(e) => e.stopPropagation()}>
        <div className="auth-dialog-head">
          <h2>{t('account.title')}</h2>
          <button type="button" className="auth-close" onClick={onClose} aria-label={t('dialog.load.btnClose')}>
            ×
          </button>
        </div>
        <p className="auth-intro">
          {user.name ? `${user.name} · ` : ''}
          {user.email} · {t(`auth.role.${user.role}`)}
        </p>

        <h3>{t('account.passwordTitle')}</h3>
        <PasswordForm
          submitLabel={t('auth.changePasswordButton')}
          onDone={(me) => {
            updateUser(me);
            setSaved(true);
          }}
        />
        {saved && <div className="auth-ok">{t('account.passwordChanged')}</div>}

        <h3>{t('account.tokensTitle')}</h3>
        {user.canUseApi ? <TokensSection /> : <p className="auth-intro">{t('account.noApiAccess')}</p>}

        <div className="auth-footer">
          <button type="button" className="auth-secondary" onClick={() => void logout()}>
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};
