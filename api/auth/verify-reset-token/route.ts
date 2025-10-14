import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false },
        { status: 400 }
      )
    }

    // Vérifier la validité du token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { valid: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: user.email
    })

  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { valid: false },
      { status: 500 }
    )
  }
}