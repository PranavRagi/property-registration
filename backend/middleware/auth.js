const jwt = require('jsonwebtoken')
const SECRET = 'property_app_secret_2026'

function verifyToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){
        return res.status(401).json({success: false, message: 'No token provided.'})
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if(err){
            return res.status(401).json({success: false, message: 'Invalid token.'})
        }
        req.user = decoded
        next()
    })
}

module.exports = {verifyToken,SECRET }