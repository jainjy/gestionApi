const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser toutes les origines en développement
    const allowedOrigins = [
      "http://localhost:8080",    //  PORT FRONTEND
      "http://127.0.0.1:8080",    //  PORT FRONTEND  
      "http://192.168.1.98:8080", //  RÉSEAU LOCAL
      "http://localhost:3000",
      "http://127.0.0.1:3000", 
      "http://localhost:3001",
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL2,
      process.env.FRONTEND_URL_LOCAL
    ];
    
    // En développement, on autorise tout
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Range", 
    "Accept-Ranges",
    "Content-Range",
    "Origin",
    "X-Requested-With"
  ],
  exposedHeaders: [
    "Content-Range", 
    "Accept-Ranges", 
    "Content-Length", 
    "Content-Type",
    "Content-Range"
  ]
};

module.exports = cors(corsOptions);