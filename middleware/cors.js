const cors = require("cors");

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL2,
    process.env.FRONTEND_URL_LOCAL,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

module.exports = cors(corsOptions);
