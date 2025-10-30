// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer un utilisateur auteur si nécessaire
  const author = await prisma.user.findFirst({
    where: { email: 'pro@servo.mg' },
  });

  console.log(`✅ Utilisateur créé: ${author?.email}`)

  // Données des articles de blog
  const blogArticles = [
    {
      title: 'Introduction au Développement Web Moderne',
      slug: 'introduction-developpement-web-moderne',
      content: `
        <h1>Le développement web moderne a considérablement évolué ces dernières années...</h1>
        <p>Dans cet article, nous explorerons les principales technologies et pratiques qui définissent le développement web contemporain.</p>
        <!-- Contenu complet de l'article -->
      `,
      excerpt: 'Découvrez les technologies et pratiques qui définissent le développement web contemporain.',
      coverUrl: 'https://example.com/images/web-dev.jpg',
      tags: ['web development', 'javascript', 'react'],
      category: 'Technologie',
      status: 'published',
      publishedAt: new Date(),
      readTime: '5 min',
      authorId: author?.id,
    },
    {
      title: 'Les Meilleures Pratiques pour le SEO en 2024',
      slug: 'meilleures-pratiques-seo-2024',
      content: `
        <h1>L'optimisation pour les moteurs de recherche est plus importante que jamais...</h1>
        <p>Voici les stratégies SEO les plus efficaces pour améliorer votre classement en 2024.</p>
        <!-- Contenu complet de l'article -->
      `,
      excerpt: 'Découvrez les stratégies SEO les plus efficaces pour améliorer votre classement cette année.',
      coverUrl: 'https://example.com/images/seo.jpg',
      tags: ['seo', 'marketing', 'optimisation'],
      category: 'Marketing',
      status: 'published',
      publishedAt: new Date(),
      readTime: '8 min',
      authorId: author?.id,
    },
    {
      title: 'Guide Complet de TypeScript pour Débutants',
      slug: 'guide-typescript-debutants',
      content: `
        <h1>TypeScript est devenu un outil essentiel pour le développement JavaScript...</h1>
        <p>Apprenez les bases de TypeScript et comment l\'intégrer dans vos projets.</p>
        <!-- Contenu complet de l'article -->
      `,
      excerpt: 'Apprenez les bases de TypeScript et comment l\'intégrer dans vos projets JavaScript.',
      coverUrl: 'https://example.com/images/typescript.jpg',
      tags: ['typescript', 'javascript', 'programmation'],
      category: 'Programmation',
      status: 'published',
      publishedAt: new Date(),
      readTime: '10 min',
      authorId: author?.id,
    },
    {
      title: 'Les Avantages du Serverless Computing',
      slug: 'avantages-serverless-computing',
      content: `
        <h1>Le serverless computing révolutionne la façon dont nous déployons nos applications...</h1>
        <p>Explorez les avantages et cas d\'utilisation du serverless pour vos projets.</p>
        <!-- Contenu complet de l'article -->
      `,
      excerpt: 'Découvrez comment le serverless computing peut améliorer vos déploiements d\'applications.',
      coverUrl: 'https://example.com/images/serverless.jpg',
      tags: ['serverless', 'cloud', 'aws'],
      category: 'Cloud Computing',
      status: 'draft',
      readTime: '6 min',
      authorId: author?.id,
    },
    {
      title: 'UX Design : Principes Fondamentaux',
      slug: 'ux-design-principes-fondamentaux',
      content: `
        <h1>L\'expérience utilisateur est au cœur des produits numériques réussis...</h1>
        <p>Maîtrisez les principes fondamentaux du UX design pour créer des interfaces intuitives.</p>
        <!-- Contenu complet de l'article -->
      `,
      excerpt: 'Maîtrisez les principes fondamentaux du UX design pour créer des interfaces intuitives.',
      coverUrl: 'https://example.com/images/ux-design.jpg',
      tags: ['ux design', 'ui', 'design'],
      category: 'Design',
      status: 'published',
      publishedAt: new Date(),
      readTime: '7 min',
      authorId: author?.id,
    },
  ]

  // Créer les articles de blog
  for (const articleData of blogArticles) {
    const article = await prisma.blogArticle.upsert({
      where: { slug: articleData.slug },
      update: {},
      create: articleData,
    })
    console.log(`✅ Article créé: ${article.title}`)
  }

  console.log('🌱 Seeding terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })