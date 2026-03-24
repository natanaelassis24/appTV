import { useEffect, useMemo, useState } from 'react';
import { getPlanById, PUBLIC_PLANS } from '../lib/plans.js';
import { PUBLIC_RUNTIME_CONFIG } from './runtime-config';

const ACCESS_STATUS_LABELS = {
  active: 'Acesso ativo',
  pending: 'Pagamento pendente',
  blocked: 'Acesso bloqueado'
};

const readJson = async response => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
};

const FIREBASE_AUTH_SESSION_KEY = 'app-tv-admin-firebase-session-v1';

const readAuthSession = () => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(FIREBASE_AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.idToken ? parsed : null;
  } catch {
    return null;
  }
};

const saveAuthSession = session => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FIREBASE_AUTH_SESSION_KEY, JSON.stringify(session));
    }
  } catch {}
};

const clearAuthSession = () => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FIREBASE_AUTH_SESSION_KEY);
    }
  } catch {}
};

async function firebaseAuthRequest(endpoint, payload) {
  const apiKey = PUBLIC_RUNTIME_CONFIG.firebaseWebApiKey;
  if (!apiKey) {
    throw new Error('Defina APP_FIREBASE_WEB_API_KEY nas variaveis do projeto.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || `HTTP ${response.status}`);
  }

  return data;
}

async function refreshFirebaseAuthSession(refreshToken) {
  const apiKey = PUBLIC_RUNTIME_CONFIG.firebaseWebApiKey;
  if (!apiKey || !refreshToken) {
    throw new Error('Sessao expirada.');
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    }
  );

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || `HTTP ${response.status}`);
  }

  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token || refreshToken,
    email: data.user_email || ''
  };
}

