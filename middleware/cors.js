const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser toutes les origines en développement
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL2,
      process.env.FRONTEND_URL3,
      process.env.FRONTEND_URL4,
      process.env.FRONTEND_URL_LOCAL,
    ];
    if (
      !origin ||
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Range",
    "Accept-Ranges",
    "Content-Range",
    "Origin",
    "X-Requested-With",
  ],
  exposedHeaders: [
    "Content-Range",
    "Accept-Ranges",
    "Content-Length",
    "Content-Type",
    "Content-Range",
  ],
};

module.exports = cors(corsOptions);