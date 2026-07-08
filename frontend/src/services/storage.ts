export const loadUsers = () => {
  try {
    const raw = localStorage.getItem('taxpal_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveUsers = (users: any[]) => {
  try {
    localStorage.setItem('taxpal_users', JSON.stringify(users));
  } catch {}
};

export const setCurrentUser = (user: any) => {
  try { localStorage.setItem('taxpal_current', JSON.stringify(user)); } catch {}
};

export const getCurrentUser = () => {
  try { const raw = localStorage.getItem('taxpal_current'); return raw ? JSON.parse(raw) : null; } catch { return null; }
};

type PasswordResetRecord = {
  code: string;
  expiresAt: number;
};

export const setPasswordResetCode = (email: string, code: string) => {
  try {
    const raw = localStorage.getItem('taxpal_password_resets');
    const map = raw ? JSON.parse(raw) : {};
    map[email] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
    localStorage.setItem('taxpal_password_resets', JSON.stringify(map));
  } catch {}
};

export const getPasswordResetCode = (email: string): PasswordResetRecord | null => {
  try {
    const raw = localStorage.getItem('taxpal_password_resets');
    const map = raw ? JSON.parse(raw) : {};
    return map[email] || null;
  } catch { return null; }
};

export const clearPasswordResetCode = (email: string) => {
  try {
    const raw = localStorage.getItem('taxpal_password_resets');
    const map = raw ? JSON.parse(raw) : {};
    delete map[email];
    localStorage.setItem('taxpal_password_resets', JSON.stringify(map));
  } catch {}
};

const loadByUser = <T,>(storageKey: string, email: string): T[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    const map = raw ? JSON.parse(raw) : {};
    return map[email] || [];
  } catch {
    return [];
  }
};

const saveByUser = <T,>(storageKey: string, email: string, data: T[]) => {
  try {
    const raw = localStorage.getItem(storageKey);
    const map = raw ? JSON.parse(raw) : {};
    map[email] = data;
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {}
};

export const loadUserTransactions = (email: string): any[] => loadByUser('taxpal_transactions', email);
export const saveUserTransactions = (email: string, transactions: any[]) => saveByUser('taxpal_transactions', email, transactions);

export const loadUserBudgets = (email: string): any[] => loadByUser('taxpal_budgets', email);
export const saveUserBudgets = (email: string, budgets: any[]) => saveByUser('taxpal_budgets', email, budgets);

export const loadUserTaxEstimate = (email: string): number | null => {
  try {
    const raw = localStorage.getItem('taxpal_tax_estimates');
    const map = raw ? JSON.parse(raw) : {};
    return typeof map[email] === 'number' ? map[email] : null;
  } catch {
    return null;
  }
};

export const saveUserTaxEstimate = (email: string, taxEstimate: number) => {
  try {
    const raw = localStorage.getItem('taxpal_tax_estimates');
    const map = raw ? JSON.parse(raw) : {};
    map[email] = taxEstimate;
    localStorage.setItem('taxpal_tax_estimates', JSON.stringify(map));
  } catch {}
};
