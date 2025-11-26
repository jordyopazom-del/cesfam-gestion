import { getSession } from '@/lib/session';
import HomeClient from '@/components/HomeClient';
import { redirect } from 'next/navigation';

const ADMIN_EMAILS = [
  'calvarado@munifutrono.cl',
  'some.cesfam@munifutrono.cl',
  'gestiondemandafutrono@munifutrono.cl',
  'convenioscesfam@munifutrono.cl'
];

export default async function Home() {
  const session = await getSession();

  if (!session || !session.email) {
    redirect('/login');
  }

  const isAdmin = ADMIN_EMAILS.includes(session.email.toLowerCase());

  return <HomeClient isAdmin={isAdmin} />;
}
