import { getSession } from '@/lib/session';
import HomeClient from '@/components/HomeClient';
import { redirect } from 'next/navigation';
import { getPersonnel } from '@/app/admin/personnel/actions';
import { getUserByEmail } from '@/lib/auth-db';

export default async function Home() {
  const session = await getSession();

  if (!session || !session.email) {
    redirect('/login');
  }

  const user = await getUserByEmail(session.email);
  const isAdmin = user?.role === 'Admin';
  const personnel = await getPersonnel();

  return <HomeClient isAdmin={isAdmin} personnel={personnel} userEmail={session.email} userName={user?.name} />;
}
