const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const userRoute = require("./routes/userRoute") 
const errorHandler = require("./middleWare/errorMiddleware") 
const cookiesParser = require("cookie-parser") 

const app = express()

const PORT = process.env.PORT || 5000;

//Middlewares
app.use(express.json());
app.use(cookiesParser());
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.json())


//Route Middleware
app.use("/api/users", userRoute)


//Routes
app.get("/", (req,res)=>{
    res.send("HOME PAGE");
});


//Error Middleware for error handling
app.use(errorHandler);

//Connect to DB to start server
mongoose
    .connect(process.env.MONGO_URI)
    .then(()=> {

        app.listen(PORT, ()=>{
            console.log(`server is running on port ${PORT}`)
        })

    })
    .catch((err) => console.log(err))