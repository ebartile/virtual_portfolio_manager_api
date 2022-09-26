const express   = require('express');
const router    = express.Router();

const { body }  = require("express-validator");
const { validateApiSecret,isAuthenticated }=require("../../middleware/authHelper");
require('dotenv').config();

const vpmController = require('../../controllers/vpmControllers/vpmController');


// Fetch user data

router.post('/getUserDetails',
  validateApiSecret,
  isAuthenticated,
  vpmController.getUserDetails
);


// Withdraw business amount raised

router.post('/withdrawAmount',
  validateApiSecret,
  isAuthenticated,
  [body('owner_address').not().isEmpty(),
  body('owner_private_key').not().isEmpty(),
  body('amount').not().isEmpty()],
  vpmController.withdrawAmount
);



router.post('/supportEmail',
  validateApiSecret,
  isAuthenticated,
  [ 
    body('email_subject').not().isEmpty(),
    body('email_message').not().isEmpty()
  ],
  vpmController.supportEmail
);




module.exports = router;