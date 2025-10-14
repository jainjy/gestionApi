// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true
      }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    // Générer le token
    const token = `real-jwt-token-${user.id}`

    // Préparer la réponse utilisateur
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role as 'user' | 'admin' | 'professional',
      companyName: user.vendor?.companyName,
      kycStatus: user.vendor?.kycStatus as 'pending' | 'verified' | 'rejected' | undefined,
      isActive: true
    }

    return NextResponse.json({
      user: userResponse,
      token
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion" },
      { status: 500 }
    )
  }
}