import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Updating Practice Sheets...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found in database.');
    process.exit(1);
  }

  console.log(`👤 Using Admin: ${adminUser.name} (${adminUser.id})`);

  // 1. Clear all questions from all sheets as requested ("remove all question from crack Interview sheet ... and Keep All Sheet Blank")
  const deleted = await prisma.practiceQuestion.deleteMany({});
  console.log(`🧹 Cleared all ${deleted.count} previous practice questions across all sheets.`);

  // 2. CtCI Chapter 1: Arrays and Strings questions (all 9 problems)
  const ctciQuestions = [
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.1 - Is Unique',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/is-unique-lcci/',
      order: 1,
      content: `# 1.1 Is Unique (Cracking the Coding Interview)

## Problem Statement
Implement an algorithm to determine if a string has all unique characters.

**Follow-up:** What if you cannot use additional data structures?

---

### Examples

**Example 1:**
\`\`\`text
Input: s = "leetcode"
Output: false
Explanation: 'e' appears multiple times.
\`\`\`

**Example 2:**
\`\`\`text
Input: s = "abcde"
Output: true
Explanation: All characters are distinct.
\`\`\`

---

### Constraints
- \`0 <= s.length <= 100\`
- \`s\` consists of standard ASCII / lowercase English letters.
- If you solve it in $O(1)$ additional space, explain your bit manipulation or in-place sorting tradeoffs.

---

### Optimal Solutions

#### Approach 1: Boolean Array / Hash Set ($O(N)$ Time, $O(1)$ Space)
Assume ASCII character set (128 alphabet size). If \`s.length > 128\`, return \`false\` immediately by Pigeonhole Principle.
Maintain a boolean array \`char_set[128]\`. Mark seen characters. If already marked, return \`false\`.

#### Approach 2: Bit Vector (No Data Structures - $O(1)$ Space)
If string only contains lowercase 'a' through 'z', use a single 32-bit integer (\`int checker = 0\`):
\`\`\`python
def is_unique(s: str) -> bool:
    checker = 0
    for char in s:
        val = ord(char) - ord('a')
        if (checker & (1 << val)) > 0:
            return False
        checker |= (1 << val)
    return True
\`\`\`
- **Time Complexity:** $O(N)$ or $O(1)$ since alphabet size $c \\le 128$
- **Space Complexity:** $O(1)$`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.2 - Check Permutation',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/check-permutation-lcci/',
      order: 2,
      content: `# 1.2 Check Permutation (Cracking the Coding Interview)

## Problem Statement
Given two strings \`s1\` and \`s2\`, write a method to decide if one is a permutation of the other.

A permutation means both strings contain the exact same characters with the exact same frequencies, just possibly in a different order.

---

### Examples

**Example 1:**
\`\`\`text
Input: s1 = "abc", s2 = "bca"
Output: true
\`\`\`

**Example 2:**
\`\`\`text
Input: s1 = "abc", s2 = "bad"
Output: false
\`\`\`

---

### Constraints
- \`0 <= s1.length, s2.length <= 100\`
- Case sensitivity: clarify if "God" vs "dog" are permutations (standard CtCI treats case as sensitive).
- Whitespace: clarify if spaces count (standard CtCI treats spaces as significant).

---

### Optimal Approaches

#### Approach 1: Sorting ($O(N \\log N)$ Time, $O(1)$ Space)
If \`s1.length != s2.length\`, return \`false\`. Sort both strings and compare:
\`\`\`python
def check_permutation(s1: str, s2: str) -> bool:
    if len(s1) != len(s2):
        return False
    return sorted(s1) == sorted(s2)
\`\`\`

#### Approach 2: Character Frequency Array ($O(N)$ Time, $O(1)$ Space)
Count characters using an array of size 128 (ASCII):
1. Increment count for characters in \`s1\`.
2. Decrement count for characters in \`s2\`.
3. If any count drops below 0, return \`false\`.
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ (128-element array)`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.3 - URLify',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/string-to-url-lcci/',
      order: 3,
      content: `# 1.3 URLify (Cracking the Coding Interview)

## Problem Statement
Write a method to replace all spaces in a string with \`%20\`. You are given the string (as a character array with sufficient buffer at the end) and the "true" length of the string.

Perform this operation in-place.

---

### Examples

**Example 1:**
\`\`\`text
Input: s = "Mr John Smith    ", length = 13
Output: "Mr%20John%20Smith"
Explanation: The original 13 characters are "Mr John Smith". 
There are 2 spaces, requiring 4 extra characters (2 * 2 = 4), which matches the trailing buffer.
\`\`\`

---

### Constraints
- \`0 <= length <= 500,000\`
- Must modify the character buffer in-place from back to front to avoid overwriting characters.

---

### Optimal Approach: Two-Pointer Backward Scan
1. First pass: count spaces in the original string up to \`length\`.
2. Compute new index: \`new_length = length + 2 * space_count\`.
3. Second pass (backwards from \`i = length - 1\` to \`0\`):
   - If \`s[i] == ' '\`: write \`'0'\`, \`'2'\`, \`'%'\` at \`new_length - 1\`, \`new_length - 2\`, \`new_length - 3\`, then decrement pointer by 3.
   - Else: copy \`s[i]\` to \`s[new_length - 1]\`, decrement pointer by 1.
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$ in-place`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.4 - Palindrome Permutation',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/palindrome-permutation-lcci/',
      order: 4,
      content: `# 1.4 Palindrome Permutation (Cracking the Coding Interview)

## Problem Statement
Given a string, write a function to check if it is a permutation of a palindrome. 

A palindrome is a word or phrase that is the same forwards and backwards. A permutation is a rearrangement of letters. The palindrome does not need to be limited to just dictionary words. You can ignore casing and non-letter characters.

---

### Examples

**Example 1:**
\`\`\`text
Input: "Tact Coa"
Output: true
Explanation: Permutations include "taco cat", "atco cta", etc.
\`\`\`

**Example 2:**
\`\`\`text
Input: "code"
Output: false
\`\`\`

---

### Key Insight
For a string to have a palindromic permutation:
- If the length is **even**: Every character must have an **even count**.
- If the length is **odd**: At most **one character** can have an **odd count**.

---

### Optimal Approaches

#### Approach 1: Frequency Hash Table ($O(N)$ Time, $O(1)$ Space)
Count frequencies of each letter. Count how many characters have odd frequencies. If odd count $> 1$, return \`false\`.

#### Approach 2: Bit Vector Toggle ($O(N)$ Time, $O(1)$ Space)
Toggle the $i$-th bit of an integer for each letter.
At the end, check if at most 1 bit is set using the trick \`bit_vector & (bit_vector - 1) == 0\`:
\`\`\`python
def can_permute_palindrome(s: str) -> bool:
    bit_vector = 0
    for char in s:
        if char.isalpha():
            val = ord(char.lower()) - ord('a')
            bit_vector ^= (1 << val)
    return (bit_vector & (bit_vector - 1)) == 0
\`\`\`
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.5 - One Away',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/one-away-lcci/',
      order: 5,
      content: `# 1.5 One Away (Cracking the Coding Interview)

## Problem Statement
There are three types of edits that can be performed on strings:
1. **Insert** a character
2. **Remove** a character
3. **Replace** a character

Given two strings \`first\` and \`second\`, write a function to check if they are **one edit (or zero edits) away**.

---

### Examples

**Example 1:**
\`\`\`text
Input: first = "pale", second = "ple"
Output: true (removal of 'a')
\`\`\`

**Example 2:**
\`\`\`text
Input: first = "pales", second = "pale"
Output: true (insertion of 's')
\`\`\`

**Example 3:**
\`\`\`text
Input: first = "pale", second = "bale"
Output: true (replacement of 'p' with 'b')
\`\`\`

**Example 4:**
\`\`\`text
Input: first = "pale", second = "bake"
Output: false (requires two replacements)
\`\`\`

---

### Constraints
- \`0 <= first.length, second.length <= 100\`
- \`first\` and \`second\` consist of lowercase English letters.

---

### Optimal Approach: Single-Pass Two Pointers
1. If \`abs(len(first) - len(second)) > 1\`, return \`false\`.
2. Ensure \`s1\` is the shorter string and \`s2\` is the longer string (or equal).
3. Use two pointers \`i = 0\`, \`j = 0\` and a boolean flag \`found_difference = false\`:
   - If \`s1[i] != s2[j]\`:
     - If \`found_difference\` is already \`true\`, return \`false\`.
     - Set \`found_difference = true\`.
     - If lengths are equal: advance both \`i\` and \`j\` (replacement case).
     - If lengths differ: advance only \`j\` (insertion/deletion case).
   - If characters match: advance both \`i\` and \`j\`.
4. Return \`true\`.
- **Time Complexity:** $O(N)$ where $N$ is length of shorter string
- **Space Complexity:** $O(1)$`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.6 - String Compression',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/compress-string-lcci/',
      order: 6,
      content: `# 1.6 String Compression (Cracking the Coding Interview)

## Problem Statement
Implement a method to perform basic string compression using the counts of repeated characters. 

For example, the string \`"aabcccccaaa"\` would become \`"a2b1c5a3"\`. 

If the "compressed" string would not become smaller than the original string, your method should return the **original string**. You can assume the string has only uppercase and lowercase letters (a - z).

---

### Examples

**Example 1:**
\`\`\`text
Input: s = "aabcccccaaa"
Output: "a2b1c5a3"
Explanation: Length 8 is strictly smaller than original length 11.
\`\`\`

**Example 2:**
\`\`\`text
Input: s = "abbccd"
Output: "abbccd"
Explanation: Compressed string "a1b2c2d1" has length 8, which is larger than original length 6. Return original.
\`\`\`

---

### Constraints
- \`0 <= s.length <= 50,000\`
- Return original string if \`compressed.length >= s.length\`.

---

### Optimal Approach: StringBuilder / Character Run Counting
Iterate through the string tracking \`consecutive_count\`:
1. Whenever the next character differs from current character (or reached end of string):
   - Append current character to compressed result buffer.
   - Append \`consecutive_count\`.
   - Reset \`consecutive_count = 0\`.
2. Compare final compressed length with original length.
3. Return the shorter of the two.
- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(N)$ for result buffer`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.7 - Rotate Matrix',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/rotate-matrix-lcci/',
      order: 7,
      content: `# 1.7 Rotate Matrix (Cracking the Coding Interview)

## Problem Statement
Given an image represented by an $N \\times N$ matrix, where each pixel in the image is an integer, write a method to rotate the image by **90 degrees clockwise**.

Can you do this **in place** without allocating another matrix?

---

### Examples

**Example 1:**
\`\`\`text
Input: matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]
Output: [
  [7, 4, 1],
  [8, 5, 2],
  [9, 6, 3]
]
\`\`\`

**Example 2:**
\`\`\`text
Input: matrix = [
  [ 5,  1,  9, 11],
  [ 2,  4,  8, 10],
  [13,  3,  6,  7],
  [15, 14, 12, 16]
]
Output: [
  [15, 13,  2,  5],
  [14,  3,  4,  1],
  [12,  6,  8,  9],
  [16,  7, 10, 11]
]
\`\`\`

---

### Optimal Approaches

#### Approach 1: Transpose + Reverse Rows ($O(N^2)$ Time, $O(1)$ Space)
A 90° clockwise rotation is mathematically equivalent to:
1. **Transpose the matrix:** swap \`matrix[i][j]\` with \`matrix[j][i]\`.
2. **Reverse each row:** swap \`matrix[i][j]\` with \`matrix[i][n - 1 - j]\`.

\`\`\`python
def rotate(matrix: list[list[int]]) -> None:
    n = len(matrix)
    # Step 1: Transpose
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
            
    # Step 2: Reverse each row
    for i in range(n):
        matrix[i].reverse()
\`\`\`

#### Approach 2: Layer-by-Layer 4-Way Swap (CtCI Classic)
Process concentric square rings from outermost layer to innermost center, rotating groups of 4 elements.
- **Time Complexity:** $O(N^2)$
- **Space Complexity:** $O(1)$ in-place`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.8 - Zero Matrix',
      difficulty: 'MEDIUM',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/zero-matrix-lcci/',
      order: 8,
      content: `# 1.8 Zero Matrix (Cracking the Coding Interview)

## Problem Statement
Write an algorithm such that if an element in an $M \\times N$ matrix is 0, its entire row and column are set to 0.

---

### Examples

**Example 1:**
\`\`\`text
Input: matrix = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1]
]
Output: [
  [1, 0, 1],
  [0, 0, 0],
  [1, 0, 1]
]
\`\`\`

**Example 2:**
\`\`\`text
Input: matrix = [
  [0, 1, 2, 0],
  [3, 4, 5, 2],
  [1, 3, 1, 5]
]
Output: [
  [0, 0, 0, 0],
  [0, 4, 5, 0],
  [0, 3, 1, 0]
]
\`\`\`

---

### Constraints
- \`m == matrix.length\`, \`n == matrix[0].length\`
- \`1 <= m, n <= 200\`
- \`-2^31 <= matrix[i][j] <= 2^31 - 1\`
- **Challenge:** Can you do it using $O(1)$ extra space?

---

### Optimal Approach: First Row & Column as Marker Storage ($O(1)$ Extra Space)
1. Check if the first row has any zeroes (\`first_row_has_zero\`).
2. Check if the first column has any zeroes (\`first_col_has_zero\`).
3. Iterate through rest of matrix (\`1 <= i < m\`, \`1 <= j < n\`):
   - If \`matrix[i][j] == 0\`: set \`matrix[i][0] = 0\` and \`matrix[0][j] = 0\`.
4. Nullify inner cells using markers in first row & column:
   - If \`matrix[i][0] == 0\` or \`matrix[0][j] == 0\`: set \`matrix[i][j] = 0\`.
5. Nullify first row if \`first_row_has_zero\` is true.
6. Nullify first column if \`first_col_has_zero\` is true.
- **Time Complexity:** $O(M \\times N)$
- **Space Complexity:** $O(1)$ auxiliary space`,
    },
    {
      sheetType: 'CRACK_THE_INTERVIEW',
      topic: 'Arrays & Strings',
      title: '1.9 - String Rotation',
      difficulty: 'EASY',
      platform: 'LeetCode',
      externalUrl: 'https://leetcode.com/problems/string-rotation-lcci/',
      order: 9,
      content: `# 1.9 String Rotation (Cracking the Coding Interview)

## Problem Statement
Assume you have a method \`isSubstring\` which checks if one word is a substring of another. 

Given two strings, \`s1\` and \`s2\`, write code to check if \`s2\` is a rotation of \`s1\` using **only one call to \`isSubstring\`**.

---

### Examples

**Example 1:**
\`\`\`text
Input: s1 = "waterbottle", s2 = "erbottlewat"
Output: true
Explanation: "erbottlewat" is a circular rotation of "waterbottle".
\`\`\`

**Example 2:**
\`\`\`text
Input: s1 = "aa", s2 = "aba"
Output: false
\`\`\`

---

### Insight & Mathematical Proof
If \`s2\` is a rotation of \`s1\`, then there is a split point dividing \`s1\` into two parts, $x$ and $y$:
$$s1 = xy$$
$$s2 = yx$$

Now consider concatenating \`s1\` with itself:
$$s1s1 = (xy)(xy) = x(yx)y$$

Notice that $s2 = yx$ is **always a substring of $s1s1$**!

---

### Optimal Implementation
1. If \`len(s1) != len(s2)\` or \`len(s1) == 0\`, return \`false\`.
2. Construct \`s1s1 = s1 + s1\`.
3. Check \`isSubstring(s1s1, s2)\` (or \`s2 in s1s1\`).
\`\`\`python
def is_rotation(s1: str, s2: str) -> bool:
    if len(s1) != len(s2) or len(s1) == 0:
        return False
    return s2 in (s1 + s1)
\`\`\`
- **Time Complexity:** $O(N)$ (assuming efficient substring search algorithm like KMP)
- **Space Complexity:** $O(N)$ to allocate $(s1 + s1)$`,
    },
  ];

  for (const q of ctciQuestions) {
    await prisma.practiceQuestion.create({
      data: {
        ...q,
        authorId: adminUser.id,
      },
    });
    console.log(`✅ Seeded CtCI: ${q.title}`);
  }

  const summary = await prisma.practiceQuestion.groupBy({
    by: ['sheetType'],
    _count: { id: true },
  });

  console.log('\n📊 Updated Question Distribution:');
  console.table(summary);
  console.log('🎉 Done! Crack the Interview has all Chapter 1 CtCI questions, and all other sheets are clean/blank.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
