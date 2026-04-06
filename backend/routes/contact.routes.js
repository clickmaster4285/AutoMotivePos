// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');


router.post('/', contactController);


// Export the router
module.exports = router;