import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial C++ Mastery course & curriculum...');

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ No Admin user found. Please ensure users are seeded first.');
    return;
  }

  // Upsert C++ Course
  const courseSlug = 'cpp-systems-mastery';
  const course = await prisma.course.upsert({
    where: { slug: courseSlug },
    update: {},
    create: {
      title: 'C++ Systems Mastery & High-Performance Engineering',
      slug: courseSlug,
      description:
        'Master modern C++ from low-level memory layouts and pointer arithmetic to cache-conscious STL containers, move semantics, and production concurrency.',
      category: 'Programming Languages',
      bannerImage:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      level: 'BEGINNER',
      order: 0,
      isPublished: true,
      authorId: admin.id,
    },
  });

  console.log(`✅ Course ensured: "${course.title}" (${course.id})`);

  // Topic 1: Modern C++ Fundamentals & Basics
  const topic1Slug = 'basics-and-memory-layout';
  const topic1 = await prisma.courseTopic.upsert({
    where: {
      courseId_slug: {
        courseId: course.id,
        slug: topic1Slug,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      title: '1. Modern C++ Fundamentals & Memory Layout',
      slug: topic1Slug,
      description:
        'Compilation pipelines, process address spaces, primitive types, and pointer arithmetic fundamentals.',
      order: 0,
    },
  });

  // Subtopic 1.1: C++ Anatomy & Compilation Pipeline
  const subtopic1_1_Slug = 'anatomy-and-compilation';
  await prisma.courseSubtopic.upsert({
    where: {
      topicId_slug: {
        topicId: topic1.id,
        slug: subtopic1_1_Slug,
      },
    },
    update: {},
    create: {
      topicId: topic1.id,
      title: 'C++ Anatomy, Process Memory & Compilation Stages',
      slug: subtopic1_1_Slug,
      order: 0,
      content: `# C++ Anatomy, Memory Layout & Compilation Pipeline

Modern C++ is the gold standard for high-throughput backend infrastructure, database engines, gaming simulations, and embedded systems. To write production-grade C++, you must understand how code transforms into machine instructions and how memory is partitioned.

---

## 1. The 4-Stage Compilation Pipeline

When you run \`g++ -O3 main.cpp -o main\`, the compiler executes four distinct transformation phases:

\`\`\`
Source Code (.cpp, .h)
        │
        ▼ (Preprocessing: expand #include, #define macros, remove comments)
Preprocessed Source (.i)
        │
        ▼ (Compilation: syntax validation, AST generation, CPU instruction translation)
Assembly Instructions (.s)
        │
        ▼ (Assembly: convert assembly instructions into machine binary opcodes)
Object File (.o / .obj)
        │
        ▼ (Linking: resolve external function definitions, combine static libraries)
Executable Binary (main.exe / ELF binary)
\`\`\`

### Key Compilation Flags
- \`-Wall -Wextra -Wpedantic\`: Enables strict diagnostic warnings for safety.
- \`-O3\`: Aggressive loop unrolling, vectorization, and inlining for peak runtime speed.
- \`-std=c++20\`: Compiles under modern ISO C++20 specifications.

---

## 2. Process Memory Layout (Virtual Address Space)

Every C++ binary executed by the OS kernel receives an isolated virtual address space:

\`\`\`
 high memory ┌─────────────────────────────────────────┐
             │ Kernel Space (Protected)                │
             ├─────────────────────────────────────────┤
             │ Stack (grows downwards ↓)               │
             │   - Local variables, stack frames       │
             │   - Fast L1/L2 cache allocation         │
             ├─────────────────────────────────────────┤
             │               ↓      ↑                  │
             ├─────────────────────────────────────────┤
             │ Heap (grows upwards ↑)                  │
             │   - Dynamic memory (\`malloc\`, \`new\`)     │
             │   - Manual lifespan management          │
             ├─────────────────────────────────────────┤
             │ BSS Segment (Uninitialized globals)     │
             ├─────────────────────────────────────────┤
             │ Data Segment (Initialized globals)      │
             ├─────────────────────────────────────────┤
             │ Text Segment (Read-only binary code)    │
  low memory └─────────────────────────────────────────┘
\`\`\`

---

## 3. Fundamental Types and Memory Sizes

\`\`\`cpp
#include <iostream>
#include <cstdint>

int main() {
    // Exact-width integer types for deterministic cross-platform sizing
    int32_t standardInt = 42;          // Exactly 4 bytes
    int64_t largeCounter = 100000000LL; // Exactly 8 bytes
    double highPrecisionFloat = 3.14159; // Exactly 8 bytes (IEEE 754)
    bool isEngineRunning = true;       // Typically 1 byte

    std::cout << "int32_t size: " << sizeof(standardInt) << " bytes\\n";
    std::cout << "int64_t size: " << sizeof(largeCounter) << " bytes\\n";

    return 0;
}
\`\`\`
`,
      attachments: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      ],
      hasQuiz: true,
      quizPassingScore: 25,
      quizData: [
        {
          id: 'q1',
          questionText:
            'Which process memory segment stores local function variables and call stack frames in C++?',
          type: 'MCQ',
          codeSnippet: null,
          options: [
            'Heap Segment',
            'Stack Segment',
            'Data Segment',
            'BSS Segment',
          ],
          correctAnswers: [1],
          explanation:
            'Local variables declared inside function blocks are stored in the Stack segment, managed automatically via stack pointers.',
        },
        {
          id: 'q2',
          questionText:
            'Which of the following stages are part of the standard C++ compilation pipeline? (Select all that apply)',
          type: 'MMQ',
          codeSnippet: null,
          options: [
            'Preprocessing',
            'Compilation',
            'Assembly',
            'Linking',
            'Garbage Collection',
          ],
          correctAnswers: [0, 1, 2, 3],
          explanation:
            'C++ compiles through Preprocessing, Compilation, Assembly, and Linking. C++ does not employ automatic runtime garbage collection.',
        },
        {
          id: 'q3',
          questionText:
            'Analyze the C++ snippet below. What will be printed to stdout when executed?',
          type: 'CODE_OUTPUT',
          codeSnippet: `#include <iostream>

int main() {
    int counter = 10;
    int* ptr = &counter;
    *ptr += 15;
    std::cout << counter;
    return 0;
}`,
          options: ['10', '15', '25', 'Memory Address (e.g. 0x7fff...)'],
          correctAnswers: [2],
          explanation:
            'The pointer ptr stores the memory address of counter. Dereferencing *ptr += 15 mutates the value stored at that address, resulting in 10 + 15 = 25.',
        },
      ],
      codingQuestions: [
        {
          id: 'code_q1',
          title: "Implement Fast Power: Pow(x, n) in C++",
          difficulty: 'MEDIUM',
          description:
            'Implement pow(x, n), which calculates x raised to the power n (i.e., x^n) in O(log n) time using binary exponentiation.',
          leetcodeUrl: 'https://leetcode.com/problems/powx-n/',
          sampleInput: 'x = 2.00000, n = 10',
          sampleOutput: '1024.00000',
          starterCode: `class Solution {
public:
    double myPow(double x, int n) {
        long long N = n;
        if (N < 0) {
            x = 1 / x;
            N = -N;
        }
        double ans = 1;
        double current_product = x;
        for (long long i = N; i > 0; i /= 2) {
            if ((i % 2) == 1) {
                ans = ans * current_product;
            }
            current_product = current_product * current_product;
        }
        return ans;
    }
};`,
          isJudge0ComingSoon: true,
        },
      ],
      isPublished: true,
    },
  });

  // Subtopic 1.2: Pointers, References & Heap Allocation
  const subtopic1_2_Slug = 'pointers-references-and-heap';
  await prisma.courseSubtopic.upsert({
    where: {
      topicId_slug: {
        topicId: topic1.id,
        slug: subtopic1_2_Slug,
      },
    },
    update: {},
    create: {
      topicId: topic1.id,
      title: 'Pointers, References & Dynamic Heap Memory (new/delete)',
      slug: subtopic1_2_Slug,
      order: 1,
      content: `# Pointers, References & Dynamic Memory in Modern C++

Pointers give C++ developers raw, unmediated hardware control. Mastering pointers, reference semantics, and heap lifecycles is foundational for high-performance software engineering.

---

## 1. Pointers vs References

| Feature | Raw Pointer (\`T*\`) | Lvalue Reference (\`T&\`) |
|---|---|---|
| **Can be null?** | Yes (\`nullptr\`) | No (must reference valid object) |
| **Reassignable?** | Yes | No (bound at initialization) |
| **Syntax** | Requires dereference (\`*ptr\`, \`ptr->\`) | Dot syntax like regular object (\`ref.foo\`) |
| **Arithmetic** | Supported (\`ptr + 1\`) | Not supported |

\`\`\`cpp
#include <iostream>

void modifyViaPointer(int* p) {
    if (p != nullptr) {
        *p = 100;
    }
}

void modifyViaReference(int& r) {
    r = 200; // Zero null checks required; guaranteed valid memory
}

int main() {
    int val = 10;
    modifyViaPointer(&val);
    std::cout << "After pointer: " << val << "\\n"; // 100

    modifyViaReference(val);
    std::cout << "After reference: " << val << "\\n"; // 200
    return 0;
}
\`\`\`

---

## 2. Dynamic Heap Allocation: \`new\` and \`delete\`

Whenever an array size is unknown at compile time, or memory must outlive the creating function frame, allocate from the Heap:

\`\`\`cpp
// Single integer allocation
int* pInt = new int(42);
delete pInt; // Free single item

// Dynamic buffer array allocation
int* buffer = new int[1024];
delete[] buffer; // Note delete[] array syntax to prevent memory leaks!
\`\`\`

> 💡 **Best Practice**: In modern C++, prefer \`std::unique_ptr\` and \`std::vector\` to eliminate manual \`delete\` and guarantee exception-safe memory cleanup.
`,
      attachments: [
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      ],
      hasQuiz: true,
      quizPassingScore: 25,
      quizData: [
        {
          id: 'q1',
          questionText:
            'What is the fundamental difference between a C++ pointer and a C++ reference?',
          type: 'MCQ',
          codeSnippet: null,
          options: [
            'Pointers cannot be null, while references can be null',
            'References can point to nullptr, while pointers cannot',
            'Pointers can be reassigned and can be null; references cannot be reassigned or null',
            'There is no difference; they are exact synonyms in C++',
          ],
          correctAnswers: [2],
          explanation:
            'References must be bound at initialization, cannot be null, and cannot be reseated to another object.',
        },
        {
          id: 'q2',
          questionText:
            'What is the correct syntax to deallocate a dynamically allocated array in C++ created with "int* arr = new int[50];"?',
          type: 'MCQ',
          codeSnippet: null,
          options: ['free(arr);', 'delete arr;', 'delete[] arr;', 'arr.clear();'],
          correctAnswers: [2],
          explanation:
            'Heap arrays allocated via "new[]" MUST be released using "delete[]" to invoke destructors on each element and deallocate the buffer block.',
        },
      ],
      codingQuestions: [
        {
          id: 'code_q2',
          title: 'Reverse a Linked List in C++',
          difficulty: 'EASY',
          description:
            'Given the head of a singly linked list, reverse the list, and return the reversed list using pointer manipulation.',
          leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
          sampleInput: 'head = [1,2,3,4,5]',
          sampleOutput: '[5,4,3,2,1]',
          starterCode: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};`,
          isJudge0ComingSoon: true,
        },
      ],
      isPublished: true,
    },
  });

  // Topic 2: Object-Oriented C++ & RAII
  const topic2Slug = 'oop-and-raii';
  const topic2 = await prisma.courseTopic.upsert({
    where: {
      courseId_slug: {
        courseId: course.id,
        slug: topic2Slug,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      title: '2. Object-Oriented C++ & Resource Acquisition Is Initialization (RAII)',
      slug: topic2Slug,
      description:
        'Constructors, deep copy semantics, rule of 3/5/0, and smart pointers (unique_ptr, shared_ptr).',
      order: 1,
    },
  });

  // Subtopic 2.1: RAII & Smart Pointers
  const subtopic2_1_Slug = 'smart-pointers-and-raii';
  await prisma.courseSubtopic.upsert({
    where: {
      topicId_slug: {
        topicId: topic2.id,
        slug: subtopic2_1_Slug,
      },
    },
    update: {},
    create: {
      topicId: topic2.id,
      title: 'RAII Paradigm & Smart Pointers: unique_ptr vs shared_ptr',
      slug: subtopic2_1_Slug,
      order: 0,
      content: `# RAII Paradigm & Smart Pointers in Modern C++

**RAII** (Resource Acquisition Is Initialization) is the core philosophical pillar of C++. Resources (heap memory, socket descriptors, database connections, mutex locks) are bound to the lifetime of stack objects. When the object leaves scope, its destructor deterministically frees the resource.

---

## 1. Smart Pointers: Eliminating Memory Leaks

Include \`<memory>\` to access the three modern C++ smart pointers:

1. \`std::unique_ptr<T>\`: Exclusive single ownership. Zero memory overhead (same size as raw pointer). Cannot be copied, only moved via \`std::move()\`.
2. \`std::shared_ptr<T>\`: Reference-counted shared ownership. Destructor runs when the reference count drops to 0.
3. \`std::weak_ptr<T>\`: Non-owning observer that prevents cyclic reference memory leaks in shared_ptr graphs.

\`\`\`cpp
#include <iostream>
#include <memory>

class DatabaseConnection {
public:
    DatabaseConnection() { std::cout << "Connected to DB\\n"; }
    ~DatabaseConnection() { std::cout << "Closed DB connection\\n"; }
    void query() { std::cout << "Executing query...\\n"; }
};

int main() {
    {
        // Exception-safe heap allocation
        auto conn = std::make_unique<DatabaseConnection>();
        conn->query();
        // conn leaves scope here -> destructor runs automatically!
    }

    std::cout << "Scope finished safely.\\n";
    return 0;
}
\`\`\`
`,
      attachments: [
        'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80',
      ],
      hasQuiz: true,
      quizPassingScore: 25,
      quizData: [
        {
          id: 'q1',
          questionText:
            'What happens when a std::unique_ptr variable goes out of scope?',
          type: 'MCQ',
          codeSnippet: null,
          options: [
            'Its destructor executes and automatically frees the managed heap memory',
            'Nothing; it causes a memory leak unless free() is called',
            'It transforms into a shared_ptr',
            'It causes a compile error',
          ],
          correctAnswers: [0],
          explanation:
            'std::unique_ptr embodies RAII: when it falls out of scope, its destructor invokes delete on the managed resource.',
        },
      ],
      codingQuestions: [],
      isPublished: true,
    },
  });

  console.log('🎉 Course curriculum seeded successfully with topics, subtopics, quizzes, and code practice!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
