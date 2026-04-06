import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.landing}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" stroke="url(#grad)" strokeWidth="2" fill="none"/>
              <path d="M10 18C10 14 13 10 16 10C19 10 22 14 22 18C22 22 19 24 16 24C13 24 10 22 10 18Z" fill="url(#grad)"/>
              <circle cx="14" cy="16" r="1.5" fill="#0F1419"/>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#00D4AA"/>
                  <stop offset="100%" stopColor="#0A66C2"/>
                </linearGradient>
              </defs>
            </svg>
            <span>OrcaIA</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/login" className="btn btn-ghost">Entrar</Link>
            <Link href="/signup" className="btn btn-accent">Começar Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <span className={styles.heroTagDot} />
            Potencializado por Inteligência Artificial
          </div>
          <h1 className={styles.heroTitle}>
            Orçamentos <span className={styles.gradient}>profissionais</span>
            <br />em segundos
          </h1>
          <p className={styles.heroSubtitle}>
            Cadastre seus serviços uma vez. A IA conversa com você e gera orçamentos
            completos em PDF — prontos para enviar ao cliente.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-accent btn-lg">
              Começar Grátis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link href="#como-funciona" className="btn btn-ghost btn-lg">
              Como funciona?
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <section className={styles.features} id="como-funciona">
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'var(--color-accent-light)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Cadastre seus serviços</h3>
            <p>Descreva o que sua empresa faz, com preços e unidades. Faça isso uma única vez.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'var(--color-primary-light)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Converse com a IA</h3>
            <p>Diga o que o cliente precisa em linguagem natural. A IA monta o orçamento pra você.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h3>Baixe em PDF</h3>
            <p>Orçamento profissional com logo, tabela de serviços e termos de pagamento.</p>
          </div>
        </section>

        {/* Pricing */}
        <section className={styles.pricing} id="precos">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Planos para todos os tamanhos</h2>
            <p className={styles.sectionSubtitle}>Escolha o plano ideal para a sua empresa crescer.</p>
          </div>
          <div className={styles.pricingGrid}>
            {/* Free Card */}
            <div className={styles.priceCard}>
              <h3>Grátis</h3>
              <div className={styles.priceValue}>R$ 0<span>/mês</span></div>
              <ul className={styles.priceFeatures}>
                <li>3 serviços cadastrados</li>
                <li>5 orçamentos p/ mês</li>
                <li>Chat com IA</li>
                <li>Design padrão</li>
              </ul>
              <Link href="/signup" className="btn btn-ghost w-full">Começar Agora</Link>
            </div>
            {/* Pro Card */}
            <div className={`${styles.priceCard} ${styles.popular}`}>
              <div className={styles.popularBadge}>Mais Popular</div>
              <h3>Profissional</h3>
              <div className={styles.priceValue}>R$ 49,90<span>/mês</span></div>
              <ul className={styles.priceFeatures}>
                <li>Orçamentos ilimitados</li>
                <li>Serviços ilimitados</li>
                <li>Chat com IA avançado</li>
                <li>Logo personalizada no PDF</li>
                <li>Suporte prioritário</li>
              </ul>
              <Link href="/signup" className="btn btn-accent w-full">Assinar Pro</Link>
            </div>
            {/* Agency Card */}
            <div className={`${styles.priceCard} ${styles.agency}`}>
              <div className={styles.agencyBadge}>Para Multi-Empresas</div>
              <h3>Agência / Contador</h3>
              <div className={styles.priceValue}>R$ 149,90<span>/mês</span></div>
              <ul className={styles.priceFeatures}>
                <li>Até 5 empresas / clientes</li>
                <li>Tudo do plano Profissional</li>
                <li>Upload de Timbrado próprio</li>
                <li>Suporte Premium Dedicado</li>
                <li>Relatórios Consolidados</li>
              </ul>
              <Link href="/signup" className="btn btn-primary w-full">Assinar Agência</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} OrcaIA — Feito com IA para facilitar sua vida.</p>
      </footer>
    </div>
  )
}
