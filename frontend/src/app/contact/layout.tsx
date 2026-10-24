import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Engineering Team',
  description: 'Reach out to the Code & Coffee engineering and editorial team for collaborations, feedback, and questions.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
