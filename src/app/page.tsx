import Link from 'next/link'
import { AnimatedButton, AnimatedCard } from '@/components/ui/animated-elements'
import { RevealContainer, RevealItem } from '@/components/ui/reveal-on-scroll'

export const metadata = {
  alternates: {
    canonical: '/',
  },
}

const highlights = [
  { number: '01', title: 'Know your water', text: 'A clearer picture of pond conditions, with early signals when readings drift.', telugu: 'చెరువు నీటి పరిస్థితిని గమనించి, మార్పులను ముందే గుర్తించండి.' },
  { number: '02', title: 'Follow every cycle', text: 'Keep feedings and growth samples connected to the pond they came from.', telugu: 'మేత, ఎదుగుదల వివరాలు ఏ చెరువువో మర్చిపోకుండా ఒకచోట చూడండి.' },
  { number: '03', title: 'Make costs visible', text: 'Bring farm expenses into the same calm, organized daily workflow.', telugu: 'ఫారం ఖర్చులన్నీ ఒకచోట రాసి, ఎక్కడ ఎంత ఖర్చవుతోందో తెలుసుకోండి.' },
]

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark">a</span><span>Aqua<span className="brand-light">Dairy</span></span></Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/auth/signin">Sign in</Link>
          <Link href="/auth/signup" className="landing-nav-cta">Get started <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <RevealContainer className="hero-text">
          <RevealItem><span className="hero-kicker"><span className="status-pulse" /> MADE FOR THE PEOPLE BEHIND THE POND</span></RevealItem>
          <RevealItem><h1>Good water.<br /><em>Good growth.</em><br />A better harvest.</h1></RevealItem>
          <RevealItem><p>A quieter, clearer way to manage your shrimp farm—from the first water check to the final harvest.</p></RevealItem>
          <RevealItem><span className="telugu-subtitle" lang="te">నీటి పరీక్ష నుంచి కోత వరకు, మీ రొయ్యల ఫారం వివరాలన్నీ ఒకచోట సులభంగా చూసుకోండి.</span></RevealItem>
          <RevealItem>
            <div className="hero-buttons">
              <AnimatedButton href="/auth/signup" variant="primary" className="!border-teal-700/20 !bg-teal-700 !text-white hover:!border-teal-600 hover:!bg-teal-600">Start your farm journal <span aria-hidden="true">→</span></AnimatedButton>
              <AnimatedButton href="/auth/signin" variant="outline" className="!border-slate-300 !bg-transparent !text-slate-700 hover:!border-teal-600 hover:!bg-teal-50">I already have an account <span aria-hidden="true">↗</span></AnimatedButton>
            </div>
          </RevealItem>
          <RevealItem><div className="hero-trust"><span className="trust-avatars"><i>F</i><i>＋</i><i>◌</i></span><span>Made for everyday farm decisions.</span></div></RevealItem>
        </RevealContainer>

        <div className="landing-visual animate-in animate-delay" aria-label="Illustration of a shrimp pond">
          <div className="visual-topline"><span>SAMPLE POND&nbsp; / &nbsp;001</span><span>16° 32&apos; N&nbsp; · &nbsp;81° 43&apos; E</span></div>
          <div className="illustration-sky"><span className="illustration-sun" /><span className="sky-bird bird-a">⌁</span><span className="sky-bird bird-b">⌁</span></div>
          <div className="illustration-horizon" />
          <div className="pond-water">
            <span className="water-shimmer shimmer-a" /><span className="water-shimmer shimmer-b" /><span className="water-shimmer shimmer-c" />
            <span className="water-ripple ring-a" /><span className="water-ripple ring-b" />
            <span className="shrimp-shape">⌁</span><span className="shrimp-shape shrimp-two">⌁</span>
            <span className="pond-data data-left"><small>WATER TEMP</small><strong>28.4° <i>C</i></strong><b><span /> IN RANGE</b></span>
            <span className="pond-data data-right"><small>OXYGEN</small><strong>5.8 <i>mg/L</i></strong><b><span /> LOOKING GOOD</b></span>
          </div>
          <div className="visual-bottomline"><span>YOUR POND, IN GOOD HANDS</span><span className="visual-live"><i /> FARM JOURNAL</span></div>
          <span className="visual-sticker">GROW<br />WELL <span>✳</span></span>
        </div>
        <div className="hero-side-note">LESS GUESSWORK <span>✳</span> MORE GOOD GROWTH</div>
      </section>

      <section className="landing-ribbon" aria-label="Aqua Dairy features">
        <span>WATER QUALITY</span><i>✳</i><span>FEED JOURNAL</span><i>✳</i><span>GROWTH TRACKING</span><i>✳</i><span>FARM FINANCES</span><i>✳</i><span>WATER QUALITY</span>
      </section>

      <section className="landing-features" id="how-it-works">
        <div className="features-intro">
          <span className="eyebrow">THE WHOLE POND PICTURE</span>
          <h2>Less scattered notes.<br /><em>More confident calls.</em></h2>
          <p>Good farming happens in the little details. Aqua Dairy gives those details a home, so you can spend less time looking back and more time looking ahead.</p>
          <Link href="/auth/signup" className="text-link">See what your farm can do <span aria-hidden="true">→</span></Link>
        </div>
        <RevealContainer className="feature-list">
          {highlights.map((item) => (
            <RevealItem key={item.number}>
              <article className="feature-item">
                <span className="feature-number">{item.number}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p><span className="telugu-subtitle" lang="te">{item.telugu}</span></div>
                <span className="feature-arrow" aria-hidden="true">↗</span>
              </article>
            </RevealItem>
          ))}
        </RevealContainer>
      </section>
      <section className="agency-showcase" aria-labelledby="agency-showcase-title">
        <RevealContainer className="agency-showcase-inner">
          <RevealItem>
            <div className="agency-showcase-heading">
              <span className="agency-kicker">THE FARM, IN FOCUS</span>
              <h2 id="agency-showcase-title">Everything connected.<br /><span>Nothing lost.</span></h2>
              <p>Clear signals across water, feeding, and growth—so the next decision feels a little more certain.</p>
            </div>
          </RevealItem>
          <div className="agency-feature-grid">
            {[
              { number: '01', title: 'Water, understood', description: 'Track daily pond readings and catch changes before they become bigger problems.', icon: '◌' },
              { number: '02', title: 'Every feed accounted for', description: 'Keep one-feeding entries or a complete daily summary with the right cycle.', icon: '◈' },
              { number: '03', title: 'Growth with context', description: 'Connect each sample and cost back to the pond and batch it belongs to.', icon: '↗' },
            ].map((feature) => (
              <RevealItem key={feature.number}>
                <AnimatedCard className="agency-feature-card">
                  <span className="agency-feature-icon" aria-hidden="true">{feature.icon}</span>
                  <span className="agency-feature-number">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="agency-feature-arrow" aria-hidden="true">↗</span>
                </AnimatedCard>
              </RevealItem>
            ))}
          </div>
          <RevealItem>
            <AnimatedButton href="/auth/signup" variant="primary">Start your farm journal <span aria-hidden="true">→</span></AnimatedButton>
          </RevealItem>
        </RevealContainer>
      </section>
      <footer className="landing-footer"><Link href="/" className="brand-lockup"><span className="brand-mark">a</span><span>Aqua<span className="brand-light">Dairy</span></span></Link><span>A little more clarity, every day.</span><Link href="/auth/signup">Make a home for your farm <span aria-hidden="true">→</span></Link></footer>
    </main>
  )
}
