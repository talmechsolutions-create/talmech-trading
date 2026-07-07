'use client';

import { useMemo, useState } from 'react';

const statuses = ['Open', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'];

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminTicketsConsole({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => tickets.filter((ticket) => !query || JSON.stringify(ticket).toLowerCase().includes(query.toLowerCase())), [tickets, query]);

  async function updateTicket(ticketId: string, patch: any) {
    const res = await fetch(`/api/admin/support-tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: 'Unable to update ticket.' }));
    if (res.ok) {
      setTickets((rows) => rows.map((ticket) => ticket.ticketId === ticketId ? res.ticket : ticket));
      setMessage(`${ticketId} updated.`);
    } else {
      setMessage(res.error || 'Unable to update ticket.');
    }
  }

  return (
    <main className="adminShell section">
      <div className="container">
        <span className="eyebrow">Client support</span>
        <h1 className="pageTitle">Support tickets</h1>
        <p className="muted">Tickets raised from the client workspace. Admin notes stay protected.</p>
        <div className="panel adminToolbar listingAdminToolbar">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, firm, subject, status..." />
        </div>
        {message && <p className="notice">{message}</p>}
        <div className="adminTicketGrid">
          {filtered.map((ticket) => (
            <article className="card adminTicketCard" key={ticket.ticketId}>
              <div className="row">
                <div>
                  <span className="pill">{ticket.status}</span>
                  <h2>{ticket.subject}</h2>
                  <p className="muted">{ticket.ticketId} / {ticket.category} / {ticket.priority} / {formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="userDetailGrid">
                <p><b>Firm:</b> {ticket.firmName || '-'}</p>
                <p><b>Contact:</b> {ticket.contactName || '-'}</p>
                <p><b>Email:</b> {ticket.email || '-'}</p>
                <p><b>Mobile:</b> {ticket.mobile || '-'}</p>
              </div>
              <p>{ticket.message}</p>
              <label>Status<select value={ticket.status} onChange={(event) => updateTicket(ticket.ticketId, { status: event.target.value, adminNote: ticket.adminNote })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Internal admin note<textarea value={ticket.adminNote || ''} onChange={(event) => setTickets((rows) => rows.map((row) => row.ticketId === ticket.ticketId ? { ...row, adminNote: event.target.value } : row))} /></label>
              <div className="waActionRow">
                <button className="btn" type="button" onClick={() => updateTicket(ticket.ticketId, { status: ticket.status, adminNote: ticket.adminNote })}>Save note</button>
                <button className="btn secondary" type="button" onClick={() => updateTicket(ticket.ticketId, { status: 'Resolved', adminNote: ticket.adminNote, reply: 'Marked resolved by Talmech admin.' })}>Mark resolved</button>
              </div>
            </article>
          ))}
          {!filtered.length && <div className="panel"><b>No tickets found.</b><p className="muted">Client support tickets will appear here after users raise them from /account/help.</p></div>}
        </div>
      </div>
    </main>
  );
}
