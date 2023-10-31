const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Token = require("..//models/tokenModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const crypto = require("crypto");
const { Console } = require("console");

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
};

//Register User
const registerUser = asyncHandler( async (req,res) => {
    
    const{name, email, password}= req.body

    //Validation
    if(!name || !email || !password){
        res.status(400)
        throw new Error("Please Enter all the required Fields")
    }

    if(password.length < 6){
        res.status(400)
        throw new Error("Please Enter all the required Fields")
    }


    //Checking If email is already exists
    const userExists = await User.findOne({email})

    if(userExists){
        res.status(400)
        throw new Error("Email has already been Registered")
    }

    //Create new user
    const user = await User.create({
        name,
        email,
        password,
    })

    //Generating Token for user
    const token = generateToken(user._id);

    //Sending HTTP-onlycookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    })

    if(user){
        const {_id, name, email, photo, phone, bio} =  user
        res.status(201).json({
           _id, name, email, photo, phone, bio, token,
        })
    } else{
        res.status(400)
        throw new Error("Invalid user credentials")
    }


});

//Login User
const loginUser = asyncHandler( async (req,res) => {
    const {email, password} = req.body

    //Validate Request
    if(!email || !password){
        res.status(400)
        throw new Error("Please provide credentials")
    }

    //Checking if user exists
    const user = await User.findOne({email})
    if(!user){
        res.status(400)
        throw new Error("There is no Account Please Sign-up first")
    }


    //Checking password is correct (User Exists)
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

    const token = generateToken(user._id);

    //Sending HTTP-onlycookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    });

    if(user && passwordIsCorrect){
        const {_id, name, email, photo, phone, bio} =  user
        res.status(200).json({
           _id, 
           name, 
           email, 
           photo,
           phone, 
           bio,
           token,
        })
    }else{
        res.status(400)
        throw new Error("Invalid email or password")
    }

});


//Logout User
const logout = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({message: "Logout Successfully"})
});

//  Get User data 
const getUser = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id)

    if(user){
        const {_id, name, email, photo, phone, bio} =  user
        res.status(200).json({
           _id, 
           name, 
           email, 
           photo, 
           phone, 
           bio,     
        })
    } else{
        res.status(400)
        throw new Error("User not Found")
    }
});


// Get Login Status
const loginStatus = asyncHandler(async (req,res)=>{ 
    const token = req.cookies.token
    if(!token){
        return res.json(false)
    }

    // Verifying Token 
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if(verified){
        return res.json(true)
    }else{
        return res.json(false)
    }
});


// Update User parameters
const updateUser = asyncHandler(async (req, res)=>{
    const user = await User.findById(req.user._id)

    if(user){
        const {name, email, photo, phone, bio} =  user
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        const updatedUser = await user.save()

        res.status(200).json({
            _id: updatedUser._id, 
            name: updatedUser.name, 
            email: updatedUser.email, 
            photo: updatedUser.photo, 
            phone: updatedUser.phone, 
            bio: updatedUser.bio,
        })

    }else{
        res.status(404)
        throw new Error("User not found")
    }
});

const changePassword = asyncHandler(async (req, res)=>{
    const user = await User.findById(req.user._id)
    const {oldpassword, password} = req.body
    
    if(!user){
        res.status(400);
        throw new Error("User not found, please sign-up")
    }
    
    // Validate
    if(!oldpassword || !password){
        res.status(400);
        throw new Error("Please add old and new Password")
    }

    // check if old password matches 
    const passwordIsCorrect = await bcrypt.compare(oldpassword, user.password)

    // Save new password
    if(user && passwordIsCorrect){
        user.password = password
        await user.save()
        res.status(200).send("Password changed successfully")
    }else{
        res.status(400);
        throw new Error("Old Password is incorrect")
    }
});


const forgetPassword = asyncHandler(async (req, res)=>{
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        res.status(404)
        throw new Error("Email is not exists")
    }

    // Generating Rest Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id
    console.log(resetToken);

    // Hashing the token before saving the token in Database
    const hashedToken = crypto.
    createHash("sha256").
    update(resetToken).
    digest("hex")
    
    // Now, Saving the Token into Database 
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiredAt: Date.now() + 30 * (60 * 1000) // Thirty minutes
    }).save()

    // Contructing Reset URL for Reset the password
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    //Reset Email
    const message = `   
    <h2>Hello ${user.name}</h2>
    <p>Please click the Url given below to reset your password</p>
    <p>Link is valid for 30 minutes</p>
    <a href=${resetUrl} clicktracking=off>  ${resetUrl}</a>
    <p>Kind Regards</p>
    `
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

        try {
        await sendEmail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email Sent" });
        } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }   
    res.send("Forget Password")
});


// Reset Password
const resetpassword = asyncHandler(async (req,res) => {
    
    const {password} = req.body
    const {resetToken} = req.params

     // Hashing the token than compare what in the database
    const hashedToken = crypto.
    createHash("sha256").
    update(resetToken).
    digest("hex")

    // Finding Token in the Database
    const userToken = await Token.findOne({
        token: hashedToken,
        expiredAt: {$gt: Date.now()}
    })

    if(!userToken){
        res.status(404);
        throw new Error("Invalid or token is expires")
    }

    //Finding User in the Database
    const user = await User.findById({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200)


})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgetPassword,
    resetpassword,
}