var mongoose    =  require("mongoose");

var userDetailsSchema = new mongoose.Schema({
    email                   :   {
                                    type:String,
                                    unique:true
                                },
    username                :   {
                                    type:String,
                                    unique:true 
                                },        
    profile_picture         :   {
                                    type:String,
                                    default:'NA'
                                },        
    businesses_owned             :   [{
                                    type:mongoose.Schema.Types.ObjectId,
                                    ref:'BusinessDetails'
                                }],
    businesses_invested          :   [{
                                    type:mongoose.Schema.Types.ObjectId,
                                    ref:'BusinessDetails'
                                }],
    businesses_collaborated      :   [{
                                    type:mongoose.Schema.Types.ObjectId,
                                    ref:'Collab'
                                }],
});

module.exports = mongoose.model("UserDetails",userDetailsSchema);
