import { useState } from 'react';
import ChatDock from '../components/chat/ChatDock';
import { navigate } from '../lib/router';
import heroImg from '../assets/clinic-hero.jpg';
import { IconBrand, IconSecure, IconPrivate, IconClock, IconChat } from '../components/icons';
import { Button, Badge } from '../components/base';
import './public.css';

const BADGES = [
  { Icon: IconSecure, label: 'Secure' },
  { Icon: IconPrivate, label: 'Private' },
  { Icon: IconClock, label: '24/7' },
];

export default function PublicApp() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);

  const openChat = () => { setChatMounted(true); setChatOpen(true); };
  const toggleChat = () => { setChatMounted(true); setChatOpen((o) => !o); };
  const closeChat = () => setChatOpen(false);

  return (
    <div className="public">
      <header className="public__nav">
        <a className="brand" href="#/">
          <span className="brand__mark" aria-hidden="true"><IconBrand /></span>
          <span className="brand__name">City Care Clinic</span>
        </a>
        <Button variant="secondary" onClick={() => navigate('/admin')}>Admin console</Button>
      </header>

      <main className="public__hero" style={{ '--hero-img': `url(${heroImg})` }}>
        <div className="hero__copy">
          <p className="hero__eyebrow">Single-clinic · Deterministic · Delightful</p>
          <h1 className="hero__title">Book appointments the easy way</h1>
          <p className="hero__lead">
            A friendly chat that helps you book with the right doctor, at the right
            time — in just a few steps.
          </p>
          <div className="hero__cta">
            <Button size="xl" iconLeading={IconChat} onClick={openChat}>Chat with us</Button>
          </div>
          <ul className="hero__badges">
            {BADGES.map(({ Icon, label }) => (
              <li key={label}><Badge color="gray" icon={Icon}>{label}</Badge></li>
            ))}
          </ul>
          <p className="hero__note">
            Your details are used only to schedule your visit.
          </p>
        </div>
      </main>

      <footer className="public__footer">
        Care that starts with a conversation. · Designed for clarity, built for trust.
      </footer>

      <ChatDock open={chatOpen} mounted={chatMounted} onToggle={toggleChat} onClose={closeChat} />
    </div>
  );
}
