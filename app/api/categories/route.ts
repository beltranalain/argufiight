import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/categories - Get all active categories (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        label: true,
        description: true,
        color: true,
        icon: true,
        sortOrder: true,
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    // Return default categories as fallback
    return NextResponse.json({
      categories: [
        { id: '1', name: 'SPORTS', label: 'Sports', sortOrder: 0 },
        { id: '2', name: 'POLITICS', label: 'Politics', sortOrder: 1 },
        { id: '3', name: 'TECH', label: 'Tech', sortOrder: 2 },
        { id: '4', name: 'ENTERTAINMENT', label: 'Entertainment', sortOrder: 3 },
        { id: '5', name: 'SCIENCE', label: 'Science', sortOrder: 4 },
        { id: '6', name: 'OTHER', label: 'Other', sortOrder: 5 },
      ],
    })
  }
}






