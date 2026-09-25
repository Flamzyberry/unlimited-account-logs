import Link from 'next/link';

const links = {
  telegram: '',
  whatsapp: '',
  support: '',
};

function TelegramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 4.1 18.2 20c-.25 1.12-.91 1.4-1.85.87l-5.1-3.76-2.46 2.37c-.27.27-.5.5-1.02.5l.36-5.2 9.47-8.55c.41-.36-.09-.56-.64-.2L5.26 13.3.19 11.72c-1.1-.34-1.12-1.1.23-1.63L20.2 2.55c.91-.34 1.7.2 1.3 1.55Z"/></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.7 11.7 0 0 0 12.15.05C5.7.05.45 5.3.45 11.75c0 2.07.54 4.08 1.57 5.85L.35 23.95l6.5-1.63a11.7 11.7 0 0 0 5.3 1.27h.01c6.45 0 11.7-5.25 11.7-11.7 0-3.13-1.2-6.08-3.36-8.39ZM12.16 21.52h-.01a9.74 9.74 0 0 1-4.97-1.36l-.36-.21-3.86.97 1.03-3.76-.23-.39a9.75 9.75 0 1 1 8.4 4.75Zm5.35-7.31c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.73.94-.89 1.13-.16.2-.33.22-.61.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.49.14-.16.19-.28.29-.47.1-.2.05-.37-.02-.52-.07-.15-.64-1.55-.87-2.12-.23-.56-.46-.48-.64-.49h-.55c-.2 0-.52.07-.8.37-.27.29-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.7-.69 1.94-1.35.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.55-.34Z"/></svg>;
}

function SupportIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1v-6H5v-1a7 7 0 0 1 14 0v1h-2v6h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9Zm-5 11h2v5H7v-5Zm8 0h2v5h-2v-5Zm-4 7h2v2h-2v-2Z"/></svg>;
}

export default function FloatingContactTabs() {
  const items = [
    { label: 'Telegram Channel', href: links.telegram, className: 'telegram', icon: <TelegramIcon /> },
    { label: 'WhatsApp Channel', href: links.whatsapp, className: 'whatsapp', icon: <WhatsAppIcon /> },
    { label: 'Customer Support', href: links.support, className: 'support', icon: <SupportIcon /> },
  ];

  return (
    <div className="floating-contact-tabs" aria-label="Contact links">
      {items.map((item) => (
        item.href ? (
          <Link key={item.label} href={item.href} className={`floating-contact-tab ${item.className}`} target="_blank" rel="noopener noreferrer">
            <span className="floating-contact-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ) : (
          <span key={item.label} className={`floating-contact-tab ${item.className} floating-contact-disabled`} aria-disabled="true">
            <span className="floating-contact-icon">{item.icon}</span>
            <span>{item.label}</span>
          </span>
        )
      ))}
    </div>
  );
}
