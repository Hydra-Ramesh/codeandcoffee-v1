import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Knowledge Sheet Questions...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found in database.');
    process.exit(1);
  }

  const knowledgeQuestions = [
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'Bit Manipulation',
      title: 'Single Number',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/single-number/',
      order: 1,
      content: `# Single Number

## Problem Statement
Given a non-empty array of integers \`nums\`, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

### Example 1:
\`\`\`
Input: nums = [2,2,1]
Output: 1
\`\`\`

### Example 2:
\`\`\`
Input: nums = [4,1,2,1,2]
Output: 4
\`\`\`

### Optimal Approach:
XOR all elements together. Since \`x ^ x = 0\` and \`x ^ 0 = x\`, duplicate numbers cancel out to 0, leaving only the unique number.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`,
    },
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'System Design & Concurrency',
      title: 'Token Bucket Rate Limiter',
      difficulty: 'MEDIUM',
      platform: 'Self-Created (Code & Coffee)',
      externalUrl: null,
      order: 2,
      content: `# Token Bucket Rate Limiter (Self-Created)

## Problem Statement
Design an in-memory **Token Bucket Rate Limiter** class \`TokenBucketRateLimiter\` that enforces API rate limits for clients:

### Class Definition:
\`\`\`typescript
class TokenBucketRateLimiter {
  constructor(capacity: number, refillRatePerSec: number);
  allowRequest(tokensRequired: number): boolean;
}
\`\`\`

### Requirements:
1. The bucket starts full with \`capacity\` tokens.
2. Tokens refill continuously at \`refillRatePerSec\` tokens per second, up to \`capacity\`.
3. When \`allowRequest(tokensRequired)\` is invoked, calculate current tokens based on elapsed time since last refill. If sufficient tokens are present, consume \`tokensRequired\` and return \`true\`; otherwise return \`false\`.

### Constraints:
- \`1 <= capacity <= 10^6\`
- \`1 <= refillRatePerSec <= 10^5\`
- \`tokensRequired >= 1\`

### Optimal Solution:
Avoid running a continuous background timer. Compute token accrual lazily on each invocation of \`allowRequest\` using \`Date.now()\`:
\`\`\`typescript
const now = Date.now();
const elapsedSec = (now - this.lastRefillTimestamp) / 1000;
this.currentTokens = Math.min(this.capacity, this.currentTokens + elapsedSec * this.refillRatePerSec);
this.lastRefillTimestamp = now;
\`\`\`
- **Time Complexity:** O(1) per check
- **Space Complexity:** O(1)`,
    },
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'Arrays & Math',
      title: 'Product of Array Except Self',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
      order: 3,
      content: `# Product of Array Except Self

## Problem Statement
Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.
You must write an algorithm that runs in \`O(N)\` time and without using the division operation.

### Example 1:
\`\`\`
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
\`\`\`

### Optimal Approach:
Use prefix and suffix running products.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) auxiliary (output array does not count as extra space).`,
    },
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'Data Structures',
      title: 'LRU Cache with TTL Expiry',
      difficulty: 'MEDIUM',
      platform: 'Self-Created (Code & Coffee)',
      externalUrl: null,
      order: 4,
      content: `# LRU Cache with TTL Expiry (Self-Created)

## Problem Statement
Design and implement a data structure for **Least Recently Used (LRU) Cache** that supports **Time-To-Live (TTL)** per entry.

### API:
\`\`\`typescript
interface ILRUCache<K, V> {
  get(key: K): V | -1;
  put(key: K, value: V, ttlMs?: number): void;
}
\`\`\`

### Rules:
- If an entry has expired based on current timestamp, \`get()\` must return \`-1\` and evict the expired node.
- If cache capacity is reached, evict the least recently used valid entry.
- All operations must execute in amortized **O(1)** time complexity.

### Implementation Concept:
Combine a Hash Map with a Doubly Linked List (for LRU ordering) and store an \`expiresAt\` timestamp on each doubly-linked node.`,
    },
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'Dynamic Programming',
      title: 'Coin Change',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/coin-change/',
      order: 5,
      content: `# Coin Change

## Problem Statement
You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Example 1:
\`\`\`
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\``,
    },
    {
      sheetType: 'KNOWLEDGE_SHEET',
      topic: 'Two Pointers',
      title: 'Trapping Rain Water',
      difficulty: 'HARD',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/trapping-rain-water/',
      order: 6,
      content: `# Trapping Rain Water

## Problem Statement
Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1:
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
\`\`\`

### Optimal Approach:
Two-pointer approach maintaining \`left_max\` and \`right_max\`.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`,
    },
  ];

  for (const q of knowledgeQuestions) {
    const existing = await prisma.practiceQuestion.findFirst({
      where: {
        sheetType: 'KNOWLEDGE_SHEET',
        title: q.title,
      },
    });

    if (!existing) {
      await prisma.practiceQuestion.create({
        data: {
          sheetType: 'KNOWLEDGE_SHEET',
          topic: q.topic,
          title: q.title,
          difficulty: q.difficulty,
          platform: q.platform,
          content: q.content,
          externalUrl: q.externalUrl,
          order: q.order,
          isPublished: true,
          authorId: adminUser.id,
        },
      });
      console.log(`✅ Seeded: ${q.title} (${q.platform})`);
    } else {
      console.log(`ℹ️ Already exists: ${q.title}`);
    }
  }

  console.log('🎉 Knowledge Sheet seeding completed successfully!');
}

main()
  .catch((err) => {
    console.error('Error seeding knowledge sheet:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
