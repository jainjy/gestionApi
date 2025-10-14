const cors = require('cors')

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}

module.exports = cors(corsOptions)