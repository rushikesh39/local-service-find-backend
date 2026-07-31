const mongoose=require("mongoose")

 async function connectDb (){
    try{
        const url=process.env.MONGO_URI;
        if(!url){
            console.log("Connection url not found")
        }
        await mongoose.connect(url)
        console.log(`Database connection successfully, Host: ${mongoose.connection.host} Database: ${mongoose.connection.name}`)
    }catch(err){
        console.log("Connection Failed!!!",err)
    }

}
module.exports=connectDb