import Link from 'next/link'
import Image from 'next/image'

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
      <section className="landing-hero">
        <Image
          src="/shrimp-farms-guayas.jpg"
          alt="Satellite view of shrimp farms and mangrove waterways in Ecuador"
          fill
          priority
          sizes="100vw"
          className="landing-hero-image"
        />
        <div className="landing-hero-overlay" aria-hidden="true" />
        <header className="landing-header">
          <Link href="/" className="brand-lockup"><span className="brand-mark">a</span><span>Aqua<span className="brand-light">Dairy</span></span></Link>
          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <Link href="/auth/signin">Log in</Link>
            <Link href="/auth/signup" className="landing-nav-cta">Get started <span aria-hidden="true">↗</span></Link>
          </nav>
        </header>
        <div className="landing-hero-content">
          <div className="hero-text">
            <span className="hero-kicker"><span className="status-pulse" /> BUILT FOR SHRIMP FARMERS</span>
            <h1>Pond precision.<br /><em>Healthier shrimp.</em></h1>
            <p>Real-time water insights, feeding records, and growth tracking—together in one calm view of your farm.</p>
            <span className="telugu-subtitle" lang="te">నీటి నాణ్యత, మేత, రొయ్యల ఎదుగుదల వివరాలు ఒకేచోట సులభంగా చూసుకోండి.</span>
            <div className="hero-buttons">
              <Link href="/auth/signup" className="button-primary">Start logging free <span aria-hidden="true">→</span></Link>
              <a href="#how-it-works" className="hero-secondary">Explore farm tools</a>
            </div>
            <div className="hero-trust">Made for everyday farm decisions.</div>
          </div>
        </div>
        <div className="landing-hero-credit">
          <a
            href="https://commons.wikimedia.org/wiki/File:Shrimp_Farms_of_the_Guayas_Estuary_(153329_-_oli_20240829_lrg).jpg"
            target="_blank"
            rel="noreferrer"
          >
            Satellite imagery: NASA / Landsat 8 · Public domain
          </a>
        </div>
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
        <div className="feature-list">
          {highlights.map((item) => (
            <article className="feature-item" key={item.number}>
              <span className="feature-number">{item.number}</span>
              <div><h3>{item.title}</h3><p>{item.text}</p><span className="telugu-subtitle" lang="te">{item.telugu}</span></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer"><Link href="/" className="brand-lockup"><span className="brand-mark">a</span><span>Aqua<span className="brand-light">Dairy</span></span></Link><span>A little more clarity, every day.</span><Link href="/auth/signup">Make a home for your farm <span aria-hidden="true">→</span></Link></footer>
    </main>
  )
}
