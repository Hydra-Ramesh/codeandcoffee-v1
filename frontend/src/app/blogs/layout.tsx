import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Blogs',
  description: 'Deep architectural blueprints, system design breakdowns, and production tutorials.',
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
