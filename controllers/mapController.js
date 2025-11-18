const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les utilisateurs avec coordonnées géographiques
exports.getUsersWithCoordinates = async (req, res) => {
  try {
    console.log('📡 Récupération des utilisateurs avec coordonnées...');
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        commercialName: true,
        userType: true,
        latitude: true,
        longitude: true,
        city: true,
        address: true,
        phone: true,
        metiers: {
          include: {
            metier: {
              select: {
                libelle: true
              }
            }
          }
        },
        services: {
          include: {
            service: {
              select: {
                libelle: true,
                price: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ ${users.length} utilisateurs trouvés avec coordonnées`);

    // Formater les données pour la carte
    const formattedUsers = users.map(user => {
      const name = user.commercialName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur sans nom';
      
      return {
        id: user.id,
        name: name,
        email: user.email,
        company: user.companyName,
        type: user.userType || 'user',
        latitude: user.latitude,
        longitude: user.longitude,
        city: user.city,
        address: user.address,
        phone: user.phone,
        metiers: user.metiers.map(m => m.metier.libelle),
        services: user.services.map(s => ({
          name: s.service.libelle,
          price: s.service.price
        })),
        popupContent: `
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-lg text-blue-600 mb-2">${name}</h3>
            ${user.companyName ? `<p class="text-sm mb-1"><strong class="text-gray-700">Entreprise:</strong> ${user.companyName}</p>` : ''}
            ${user.metiers.length > 0 ? `<p class="text-sm mb-1"><strong class="text-gray-700">Métiers:</strong> ${user.metiers.map(m => m.metier.libelle).join(', ')}</p>` : ''}
            ${user.services.length > 0 ? `<p class="text-sm mb-1"><strong class="text-gray-700">Services:</strong> ${user.services.map(s => s.service.libelle).join(', ')}</p>` : ''}
            ${user.address ? `<p class="text-sm mb-1"><strong class="text-gray-700">Adresse:</strong> ${user.address}</p>` : ''}
            ${user.city ? `<p class="text-sm mb-1"><strong class="text-gray-700">Ville:</strong> ${user.city}</p>` : ''}
            ${user.phone ? `<p class="text-sm mb-1"><strong class="text-gray-700">Téléphone:</strong> ${user.phone}</p>` : ''}
            ${user.email ? `<p class="text-sm mb-1"><strong class="text-gray-700">Email:</strong> ${user.email}</p>` : ''}
          </div>
        `
      };
    });

    res.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs',
      details: error.message 
    });
  }
};

// Récupérer les propriétés avec coordonnées
exports.getPropertiesWithCoordinates = async (req, res) => {
  try {
    console.log('📡 Récupération des propriétés avec coordonnées...');
    
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { isActive: true }
        ]
      },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        surface: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        images: true,
        status: true,
        listingType: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true
          }
        }
      }
    });

    console.log(`✅ ${properties.length} propriétés trouvées avec coordonnées`);

    const formattedProperties = properties.map(property => {
      const ownerName = property.owner.companyName || `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || 'Propriétaire inconnu';
      
      return {
        id: property.id,
        title: property.title,
        type: property.type,
        price: property.price,
        city: property.city,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        surface: property.surface,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        images: property.images,
        status: property.status,
        listingType: property.listingType,
        owner: ownerName,
        ownerPhone: property.owner.phone,
        popupContent: `
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-lg text-green-600 mb-2">${property.title}</h3>
            ${property.images.length > 0 ? `
              <img 
                src="${property.images[0]}" 
                alt="${property.title}" 
                class="w-full h-32 object-cover rounded mb-2"
                onerror="this.style.display='none'"
              >
            ` : ''}
            <div class="space-y-1 text-sm">
              <p><strong class="text-gray-700">Type:</strong> ${property.type}</p>
              <p><strong class="text-gray-700">Prix:</strong> ${property.price ? `${property.price} €` : 'Non spécifié'}</p>
              ${property.surface ? `<p><strong class="text-gray-700">Surface:</strong> ${property.surface} m²</p>` : ''}
              ${property.rooms ? `<p><strong class="text-gray-700">Pièces:</strong> ${property.rooms}</p>` : ''}
              ${property.bedrooms ? `<p><strong class="text-gray-700">Chambres:</strong> ${property.bedrooms}</p>` : ''}
              <p><strong class="text-gray-700">Ville:</strong> ${property.city}</p>
              ${property.address ? `<p><strong class="text-gray-700">Adresse:</strong> ${property.address}</p>` : ''}
              <p><strong class="text-gray-700">Statut:</strong> <span class="capitalize">${property.status}</span></p>
              <p><strong class="text-gray-700">Propriétaire:</strong> ${ownerName}</p>
              ${property.ownerPhone ? `<p><strong class="text-gray-700">Contact:</strong> ${property.ownerPhone}</p>` : ''}
            </div>
          </div>
        `
      };
    });

    res.json({
      success: true,
      data: formattedProperties,
      count: formattedProperties.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des propriétés:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des propriétés',
      details: error.message 
    });
  }
};

// Récupérer tous les points (utilisateurs + propriétés)
exports.getAllMapPoints = async (req, res) => {
  try {
    console.log('📡 Récupération de tous les points de la carte...');
    
    const [users, properties] = await Promise.all([
      prisma.user.findMany({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          commercialName: true,
          userType: true,
          latitude: true,
          longitude: true,
          city: true,
          address: true
        }
      }),
      prisma.property.findMany({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
            { isActive: true }
          ]
        },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          city: true,
          address: true,
          latitude: true,
          longitude: true
        }
      })
    ]);

    console.log(`✅ ${users.length} utilisateurs et ${properties.length} propriétés trouvés`);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          name: user.commercialName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur sans nom',
          type: 'user'
        })),
        properties: properties.map(property => ({
          ...property,
          type: 'property'
        }))
      },
      counts: {
        users: users.length,
        properties: properties.length,
        total: users.length + properties.length
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des points:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des points de carte',
      details: error.message 
    });
  }
};