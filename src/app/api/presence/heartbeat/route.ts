import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ONLINE_THRESHOLD_MS = 30_000 // 30 seconds

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Update this user's last active time
    await db.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })

    // Fetch all users who have been active in the last 30 seconds
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS)
    const onlineUsers = await db.user.findMany({
      where: {
        lastActiveAt: { gte: threshold },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        lastActiveAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    return NextResponse.json({ onlineUsers })
  } catch (error) {
    console.error('Presence heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}