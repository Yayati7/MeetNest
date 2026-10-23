import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const highlights = [
  { number: "01", title: "Just join", text: "Start with a link. No complicated setup and no noisy dashboard." },
  { number: "02", title: "Feel present", text: "Clear video and simple controls keep attention on the conversation." },
  { number: "03", title: "Stay in sync", text: "Share a screen or send a quick note without leaving your room." }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="landingPageContainer">
      <nav className="landingNav" aria-label="Main navigation">
        <Link className="navHeader" to="/" aria-label="MeetNest home">
          <img src="/meetnest-icon.png" alt="" className="navIcon" />
          <span className="brandName">MeetNest</span>
        </Link>
        <div className="navlist desktopNav">
          <a href="#why-meetnest">Why MeetNest</a>
          <button type="button" className="navTextButton" onClick={() => navigate("/aljk23")}>Join as guest</button>
          <Link className="navSignIn" to="/auth">Sign in <span aria-hidden="true">↗</span></Link>
        </div>
        <button className="hamburger" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
        <div className={`mobileSidebar ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          <button className="closeBtn" type="button" onClick={closeMenu} aria-label="Close menu">×</button>
          <a href="#why-meetnest" onClick={closeMenu}>Why MeetNest</a>
          <button type="button" onClick={() => { navigate("/aljk23"); closeMenu(); }}>Join as guest</button>
          <Link to="/auth" onClick={closeMenu}>Sign in</Link>
        </div>
      </nav>

      <section className="landingHero">
        <div className="heroCopy">
          <span className="eyebrow"><span className="liveDot" /> VIDEO MEETINGS, MADE HUMAN</span>
          <h1>Closer, even<br />when <em>apart.</em></h1>
          <p>A welcoming place to catch up, share ideas, and make every conversation feel a little more personal.</p>
          <div className="heroActions">
            <Link className="primaryAction" to="/auth?mode=signup">Get started <span aria-hidden="true">→</span></Link>
            <button className="secondaryAction" type="button" onClick={() => navigate("/aljk23")}>Join a meeting <span aria-hidden="true">↗</span></button>
          </div>
          <div className="heroTrust"><span className="avatarStack"><i>M</i><i>A</i><i>J</i></span><span>Made for the moments that matter</span></div>
        </div>
        <div className="heroVisual" aria-label="A preview of a video meeting">
          <div className="orbit orbitOne" /><div className="orbit orbitTwo" />
          <div className="heroPhoto"><img src="/mobile.png" alt="Friends sharing a video conversation" /></div>
          <div className="floatingNote noteTop"><span className="noteDot" />Your people, right here</div>
          <div className="floatingNote noteBottom"><span className="noteIcon">✦</span><span>Room to be<br /><strong>in the moment</strong></span></div>
          <div className="heroCounter"><span>01</span><span className="counterLine" /><span>03</span></div>
        </div>
      </section>

      <section className="landingHighlights" id="why-meetnest">
        <div className="highlightsIntro"><span className="eyebrow">A BETTER WAY TO COME TOGETHER</span><h2>Good meetings feel like <em>good company.</em></h2></div>
        <div className="highlightGrid">{highlights.map((item) => <article className="highlightCard" key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <footer className="landingFooter"><Link className="navHeader" to="/"><img src="/meetnest-icon.png" alt="" className="navIcon" /><span className="brandName">MeetNest</span></Link><span>Make room for a better conversation.</span><Link to="/auth">Join MeetNest <span aria-hidden="true">→</span></Link></footer>
    </main>
  );
}
