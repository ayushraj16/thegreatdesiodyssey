import React from 'react';
import './landing.css';

export function LandingPage({ onStart }) {
  return <section className="odyssey-landing" aria-labelledby="odyssey-title">
    <header className="odyssey-brand"><span className="odyssey-emblem" aria-hidden="true">✦</span> AN ADVENTURE ACROSS INDIA</header>
    <nav className="odyssey-nav" aria-label="About the project">
      <a href="/vision.html">Vision</a>
      <a href="/contribution.html">Contribution</a>
      <a href="/tnc.html">T&amp;C</a>
    </nav>
    <div className="odyssey-intro">
      <div className="odyssey-eyebrow"><span /> BUILDING VIRTUAL BHARAT</div>
      <h1 id="odyssey-title">The Great<br /><span>Desi Odyssey</span></h1>
      <p>Big flavours. Little voxels.<br />One unforgettable journey.</p>
      <button className="odyssey-start" type="button" onClick={onStart}>Chaliye Shuru karte hain <span aria-hidden="true">↗</span></button>
      <div className="odyssey-start-note">Your adventure begins in Maharashtra.</div>
    </div>
    <footer className="odyssey-footer">
      <a className="odyssey-pixellon" href="https://pixellon.in" target="_blank" rel="noreferrer">Built by Pixellon</a>
      <a className="odyssey-coffee" href="https://buymeacoffee.com/aayushraj1q" target="_blank" rel="noreferrer">☕ Buy me a coffee</a>
    </footer>
  </section>;
}
