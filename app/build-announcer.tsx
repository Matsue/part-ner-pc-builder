'use client';

import { useEffect, useState } from 'react';
import { describeBuildUpdate } from '@/lib/accessibility/build-announcements';
import { buildStore } from '@/lib/store/build-store';

export function BuildAnnouncer() {
  const [announcement, setAnnouncement] = useState({ message: '', sequence: 0 });
  useEffect(() => buildStore.subscribe((current, previous) => {
    const message = describeBuildUpdate(previous, current);
    if (message) setAnnouncement((last) => ({ message, sequence: last.sequence + 1 }));
  }), []);

  return (
    <output className="sr-only" aria-live="polite" aria-atomic="true">
      <span key={announcement.sequence}>{announcement.message}</span>
    </output>
  );
}
