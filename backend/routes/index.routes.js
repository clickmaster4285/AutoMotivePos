
const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const user = require('./user.routes');
const branch = require('./branch.routes');
const customer = require('./customer.routes');
const warehouse = require('./warehouse.routes');
const category = require('./categoty.routes');
const product = require('./product.routes');
const transfer = require('./transfer.routes');



router.use('/auth', auth);
router.use('/users', user);
router.use('/branches', branch);
router.use('/customers', customer);
router.use('/warehouses', warehouse);
router.use('/categories', category);
router.use('/products', product);
router.use('/transfers', transfer);


module.exports = router;