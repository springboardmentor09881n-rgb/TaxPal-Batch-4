const mongoose= require("mongoose");

const budgetSchema= new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
        index:true,
    },
    category:{
        type:String,
        required:true,
    },
    limit:{
        type:Number,
        required:true,
    },
    month:{
        type:String,
        required:true,
    },
},
{timestamps:true}
);

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports=mongoose.model("Budget",budgetSchema);