var mongoose = require('mongoose');

var collabSchema = new mongoose.Schema({
    
    businessID              :       {
                                    type:String,
                                    required:true,
                                    default:'NA'
                                },
    businessOwnerUsername   :       {
                                    type:String,
                                    default:'NA'
                                },
    collabTitle         :       {
                                    type:String,
                                    default:'NA'
                                },
    collabAmount        :       {
                                    type:Number,
                                    default:0
                                },
    collabDescription   :       {
                                    type:Array,
                                    default:[]
                                },
    collaboratorSearchActive     :  {
                                        type:Boolean,
                                        default:true
                                    },
    collabRequests      :       [{
                                    username    :   String,
                                    address     :   String,
                                }]
}); 

module.exports = mongoose.model("Collab",collabSchema)
