const express   =   require('express');
const router    =   express.Router();
const multer    =   require('multer');
const path      =   require('path');
const { v4: uuidv4 }    =   require('uuid');
const { body}           =   require("express-validator");

const businessesController    =   require('../../controllers/blockchainControllers/businessesController');
const { validateApiSecret,isAuthenticated } =   require("../../middleware/authHelper");

require('dotenv').config();        


// Multer setup for Business image upload

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,(path.join(__dirname,'../../VpmMedia/business')));
    },
    filename:function(req,file,cb){
        const file_name = uuidv4() +".jpg";
        cb(null,file_name)
    }
});

const upload = multer({storage:storage});


// CREATE A NEW CROWFUNDING BUSINESS ON VPM

router.post('/createBusiness',
    validateApiSecret,
    isAuthenticated,
    upload.single('image'),
    businessesController.createBusiness
);


// GET BUSINESS LIST

router.post('/getBusinessList',
    validateApiSecret,
    isAuthenticated,
    body('sort_by').not().isEmpty(),
    businessesController.getBusinessList
);


// BUY EQUITY IN BUSINESS

router.post('/buyEquity',
    validateApiSecret,
    isAuthenticated,
    body('business_address').not().isEmpty(),
    body('amount').not().isEmpty(),
    businessesController.buyEquity
);



// GET BUSINESS DETAILS

router.post('/getBusinessDetails',
    body('business_address').not().isEmpty(),
    businessesController.getBusinessDetails
);


// GET BUSINESS MASTER DETAILS

router.post('/getBusinessMasterDetails',
    body('business_address').not().isEmpty(),
    businessesController.getBusinessMasterDetails
);


// GET FUNDING DETAILS

router.post('/getFundingDetails',
    body('business_address').not().isEmpty(),
    body('angel_address').not().isEmpty(),
    businessesController.getFundingDetails
);



// GET NUMBERS OF ANGELS WHO INVESTED IN A BUSINESS

router.post('/getBusinessesAngelInvestorsCount',
    body('business_address').not().isEmpty(),
    businessesController.getBusinessesAngelInvestorsCount
 );


// GET LIST OF ANGEL INVESTORS FOR A BUSINESS

router.post('/getBusinessesAngelInvestors',
    body('business_address').not().isEmpty(),
    businessesController.getBusinessesAngelInvestors
);


// GET BUSINESSES CREATED BY A USER

router.get('/getBusinessesCreatedByUser',
    validateApiSecret,
    isAuthenticated,
    businessesController.getBusinessesCreatedByUser
);


// GET BUSINESSES CREATED BY A USER

router.get('/getBusinessesInvestedByUser',
    validateApiSecret,
    isAuthenticated,
    businessesController.getBusinessesInvestedByUser
);


// GET COLLAB JOBS OF A USER

router.get('/getUsersCollabs',
    validateApiSecret,
    isAuthenticated,
    businessesController.getUsersCollabs
);



// Search for a business - Search API

router.post('/searchBusiness',
    validateApiSecret,
    isAuthenticated,
    [body('business_name').not().isEmpty()],
    businessesController.searchBusiness
);


module.exports = router;


