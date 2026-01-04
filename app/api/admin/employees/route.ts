import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'

// POST /api/admin/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()

    if (!session || !session.userId) {
      console.error('[API /admin/employees] No session or userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      console.error('[API /admin/employees] User is not admin:', session.userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    console.log('[API /admin/employees] Request body:', JSON.stringify({ ...body, password: '[REDACTED]' }, null, 2))
    
    const { username, email, password, role, accessLevel } = body

    // Validation
    if (!username || !email || !password) {
      console.error('[API /admin/employees] Missing required fields:', { username: !!username, email: !!email, password: !!password })
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create employee
    const employee = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isAdmin: true, // Employees are admins
        employeeRole: role || 'Admin',
        accessLevel: accessLevel || 'full',
      },
      select: {
        id: true,
        username: true,
        email: true,
        employeeRole: true,
        accessLevel: true,
        createdAt: true,
      },
    })

    console.log('[API /admin/employees] Employee created successfully:', employee.id)
    return NextResponse.json({ employee }, { status: 201 })
  } catch (error: any) {
    console.error('[API /admin/employees] Failed to create employee:', error)
    console.error('[API /admin/employees] Error stack:', error?.stack)
    console.error('[API /admin/employees] Error details:', JSON.stringify(error, null, 2))
    const errorMessage = error?.message || error?.toString() || 'Failed to create employee'
    
    // Check for Prisma unique constraint errors
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

