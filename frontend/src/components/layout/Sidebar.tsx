import React from 'react';
import { Page } from '../../types';
import { getCurrentUser } from '../../services/storage';

export default function Sidebar({ userName, active, setActive }: { userName: string; active: Page; setActive: (p: Page) => void }) {
  const navItems: Page[] = ['Dashboard', 'Transactions', 'Budgets', 'Tax Estimate', 'Reports'];
  const cur = getCurrentUser();
  const displayName = userName || (cur?.fullName || cur?.username || 'User');

  return (
    <aside className="sidebar">
      <div className="brand">TaxPal</div>
      <nav>
        {navItems.map((item) => (
          <button key={item} className={item === active ? 'nav-button active' : 'nav-button'} onClick={() => setActive(item)}>{item}</button>
        ))}
      </nav>
    </aside>
  );
}
