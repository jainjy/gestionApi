import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return NextResponse.json(
        { 
          success: true, 
          message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation' 
        },
        { status: 200 }
      )
    }

    // Générer un token de réinitialisation
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures

    // Stocker le token dans la base de données
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Envoyer l'email de réinitialisation
    await sendPasswordResetEmail(email, resetToken)

    return NextResponse.json({
      success: true,
      message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}