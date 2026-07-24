import { getSession } from '@/lib/session';
import HomeClient from '@/components/HomeClient';
import { redirect } from 'next/navigation';
import { getPersonnel } from '@/app/admin/personnel/actions';
import { getUserByEmail } from '@/lib/auth-db';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const session = await getSession();

  if (!session || !session.email) {
    redirect('/login');
  }

  const user = await getUserByEmail(session.email);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Admin' || session.email === 'kkoandres@gmail.com';
  const personnel = await getPersonnel();

  // Get count of pending users awaiting admin activation
  const pendingUsersCount = isAdmin
    ? await prisma.user.count({ where: { status: 'pending' } })
    : 0;

  // Get Reprogramacion notifications
  const reprogramacionNotificationCount = (!isAdmin && user?.role !== 'COORDINADOR')
    ? await prisma.agendaBlock.count({
        where: { assignedToEmail: user?.email, status: 'Pendiente' }
      })
    : 0;

  return (
    <HomeClient
      isAdmin={isAdmin}
      userRole={user?.role || 'USUARIO'}
      personnel={personnel}
      userEmail={session?.email || undefined}
      userName={user?.name || undefined}
      accessLogistica={isAdmin || (user?.accessLogistica ?? false)}
      accessSolicitudes={isAdmin || (user?.accessSolicitudes ?? false)}
      accessReservas={isAdmin || (user?.accessReservas ?? false)}
      accessAgendas={isAdmin || (user?.accessAgendas ?? false)}
      accessDemanda={isAdmin || (user?.accessDemanda ?? false)}
      accessReprogramacion={isAdmin || (user?.accessReprogramacion ?? false)}
      pendingUsersCount={pendingUsersCount}
      reprogramacionNotificationCount={reprogramacionNotificationCount}
    />
  );
}
