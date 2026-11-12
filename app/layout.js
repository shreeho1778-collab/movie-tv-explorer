import './globals.css';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Movie/TV Relationship Exploration System',
  description: 'Explore how films, shows and the people behind them are connected',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
