import ChatWidget from '../components/chat/ChatWidget';
import { navigate } from '../lib/router';
import heroImg from '../assets/clinic-hero.jpg';
import './public.css';

const BADGES = [
  { icon: '🛡️', label: 'Secure' },
  { icon: '🔒', label: 'Private' },
  { icon: '🕐', label: '24/7' },
];

export default function PublicApp() {
  return (
    <div className="public">
      <header className="public__nav">
        <a className="brand" href="#/">
          <span className="brand__mark" aria-hidden="true">🩺</span>
          <span className="brand__name">City Care Clinic</span>
        </a>
        <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
          Admin console
        </button>
      </header>

      <main className="public__hero" style={{ '--hero-img': `url(${heroImg})` }}>
        <div className="hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow">Single-clinic · Deterministic · Delightful</p>
          <h1 className="hero__title">Book appointments the easy way</h1>
          <p className="hero__lead">
            A friendly chat that helps you book with the right doctor, at the right
            time — in just a few steps.
          </p>
          <ul className="hero__badges">
            {BADGES.map((b) => (
              <li key={b.label} className="pill pill-muted">
                <span aria-hidden="true">{b.icon}</span> {b.label}
              </li>
            ))}
          </ul>
          <p className="hero__note">
            Your details are used only to schedule your visit.
          </p>
        </div>

        <div className="hero__chat">
          <ChatWidget />
        </div>
        </div>
      </main>

      <footer className="public__footer">
        Care that starts with a conversation. · Designed for clarity, built for trust.
      </footer>
    </div>
  );
}
