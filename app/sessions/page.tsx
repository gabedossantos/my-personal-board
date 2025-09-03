import Link from 'next/link';
import { Suspense } from 'react';

async function fetchSessions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/conversations/recent`, { cache: 'no-store' });
  if (!res.ok) return { success: false, sessions: [] } as any;
  return res.json();
}

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const data = await fetchSessions();
  const sessions = data.success ? data.sessions : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4">Recent Sessions</h1>
        <p className="text-sm text-gray-600 mb-6">Pick up where you left off. Click a session to resume.</p>
        <Suspense fallback={<div>Loading…</div>}>
          <ul className="divide-y">
            {sessions.map((s: any) => (
              <li key={s.sessionId} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{s.projectName}</div>
                  <div className="text-xs text-gray-500">{s.sessionId} • {new Date(s.updatedAt).toLocaleString()} • {s.status} • {s.phase}</div>
                </div>
                <Link href={`/conversation/${s.sessionId}`} className="text-emerald-600 hover:text-emerald-700 text-sm">
                  Open →
                </Link>
              </li>
            ))}
          </ul>
          {sessions.length === 0 && (
            <div className="text-sm text-gray-500">No sessions yet.</div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
