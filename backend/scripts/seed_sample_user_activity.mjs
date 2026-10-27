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
    // Distribute questions across multiple days for streak simulation
    // Alex: 10 questions (5 today [FIRE 🔥], 2 yesterday, 2 2-days-ago, 1 3-days-ago) -> 4 day streak!
    // Sarah: 11 questions (3 today, 3 yesterday, 5 2-days-ago [FIRE 🔥]) -> 3 day streak!
    // Ramesh: 3 questions (2 today, 1 yesterday) -> 2 day streak!
    let plan = [];
    if (user.email.includes('alex')) {
      plan = [
        { dayOffset: 0, count: 5 }, // 5 solves today -> FIRE DAY 🔥
        { dayOffset: 1, count: 2 }, // 2 solves yesterday -> NORMAL DAY 🟢
        { dayOffset: 2, count: 2 }, // 2 solves 2 days ago -> NORMAL DAY 🟢
        { dayOffset: 3, count: 1 }, // 1 solve 3 days ago -> NORMAL DAY 🟢
      ];
    } else if (user.email.includes('sarah')) {
      plan = [
        { dayOffset: 0, count: 3 }, // 3 solves today -> NORMAL DAY 🟢
        { dayOffset: 1, count: 3 }, // 3 solves yesterday -> NORMAL DAY 🟢
        { dayOffset: 2, count: 5 }, // 5 solves 2 days ago -> FIRE DAY 🔥
      ];
    } else {
      plan = [
        { dayOffset: 0, count: 2 }, // 2 solves today -> NORMAL DAY 🟢
        { dayOffset: 1, count: 1 }, // 1 solve yesterday -> NORMAL DAY 🟢
      ];
    }

    let qIndex = 0;
    for (const step of plan) {
      for (let s = 0; s < step.count; s++) {
        const q = questions[qIndex % questions.length];
        qIndex++;
        const hasNote = s % 2 === 0;

        // Base timestamp for this day offset
        const targetDate = new Date(Date.now() - step.dayOffset * 86400000 - s * 3600000);

        await prisma.userPracticeProgress.upsert({
          where: {
            userId_questionId: {
              userId: user.id,
              questionId: q.id,
            },
          },
          update: {
            isCompleted: true,
            notes: hasNote ? sampleNotes[s % sampleNotes.length] : null,
            completedAt: targetDate,
            updatedAt: targetDate,
          },
          create: {
            userId: user.id,
            questionId: q.id,
            isCompleted: true,
            notes: hasNote ? sampleNotes[s % sampleNotes.length] : null,
            completedAt: targetDate,
            updatedAt: targetDate,
          },
        });
        count++;
      }
    }
  }

  console.log(`✅ Seeded ${count} practice activity records with realistic multi-day streaks & fire days!`);
}

main()
  .catch((e) => {
    console.error('Error seeding activity:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
