const Tx        =   require('ethereumjs-tx');
const Web3      =   require('web3');
const moment    =   require('moment-timezone');
const CryptoJS  = require("crypto-js");
const axios     = require("axios");
const nodemailer = require('nodemailer');

const BusinessModel         = require("../../models/businessDetailsModel");
const UserDetailsModel  = require("../../models/userDetailsModel");

const { validationResult } = require("express-validator");
require('dotenv').config();


///////////////////////////
//Web3 and contract setup
///////////////////////////

const rpcURL = 'https://ropsten.infura.io/v3/5dc6ff74c3d949908c78ced4b99fe2eb';

const web3 = new Web3(rpcURL);

const VPMToken = require('../../build/contracts/VpmToken.json');

const VPMCONTRACTADDRESS = process.env.VPMCONTRACTADDRESS;

const vpmabi = VPMToken.abi;

const vpm_contract = new web3.eth.Contract(vpmabi,VPMCONTRACTADDRESS);

////////////////////////////////////
// Account addresses & Private keys
////////////////////////////////////

//Main account with which contract is deployed

const account_address_1 = process.env.ACCOUNT;

// Main private key - token generation

const privateKey1 = Buffer.from(process.env.PRIVATEKEY,'hex');


const getUserDetails = async (req,res)=>{
    try{
      
      const userData = await UserDetailsModel.find({username:req.decoded.username});
      if(userData.length>0){
        res.status(200).json({
          msg:"User is a valid registered Vpm user",
          result:true,
          userData:userData[0],
          userAuthData:req.decoded
        })
      }
      else{
        res.status(404).json({
          error:"User doesn't exist",
          result:false
        })
      }
    }catch(err){
      return res.status(500).json({
        msg:"Failed to fetch user data.",
        result:false,
        err
      });
    }
}


const withdrawAmount = async (req,res)=>{
    try{

        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        const owner_address     =   req.body.owner_address;
        const business_private_key =   req.body.owner_private_key;
        const transfer_address  =   req.decoded.eth_address;
        const amount            =   req.body.amount;


        let bytes  = CryptoJS.AES.decrypt(business_private_key, process.env.MASTERKEY);
        let bytes_key = bytes.toString(CryptoJS.enc.Utf8).slice(2);
        let owner_private_key = Buffer.from(bytes_key,'hex');
        const estGasPrice = await web3.eth.getGasPrice()*2;

        res.status(200).json({
          msg:"Amount withdrawal in-progress",
          result:true,
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
        gasLimit: web3.utils.toHex(50000),
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
        
        const userData = await BusinessModel.findOneAndUpdate({address:owner_address},{amountWithdrawn:true});
        if(userData){
          console.log("Amount withdrawal successful");
        }
        else{
          console.log("Business doesnt exits!");
        }

      

    }catch(err){
      console.log(err);
      return res.status(500).json({
        msg:"Failed to withdraw amount!",
        result:false,
      });
    }
}


// Support/Help email API

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAILID,
      pass: process.env.email_password
    },
    tls: {
      rejectUnauthorized: false
    }
});


const supportEmail = async(req,res)=>{
    try{
        //Input field validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                error: errors.array()[0],result:false   
            });
        }

        let { email_subject,email_message } = req.body;
        let email_sender = req.decoded.email;

        // Using nodemailer to send support email

        const mailOptions = {
          from: email_sender,
          to: 'vpmcfplatform@gmail.com',
          subject: email_sender+" - "+email_subject,
          text: email_sender+" - "+email_message
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            return res.status(500).json({
              msg:"There was a problem sending the email",
              result:false,
              error
            });
          } else {
            return res.status(200).json({
              msg:"Email sent, please wait for the response from our support team",
              result:true
            })
          }
        });

    }
    catch(err){
      console.log(err);
      return res.status(500).json({
        msg:"There was an error sending a message to our team, Please try again.",
        result:false,
      });
    }
}


module.exports = {
    getUserDetails,
    withdrawAmount,
    supportEmail
}