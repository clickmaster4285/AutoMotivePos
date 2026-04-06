
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
const jobCard = require('./jobCard.routes');
const supplier = require('./supplier.routes');
const transaction = require('./transaction.routes');
const refund = require('./refund.routes');
const centralizedProduct = require('./centralizedProducts.routes');
const auditLogs = require("./auditLog.routes");
const settings = require("./settings.routes");
const contact = require('./contact.routes');


router.use('/auth', auth);
router.use('/users', user);
router.use('/branches', branch);
router.use('/customers', customer);
router.use('/warehouses', warehouse);
router.use('/categories', category);
router.use('/products', product);
router.use('/transfers', transfer);
router.use('/job-cards', jobCard);
router.use('/suppliers', supplier);
router.use('/transactions', transaction);
router.use('/refunds', refund);
router.use('/centralizedproducts', centralizedProduct);
router.use("/audit-logs", auditLogs);
router.use("/settings", settings);
router.use('/contact', contact);

module.exports = router;