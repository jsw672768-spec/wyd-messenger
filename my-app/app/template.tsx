import type { ReactNode } from 'react';
import EventNotifications from '@/components/event-notifications';

// Keep framework-only route params on the server side of the RSC boundary.
export default function Template({ children }: { children: ReactNode }) {
  return <EventNotifications>{children}</EventNotifications>;
}
