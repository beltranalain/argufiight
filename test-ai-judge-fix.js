// Test script to verify the AI judge fix
import { PrismaClient } from '@prisma/client';
import { generateVerdict } from './lib/ai/verdictGenerator';
import { JUDGE_PERSONALITIES } from './lib/ai/judges';

const prisma = new PrismaClient();

async function testAIJudge() {
  try {
    console.log('🧪 Testing AI Judge Fix...\n');

    // Find a completed debate
    const debate = await prisma.debate.findFirst({
      where: {
        status: 'COMPLETED',
        opponentId: { not: null }
      },
      include: {
        challenger: { select: { id: true, username: true } },
        opponent: { select: { id: true, username: true } },
        statements: {
          include: { author: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!debate) {
      console.log('❌ No completed debates found to test with');
      return;
    }

    console.log(`📝 Testing with debate: "${debate.topic}"`);
    console.log(`👥 Participants: ${debate.challenger.username} vs ${debate.opponent.username}`);
    console.log(`📄 Statements: ${debate.statements.length}\n`);

    // Test with one judge (Rhetorician)
    const judge = JUDGE_PERSONALITIES.find(j => j.name === 'The Rhetorician');
    if (!judge) {
      console.log('❌ Rhetorician judge not found');
      return;
    }

    console.log(`🧑‍⚖️ Testing with judge: ${judge.name} (${judge.personality})`);
    console.log(`📋 System prompt preview: ${judge.systemPrompt.substring(0, 100)}...\n`);

    // Generate verdict
    console.log('🤖 Generating verdict...');
    const startTime = Date.now();

    const verdict = await generateVerdict({
      topic: debate.topic,
      description: debate.description,
      challengerPosition: debate.challengerPosition,
      opponentPosition: debate.opponentPosition,
      statements: debate.statements.map(s => ({
        authorId: s.authorId,
        round: s.round,
        content: s.content
      })),
      challenger: debate.challenger,
      opponent: debate.opponent
    }, judge);

    const duration = Date.now() - startTime;

    console.log(`✅ Verdict generated in ${duration}ms\n`);

    console.log('📊 Results:');
    console.log(`🏆 Winner: ${verdict.decision}`);
    console.log(`📈 ${debate.challenger.username}: ${verdict.challengerScore}/100`);
    console.log(`📈 ${debate.opponent.username}: ${verdict.opponentScore}/100`);
    console.log(`📝 Reasoning length: ${verdict.reasoning.length} characters\n`);

    console.log('💬 Judge Reasoning:');
    console.log(verdict.reasoning.substring(0, 300) + (verdict.reasoning.length > 300 ? '...' : ''));

    // Verify consistency
    const scoreDiff = Math.abs(verdict.challengerScore - verdict.opponentScore);
    const expectedWinner = scoreDiff >= 10 ?
      (verdict.challengerScore > verdict.opponentScore ? 'CHALLENGER_WINS' :
       verdict.opponentScore > verdict.challengerScore ? 'OPPONENT_WINS' : 'TIE') : 'TIE';

    const consistent = verdict.decision === expectedWinner;

    console.log(`\n🔍 Consistency Check:`);
    console.log(`Expected winner from scores: ${expectedWinner}`);
    console.log(`Actual verdict decision: ${verdict.decision}`);
    console.log(`✅ Scores match decision: ${consistent ? 'YES' : 'NO'}`);

    if (consistent) {
      console.log('\n🎉 AI Judge Fix Successful! Scores and reasoning are now consistent.');
    } else {
      console.log('\n❌ Issue still exists - scores don\'t match decision.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAIJudge();