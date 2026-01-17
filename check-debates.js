import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDebates() {
  try {
    const debates = await prisma.debate.findMany({
      where: {
        status: 'COMPLETED',
        opponentId: { not: null }
      },
      include: {
        _count: { select: { statements: true } },
        statements: { take: 1 }
      },
      take: 5
    });

    console.log('Completed debates with opponents:');
    debates.forEach(debate => {
      console.log(`- ID: ${debate.id}`);
      console.log(`  Topic: "${debate.topic}"`);
      console.log(`  Statements: ${debate._count.statements}`);
      console.log(`  Has statements: ${debate._count.statements > 0}`);
      console.log('');
    });

    // Find one with statements
    const debateWithStatements = debates.find(d => d._count.statements > 0);
    if (debateWithStatements) {
      console.log(`Found debate with statements: ${debateWithStatements.id}`);
      return debateWithStatements.id;
    } else {
      console.log('No debates with statements found');
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

checkDebates();