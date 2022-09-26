const Tx        =   require('ethereumjs-tx');
const Web3      =   require('web3');
const moment    =   require('moment-timezone');
const CryptoJS  =   require("crypto-js");
const axios     =   require('axios');
const { validationResult }    =   require("express-validator");

require('dotenv').config();

const BusinessModel         =   require('../../models/businessDetailsModel');
const UserAuthModel     =   require('../../models/userAuthModel');
const UserDetailsModel  =   require("../../models/userDetailsModel");
const CollabModel       =   require("../../models/collabModel");   


///////////////////////////
//Web3 and contract setup
///////////////////////////

const rpcURL = process.env.RCPURL;

const web3 = new Web3(rpcURL);

const Businesses = require('../../build/contracts/Businesses.json');

const VPMToken = require('../../build/contracts/VpmToken.json');

const contract_address = process.env.BUSINESSCONTRACTADDRESS;

const VPMCONTRACTADDRESS = process.env.VPMCONTRACTADDRESS;

const abi = Businesses.abi;

const vpmabi = VPMToken.abi;

const contract = new web3.eth.Contract(abi,contract_address);

const vpm_contract = new web3.eth.Contract(vpmabi,VPMCONTRACTADDRESS);



////////////////////////////////////
// Account addresses & Private keys
////////////////////////////////////


//Main account with which contract is deployed

const account_address = process.env.ACCOUNT;

const account_address_1 = process.env.ACCOUNT;

// Main private key - token generation

const privateKey = Buffer.from(process.env.PRIVATEKEY,'hex');

const privateKey1 = Buffer.from(process.env.PRIVATEKEY,'hex');

const createBusiness = async(req,res)=>{
    try{

        // INput field validation

        if(req.file == undefined || req.file.size == 0){
            return res.status(401).json({
                error:"No valid image is provided",
                result:false
            })
        }
        if(req.body.business_name == "" || req.body.business_name == undefined){
            return res.status(401).json({
                error:"Input field business_name is not valid",
                result:false
            })
        }
        if(req.body.business_target == "" || req.body.business_target == undefined){
            return res.status(401).json({
                error:"Input field business_target is not valid",
                result:false
            })
        }
        if(req.body.business_equity == "" || req.body.business_equity == undefined){
            return res.status(401).json({
                error:"Input field business_equity is not valid",
                result:false
            })
        }
        if(req.body.business_description == "" || req.body.business_description == undefined){
            return res.status(401).json({
                error:"Input field business_description is not valid",
                result:false
            })
        }
        if(req.body.long_description == "" || req.body.long_description == undefined){
            return res.status(401).json({
                error:"Input field long_description is not valid",
                result:false
            })
        }
        if(req.body.category == "" || req.body.category == undefined){
            return res.status(401).json({
                error:"Input field category is not valid",
                result:false
            })
        }

        const image_url = `http://${process.env.SERVERURL}:${process.env.SERVERPORT}/media/business/${req.file.filename}`;
        const business_name         =   req.body.business_name;
        const business_target       =   req.body.business_target;
        const business_equity       =   req.body.business_equity;
        const business_description  =   req.body.business_description;
        const long_description  =   req.body.long_description;
        const category          =   req.body.category
        const estGasPrice       =   await web3.eth.getGasPrice()*2;



        // Checking if the business name already exists

        const businessExists    =   await BusinessModel.findOne({name:business_name});

        if(businessExists){
            return res.status(400).json({
                result:false,
                msg:'Business already exists'
            })
        }

        // Create a eth account for business

        const ethAccount    =   await web3.eth.accounts.create();

        if(!ethAccount){
          return res.status(400).json({
            msg:"There was a problem creating ETH account for the user",
            result:false
          });
        }

        // Using AES to encrypt the Ethereum private key

        let ciphertext = CryptoJS.AES.encrypt(ethAccount.privateKey,process.env.MASTERKEY).toString();


        // Saving the business on Ethereum SC.

        const txCount = await web3.eth.getTransactionCount(account_address);
        if(!txCount){
            return res.status(500).json({
                result:false,
                msg:'There was a problem creating a Business'
            })
        }
        // Build the transaction
        const txObject = {
            nonce:    web3.utils.toHex(txCount),
            to:       contract_address,
            gasLimit: web3.utils.toHex(500000),
            gasPrice: web3.utils.toHex(estGasPrice),
            data: contract.methods.createBusiness(ethAccount.address,business_target,business_equity).encodeABI()
        }
    
        // Sign the transaction
        const tx = new Tx(txObject,{chain:3})
        tx.sign(privateKey)
    
        const serializedTx = tx.serialize()
        const raw = '0x' + serializedTx.toString('hex')


        // Broadcast the transaction

        await web3.eth.sendSignedTransaction(raw);



        // Saving business details to the database

        const businessDetails = new BusinessModel({
            name                :   business_name,  
            owner               :   req.decoded.username,
            createdOn           :   moment().format('MMMM Do YYYY, h:mm:ss a'),
            target              :   business_target,
            equity              :   business_equity,
            address             :   ethAccount.address,   
            privatekey          :   ciphertext,
            business_image          :   image_url,
            business_description    :   business_description,
            long_description    :   long_description,
            category            :   category
        });
        

        const newBusinessDetails = await BusinessModel.create(businessDetails);

        if(!newBusinessDetails){
            return res.status(500).json({
                result:false,
                msg:'There was a problem creating the business',
            });
        }

        // Saving the business id to userdetails

        const userDetailsUpdate = await UserDetailsModel.findOneAndUpdate({username:req.decoded.username},{
            $addToSet:{businesses_owned:newBusinessDetails.id}
        })

        if(!userDetailsUpdate){
            return res.status(500).json({
                result:false,
                msg:'There was a problem creating the business',
            });
        }

        return res.status(200).json({
            result:true,
            msg:'Business created',
            business:newBusinessDetails
        });
        
    }
    catch(err){
        console.log(err);
        // console.log(web3.utils.hexToAscii(err.receipt.logsBloom));
        res.status(500).json({
            result:false,
            msg:'There was a problem creating the business. Note - Business name needs to be unique.'
        })
    }
}


