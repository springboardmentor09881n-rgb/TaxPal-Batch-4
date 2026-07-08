import React, { useState, useEffect } from 'react';
import './App.css';
import { Page, Transaction, Budget } from './types';
import { getCurrentUser, loadUsers, setCurrentUser, saveUsers, loadUserTransactions, saveUserTransactions, loadUserBudgets, saveUserBudgets, loadUserTaxEstimate, saveUserTaxEstimate } from './services/storage';
import Sidebar from './components/layout/Sidebar';
import SignInForm from './components/auth/SignInForm';
import SignUpForm from './components/auth/SignUpForm';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import TaxEstimate from './pages/TaxEstimate';
import Reports from './pages/Reports';

function App() {
  const [active, setActive] = useState<Page>('Dashboard');
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [userName, setUserName] = useState('Alex Morgan');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reportPeriod, setReportPeriod] = useState('Current Month');
  const [reportType, setReportType] = useState('Summary');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [taxEstimate, setTaxEstimate] = useState(0);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin'|'signup'>('signup');
  const [signupNotice, setSignupNotice] = useState<string | null>(null);
  
  useEffect(() => {
    // load persisted transactions and user
    try {
      const cur = getCurrentUser();
      if (cur) {
        loadCurrentUserData(cur);
      }
      // if a previous action requested signup, open the signup form
      try {
        const next = localStorage.getItem('taxpal_next_action');
        if (next === 'signup') {
          setAuthMode('signup');
          localStorage.removeItem('taxpal_next_action');
        }
      } catch {}
    } catch {}
  }, []);

  const users = loadUsers();
  const cur = getCurrentUser();

  const loadCurrentUserData = (user: any) => {
    setUserName(user.fullName || user.username || user.email);
    setCurrentEmail(user.email);
    setTransactions(loadUserTransactions(user.email) as Transaction[]);
    setBudgets(loadUserBudgets(user.email) as Budget[]);
    const estimate = loadUserTaxEstimate(user.email);
    setTaxEstimate(estimate ?? 0);
  };

  const switchAccount = (u: any) => {
    try { setCurrentUser(u); } catch {}
    setAuthenticated(true);
    setProfileOpen(false);
    loadCurrentUserData(u);
  };

  const handleAddAnother = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
    setProfileOpen(false);
  };

  const signOutCurrent = () => {
    try { localStorage.removeItem('taxpal_current'); } catch {}
    setAuthenticated(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (!currentEmail) return;
    try {
      saveUserTransactions(currentEmail, transactions);
    } catch {}
  }, [transactions, currentEmail]);

  useEffect(() => {
    if (!currentEmail) return;
    try {
      saveUserBudgets(currentEmail, budgets);
    } catch {}
  }, [budgets, currentEmail]);

  useEffect(() => {
    if (!currentEmail) return;
    try {
      saveUserTaxEstimate(currentEmail, taxEstimate);
    } catch {}
  }, [taxEstimate, currentEmail]);

  useEffect(() => {
    // update displayed name after authentication
    if (authenticated) {
      const cur = getCurrentUser();
      if (cur) setUserName(cur.fullName || cur.username || userName);
    }
  }, [authenticated]);


  if (!authenticated) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <h1>TaxPal</h1>
            <p>Personal finance and tax estimation for freelancers.</p>
          </div>
          {authMode === 'signin' ? (
            <SignInForm notice={signupNotice} onSuccess={() => setAuthenticated(true)} onSwitchToSignUp={() => setAuthMode('signup')} />
          ) : (
            <SignUpForm onSuccess={(name) => { setUserName(name); setAuthMode('signin'); setSignupNotice(`${name}, your account was created. Please sign in.`); }} onSwitchToSignIn={() => setAuthMode('signin')} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar userName={userName} active={active} setActive={setActive} />
      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Welcome back, {userName}</p>
            <h1>{active}</h1>
          </div>
          <div className="header-profile">
            <div className="header-info" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="avatar small">{(userName || cur?.fullName || cur?.username || 'U').split(' ').map((s:string)=>s[0]).slice(0,2).join('').toUpperCase()}</div>
              <div className="header-text">
                <div className="header-name">{userName}</div>
                <div className="header-email">{cur?.email}</div>
              </div>
            </div>
            {profileOpen && (
              <div className="header-menu" onClick={(e) => e.stopPropagation()}>
                <div className="menu-header">
                  <div className="menu-avatar">{(userName||cur?.fullName||'U').split(' ').map((s:string)=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                  <div>
                    <div className="menu-email">{cur?.email}</div>
                    <div className="menu-greeting">Hi, {userName.split(' ')[0]}!</div>
                  </div>
                </div>

                <div className="menu-accounts">
                  {users.filter((u: any) => u.email !== cur?.email).map((a: any) => (
                    <div key={a.email} className="menu-account" onClick={() => switchAccount(a)}>
                      <div className="menu-account-avatar">{(a.fullName || a.username || a.email).split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase()}</div>
                      <div className="menu-account-info">
                        <div className="menu-account-name">{a.fullName || a.username}</div>
                        <div className="menu-account-email">{a.email}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="menu-actions">
                  <button className="link-action" onClick={handleAddAnother}>Add another account</button>
                  <button className="link-action" onClick={signOutCurrent}>Sign out</button>
                </div>
              </div>
            )}
          </div>
        </header>

        {active === 'Dashboard' && <Dashboard transactions={transactions} budgets={budgets} taxEstimate={taxEstimate} />}
        {active === 'Transactions' && <Transactions transactions={transactions} setTransactions={setTransactions} />}
        {active === 'Budgets' && <Budgets budgets={budgets} setBudgets={setBudgets} />}
        {active === 'Tax Estimate' && <TaxEstimate estimate={taxEstimate} setEstimate={setTaxEstimate} />}
        {active === 'Reports' && (
          <Reports reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} reportType={reportType} setReportType={setReportType} reportFormat={reportFormat} setReportFormat={setReportFormat} />
        )}
      </main>

      {showAuthModal && (
        <div className="auth-modal" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e)=>e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowAuthModal(false)}>×</button>
            {authModalMode === 'signin' ? (
              <SignInForm notice={signupNotice} onSuccess={() => { setAuthenticated(true); setShowAuthModal(false); }} onSwitchToSignUp={() => setAuthModalMode('signup')} />
            ) : (
              <SignUpForm onSuccess={(name) => { setUserName(name); setAuthModalMode('signin'); setSignupNotice(`${name}, your account was created. Please sign in.`); }} onSwitchToSignIn={() => setAuthModalMode('signin')} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
