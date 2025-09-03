// Legacy page; redirect to app/summary
import { redirect } from 'next/navigation';
export default function LegacySummaryPage() {
  redirect('/summary');
}
