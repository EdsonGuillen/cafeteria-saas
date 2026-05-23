const router     = require('express').Router()
const ctrl       = require('../controllers/auth.controller')
const authMiddle = require('../middleware/auth.middleware')

router.post('/register', ctrl.register)
router.post('/login',    ctrl.login)
router.get('/me',        authMiddle, ctrl.me)

module.exports = router