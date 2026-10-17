import Link from 'next/link'

export const metadata = {
  alternates: {
    canonical: '/',
  },
}

const highlights = [
  { number: '01', title: 'Know your water', text: 'A clearer picture of pond conditions, with early signals when readings drift.' },
  { number: '02', title: 'Follow every cycle', text: 'Keep feedings and growth samples connected to the pond they came from.' },
  { number: '03', title: 'Make costs visible', text: 'Bring farm expenses into the same calm, organized daily workflow.' },
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
        <div className="hero-text animate-in">
          <span className="hero-kicker"><span className="status-pulse" /> MADE FOR THE PEOPLE BEHIND THE POND</span>
          <h1>Good water.<br /><em>Good growth.</em><br />A better harvest.</h1>
          <p>A quieter, clearer way to manage your shrimp farm—from the first water check to the final harvest.</p>
          <div className="hero-buttons">
            <Link href="/auth/signup" className="button-primary">Start your farm journal <span aria-hidden="true">→</span></Link>
            <Link href="/auth/signin" className="button-text">I already have an account <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="hero-trust"><span className="trust-avatars"><i>F</i><i>＋</i><i>◌</i></span><span>Made for everyday farm decisions.</span></div>
        </div>

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
        <div className="feature-list">
          {highlights.map((item) => (
            <article className="feature-item" key={item.number}>
              <span className="feature-number">{item.number}</span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer"><Link href="/" className="brand-lockup"><span className="brand-mark">a</span><span>Aqua<span className="brand-light">Dairy</span></span></Link><span>A little more clarity, every day.</span><Link href="/auth/signup">Make a home for your farm <span aria-hidden="true">→</span></Link></footer>
    </main>
  )
}
