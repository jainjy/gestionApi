import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `blog-images/${fileName}`

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file)

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload' },
        { status: 500 }
      )
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}