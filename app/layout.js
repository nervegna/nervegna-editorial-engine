import './globals.css';

export const metadata = {
  title: 'Nervegna Editorial Engine',
  description: 'AI-native editorial intelligence — agentic AI, generative AI, product design',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/">
            <div className="site-title">Nervegna</div>
            <div className="site-subtitle">Editorial Engine</div>
          </a>
        </header>
        {children}
      </body>
    </html>
  );
}
