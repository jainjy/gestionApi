// routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');

// Middleware d'authentification pour l'API Sync
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.SYNC_API_KEY;

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized - Invalid API Key"
    });
  }
  next();
};

// Appliquer le middleware d'authentification à toutes les routes sync
router.use(authenticateApiKey);

/**
 * 🔐 POST /api/sync/auth - Vérification d'authentification
 */
router.post('/auth', (req, res) => {
  res.json({
    success: true,
    message: "API authenticated successfully",
    timestamp: new Date().toISOString()
  });
});

/**
 * 📦 GET /api/sync/parcels - Récupérer les colis avec filtrage
 * Query parameters:
 * - admin_email: Filtrer par email de l'administrateur/prestataire
 * - tracking_number: Récupérer un colis spécifique
 * - status: Filtrer par statut
 * - client_email: Filtrer par email du client
 * - limit: Limiter le nombre de résultats (défaut: 100)
 * - page: Numéro de page (défaut: 1)
 */
router.get('/parcels', async (req, res) => {
  try {
    const { 
      admin_email, 
      tracking_number, 
      status, 
      client_email,
      limit = 100,
      page = 1
    } = req.query;

    console.log('📦 API Sync - Récupération colis avec filtres:', {
      admin_email,
      tracking_number,
      status,
      client_email,
      page,
      limit
    });

    // Construire le filtre
    const where = {};
    
    // Filtre par admin_email (prestataire)
    if (admin_email) {
      const admin = await prisma.user.findUnique({
        where: { email: admin_email },
        select: { id: true, email: true }
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: `Prestataire avec email ${admin_email} non trouvé`
        });
      }

      where.idPrestataire = admin.id;
      console.log(`🔍 Filtrage par prestataire: ${admin.email} (ID: ${admin.id})`);
    }

    // Filtre par numéro de suivi
    if (tracking_number) {
      where.orderNumber = tracking_number;
      console.log(`🔍 Filtrage par tracking number: ${tracking_number}`);
    }

    // Filtre par statut
    if (status && status !== 'all') {
      const statusMap = {
        'pending': 'pending',
        'picked_up': 'confirmed',
        'in_transit': 'processing',
        'out_for_delivery': 'shipped',
        'delivered': 'delivered',
        'failed': 'cancelled',
        'confirmed': 'confirmed',
        'processing': 'processing',
        'shipped': 'shipped',
        'cancelled': 'cancelled'
      };
      
      where.status = statusMap[status] || status;
      console.log(`🔍 Filtrage par statut: ${status} -> ${where.status}`);
    }

    // Filtre par email du client
    if (client_email) {
      const client = await prisma.user.findUnique({
        where: { email: client_email },
        select: { id: true }
      });

      if (client) {
        where.userId = client.id;
        console.log(`🔍 Filtrage par client: ${client_email} (ID: ${client.id})`);
      }
    }

    // Pagination
    const take = Math.min(parseInt(limit), 500);
    const skip = (parseInt(page) - 1) * take;

    console.log(`📊 Pagination: skip=${skip}, take=${take}`);

    // Récupérer les commandes avec toutes les informations nécessaires
    const orders = await prisma.order.findMany({
      where,
      include: {
        // Client (propriétaire du colis)
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
            address: true,
            city: true,
            zipCode: true
          }
        },
        // Prestataire/Admin (en charge du colis)
        prestataire: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
            address: true,
            city: true,
            zipCode: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take,
      skip
    });

    // Compter le total
    const total = await prisma.order.count({ where });

    console.log(`✅ ${orders.length} colis trouvés sur ${total} total`);

    // Transformer les données pour ParcelTracking
    const transformedParcels = orders.map(order => {
      const shippingAddress = order.shippingAddress || {};
      
      // Informations d'adresse d'expédition
      const senderInfo = {
        name: shippingAddress.senderName || order.prestataire?.companyName || order.prestataire?.firstName || 'Non spécifié',
        address: shippingAddress.senderAddress || order.prestataire?.address || '',
        city: shippingAddress.senderCity || order.prestataire?.city || '',
        zipCode: shippingAddress.senderZipCode || order.prestataire?.zipCode || '',
        phone: order.prestataire?.phone || '',
        email: order.prestataire?.email || ''
      };

      // Informations du destinataire
      const recipientInfo = {
        name: shippingAddress.recipientName || order.user?.firstName || 'Client',
        address: shippingAddress.address || order.user?.address || '',
        city: shippingAddress.city || order.user?.city || '',
        zipCode: shippingAddress.postalCode || order.user?.zipCode || '',
        phone: shippingAddress.phone || order.user?.phone || '',
        email: order.user?.email || ''
      };

      // Détails des articles
      const items = Array.isArray(order.items) ? order.items : [];
      const itemDescriptions = items.map(item => 
        `${item.quantity || 1}x ${item.name || 'Article'} - ${item.productType || 'general'}`
      );

      return {
        // Informations de base
        id: order.id,
        tracking_number: order.orderNumber,
        
        // Client/Propriétaire du colis
        client: {
          id: order.user?.id,
          email: order.user?.email,
          name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
          phone: order.user?.phone,
          company: order.user?.companyName
        },
        
        // Admin/Prestataire en charge
        admin: {
          id: order.prestataire?.id,
          email: order.prestataire?.email,
          name: `${order.prestataire?.firstName || ''} ${order.prestataire?.lastName || ''}`.trim(),
          phone: order.prestataire?.phone,
          company: order.prestataire?.companyName,
          role: order.prestataire?.role
        },
        
        // Expéditeur (généralement l'admin/prestataire)
        sender: senderInfo,
        
        // Destinataire (généralement le client)
        recipient: recipientInfo,
        
        // Statut et suivi
        status: order.status,
        payment_status: order.paymentStatus,
        
        // Informations de livraison
        delivery_address: shippingAddress.address || '',
        delivery_city: shippingAddress.city || '',
        delivery_zip_code: shippingAddress.postalCode || '',
        delivery_country: shippingAddress.country || 'France',
        
        // Détails du colis
        weight: order.weight || 0,
        description: order.description || itemDescriptions.join(', ') || 'Colis',
        total_amount: order.totalAmount,
        items_count: items.length,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          product_type: item.productType || 'general'
        })),
        
        // Métadonnées de livraison
        delivery_details: order.deliveryDetails || {},
        delivery_id: order.deliveryId,
        
        // Dates importantes
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        estimated_delivery: order.estimatedDelivery,
        
        // Notes et informations supplémentaires
        notes: order.notes || [],
        special_instructions: shippingAddress.specialInstructions || ''
      };
    });

    res.json({
      success: true,
      data: transformedParcels,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      },
      filters_applied: {
        admin_email: admin_email || 'aucun',
        tracking_number: tracking_number || 'aucun',
        status: status || 'aucun',
        client_email: client_email || 'aucun'
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération colis:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des colis",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📦 POST /api/sync/parcels - Créer un nouveau colis depuis ParcelTracking
 */
router.post('/parcels', async (req, res) => {
  try {
    console.log('📦 API Sync - Création colis:', req.body);
    
    const {
      tracking_number,
      client_email,
      admin_email,
      sender_name,
      sender_address,
      sender_city,
      sender_zip_code,
      sender_phone,
      recipient_name,
      recipient_address,
      recipient_city,
      recipient_zip_code,
      recipient_phone,
      status = 'pending',
      weight = 0,
      description = '',
      items = []
    } = req.body;

    // Validation
    if (!tracking_number) {
      return res.status(400).json({
        success: false,
        error: "tracking_number est requis"
      });
    }

    if (!client_email && !recipient_email) {
      return res.status(400).json({
        success: false,
        error: "client_email ou recipient_email est requis"
      });
    }

    if (!admin_email) {
      return res.status(400).json({
        success: false,
        error: "admin_email est requis"
      });
    }

    // Vérifier que l'admin/prestataire existe
    const admin = await prisma.user.findUnique({
      where: { email: admin_email }
    });

    if (!admin) {
      console.error(`❌ Admin non trouvé: ${admin_email}`);
      return res.status(404).json({
        success: false,
        error: `Prestataire avec email ${admin_email} non trouvé`
      });
    }

    console.log(`✅ Admin trouvé: ${admin.email} (ID: ${admin.id})`);

    // Vérifier/gérer le client
    const clientEmail = client_email || recipient_email;
    let client = await prisma.user.findUnique({
      where: { email: clientEmail }
    });

    if (!client) {
      console.log(`🆕 Création client: ${clientEmail}`);
      client = await prisma.user.create({
        data: {
          email: clientEmail,
          firstName: recipient_name?.split(' ')[0] || 'Client',
          lastName: recipient_name?.split(' ').slice(1).join(' ') || 'TrackParcel',
          phone: recipient_phone || '',
          role: 'user',
          passwordHash: 'temp_trackparcel_' + Math.random().toString(36).substr(2, 9)
        }
      });
      console.log(`✅ Client créé: ${client.id}`);
    } else {
      console.log(`✅ Client existant: ${client.id}`);
    }

    // Transformer le statut
    const statusMap = {
      'pending': 'pending',
      'picked_up': 'confirmed',
      'in_transit': 'processing',
      'out_for_delivery': 'shipped',
      'delivered': 'delivered',
      'failed': 'cancelled'
    };

    const orderStatus = statusMap[status] || 'pending';

    // Préparer les items
    const orderItems = items.length > 0 ? items.map(item => ({
      productId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || description || 'Colis',
      price: item.price || 0,
      quantity: item.quantity || 1,
      productType: item.product_type || 'general',
      itemTotal: (item.price || 0) * (item.quantity || 1)
    })) : [{
      productId: `sync_parcel_${Date.now()}`,
      name: description || 'Colis TrackParcel',
      price: 0,
      quantity: 1,
      productType: 'general',
      itemTotal: 0
    }];

    // Calculer le total
    const totalAmount = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        orderNumber: tracking_number,
        userId: client.id,
        idPrestataire: admin.id,
        items: orderItems,
        totalAmount: totalAmount,
        shippingAddress: {
          senderName: sender_name,
          senderAddress: sender_address,
          senderCity: sender_city,
          senderZipCode: sender_zip_code,
          senderPhone: sender_phone,
          recipientName: recipient_name,
          address: recipient_address,
          city: recipient_city,
          postalCode: recipient_zip_code,
          phone: recipient_phone,
          country: 'France'
        },
        paymentMethod: 'sync',
        status: orderStatus,
        paymentStatus: 'completed',
        weight: parseFloat(weight) || 0,
        description: description,
        deliveryDetails: {
          source: 'parceltracking_sync',
          sync_date: new Date().toISOString(),
          external_reference: tracking_number
        }
      }
    });

    console.log(`✅ Colis créé: ${order.id} (${order.orderNumber})`);

    res.status(201).json({
      success: true,
      action: 'created',
      data: {
        id: order.id,
        tracking_number: order.orderNumber,
        client_id: client.id,
        admin_id: admin.id,
        status: order.status,
        created_at: order.createdAt
      },
      message: 'Colis créé avec succès dans le système'
    });

  } catch (error) {
    console.error('💥 Erreur création colis:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: "Un colis avec ce numéro de suivi existe déjà"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création du colis",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 🔄 PUT /api/sync/parcels/:tracking_number - Mettre à jour un colis
 */
router.put('/parcels/:tracking_number', async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const { 
      status, 
      client_email, 
      admin_email,
      delivery_address,
      delivery_city,
      delivery_zip_code,
      weight,
      description,
      delivery_details
    } = req.body;

    console.log(`🔄 Mise à jour colis ${tracking_number}:`, req.body);

    if (!tracking_number) {
      return res.status(400).json({
        success: false,
        error: "tracking_number est requis dans l'URL"
      });
    }

    // Chercher la commande
    const order = await prisma.order.findUnique({
      where: { orderNumber: tracking_number },
      include: {
        user: true,
        prestataire: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Colis avec tracking number ${tracking_number} non trouvé`
      });
    }

    // Préparer les données de mise à jour
    const updateData = {
      updatedAt: new Date()
    };

    // Mise à jour du statut
    if (status) {
      const statusMap = {
        'pending': 'pending',
        'picked_up': 'confirmed',
        'in_transit': 'processing',
        'out_for_delivery': 'shipped',
        'delivered': 'delivered',
        'failed': 'cancelled'
      };
      
      updateData.status = statusMap[status] || status;
      
      // Si livré, marquer comme payé
      if (updateData.status === 'delivered') {
        updateData.paymentStatus = 'completed';
      }
    }

    // Mise à jour du client si nécessaire
    if (client_email && client_email !== order.user?.email) {
      let client = await prisma.user.findUnique({
        where: { email: client_email }
      });

      if (!client) {
        client = await prisma.user.create({
          data: {
            email: client_email,
            firstName: 'Client',
            lastName: 'TrackParcel',
            phone: '',
            role: 'user',
            passwordHash: 'temp_trackparcel_' + Math.random().toString(36).substr(2, 9)
          }
        });
      }

      updateData.userId = client.id;
    }

    // Mise à jour de l'admin si nécessaire
    if (admin_email && admin_email !== order.prestataire?.email) {
      const admin = await prisma.user.findUnique({
        where: { email: admin_email }
      });

      if (admin) {
        updateData.idPrestataire = admin.id;
      }
    }

    // Mise à jour des autres informations
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (description) updateData.description = description;
    
    // Mise à jour des détails de livraison
    if (delivery_details) {
      updateData.deliveryDetails = {
        ...(order.deliveryDetails || {}),
        ...delivery_details,
        last_updated: new Date().toISOString()
      };
    }

    // Mise à jour de l'adresse de livraison
    if (delivery_address || delivery_city || delivery_zip_code) {
      const currentAddress = order.shippingAddress || {};
      updateData.shippingAddress = {
        ...currentAddress,
        address: delivery_address || currentAddress.address,
        city: delivery_city || currentAddress.city,
        postalCode: delivery_zip_code || currentAddress.postalCode
      };
    }

    // Appliquer les mises à jour
    const updatedOrder = await prisma.order.update({
      where: { orderNumber: tracking_number },
      data: updateData,
      include: {
        user: true,
        prestataire: true
      }
    });

    console.log(`✅ Colis mis à jour: ${tracking_number}`);

    res.json({
      success: true,
      message: "Colis mis à jour avec succès",
      data: {
        tracking_number: updatedOrder.orderNumber,
        status: updatedOrder.status,
        client_email: updatedOrder.user?.email,
        admin_email: updatedOrder.prestataire?.email,
        updated_at: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour colis:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour du colis",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 👥 GET /api/sync/admins - Récupérer tous les administrateurs/prestataires
 */
router.get('/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'professional' }
        ],
        email: { not: null }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        companyName: true,
        address: true,
        city: true,
        zipCode: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: admins,
      count: admins.length
    });
  } catch (error) {
    console.error('💥 Erreur récupération admins:', error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des administrateurs"
    });
  }
});

module.exports = router;