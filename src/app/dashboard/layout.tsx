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
    .single() as { data: { full_name: string; company_id: string; companies: { id: string; name: string } } | null }

  if (!profile?.company_id) redirect('/onboarding')

  // Fetch all companies owned by this user for the Agency plan
  const { data: ownedCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('owner_id', user.id)

  const userCompanies = ownedCompanies || []
  const currentCompany = profile?.companies

  // If the user's active company is not in the owned list (e.g. they don't own it but are added to it), we should still include it in the switcher list
  if (currentCompany && !userCompanies.find(c => c.id === currentCompany.id)) {
    userCompanies.push({ id: currentCompany.id, name: currentCompany.name })
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar
        userName={profile.full_name}
        companyName={currentCompany?.name || 'Minha Empresa'}
        activeCompanyId={currentCompany?.id || ''}
        userCompanies={userCompanies}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
