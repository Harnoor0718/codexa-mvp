import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample problems
  const problems = [
    {
      code: 'two-sum',
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'Easy',
      tags: 'Array,Hash Table',
      isPublished: true,
      testCases: {
        create: [
          {
            input: '[2,7,11,15]\n9',
            expectedOutput: '[0,1]',
            isSample: true
          },
          {
            input: '[3,2,4]\n6',
            expectedOutput: '[1,2]',
            isSample: true
          }
        ]
      }
    },
    {
      code: 'reverse-string',
      title: 'Reverse String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters.',
      difficulty: 'Easy',
      tags: 'String,Two Pointers',
      isPublished: true,
      testCases: {
        create: [
          {
            input: 'hello',
            expectedOutput: 'olleh',
            isSample: true
          },
          {
            input: 'world',
            expectedOutput: 'dlrow',
            isSample: true
          }
        ]
      }
    },
    {
      code: 'valid-parentheses',
      title: 'Valid Parentheses',
      description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
      difficulty: 'Medium',
      tags: 'String,Stack',
      isPublished: true,
      testCases: {
        create: [
          {
            input: '()',
            expectedOutput: 'true',
            isSample: true
          },
          {
            input: '()[]{}',
            expectedOutput: 'true',
            isSample: true
          }
        ]
      }
    }
  ];

  for (const problem of problems) {
    await prisma.problem.create({
      data: problem
    });
    console.log(`✅ Created problem: ${problem.title}`);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });