import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Practice Questions...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found in database. Please run user seed first.');
    process.exit(1);
  }

  console.log(`👤 Using Admin: ${adminUser.name} (${adminUser.id})`);

  // 1. CRACK THE INTERVIEW (Topic Wise with Readme Problem Statements)
  const crackQuestions = [
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays',
      title: 'Two Sum',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/two-sum/',
      order: 1,
      content: `# Two Sum

## Problem Statement
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.

### Optimal Approach (Hash Map):
1. Maintain a hash map storing value to index: \`{ nums[i]: i }\`.
2. For each element \`x\`, check if \`complement = target - x\` is already in the map.
3. If found, return \`[map[complement], i]\`.
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays',
      title: "Kadane's Algorithm - Maximum Subarray",
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/maximum-subarray/',
      order: 2,
      content: `# Maximum Subarray (Kadane's Algorithm)

## Problem Statement
Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

### Example 1:
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`

### Optimal Approach:
Maintain two variables: \`currentSum\` and \`maxSum\`.
At each element, decide whether to append to current sum or start a fresh subarray:
\`currentSum = max(nums[i], currentSum + nums[i])\`
\`maxSum = max(maxSum, currentSum)\`

- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays',
      title: 'Trapping Rain Water',
      difficulty: 'HARD',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/trapping-rain-water/',
      order: 3,
      content: `# Trapping Rain Water

## Problem Statement
Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1:
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are trapped.
\`\`\`

### Optimal Approach (Two Pointers):
Use left and right pointers with \`leftMax\` and \`rightMax\`.
- If \`height[left] < height[right]\`: process left side.
- Else: process right side.
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Strings',
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      order: 1,
      content: `# Longest Substring Without Repeating Characters

## Problem Statement
Given a string \`s\`, find the length of the longest substring without duplicate characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Optimal Approach (Sliding Window):
Use a dynamic sliding window \`[left, right]\` and a set/map to store characters currently in window.
- **Time Complexity:** O(N)
- **Space Complexity:** O(min(N, charset))`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Dynamic Programming',
      title: '0/1 Knapsack Problem',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/target-sum/',
      order: 1,
      content: `# 0/1 Knapsack Problem

## Problem Statement
Given \`N\` items with weights \`wt[]\` and values \`val[]\`, and a knapsack of capacity \`W\`, determine the maximum total value you can obtain by choosing a subset of items such that their total weight does not exceed \`W\`.

### Optimal DP Recurrence:
\`\`\`text
dp[i][w] = max(val[i-1] + dp[i-1][w - wt[i-1]], dp[i-1][w])
\`\`\`
- **Time Complexity:** O(N * W)
- **Space Complexity:** O(W) with 1D array space optimization`,
    },
  ];

  // 2. SDE SHEET (Topic Wise with LeetCode Direct Links)
  const sdeQuestions = [
    {
      sheetType: 'SDE_SHEET',
      topic: 'Arrays & Hashing',
      title: 'Best Time to Buy and Sell Stock',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
      order: 1,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Arrays & Hashing',
      title: 'Product of Array Except Self',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
      order: 2,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Two Pointers',
      title: '3Sum',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/3sum/',
      order: 1,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Two Pointers',
      title: 'Container With Most Water',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/container-with-most-water/',
      order: 2,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Binary Trees',
      title: 'Invert Binary Tree',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/invert-binary-tree/',
      order: 1,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Binary Trees',
      title: 'Lowest Common Ancestor of a BST',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
      order: 2,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Dynamic Programming',
      title: 'Coin Change',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/coin-change/',
      order: 1,
    },
    {
      sheetType: 'SDE_SHEET',
      topic: 'Dynamic Programming',
      title: 'Longest Common Subsequence',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/longest-common-subsequence/',
      order: 2,
    },
  ];

  // 3. CP SHEET (Rating Wise from Codeforces & CodeChef)
  const cpQuestions = [
    {
      sheetType: 'CP_SHEET',
      rating: 800,
      title: 'Watermelon (4A)',
      difficulty: 'EASY',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/4/A',
      order: 1,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 800,
      title: 'Way Too Long Words (71A)',
      difficulty: 'EASY',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/71/A',
      order: 2,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 800,
      title: 'Chef and Instant Noodles',
      difficulty: 'EASY',
      platform: 'CodeChef',
      externalUrl: 'https://www.codechef.com/problems/INSTNOODLE',
      order: 3,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1000,
      title: 'Theatre Square (1A)',
      difficulty: 'MEDIUM',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/1/A',
      order: 1,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1000,
      title: 'String Task (118A)',
      difficulty: 'MEDIUM',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/118/A',
      order: 2,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1000,
      title: 'Chef and Candies',
      difficulty: 'MEDIUM',
      platform: 'CodeChef',
      externalUrl: 'https://www.codechef.com/problems/CANDYSTORE',
      order: 3,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1200,
      title: 'Chewbaсca and Number (514A)',
      difficulty: 'MEDIUM',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/514/A',
      order: 1,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1200,
      title: 'Odd Grasshopper (1607B)',
      difficulty: 'MEDIUM',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/1607/B',
      order: 2,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1400,
      title: 'Two Buttons (520B)',
      difficulty: 'HARD',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/520/B',
      order: 1,
    },
    {
      sheetType: 'CP_SHEET',
      rating: 1400,
      title: 'Given Length and Sum of Digits... (489C)',
      difficulty: 'HARD',
      platform: 'Codeforces',
      externalUrl: 'https://codeforces.com/problemset/problem/489/C',
      order: 2,
    },
  ];

  const allQuestions = [...crackQuestions, ...sdeQuestions, ...cpQuestions];

  for (const q of allQuestions) {
    const existing = await prisma.practiceQuestion.findFirst({
      where: {
        sheetType: q.sheetType,
        title: q.title,
      },
    });

    if (!existing) {
      await prisma.practiceQuestion.create({
        data: {
          ...q,
          authorId: adminUser.id,
          isPublished: true,
        },
      });
      console.log(`✅ Created [${q.sheetType}] ${q.title}`);
    } else {
      console.log(`ℹ️ [${q.sheetType}] ${q.title} already exists`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
