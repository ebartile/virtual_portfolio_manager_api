const express   =   require('express');
const router    =   express.Router();
const { body } = require("express-validator");
const { validateApiSecret,isAuthenticated }   =   require("../../middleware/authHelper");
require('dotenv').config();

const vpmTokenController = require('../../controllers/blockchainControllers/vpmTokenController');


// Get users account balance

router.get('/getAccountBalance',
    validateApiSecret,
    body('account_address').not().isEmpty(),
    vpmTokenController.getAccountBalance
);


// // Get users account balance

router.get('/getUsersAccountBalance',
    validateApiSecret,
    isAuthenticated,
    vpmTokenController.getUsersAccountBalance
);


// Sending ETH to users

router.post('/transferETH',
    [body('transfer_address').not().isEmpty(),
    body('amount').not().isEmpty()],
    vpmTokenController.transferETH
);


// Sending VPM - Vpm token to users

router.post('/transferVPM',
    [body('transfer_address').not().isEmpty(),
    body('amount').not().isEmpty()],
    vpmTokenController.transferVPM
);


// Transfer VPM to use - with AUTH

router.post('/transferVPMToUser',
    validateApiSecret,
    isAuthenticated,
    body('amount').not().isEmpty(),
    vpmTokenController.transferVPMToUser
);


// Get the allowance for a account;

router.post('/getAllowance',
    [body('owner_address').not().isEmpty(),
    body('spender_address').not().isEmpty()],
    vpmTokenController.getAllowance
);


// Transfer VPM between user accounts

/// How the API works

// 1. Start with sending required ETH (gas) from the master account to VPM owner account
// 2. Approve the transaction amount
// 3. Send the amount to the transfer address from the VPM owner address

router.post('/transferVPMbetweenUsers',
    [body('owner_address').not().isEmpty(),
    body('owner_private_key').not().isEmpty(),
    body('transfer_address').not().isEmpty(),
    body('amount').not().isEmpty()],
    vpmTokenController.transferVPMbetweenUsers
);


module.exports = router;