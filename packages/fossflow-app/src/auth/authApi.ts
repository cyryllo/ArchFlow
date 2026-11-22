// Calls to ArchFlow's login API (/api/auth, /api/admin). Only used when the
// server runs with logins (AUTH_MODE=local).
import i18n from '../i18n';

export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
  apiAccess: boolean;
  canUseApi: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  scope: 'read' | 'write';
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  user?: string | null;
  token?: string;
}

export interface AdminSettings {
  apiAccessForAll: boolean;
  publicAccess: boolean;
}

// An error with the server's message (already in plain words)
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// The server answers in English; known messages are shown in the UI language
const SERVER_ERRORS: Record<string, string> = {
  'Wrong e-mail or password': 'errors.wrongLogin',
  'Too many failed attempts. Try again in 15 minutes.': 'errors.tooMany',
  'This account is disabled': 'errors.disabled',
  'Enter a valid e-mail address': 'errors.email',
  'The password must have at least 8 characters': 'errors.passwordShort',
  'The current password is wrong': 'errors.currentWrong',
  'A user with this e-mail already exists': 'errors.exists',
  'ArchFlow needs at least one active administrator': 'errors.lastAdmin',
  "You can't disable yourself or take away your own admin role": 'errors.self',
  "You can't delete yourself": 'errors.self',
  'Give the token a name': 'errors.tokenName',
  'API and MCP access is not allowed for you': 'errors.noApi'
};
const translateError = (message: string) => {
  const key = SERVER_ERRORS[message];
  return key ? i18n.t(key) : message;
};

const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => {
    return null;
  });
  if (!res.ok) throw new ApiError(translateError(data?.error ?? `HTTP ${res.status}`), res.status);
  return data as T;
};

export const authApi = {
  me: () => {
    return call<{ user: User }>('GET', '/api/auth/me');
  },
  login: (email: string, password: string) => {
    return call<{ user: User }>('POST', '/api/auth/login', { email, password });
  },
  setup: (email: string, name: string, password: string) => {
    return call<{ user: User }>('POST', '/api/auth/setup', { email, name, password });
  },
  logout: () => {
    return call<{ success: boolean }>('POST', '/api/auth/logout');
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    return call<{ user: User }>('POST', '/api/auth/password', { currentPassword, newPassword });
  },
  tokens: () => {
    return call<ApiToken[]>('GET', '/api/auth/tokens');
  },
  createToken: (name: string, scope: 'read' | 'write', expiresInDays: number | null) => {
    return call<ApiToken>('POST', '/api/auth/tokens', { name, scope, expiresInDays });
  },
  revokeToken: (id: string) => {
    return call<{ success: boolean }>('DELETE', `/api/auth/tokens/${encodeURIComponent(id)}`);
  }
};

export const adminApi = {
  users: () => {
    return call<User[]>('GET', '/api/admin/users');
  },
  addUser: (email: string, name: string, role: Role, apiAccess: boolean) => {
    return call<{ user: User; temporaryPassword: string }>('POST', '/api/admin/users', { email, name, role, apiAccess });
  },
  updateUser: (id: string, change: Partial<Pick<User, 'name' | 'role' | 'disabled' | 'apiAccess'>>) => {
    return call<User>('PATCH', `/api/admin/users/${encodeURIComponent(id)}`, change);
  },
  resetPassword: (id: string) => {
    return call<{ temporaryPassword: string }>('POST', `/api/admin/users/${encodeURIComponent(id)}/reset-password`);
  },
  deleteUser: (id: string) => {
    return call<{ success: boolean }>('DELETE', `/api/admin/users/${encodeURIComponent(id)}`);
  },
  settings: () => {
    return call<AdminSettings>('GET', '/api/admin/settings');
  },
  updateSettings: (change: Partial<AdminSettings>) => {
    return call<AdminSettings>('PATCH', '/api/admin/settings', change);
  },
  tokens: () => {
    return call<ApiToken[]>('GET', '/api/admin/tokens');
  },
  revokeToken: (id: string) => {
    return call<{ success: boolean }>('DELETE', `/api/admin/tokens/${encodeURIComponent(id)}`);
  }
};