const getBusinessList = async(req,res)=>{
    try{

        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const sort_by   =   req.body.sort_by;

        let businessList;

        if(sort_by == "Latest"){
             businessList = (await BusinessModel.find({})).reverse();
        }
        else if(sort_by == "High target"){
            businessList = await BusinessModel.find({}).sort({target:-1});
        }
        else if(sort_by == "Low target"){
            businessList = await BusinessModel.find({}).sort({target:1});
        }
        
        if(businessList.length == 0){
            return res.status(500).json({
                result:false,
                msg:'No businesses found'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Business list fetched',
            details:businessList
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the business list'
        })
    }
}


////////////////////
/// BUY EQUITY API
///////////////////

/// How the API works

// 1. Start with sending required ETH (gas) from the master account to VPM owner account
// 2. Approve the transaction amount
// 3. Send the amount to the transfer address from the VPM owner address
// 4. Update the Businesses SC


const buyEquity = async(req,res)=>{
    try{

        //Input field validation
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const owner_address     =   req.decoded.eth_address;
        const transfer_address  =   req.body.business_address;
        const amount            =   req.body.amount;
        const estGasPrice       =   await web3.eth.getGasPrice()*2;



        const buyer_private_key  =   req.decoded.eth_private_key;
        let bytes                =   CryptoJS.AES.decrypt(buyer_private_key, process.env.MASTERKEY);
        let bytes_key            =   bytes.toString(CryptoJS.enc.Utf8).slice(2);
        let owner_private_key    =   Buffer.from(bytes_key,'hex');

        res.status(200).json({
            result:true,
            msg:`Transaction in progress this might take some time` 
        });

        ///////////////////////////////////////////////////////////////
        // Transferring ETH(gas) required for the transaction to owner 
        ///////////////////////////////////////////////////////////////

        const txCount = await web3.eth.getTransactionCount(account_address_1);
        if(!txCount){
            return res.status(500).json({
                result:false,
                msg:'There was a problem transferring ETH - gas for the transaction'
            })
        }

        // Build the transaction
        const txObject1 = {
            nonce:    web3.utils.toHex(txCount),
            to:       owner_address,
            value:    web3.utils.toHex(web3.utils.toWei('100000000', 'gwei')),
            gasLimit: web3.utils.toHex(500000),
            gasPrice: web3.utils.toHex(estGasPrice),
        }
    
        // Sign the transaction
        const tx1 = new Tx(txObject1,{chain:3})
        tx1.sign(privateKey1)
    
        const serializedTx1 = tx1.serialize()
        const raw1 = '0x' + serializedTx1.toString('hex')
    
        // Broadcast the transaction
        const sendTransaction = await web3.eth.sendSignedTransaction(raw1);
        if(!sendTransaction){
            return res.status(500).json({
                result:false,
                msg:'There was a problem transferring ETH - gas for the transaction'
            })
        }
        console.log('\nETH transfered for the transaction');



        //////////////////////////////////////////////////////////////
        // Getting approval for the transaction
        //////////////////////////////////////////////////////////////
    
        const ownertxCount = await web3.eth.getTransactionCount(owner_address);
        console.log("Approval txCount : "+ownertxCount);

        // Build the transaction
        const txObject2 = {
        nonce:    web3.utils.toHex(ownertxCount),
        to:       VPMCONTRACTADDRESS,
        gasLimit: web3.utils.toHex(500000),
        gasPrice: web3.utils.toHex(estGasPrice),
        data: vpm_contract.methods.increaseAllowance(owner_address,amount).encodeABI()
        }
    
        // Sign the transaction
        const tx2 = new Tx(txObject2,{chain:3})
        tx2.sign(owner_private_key)
    
        const serializedTx2 = tx2.serialize()
        const raw2 = '0x' + serializedTx2.toString('hex')
    
        // Broadcast the transaction
        const approvalHash = await web3.eth.sendSignedTransaction(raw2);

        if(!approvalHash){
            return res.status(500).json({
                result:false,
                msg:'There was a problem getting approval for transaction'
            })
        }
        
        console.log("\nTransfer approved");



        /////////////////////////////////
        // Transfering VPM between users
        /////////////////////////////////


        const ownertxCountUpdated = await  web3.eth.getTransactionCount(owner_address);
        console.log("Transfer txCount : "+ownertxCountUpdated);

     
        // Build the transaction
        const txObject3 = {  
            nonce:    web3.utils.toHex(ownertxCountUpdated),
            to:       VPMCONTRACTADDRESS,
            gasLimit: web3.utils.toHex(100000),
            gasPrice: web3.utils.toHex(estGasPrice),
            data: vpm_contract.methods.transferFrom(owner_address,transfer_address,amount).encodeABI()
        }

        
        // Sign the transaction2
        const tx3 = new Tx(txObject3,{chain:3})
        tx3.sign(owner_private_key)
        
        const serializedTx3 = tx3.serialize()
        const raw3 = '0x' + serializedTx3.toString('hex')
        
        // Broadcast the transaction
        const finalTransactionHash = await web3.eth.sendSignedTransaction(raw3);
        if(!finalTransactionHash){
            return res.status(500).json({
                result:false,
                msg:'There was a problem transferring VPM between users.'
            })
        }

        console.log(`\nVPM transfered between accounts : ${amount} VPM`);
        

        /////////////////////////////////////////////
        // Making Changes to the Businesses smart contract
        /////////////////////////////////////////////

        const txCount4 = await web3.eth.getTransactionCount(account_address);
        if(!txCount4){
            console.log('There was a problem in transaction');
        }

        // Build the transaction
        const txObject4 = {
            nonce:    web3.utils.toHex(txCount4),
            to:       contract_address,
            gasLimit: web3.utils.toHex(500000),
            gasPrice: web3.utils.toHex(estGasPrice),
            data: contract.methods.buyEquity(owner_address,transfer_address,amount).encodeABI()
        }
    
        // Sign the transaction
        const tx4 = new Tx(txObject4,{chain:3})
        tx4.sign(privateKey)
    
        const serializedTx4 = tx4.serialize()
        const raw4 = '0x' + serializedTx4.toString('hex')


        // Broadcast the transaction

        const transactionDetails = await web3.eth.sendSignedTransaction(raw4);
        if(transactionDetails.logs.length>0){
            const businessUpdate = await BusinessModel.findOneAndUpdate({address:transfer_address},{targetReachedDB:true});
            if(!businessUpdate){
                console.log('\nThere was a problem updating the targetReached status');
            }
            console.log("\nBusiness's target reached !!!!");
        }
        if(transactionDetails.status){
            
            // Saving the business id to userdetails

            const businessDetails = await BusinessModel.findOne({address:transfer_address});
            if(!businessDetails){
                console.log('\nBusiness not found');
            }

            const userDetailsUpdate = await UserDetailsModel.findOneAndUpdate({username:req.decoded.username},{
                $addToSet:{businesses_invested:businessDetails.id}
            })

            if(!userDetailsUpdate){
                console.log('There was a problem updating your investment list');
            }

            console.log("\nBusiness added to Users investment list");

            console.log("\nEquity bought in the business");

            return "Tx completed";

        }
        else if (transactionDetails.status == false){
            console.log('There was a problem buying equity in the business');
        }
            
    }
    catch(err){
        console.log(err);
        // console.log(web3.utils.hexToAscii(err.receipt.logsBloom));
        res.status(500).json({
            result:false,
            msg:'There was a problem buying equity in the business'
        })
    }
}


const getBusinessDetails = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const business_address = req.body.business_address;

        const businessDetails = await contract.methods.businesses(business_address).call();

        if(!businessDetails){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching the business details'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Business details fetched',
            details:businessDetails
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the business details'
        })
    }
}


