import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Write for Us • Become a Contributor',
  description: 'Publish deep engineering articles, case studies, and tutorials on Code & Coffee.',
};

export default function BecomeContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
