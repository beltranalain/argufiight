import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/social-posts/generate - Generate AI-powered social media post
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { debateId, platform } = body

    if (!debateId || !platform) {
      return NextResponse.json(
        { error: 'debateId and platform are required' },
        { status: 400 }
      )
    }

    if (!['INSTAGRAM', 'LINKEDIN', 'TWITTER'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be INSTAGRAM, LINKEDIN, or TWITTER' },
        { status: 400 }
      )
    }

    // Fetch debate details
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        challenger: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        opponent: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        statements: {
          take: 2,
          orderBy: { createdAt: 'asc' },
          select: {
            content: true,
            authorId: true,
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Check for DeepSeek API key
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    // Build platform-specific prompt
    const platformPrompts: Record<string, string> = {
      INSTAGRAM: `Create an engaging Instagram post about this debate. Requirements:
- Visual and engaging tone
- Include relevant hashtags (5-10)
- Keep it under 2,200 characters
- Make it shareable and attention-grabbing
- Include emojis where appropriate
- Focus on the debate topic and participants

Debate Topic: ${debate.topic}
Category: ${debate.category?.name || 'General'}
Challenger: ${debate.challenger.username}
Opponent: ${debate.opponent?.username || 'TBD'}`,

      LINKEDIN: `Create a professional LinkedIn post about this debate. Requirements:
- Professional and thought-provoking tone
- Include relevant hashtags (3-5)
- Keep it under 3,000 characters
- Focus on insights and discussion value
- Encourage engagement and comments
- Professional language

Debate Topic: ${debate.topic}
Category: ${debate.category?.name || 'General'}
Challenger: ${debate.challenger.username}
Opponent: ${debate.opponent?.username || 'TBD'}`,

      TWITTER: `Create a concise Twitter/X post about this debate. Requirements:
- Concise and engaging (under 280 characters)
- Include 2-3 relevant hashtags
- Make it tweetable and shareable
- Use trending topic language if applicable
- Focus on the key debate point

Debate Topic: ${debate.topic}
Category: ${debate.category?.name || 'General'}
Challenger: ${debate.challenger.username}
Opponent: ${debate.opponent?.username || 'TBD'}`,
    }

    const systemPrompt = platformPrompts[platform] || platformPrompts.INSTAGRAM

    // Generate post content using DeepSeek
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a social media content creator specializing in creating engaging, platform-specific posts for debate platforms.',
          },
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: platform === 'TWITTER' ? 150 : 500,
      }),
    })

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text()
      console.error('DeepSeek API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate post content' },
        { status: 500 }
      )
    }

    const deepseekData = await deepseekResponse.json()
    const generatedContent = deepseekData.choices?.[0]?.message?.content || ''

    // Extract hashtags from content
    const hashtagRegex = /#\w+/g
    const extractedHashtags = generatedContent.match(hashtagRegex)?.join(' ') || ''

    // Generate Sora image prompt
    const imagePrompt = `A dynamic, engaging visual representation of a debate about "${debate.topic}" in the ${debate.category?.name || 'general'} category. Two debaters facing off, with visual elements representing their arguments. Modern, clean design suitable for social media.`

    // Generate image prompt using AI
    const imagePromptResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed image generation prompts for Sora (video generation) and other AI image tools. Create vivid, detailed prompts that capture the essence of a debate topic.',
          },
          {
            role: 'user',
            content: `Create a detailed Sora image generation prompt for a debate about: "${debate.topic}" in the ${debate.category?.name || 'general'} category. Make it visually engaging and suitable for social media.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    let aiImagePrompt = imagePrompt
    if (imagePromptResponse.ok) {
      const imagePromptData = await imagePromptResponse.json()
      aiImagePrompt = imagePromptData.choices?.[0]?.message?.content || imagePrompt
    }

    return NextResponse.json({
      content: generatedContent.trim(),
      imagePrompt: aiImagePrompt.trim(),
      hashtags: extractedHashtags,
      platform,
      debateId,
    })
  } catch (error: any) {
    console.error('Failed to generate social post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate social post' },
      { status: error.status || 500 }
    )
  }
}

