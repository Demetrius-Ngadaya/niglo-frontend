'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';

// Logs one visit per browser session — not per page view — so the count in
// the admin dashboard means "how many distinct visitors," matching how
// "visitor" analytics are normally understood. Location comes from the
// backend resolving the visitor's IP address; nothing here ever asks the
// browser for GPS/precise location permission.
export default function VisitorTracker() {
  useEffect(() => {
    const KEY = 'niglo_visitor_session';
    if (sessionStorage.getItem(KEY)) return;

    const sessionId =
      crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(KEY, sessionId);

    fetch(`${API_URL}/visitor-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, landing_page: window.location.pathname }),
    }).catch(() => {
      // Silent — analytics should never surface an error to the visitor.
    });
  }, []);

  return null;
}
