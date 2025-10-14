import { NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, userType, companyName } = await req.json()

    // Validation des données
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        role: userType === 'professional' ? 'professional' : 'user'
      }
    })

    // Si c'est un professionnel, créer le vendor
    if (userType === 'professional' && companyName) {
      await prisma.vendor.create({
        data: {
          userId: user.id,
          companyName,
          categories: [],
          kycStatus: 'pending'
        }
      })
    }

    // Générer un token (vous pouvez utiliser jose ou jsonwebtoken)
    const token = `real-jwt-token-${user.id}`

    return NextResponse.json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role
      },
      token
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    )
  }
}