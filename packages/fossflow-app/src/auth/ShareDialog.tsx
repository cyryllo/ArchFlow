// Sharing one diagram: who sees it (team or private), people with view or
// edit access, and read-only links that work without logging in.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sharingApi, type Sharing } from './authApi';
import { SecretBox, formatDate } from './AccountDialog';

const basePath = () => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
};

export const ShareDialog = ({ diagramId, diagramName, onClose }: { diagramId: string; diagramName: string; onClose: () => void }) => {
  const { t, i18n } = useTranslation();
  const [sharing, setSharing] = useState<Sharing | null>(null);
  const [error, setError] = useState('');
  const [person, setPerson] = useState('');
  const [access, setAccess] = useState<'view' | 'edit'>('view');
  const [days, setDays] = useState('');
  const [newLink, setNewLink] = useState('');

  const fail = (e: Error) => {
    setError(e.message);
  };
  useEffect(() => {
    sharingApi.get(diagramId).then(setSharing).catch(fail);
  }, [diagramId]);

  const save = (change: Parameters<typeof sharingApi.update>[1]) => {
    setError('');
    sharingApi.update(diagramId, change).then(setSharing).catch(fail);
  };
  const users = (list: Sharing['users']) => {
    return list.map((u) => {
      return { id: u.id, access: u.access ?? ('view' as const) };
    });
  };

  if (!sharing) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog auth-dialog" onClick={(e) => e.stopPropagation()}>
          {error ? <div className="auth-error">{error}</div> : <p className="auth-intro">…</p>}
        </div>
      </div>
    );
  }

  const candidates = sharing.people.filter((p) => {
    return !sharing.users.some((u) => u.id === p.id);
  });

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog auth-dialog" role="dialog" aria-label={t('share.title', { name: diagramName })} onClick={(e) => e.stopPropagation()}>
        <div className="auth-dialog-head">
          <h2>{t('share.title', { name: diagramName })}</h2>
          <button type="button" className="auth-close" onClick={onClose} aria-label={t('dialog.load.btnClose')}>
            ×
          </button>
        </div>
        {error && <div className="auth-error">{error}</div>}

        <h3>{t('share.whoSees')}</h3>
        <div className="auth-settings">
          {(['team', 'private'] as const).map((v) => {
            return (
              <label key={v} className="auth-setting">
                <input type="radio" name="visibility" checked={sharing.visibility === v} onChange={() => save({ visibility: v })} />
                <span>
                  <strong>{t(`share.${v}`)}</strong>
                  <span className="auth-muted">{t(`share.${v}Hint`)}</span>
                </span>
              </label>
            );
          })}
        </div>

        <h3>{t('share.people')}</h3>
        <p className="auth-intro">{t(sharing.visibility === 'private' ? 'share.peopleHintPrivate' : 'share.peopleHintTeam')}</p>
        {sharing.users.length > 0 && (
          <table className="auth-table">
            <tbody>
              {sharing.users.map((u) => {
                return (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      <div className="auth-muted">{u.name}</div>
                    </td>
                    <td>
                      <select
                        value={u.access}
                        aria-label={t('share.access')}
                        onChange={(e) =>
                          save({
                            users: users(sharing.users).map((x) => (x.id === u.id ? { ...x, access: e.target.value as 'view' | 'edit' } : x))
                          })
                        }
                      >
                        <option value="view">{t('share.canView')}</option>
                        <option value="edit" disabled={u.role === 'viewer'}>
                          {t('share.canEdit')}
                        </option>
                      </select>
                    </td>
                    <td>
                      <button type="button" className="auth-danger" onClick={() => save({ users: users(sharing.users).filter((x) => x.id !== u.id) })}>
                        {t('share.remove')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {candidates.length > 0 && (
          <div className="auth-inline-form">
            <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label={t('share.person')}>
              <option value="">{t('share.choosePerson')}</option>
              {candidates.map((p) => {
                return (
                  <option key={p.id} value={p.id}>
                    {p.name ? `${p.name} (${p.email})` : p.email}
                  </option>
                );
              })}
            </select>
            <select value={access} onChange={(e) => setAccess(e.target.value as 'view' | 'edit')} aria-label={t('share.access')}>
              <option value="view">{t('share.canView')}</option>
              <option value="edit">{t('share.canEdit')}</option>
            </select>
            <button
              type="button"
              className="auth-primary"
              disabled={!person}
              onClick={() => {
                const who = sharing.people.find((p) => p.id === person);
                // Viewers never edit, whatever is chosen here
                const level = who?.role === 'viewer' ? 'view' : access;
                save({ users: [...users(sharing.users), { id: person, access: level }] });
                setPerson('');
              }}
            >
              {t('share.add')}
            </button>
          </div>
        )}

        <h3>{t('share.links')}</h3>
        <p className="auth-intro">{t('share.linksHint')}</p>
        <div className="auth-inline-form">
          <select value={days} onChange={(e) => setDays(e.target.value)} aria-label={t('account.expires')}>
            <option value="">{t('share.noExpiry')}</option>
            <option value="7">{t('account.days', { count: 7 })}</option>
            <option value="30">{t('account.days', { count: 30 })}</option>
            <option value="90">{t('account.days', { count: 90 })}</option>
          </select>
          <button
            type="button"
            className="auth-primary"
            onClick={() => {
              setError('');
              sharingApi
                .createLink(diagramId, days ? Number(days) : null)
                .then((r) => {
                  setNewLink(`${window.location.origin}${basePath()}/view/${r.token}`);
                  return sharingApi.get(diagramId).then(setSharing);
                })
                .catch(fail);
            }}
          >
            {t('share.createLink')}
          </button>
        </div>
        {newLink && <SecretBox title={t('share.newLink')} secret={newLink} hint={t('share.linkOnce')} />}
        {sharing.links.length > 0 && (
          <table className="auth-table">
            <tbody>
              {sharing.links.map((l) => {
                return (
                  <tr key={l.id}>
                    <td>
                      {l.prefix}…<div className="auth-muted">{l.createdBy}</div>
                    </td>
                    <td>
                      {t('account.expires')}: {l.expiresAt ? formatDate(l.expiresAt, i18n.language) : t('account.never')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="auth-danger"
                        onClick={() => {
                          sharingApi
                            .revokeLink(diagramId, l.id)
                            .then(() => sharingApi.get(diagramId).then(setSharing))
                            .catch(fail);
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
        )}
      </div>
    </div>
  );
};
