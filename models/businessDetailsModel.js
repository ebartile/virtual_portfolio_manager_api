var mongoose    =  require("mongoose");

var businessDetailsSchema = new mongoose.Schema({
name            :   {
                        type:String,
                        default:'NA',
                        required:true,
                        unique:true,
                        index:true
                    },
owner           :   {
                        type:String,
                        default:'NA',
                        required:true
                    },
business_image      :   {
                        type:String,
                        default:'NA',
                    },
business_description:   {
                        type:String,
                        default:'NA',
                    },
long_description:   {
                        type:String,
                        default:'NA',
                    },
createdOn       :   {
                        type:String,
                        default:'NA',
                        required:true
                    },
target          :   {
                        type:Number,
                        default:'NA',
                        required:true
                    },
equity          :   {
                        type:Number,
                        default:'NA',
                        required:true
                    },
address         :   {
                        type:String,
                        default:'NA',
                        required:true
                    },
privatekey      :   {
                        type:String,
                        default:'NA',
                        required:true
                    },
category        :   {
                        type:String,
                        default:'NA',
                        required:true
                    },
targetReachedDB :   {
                        type:Boolean,
                        default:false
                    },
amountWithdrawn :   {
                        type:Boolean,
                        default:false
                    },

});

module.exports = mongoose.model("BusinessDetails",businessDetailsSchema);
