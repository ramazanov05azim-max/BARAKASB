import { redirect } from 'next/navigation';
import { universalApplicationRoutes } from '@/features/universal-application/routes';

export default function InvalidUniversalApplicationRoute() {
  redirect(universalApplicationRoutes.root);
}
