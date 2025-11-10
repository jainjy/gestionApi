const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding des articles de blog...')

  try {
    // Vérifier si l'utilisateur auteur existe
    const author = await prisma.user.findFirst({
      where: { email: 'pro@servo.mg' },
    })

    if (!author) {
      console.log('❌ Aucun utilisateur trouvé avec email: pro@servo.mg')
      console.log('💡 Veuillez d\'abord créer un utilisateur avant de lancer ce seed')
      return
    }

    console.log(`✅ Utilisateur auteur trouvé: ${author.email}`)

    // Données des articles de blog
    const blogArticles = [
      {
        title: 'Introduction au Développement Web Moderne',
        slug: 'introduction-developpement-web-moderne',
        content: `
          <h1>Le développement web moderne a considérablement évolué ces dernières années...</h1>
          <p>Dans cet article, nous explorerons les principales technologies et pratiques qui définissent le développement web contemporain.</p>
          <h2>Les frameworks JavaScript modernes</h2>
          <p>React, Vue.js et Angular ont révolutionné la façon dont nous construisons les interfaces utilisateur.</p>
          <h2>Les outils de build</h2>
          <p>Webpack, Vite et autres outils ont simplifié le processus de développement et de déploiement.</p>
        `,
        excerpt: 'Découvrez les technologies et pratiques qui définissent le développement web contemporain.',
        coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        tags: ['web development', 'javascript', 'react'],
        category: 'Technologie',
        status: 'published',
        publishedAt: new Date('2024-01-15'),
        readTime: '5 min',
        authorId: author.id,
      },
      {
        title: 'Les Meilleures Pratiques pour le SEO en 2024',
        slug: 'meilleures-pratiques-seo-2024',
        content: `
          <h1>L'optimisation pour les moteurs de recherche est plus importante que jamais...</h1>
          <p>Voici les stratégies SEO les plus efficaces pour améliorer votre classement en 2024.</p>
          <h2>L'importance du Core Web Vitals</h2>
          <p>Google accorde une importance croissante aux performances utilisateur.</p>
          <h2>Le contenu de qualité prime</h2>
          <p>Créez du contenu utile et pertinent pour votre audience.</p>
        `,
        excerpt: 'Découvrez les stratégies SEO les plus efficaces pour améliorer votre classement cette année.',
        coverUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        tags: ['seo', 'marketing', 'optimisation'],
        category: 'Marketing',
        status: 'published',
        publishedAt: new Date('2024-01-10'),
        readTime: '8 min',
        authorId: author.id,
      },
      {
        title: 'Guide Complet de TypeScript pour Débutants',
        slug: 'guide-typescript-debutants',
        content: `
          <h1>TypeScript est devenu un outil essentiel pour le développement JavaScript...</h1>
          <p>Apprenez les bases de TypeScript et comment l'intégrer dans vos projets.</p>
          <h2>Les types de base</h2>
          <p>Découvrez les types primitifs et comment les utiliser.</p>
          <h2>Les interfaces</h2>
          <p>Créez des contrats pour vos objets avec les interfaces TypeScript.</p>
        `,
        excerpt: 'Apprenez les bases de TypeScript et comment l\'intégrer dans vos projets JavaScript.',
        coverUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        tags: ['typescript', 'javascript', 'programmation'],
        category: 'Programmation',
        status: 'published',
        publishedAt: new Date('2024-01-05'),
        readTime: '10 min',
        authorId: author.id,
      },
      {
        title: 'Les Avantages du Serverless Computing',
        slug: 'avantages-serverless-computing',
        content: `
          <h1>Le serverless computing révolutionne la façon dont nous déployons nos applications...</h1>
          <p>Explorez les avantages et cas d'utilisation du serverless pour vos projets.</p>
          <h2>Réduction des coûts</h2>
          <p>Payez seulement pour le temps d'exécution réel de votre code.</p>
          <h2>Scalabilité automatique</h2>
          <p>Votre application s'adapte automatiquement à la charge.</p>
        `,
        excerpt: 'Découvrez comment le serverless computing peut améliorer vos déploiements d\'applications.',
        coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        tags: ['serverless', 'cloud', 'aws'],
        category: 'Cloud Computing',
        status: 'draft',
        readTime: '6 min',
        authorId: author.id,
      },
      {
        title: 'UX Design : Principes Fondamentaux',
        slug: 'ux-design-principes-fondamentaux',
        content: `
          <h1>L'expérience utilisateur est au cœur des produits numériques réussis...</h1>
          <p>Maîtrisez les principes fondamentaux du UX design pour créer des interfaces intuitives.</p>
          <h2>L'importance de la simplicité</h2>
          <p>Les interfaces simples sont plus faciles à utiliser et à comprendre.</p>
          <h2>Le parcours utilisateur</h2>
          <p>Concevez des parcours fluides et logiques pour vos utilisateurs.</p>
        `,
        excerpt: 'Maîtrisez les principes fondamentaux du UX design pour créer des interfaces intuitives.',
        coverUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        tags: ['ux design', 'ui', 'design'],
        category: 'Design',
        status: 'published',
        publishedAt: new Date('2024-01-01'),
        readTime: '7 min',
        authorId: author.id,
      },
    ]

    // Vérifier s'il y a déjà des articles
    const existingArticles = await prisma.blogArticle.count()
    if (existingArticles > 0) {
      console.log(`⚠️  ${existingArticles} articles existants détectés`)
      console.log('🗑️  Suppression des anciens articles...')
      await prisma.blogArticle.deleteMany({})
      console.log('✅ Anciens articles supprimés')
    }

    // Créer les articles de blog
    console.log(`📝 Création de ${blogArticles.length} articles...`)
    
    for (const articleData of blogArticles) {
      const article = await prisma.blogArticle.create({
        data: articleData,
      })
      console.log(`✅ Article créé: ${article.title}`)
    }

    console.log('🎉 Seeding des articles de blog terminé avec succès!')
    console.log(`📊 ${blogArticles.length} articles créés`)

    // Afficher un résumé par statut
    const publishedCount = await prisma.blogArticle.count({
      where: { status: 'published' }
    })
    const draftCount = await prisma.blogArticle.count({
      where: { status: 'draft' }
    })

    console.log('\n📈 Résumé:')
    console.log(`   📢 Publiés: ${publishedCount} articles`)
    console.log(`   📝 Brouillons: ${draftCount} articles`)

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })