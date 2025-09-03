// Legacy page; redirect to app route
import { redirect } from 'next/navigation';
export default function LegacySessionPage() {
  redirect('/');
}
