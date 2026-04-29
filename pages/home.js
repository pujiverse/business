// Home — dashboard summary across customers, expenses and loans.

import { db } from '../db.js';
import { mount, esc, inr } from '../ui.js';

export async function renderHome(target) {
  mount(target, `<div class="text-slate-500">Loading dashboard…</div>`);
  const supabase = db();

  // Fire all reads in parallel for speed.
  const [cust, custTx, expenses, loans, loanTx] = await Promise.all([
    supabase.from('customers').select('*'),
    supabase.from('customer_transactions').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('loans').select('*'),
    supabase.from('loan_transactions').select('*'),
  ]);

  // Roll up totals.
  const given     = sum(custTx.data, 'Given');
  const received  = sum(custTx.data, 'Received');
  const balance   = given - received;
  const income    = sumExp(expenses.data, 'Income');
  const expense   = sumExp(expenses.data, 'Expense');
  const loanGiven = sumLoans(loans.data, 'Given');
  const loanTaken = sumLoans(loans.data, 'Taken');
  const loanPaid  = sum(loanTx.data, 'Payment');

  const cards = [
    { label: 'Customers',        value: (cust.data || []).length,  icon: '👥', color: 'bg-blue-500'   },
    { label: 'Money Given Out',  value: inr(given - received),     icon: '↗️', color: 'bg-emerald-500' },
    { label: 'Net Income',       value: inr(income - expense),     icon: '💰', color: 'bg-violet-500' },
    { label: 'Loan Balance',     value: inr((loanTaken + loanGiven) - loanPaid), icon: '🏦', color: 'bg-amber-500' },
  ];

  // Last 5 entries across all activity, mixed.
  const recent = [
    ...(custTx.data || []).map((t) => ({
      date: t.date,
      label: `${t.type} for customer #${t.customer_id}`,
      amount: t.amount,
      negative: t.type === 'Received'
    })),
    ...(expenses.data || []).map((t) => ({
      date: t.expense_date,
      label: `${t.type}: ${t.description}`,
      amount: t.amount,
      negative: t.type === 'Expense'
    })),
    ...(loanTx.data || []).map((t) => ({
      date: t.date,
      label: `${t.type} on loan #${t.loan_id}`,
      amount: t.amount,
      negative: t.type === 'Disbursement'
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 7);

  mount(target, `
    <h1 class="text-3xl font-bold mb-2">Welcome back</h1>
    <p class="text-slate-500 mb-6">Here is a quick view of your business today.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${cards.map(c => `
        <div class="card flex items-center gap-4">
          <div class="${c.color} text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl">${c.icon}</div>
          <div>
            <div class="text-sm text-slate-500">${esc(c.label)}</div>
            <div class="text-xl font-bold">${esc(c.value)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h2 class="text-lg font-semibold mb-3">Quick actions</h2>
        <div class="grid grid-cols-2 gap-2">
          <a href="#/customers" class="btn btn-ghost border border-slate-200 dark:border-slate-700 justify-center">+ Customer entry</a>
          <a href="#/expenses"  class="btn btn-ghost border border-slate-200 dark:border-slate-700 justify-center">+ Expense / Income</a>
          <a href="#/loans"     class="btn btn-ghost border border-slate-200 dark:border-slate-700 justify-center">+ Loan payment</a>
          <a href="#/reports"   class="btn btn-ghost border border-slate-200 dark:border-slate-700 justify-center">📊 Open reports</a>
          <a href="#/settings"  class="btn btn-ghost border border-slate-200 dark:border-slate-700 justify-center col-span-2">⬆ Bulk import / Backup</a>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold mb-3">Recent activity</h2>
        ${recent.length === 0
          ? `<p class="text-slate-500 text-sm">Nothing yet — go add your first entry.</p>`
          : `<ul class="space-y-2">
               ${recent.map(r => `
                 <li class="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0">
                   <div>
                     <div class="text-sm">${esc(r.label)}</div>
                     <div class="text-xs text-slate-500">${esc(r.date || '')}</div>
                   </div>
                   <div class="font-semibold ${r.negative ? 'text-red-600' : 'text-green-600'}">
                     ${r.negative ? '-' : '+'}${esc(inr(r.amount))}
                   </div>
                 </li>`).join('')}
             </ul>`
        }
      </div>
    </div>
  `);
}

function sum(rows, type) {
  return (rows || []).filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount || 0), 0);
}
function sumExp(rows, type) {
  return (rows || []).filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount || 0), 0);
}
function sumLoans(rows, type) {
  return (rows || []).filter((r) => r.type === type).reduce((s, r) => s + Number(r.principal || 0), 0);
}
