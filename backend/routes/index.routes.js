
const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const user = require('./user.routes');
const branch = require('./branch.routes');
const customer = require('./customer.routes');



router.use('/auth', auth);
router.use('/users', user);
router.use('/branches', branch);
router.use('/customers', customer);


module.exports = router;