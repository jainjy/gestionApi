const cors = require('cors')

const corsOptions = {
  origin: [process.env.FRONTEND_URL ,process.env.FRONTEND_URL_LOCAL],
  credentials: true
}

module.exports = cors(corsOptions)