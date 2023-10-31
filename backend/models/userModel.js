const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please add a name"]  //It means this field is required if not error message will through
                                              //This is called Backend Validation 
    },
    email:{
        type: String,
        required: [true, "Please Add a email"],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please Enter a valid Email"
        ]
    },
    password:{
        type: String,
        required: [true, "Please add a new Password"],
        minLength: [6, "Password must be up to 6 characters"],
        // maxLength: [6, "Password must not be more than 23 characters"]
    },
    photo:{
        type: String,
        required: [true, "Please add a Photo"],
        default: "https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone:{
        type: String,
        default: "+92"
    },
    bio:{
        type: String,
        maxLength: [500, "Bio cannot be more than 500 words"],
        default: "Bio"
    }


}, {
    timestamps: true,
});


//Encrypting Password before creating a user
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    //Hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword
    console.log(hashedPassword);
    next(); 
});


const User = mongoose.model("User", userSchema)  // Evertime you access schema we use this variable "User"
module.exports = User