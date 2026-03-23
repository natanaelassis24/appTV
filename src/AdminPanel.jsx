import { useEffect, useMemo, useState } from 'react';
import { PUBLIC_RUNTIME_CONFIG } from './runtime-config';

const ADMIN_SESSION_KEY = 'app-tv-admin-session-v1';
const ACCESS_STATUS_LABELS = {
  active: 'Acesso ativo',
  pending: 'Pagamento pendente',
  blocked: 'Acesso bloqueado'
};

const readToken = () => {
  try {
    return typeof window === 'undefined' ? '' : window.localStorage.getItem(ADMIN_SESSION_KEY) || '';
  } catch {
    return '';
  }
};

const saveToken = token => {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(ADMIN_SESSION_KEY, token);
  } catch {}
};

const clearToken = () => {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
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
  const telegramUrl = PUBLIC_RUNTIME_CONFIG.telegramUrl || 'https://t.me/natalinoprr';
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loginState, setLoginState] = useState('idle');
  const [loginError, setLoginError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, pending: 0, blocked: 0 });
  const [generatorName, setGeneratorName] = useState('Cliente');
  const [generatorPlanName, setGeneratorPlanName] = useState('Plano manual');
  const [generatorPlanId, setGeneratorPlanId] = useState('manual');
  const [generatorStatus, setGeneratorStatus] = useState('pending');
  const [generatorExpiresInMonths, setGeneratorExpiresInMonths] = useState('1');
  const [generatorExpiresAt, setGeneratorExpiresAt] = useState('');
  const [generateState, setGenerateState] = useState('idle');
  const [generateError, setGenerateError] = useState('');
  const [generatedAccess, setGeneratedAccess] = useState(null);

  useEffect(() => {
    const token = readToken();
    if (token) {
      setSessionToken(token);
      setLoginState('success');
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

  const handleLogin = async event => {
    event.preventDefault();
    setLoginState('loading');
    setLoginError('');

    try {
      const response = await fetch(`/api/admin-login?password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      saveToken(payload.token);
      setSessionToken(payload.token);
      setLoginState('success');
    } catch (error) {
      clearToken();
      setSessionToken('');
      setLoginState('error');
      setLoginError(error?.message || 'Falha ao autenticar no painel.');
    }
  };

  const handleLogout = () => {
    clearToken();
    setSessionToken('');
    setPassword('');
    setRows([]);
    setCounts({ all: 0, active: 0, pending: 0, blocked: 0 });
    setSearchTerm('');
    setStatusFilter('active');
    setLoadState('idle');
    setLoadError('');
    setLoginState('idle');
    setGenerateState('idle');
    setGenerateError('');
    setGeneratedAccess(null);
  };

  const handleGenerateAccess = async event => {
    event.preventDefault();
    setGenerateState('loading');
    setGenerateError('');

    try {
      const response = await fetch('/api/admin-generate-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          name: generatorName,
          planName: generatorPlanName,
          planId: generatorPlanId,
          status: generatorStatus,
          expiresInMonths: generatorExpiresAt ? '' : generatorExpiresInMonths,
          expiresAt: generatorExpiresAt
        })
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      setGeneratedAccess(payload);
      setGenerateState('success');
      setSearchTerm(payload?.accessId || '');
      setStatusFilter('all');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      setGenerateState('error');
      setGenerateError(error?.message || 'Falha ao gerar o ID.');
    }
  };

  if (!sessionToken) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-login-card">
          <div className="admin-login-copy">
            <span className="section-kicker">Painel administrativo</span>
            <h1>IDs e vencimentos</h1>
            <p>Entre com a senha para ver os IDs ativos, pendentes e bloqueados de qualquer lugar.</p>
          </div>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label className="admin-field">
              <span>Senha do painel</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Digite a senha administrativa"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <div className="admin-banner error">{loginError}</div> : null}
            <div className="admin-login-actions">
              <button type="submit" className="primary-btn" disabled={loginState === 'loading'}>
                {loginState === 'loading' ? 'Entrando...' : 'Entrar no painel'}
              </button>
              <a className="secondary-btn" href={telegramUrl} target="_blank" rel="noreferrer">
                Falar no Telegram
              </a>
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
            <button type="button" className="secondary-btn" onClick={() => window.location.reload()}>
              Atualizar
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
              <p>Crie um ID no formato ATA-2547 para enviar manualmente ao cliente. O numero e aleatorio e varia a cada geracao.</p>
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
              <input value={generatorPlanName} onChange={event => setGeneratorPlanName(event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Código do plano</span>
              <input value={generatorPlanId} onChange={event => setGeneratorPlanId(event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Status</span>
              <select value={generatorStatus} onChange={event => setGeneratorStatus(event.target.value)}>
                <option value="pending">Pendente</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Validade em meses</span>
              <input
                type="number"
                min="1"
                value={generatorExpiresInMonths}
                onChange={event => setGeneratorExpiresInMonths(event.target.value)}
                placeholder="1"
              />
            </label>
            <label className="admin-field">
              <span>Validade manual</span>
              <input
                type="date"
                value={generatorExpiresAt}
                onChange={event => setGeneratorExpiresAt(event.target.value)}
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