const formatDate = value => {
  if (!value) return 'Nao definida';
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

const normalize = (entry, id) => ({
  accessId: entry.accessId || id,
  name: entry.name || 'Cliente',
  planName: entry.planName || 'Plano nao definido',
  status: entry.status || 'pending',
  paymentLabel: entry.paymentLabel || 'Aguardando confirmacao',
  expiresAt: entry.expiresAt || null,
  expiresAtLabel: formatDate(entry.expiresAt)
});

export default function AdminPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [authState, setAuthState] = useState('idle');
  const [authError, setAuthError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, pending: 0, blocked: 0 });
  const [generatorName, setGeneratorName] = useState('Cliente');
  const [generatorPlanId, setGeneratorPlanId] = useState('mensal');
  const [generateState, setGenerateState] = useState('idle');
  const [generateError, setGenerateError] = useState('');
  const [generatedAccess, setGeneratedAccess] = useState(null);
  const [diagnosticState, setDiagnosticState] = useState('idle');
  const [diagnosticError, setDiagnosticError] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  useEffect(() => {
    const session = readAuthSession();
    const restoreSession = async () => {
      if (!session?.refreshToken) return;

      try {
        const refreshed = await refreshFirebaseAuthSession(session.refreshToken);
        const nextSession = {
          ...session,
          ...refreshed,
          expiresAt: Date.now() + 55 * 60 * 1000
        };
        saveAuthSession(nextSession);
        setSessionToken(nextSession.idToken || '');
        setEmail(nextSession.email || session.email || '');
      } catch {
        clearAuthSession();
      }
    };

    if (session?.idToken) {
      setSessionToken(session.idToken);
      setEmail(session.email || '');
      restoreSession();
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) return;

    const load = async () => {
      setLoadState('loading');
      setLoadError('');

      try {
        const response = await fetch(`/api/admin-accesses?status=${encodeURIComponent(statusFilter)}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${sessionToken}`
          }
        });

        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }

        setRows(Array.isArray(payload?.entries) ? payload.entries : []);
        setCounts(payload?.counts || { all: 0, active: 0, pending: 0, blocked: 0 });
        setLoadState('success');
      } catch (error) {
        setRows([]);
        setLoadError(error?.message || 'Falha ao carregar os IDs.');
        setLoadState('error');
      }
    };

    load();
  }, [sessionToken, statusFilter]);

  const visibleRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(row => {
      return (
        String(row.accessId || '').toLowerCase().includes(term) ||
        String(row.name || '').toLowerCase().includes(term) ||
        String(row.planName || '').toLowerCase().includes(term)
      );
    });
  }, [rows, searchTerm]);

  const selectedPlan = useMemo(() => getPlanById(generatorPlanId) || PUBLIC_PLANS[0] || null, [generatorPlanId]);

  const handleAuth = async () => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthState('error');
      setAuthError('Informe email e senha.');
      return;
    }

    setAuthState('loading');
    setAuthError('');

    try {
      const authResult = await firebaseAuthRequest('signInWithPassword', {
        email: normalizedEmail,
        password: normalizedPassword,
        returnSecureToken: true
      });

      const session = {
        email: authResult.email || normalizedEmail,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
        expiresAt: Date.now() + Number(authResult.expiresIn || 3600) * 1000
      };

      saveAuthSession(session);
      setSessionToken(session.idToken);
      setAuthState('success');
      setAuthError('');
    } catch (error) {
      clearAuthSession();
      setSessionToken('');
      setAuthState('error');
      setAuthError(error?.message || 'Falha ao autenticar no painel.');
    }
  };

  const handleLogin = async event => {
    event.preventDefault();
    handleAuth();
  };

  const handleLogout = () => {
    clearAuthSession();
    setSessionToken('');
    setEmail('');
    setPassword('');
    setRows([]);
    setCounts({ all: 0, active: 0, pending: 0, blocked: 0 });
    setSearchTerm('');
    setStatusFilter('active');
    setLoadState('idle');
    setLoadError('');
    setGenerateState('idle');
    setGenerateError('');
    setGeneratedAccess(null);
    setDiagnosticState('idle');
    setDiagnosticError('');
    setDiagnosticResult(null);
    setAuthState('idle');
    setAuthError('');
  };

  const handleClose = () => {
    handleLogout();
    window.location.href = '/';
  };

  const handleGenerateAccess = async event => {
    event.preventDefault();
    setGenerateState('loading');
    setGenerateError('');

    const requestUrl = `/api/admin-generate-access?name=${encodeURIComponent(generatorName)}&planId=${encodeURIComponent(generatorPlanId)}`;

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${sessionToken}`
        }
      });

      const responsePayload = await readJson(response);
      if (!response.ok) {
        if (response.status === 405 || response.status === 500) {
          const diagnosticResponse = await fetch('/api/firebase-diagnostics', {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${sessionToken}`
            }
          });

          const diagnosticPayload = await readJson(diagnosticResponse);
          if (diagnosticResponse.ok) {
            setDiagnosticResult(diagnosticPayload);
            setDiagnosticState('success');
          }
        }

        throw new Error(responsePayload?.error || `HTTP ${response.status}`);
      }

      setGeneratedAccess(responsePayload);
      setGenerateState('success');
      setSearchTerm(responsePayload?.accessId || '');
      setStatusFilter('all');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      setGenerateState('error');
      setGenerateError(error?.message || 'Falha ao gerar o ID.');
    }
  };

  const handleFirebaseDiagnostic = async () => {
    setDiagnosticState('loading');
    setDiagnosticError('');
    setDiagnosticResult(null);

    try {
      const response = await fetch('/api/firebase-diagnostics', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${sessionToken}`
        }
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      setDiagnosticResult(payload);
      setDiagnosticState('success');
    } catch (error) {
      setDiagnosticState('error');
      setDiagnosticError(error?.message || 'Falha ao diagnosticar o Firebase.');
    }
  };

  if (!sessionToken) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-login-card">
          <div className="admin-login-copy">
            <span className="section-kicker">Login administrativo</span>
            <h1>Entrar no admin</h1>
            <p>Entre com o email e a senha do administrador cadastrado.</p>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={event => {
                setEmail(event.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="Digite o email do admin"
              autoComplete="email"
              />
            </label>
            <label className="admin-field">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={event => {
                setPassword(event.target.value);
                if (authError) setAuthError('');
              }}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </label>
            {authError ? <div className="admin-banner error">{authError}</div> : null}
            <div className="admin-login-actions">
              <button type="button" className="secondary-btn" onClick={handleClose}>
                Fechar
              </button>
              <button type="submit" className="primary-btn" disabled={authState === 'loading'}>
                {authState === 'loading' ? 'Entrando...' : 'Entrar com email e senha'}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-card admin-dashboard">
        <div className="admin-topbar">
          <div className="admin-login-copy">
            <span className="section-kicker">Painel administrativo</span>
            <h1>IDs cadastrados</h1>
            <p>Veja os acessos ativos e a data de vencimento de cada cliente.</p>
          </div>
          <div className="admin-topbar-actions">
            <button type="button" className="secondary-btn" onClick={handleClose}>
              Fechar
            </button>
            <button type="button" className="secondary-btn" onClick={() => window.location.reload()}>
              Atualizar
            </button>
            <button type="button" className="secondary-btn" onClick={handleFirebaseDiagnostic}>
              Testar Firebase
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>

        <form className="admin-generator" onSubmit={handleGenerateAccess}>
          <div className="admin-generator-head">
            <div>
              <span className="section-kicker">Gerador de ID</span>
              <h2>Novo acesso ATA</h2>
              <p>Escolha o plano e o sistema gera o ID ATA-XXXX com a validade correta automaticamente.</p>
            </div>
            {generatedAccess ? (
              <div className="admin-generator-result">
                <strong>{generatedAccess.accessId}</strong>
                <span>{generatedAccess.planName}</span>
              </div>
            ) : null}
          </div>

          <div className="admin-generator-grid">
            <label className="admin-field">
              <span>Cliente</span>
              <input value={generatorName} onChange={event => setGeneratorName(event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Plano</span>
              <select value={generatorPlanId} onChange={event => setGeneratorPlanId(event.target.value)}>
                {PUBLIC_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Validade do plano</span>
              <input
                type="text"
                value={selectedPlan ? `${selectedPlan.durationMonths} mês(es)` : ''}
                readOnly
              />
            </label>
          </div>

          {generateError ? <div className="admin-banner error">{generateError}</div> : null}

          <div className="admin-generator-actions">
            <button type="submit" className="primary-btn" disabled={generateState === 'loading'}>
              {generateState === 'loading' ? 'Gerando...' : 'Gerar ID'}
            </button>
            {generatedAccess ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigator.clipboard?.writeText(generatedAccess.accessId || '')}
              >
                Copiar ID
              </button>
            ) : null}
          </div>
        </form>

        <div className="admin-stats">
          <article className="admin-stat-card">
            <span>Total</span>
            <strong>{counts.all}</strong>
          </article>
          <article className="admin-stat-card active">
            <span>Ativos</span>
            <strong>{counts.active}</strong>
          </article>
          <article className="admin-stat-card pending">
            <span>Pendentes</span>
            <strong>{counts.pending}</strong>
          </article>
          <article className="admin-stat-card blocked">
            <span>Bloqueados</span>
            <strong>{counts.blocked}</strong>
          </article>
        </div>

        <div className="admin-toolbar">
          <label className="admin-field admin-search">
            <span>Pesquisar</span>
            <input
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por ID, cliente ou plano"
            />
          </label>

          <div className="admin-filters" role="tablist" aria-label="Filtrar registros">
            {[
              ['active', 'Ativos'],
              ['pending', 'Pendentes'],
              ['blocked', 'Bloqueados'],
              ['all', 'Todos']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`admin-filter${statusFilter === value ? ' active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? <div className="admin-banner error">{loadError}</div> : null}

        {diagnosticState === 'loading' ? <div className="admin-banner neutral">Testando Firebase...</div> : null}
        {diagnosticState === 'error' ? <div className="admin-banner error">{diagnosticError}</div> : null}
        {diagnosticState === 'success' && diagnosticResult ? (
          <div className="admin-banner success">
            Firebase ok: projeto {diagnosticResult.projectId || 'desconhecido'}.
          </div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {loadState === 'loading' ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">
                    Carregando registros...
                  </td>
                </tr>
              ) : null}

              {loadState !== 'loading' && !visibleRows.length ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : null}

              {visibleRows.map(entry => (
                <tr key={entry.accessId} className={`status-${entry.status}`}>
                  <td>{entry.accessId}</td>
                  <td>{entry.name}</td>
                  <td>{entry.planName}</td>
                  <td>{ACCESS_STATUS_LABELS[entry.status] || entry.status}</td>
                  <td>{entry.paymentLabel}</td>
                  <td>{entry.expiresAtLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
