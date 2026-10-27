import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Coding Sheets — Crack the Interview, SDE Sheet & CP Sheet',
  description:
    'Curated algorithmic problem sheets benchmarked for Big Tech interviews and competitive programming. Track your progress, write revision notes, and master core data structures and algorithms.',
  openGraph: {
    title: 'Practice Coding Sheets | Code & Coffee',
    description:
      'Master data structures and competitive programming with our curated sheets: Crack the Interview, SDE Sheet, and Codeforces/CodeChef CP Sheet.',
    url: 'https://codeandcoffee.live/practice',
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
