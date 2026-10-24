import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Our Mission',
  description: 'Empowering engineering talent with deep technical principles, high-scale system design, and job-ready skills.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