const getBusinessMasterDetails = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const business_address = req.body.business_address;

        const businessDetailsSC     =   await contract.methods.businesses(business_address).call();
        const businessDetailsDB     =   await BusinessModel.findOne({address:business_address},{target:0,equity:0});   
        
    

        if(!businessDetailsSC || !businessDetailsDB){
            return res.status(404).json({
                result:false,
                msg:'Business not found'
            })    
        }

        const businessCollabCount = await CollabModel.countDocuments({
            businessID                      :   businessDetailsDB._id,
            collaboratorSearchActive    :   false
        });


        const businessDetailsMaster = {
            ...businessDetailsSC,
            ...businessDetailsDB._doc,
            businessCollabCount
        }

        return res.status(200).json({
            result:true,
            msg:'Business details fetched',
            details:businessDetailsMaster
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the business details'
        })
    }
}


const getFundingDetails = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const business_address  =   req.body.business_address;
        const angel_address =   req.body.angel_address;

        const fundingDetails = await contract.methods.funding(business_address,angel_address).call();

        if(!fundingDetails){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching the funding details for the business'
            })
        }

        return res.status(200).json({
            result:true,
            msg:"User's funding towards business fetched",
            details:fundingDetails
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the funding details for the business'
        })
    }
}


const getBusinessesAngelInvestorsCount = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const business_address = req.body.business_address;

        const businessAngelsList = await contract.methods.getAngelListLength(business_address).call();

        if(!businessAngelsList){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching the count of angels'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Businesses Angels count fetched',
            count:businessAngelsList
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the count of angels '
        })
    }
}


