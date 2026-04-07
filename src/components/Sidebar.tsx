'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/quotes/new',
    label: 'Novo Orçamento',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: true,
  },
  {
    href: '/dashboard/quotes',
    label: 'Orçamentos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/services',
    label: 'Serviços',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/changelog',
    label: 'Novidades',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Configurações',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
]

export function Sidebar({ 
  userName, 
  companyName, 
  activeCompanyId, 
  userCompanies,
  avatarUrl,
}: { 
  userName: string, 
  companyName: string,
  activeCompanyId?: string,
  userCompanies?: { id: string, name: string }[],
  avatarUrl?: string | null,
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompanyId) return;
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Update active company in profile
    await supabase.from('profiles').update({ company_id: companyId }).eq('id', user.id)
    
    // Reload page to reflect new company context
    window.location.reload()
  }

  const avatarElement = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
  ) : (
    companyName.charAt(0).toUpperCase()
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="url(#gradSB)" strokeWidth="2" fill="none"/>
            <path d="M10 18C10 14 13 10 16 10C19 10 22 14 22 18C22 22 19 24 16 24C13 24 10 22 10 18Z" fill="url(#gradSB)"/>
            <circle cx="14" cy="16" r="1.5" fill="#0F1419"/>
            <defs><linearGradient id="gradSB" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#00D4AA"/><stop offset="100%" stopColor="#0A66C2"/></linearGradient></defs>
          </svg>
          <span>OrcaIA</span>
        </div>
        <div className={styles.companyInfo}>
          {userCompanies && userCompanies.length > 1 ? (
            <div className={styles.switcherContainer}>
              <div className={styles.companyAvatar}>
                {avatarElement}
              </div>
              <div className={styles.switcherWrapper}>
                <select 
                  className={styles.companySwitcher}
                  value={activeCompanyId}
                  onChange={(e) => handleSwitchCompany(e.target.value)}
                >
                  {userCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className={styles.switcherChevron}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.singleCompany}>
              <div className={styles.companyAvatar}>
                {avatarElement}
              </div>
              <span className={styles.companyName}>{companyName}</span>
            </div>
          )}
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.accent ? styles.accent : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>
  )
}
