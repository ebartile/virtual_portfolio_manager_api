const express   =   require('express');
const router    =   express.Router();

const { body }  =   require("express-validator");
const { validateApiSecret,isAuthenticated } =   require("../../middleware/authHelper");

const collabController  =   require('../../controllers/vpmControllers/collabController');

require('dotenv').config();



// Create a new collab job for a business 

router.post('/newCollabJobForBusiness',
    validateApiSecret,
    isAuthenticated,
    [
        body('business_id').not().isEmpty(),
        body('business_owner_username').not().isEmpty(),
        body('collab_title').not().isEmpty(),
        body('collab_amount').not().isEmpty(),
        body('collab_description').not().isEmpty()
    ],
    collabController.newCollabJobForBusiness
);


// Fetch all the collab jobs for a particular business

router.get('/getAllCollabJobForABusiness/:id',
    validateApiSecret,
    isAuthenticated,
    collabController.getAllCollabJobForABusiness
);


// Send a request to a business to join as a collab for a particular position

router.post('/sendRequestToCollab',
    validateApiSecret,
    isAuthenticated,
    [body('collab_job_id').not().isEmpty()],
    collabController.sendRequestToCollab
);


// Fetch Collab Request for a particular business


router.get('/getAllCollabRequestForABusinessJob/:id',
    validateApiSecret,
    isAuthenticated,
    collabController.getAllCollabRequestForABusinessJob
);



// Accept a request for a collab job

router.post('/acceptUsersRequest',
    validateApiSecret,
    isAuthenticated,
    [   body('collab_job_id').not().isEmpty(),
        body('business_address').not().isEmpty(),
        body('col_username').not().isEmpty(),
        body('col_address').not().isEmpty(),
        body('collab_title').not().isEmpty(),
        body('collab_amount').not().isEmpty(),
    ],
    collabController.acceptUsersRequest
);



// Reject a collab request for a collab

router.put('/rejectCollabRequestForABusinessJob',    
    validateApiSecret,
    isAuthenticated,
    [
        body('collab_job_id').not().isEmpty(),
        body('col_req_username').not().isEmpty(),
    ],
    collabController.rejectCollabRequestForABusinessJob
);



// Get businesses accepted collabs

router.get('/getCollabAcceptedRequest/:businessaddress',    
    validateApiSecret,
    isAuthenticated,
    collabController.getCollabAcceptedRequest
);



module.exports = router;