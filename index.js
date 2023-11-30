const express=require("express");
const bodyParser=require('body-parser');
const mongoose=require("mongoose");
const nodemailer=require("nodemailer");
const app=express();

const crypto=require("crypto");
const jwt=require("jsonwebtoken");
const port=8000;
const User=require("./models/User");
const Order=require("./models/Order");
const cors=require("cors");

const { urlencoded } = require("body-parser");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


mongoose.connect("mongodb+srv://ibrahimdarkseid:inayA2520@cluster0.9cnafu3.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });



  app.listen(port,()=>
  console.log(`server is connected on the ${port}`));



  const sendverificationEmail=async(email,verificationToken)=>{

const transporter=nodemailer.createTransport({
    service:"gmail",
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
        user:"sakeenamd024@gmail.com",
        pass:"dvmeyijnocuukmse",
    }

})

const mailOptions={
    from:"amazon.com",
    to:email,
    subject:"Email verification",
    text:`please click the following link to verify your email :http://192.168.43.242:8000/verify/${verificationToken}`
};
try{
await transporter.sendMail(mailOptions);
console.log("verification email sent successfully");
}catch(error){
  console.log("error sending verification",error)

}
  };

//endpoint for registration
  app.post("/register",async(req,res)=>{
  
    try{
      const{name,email,password}=req.body;
const existingUser=await User.findOne({email});
if(existingUser){
    return res.status(400).json({message:"email already exist"});

}

const newUser=new User({name,email,password});

newUser.verificationToken=crypto.randomBytes(20).toString("hex");

await newUser.save();

console.log("new user registered",newUser);


sendverificationEmail(newUser.email,newUser.verificationToken);

res.status(201).json({
  message:"registeration successfull.please check your email for verification."
});
    }catch(e){
        console.log("error registering user:",e);
        res.status(500).json({message:"registeration failed"})
        
    }
  });

  app.get("/verify/:token",async(req,res)=>{
    try{
      const token=req.params.token;

      const user=await User.findOne({verificationToken:token});
      if(!user){
        return res.status(404).json({message:"invalid verification token"});

      }
      user.verified=true;
      user.verificationToken=undefined;

       await user.save();
       res.status(200).json({message:"Email verified successfully"})
    }catch(e){
      res.status(500).json({message:"email verification failed"});
    }
  });

const generateSecretKey=()=>{
  const secretKey=crypto.randomBytes(32).toString("hex");
  return secretKey;
}

const secretKey=generateSecretKey();
  //login endpoint

  app.post("/login",async(req,res)=>{
    try{
const{email,password}=req.body;

const user=await User.findOne({email});

if(!user){
  return res.status(401).json({message:"invalid email or password"})

}

if(user.password !==password){
  return res.status(401).json({message:"invalid password"});

}
//generate token

const token=jwt.sign({userId:user._id},secretKey)

res.status(200).json({token});
    }catch(error){
res.status(500).json({message:"login failed"})
    }
  })
  
  

  //endpoint for stroing address


  app.post("/addresses",async(req,res)=>{

    try{
const{userId,address}=req.body;


const user=await User.findById(userId);
if(!user){
  return res.status(400).json({message:"user not found"});

}
user.addresses.push(address);
await user.save();

res.status(200).json({message:"Address created Successfully"})

    }catch(error){
      res.status(500).json({message:"error adding address"})
    }
  });



  //endpoint to get all addresses of the user

  app.get("/addresses/:userId",async(req,res)=>{
    try{
const userId=req.params.userId;
const user=await User.findById(userId);
if(!user){
  return res.status(400).json({message:"user not found"});

}

const address=user.addresses;
res.status(200).json({address});
    }catch(error){
      res.status(500).json({message:"error retrieving the adresses"})
    }
  })

//creating order api call


  app.post("/orders",async(req,res)=>{
    try{
const {userId,cartItems,totalPrice,shippingAddress,paymentMethod}=req.body;
 

const user=await User.findById(userId);
if(!user){

  return res.status(404).json({message:"user not found"})
}

const products=cartItems.map((item)=>({
name:item?.title,
quantity:item?.quantity,
price:item?.price,
image:item?.image,

}))

const order=new Order({
  user:userId,
  products:products,
  totalPrice:totalPrice,
  shippingAddress:shippingAddress,
  paymentMethod:paymentMethod
})

await order.save();
res.status(200).json({message:"order created succesffuly",order:order})
    }catch(error){
      console.log("error creating orders",error);
      res.status(500).json({message:"error creating orders"})
    }
  });

//get profile details api

  app.get("/profile/:userId",async(req,res)=>{
    try{
const userId=req.params.userId;
const user=await User.findById(userId);

if(!user){
 return res.status(404).json({message:"user not found"})
}
res.status(200).json({user})
    }catch(error){
      res.status(500).json({message:"error retrieving the user profile"})

    }
  });


//getting order of the particular user

app.get("/orders/:userId",async(req,res)=>{
  try{
const userId=req.params.userId;

const orders=await Order.find({user:userId}).populate("user");

if(!orders || orders.length ===0){
  return res.status("404").json({message:"no orders found for this user"})

}
res.status(200).json({orders})
  }catch(error){
    res.status(500).json({message:"error"})
  }
})
