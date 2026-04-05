import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { MobileNav } from '@/components/MobileNav'
import styles from './dashboard.module.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/onboarding')

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar
        userName={profile.full_name}
        companyName={(profile as any).companies?.name || 'Minha Empresa'}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
