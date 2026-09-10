import type { Metadata } from 'next';
import MessageReader from '@/components/message-reader';
export const metadata: Metadata = { title: '메시지 | WYD Messenger', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function MessagePage() { return <MessageReader/>; }
