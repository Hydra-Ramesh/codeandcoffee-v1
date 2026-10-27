import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sample User Practice Activity...');

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['alex.dev@gmail.com', 'sarah.codes@outlook.com', 'dasramesh8343003905@gmail.com'],
      },
    },
  });

  const questions = await prisma.practiceQuestion.findMany({
    where: { isPublished: true },
    take: 12,
  });

  if (users.length === 0 || questions.length === 0) {
    console.log('⚠️ Not enough users or questions found.');
    return;
  }

  const sampleNotes = [
    'Used two-pointer technique. Remember to sort first to avoid O(N^2) duplicates.',
    'Tricky base case: empty array or single element. Hash map handles negative numbers smoothly.',
    'Classic Kadane algorithm. Do not reset sum to 0 if all elements are negative!',
    'Sliding window with character set. Time complexity O(N), Space complexity O(min(m, n)).',
    'Dynamic programming memoization reduced recursion from 2^N to O(N * Capacity).',
    'Codeforces greedy approach: check parity of N first.',
  ];

  let count = 0;
  for (const user of users) {
    // Each user solves a few questions
    const userQuestions = questions.slice(0, user.email.includes('alex') ? 6 : 4);

    for (let i = 0; i < userQuestions.length; i++) {
      const q = userQuestions[i];
      const hasNote = i % 2 === 0;

      await prisma.userPracticeProgress.upsert({
        where: {
          userId_questionId: {
            userId: user.id,
            questionId: q.id,
          },
        },
        update: {
          isCompleted: true,
          notes: hasNote ? sampleNotes[i % sampleNotes.length] : null,
          completedAt: new Date(Date.now() - i * 3600000),
          updatedAt: new Date(Date.now() - i * 1800000),
        },
        create: {
          userId: user.id,
          questionId: q.id,
          isCompleted: true,
          notes: hasNote ? sampleNotes[i % sampleNotes.length] : null,
          completedAt: new Date(Date.now() - i * 3600000),
          updatedAt: new Date(Date.now() - i * 1800000),
        },
      });
      count++;
    }
  }

  console.log(`✅ Seeded ${count} practice activity records for demo users!`);
}

main()
  .catch((e) => {
    console.error('Error seeding activity:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
