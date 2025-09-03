// Legacy page; redirect to app/simulation
import { redirect } from 'next/navigation';
export default function LegacySimulationPage() {
  redirect('/simulation');
}
