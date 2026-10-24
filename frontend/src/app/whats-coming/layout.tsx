import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "What's Coming? • Job-Ready Roadmap | Code & Coffee",
  description:
    'Explore our upcoming Job-Ready engineering ecosystem: AI & LLMs, DSA Mastery, High-Scale System Design, DevOps & Cloud, Modern Fullstack, and Competitive Programming across 4 pillars: Learn, Practice, Read, Apply.',
  openGraph: {
    title: "What's Coming? • Job-Ready Roadmap | Code & Coffee",
    description:
      'Explore our upcoming Job-Ready engineering ecosystem: AI & LLMs, DSA Mastery, High-Scale System Design, DevOps, and Coding.',
    url: 'https://codeandcoffee.live/whats-coming',
  },
};

export default function WhatsComingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
