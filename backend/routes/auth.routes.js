const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const auth = require('../middlewares/auth');


router.post('/login', login);

router.get('/me', auth, getMe);

module.exports = router;