const getBusinessesAngelInvestors = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const business_address = req.body.business_address;

        // Fetching data from SC - ethereum

        const businessAngelsList = await contract.methods.getAngelList(business_address).call();

        if(!businessAngelsList){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching the list of angels'
            })
        }
        
        // Fetching user details with ETH address

        const angelsUsername = await UserAuthModel.find({
            eth_address : {
                $in : businessAngelsList
            }
        },{eth_private_key:0,password:0});

        if(!angelsUsername){
            res.status(500).json({
                result:false,
                msg:'There was a problem fetching the list of angels '
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Businesses Angels list fetched',
            list:angelsUsername
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching the list of angels '
        })
    }
}


const getBusinessesCreatedByUser = async(req,res)=>{
    try{

        const businessList = await UserDetailsModel.findOne({username:req.decoded.username},{businesses_owned:1}).populate("businesses_owned"); 

        if(!businessList){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching businesses'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Businesses fetched',
            details:businessList.businesses_owned
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching businesses created by the user'
        })
    }
}


const getBusinessesInvestedByUser = async(req,res)=>{
    try{

        const businessList = await UserDetailsModel.findOne({username:req.decoded.username},{businesses_invested:1}).populate("businesses_invested"); 

        if(!businessList){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching businesses'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Businesses fetched',
            details:businessList.businesses_invested
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching businesses invested by the user'
        })
    }
}


const getUsersCollabs = async(req,res)=>{
    try{

        const businessList = await UserDetailsModel.findOne({username:req.decoded.username},{businesses_collaborated:1})
            .populate("businesses_collaborated",{collabRequests:0}); 

        if(!businessList){
            return res.status(500).json({
                result:false,
                msg:'There was a problem fetching users collabs'
            })
        }

        return res.status(200).json({
            result:true,
            msg:'Collabs jobs fetched',
            details:businessList.businesses_collaborated
        });
        
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            result:false,
            msg:'There was a problem fetching users collabs'
        })
    }
}


const searchBusiness = async(req,res)=>{
    try{
        // Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        let business_name = req.body.business_name;
        

        // Search for business with regex

        const businesses = await BusinessModel.find({"name": { $regex : business_name,'$options' : 'i' }});

        if(businesses.length == 0){
            return res.status(404).json({
                msg:"No businesses found",
                result:false
            })
        }

        return res.status(200).json({
            msg:"Businesses matching to the search query",
            result:true,
            businesses
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            msg:"Error in searching for businesses",
            result:false
        })
    }
}



module.exports = {
    createBusiness,
    getBusinessList,
    buyEquity,
    getBusinessDetails,
    getBusinessMasterDetails,
    getFundingDetails,
    getBusinessesAngelInvestorsCount,
    getBusinessesAngelInvestors,
    getBusinessesCreatedByUser,
    getBusinessesInvestedByUser,
    getUsersCollabs,
    searchBusiness
}

