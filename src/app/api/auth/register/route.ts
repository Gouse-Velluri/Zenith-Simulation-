import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

const VALID_ROLES = ['STUDENT', 'TRAINER', 'ADMIN'] as const

const DOMAIN_RULES: Record<string, string> = {
  TRAINER: '@trainer.zenith.io',
  ADMIN: '@admin.zenith.io',
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate and normalize role
    const normalizedRole = VALID_ROLES.includes(role) ? role : 'STUDENT'

    // Server-side email domain validation
    const requiredDomain = DOMAIN_RULES[normalizedRole]
    if (requiredDomain) {
      if (!email.toLowerCase().endsWith(requiredDomain)) {
        if (normalizedRole === 'TRAINER') {
          return NextResponse.json(
            { error: 'Trainers must register with a @trainer.zenith.io email' },
            { status: 400 },
          )
        }
        if (normalizedRole === 'ADMIN') {
          return NextResponse.json(
            { error: 'Admins must register with a @admin.zenith.io email' },
            { status: 400 },
          )
        }
      }
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)
    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: normalizedRole,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      level: 1,
      status: 'SYSTEM ONLINE',
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}