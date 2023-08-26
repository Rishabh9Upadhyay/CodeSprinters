require("dotenv").config();
const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const port = process.env.PORT || 8000;
require("./db/conn");
const Patient = require("./models/registers");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const auth = require("./middleware/auth");
const contact = require("./models/contact");

// Middleware to parse incoming JSON data
app.use(express.json());
app.use(cookieParser())

// Middleware to parse incoming URL-encoded data
app.use(express.urlencoded({extended : false}));

const static_path = path.join(__dirname,"../public");
app.use(express.static(static_path));


const templates_path = path.join(__dirname,"../templates/views");
const partial_path = path.join(__dirname,"../templates/partials");

app.set("view engine","hbs");
app.set("views",templates_path);
hbs.registerPartials(partial_path)


app.get("/",(req,res)=>{
    res.render("index")
})

app.get("/about",auth,(req,res)=>{
    res.render("About")
})

app.get("/contact",(req,res)=>{
    res.render("contact")
})
app.get("/article",(req,res)=>{
    res.render("article")
})

app.get("/services",auth,(req,res)=>{
    res.render("Services")
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/register",(req,res)=>{
    res.render("register")
})


// app.get("/abc",(req,res)=>{
//     const request = require('request');
//     var muscle = 'biceps';
//     request.get({
//       url: 'https://api.api-ninjas.com/v1/exercises?muscle=' + muscle,
//       headers: {
//         'X-Api-Key': 'YOUR_API_KEY'
//       },
//     }, function(error, response, body) {
//       if(error) return console.error('Request failed:', error);
//       else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
//       else console.log(body)
//     });
// })






app.post("/contact", auth, async (req,res)=>{
    try{
        const ContactDoc = new contact({
            name : req.body.name,
            email : req.body.email,
            phone : req.body.phone,
            textsms : req.body.textsms
        })
        console.log("Massege recived: "+ContactDoc);
        const sms = await ContactDoc.save();
        console.log("Massege sent successfully")
        res.render("index")
    }catch(e){
        res.status(500).send("<h1>Eroor found</h1>");
    }
})




app.get("/logout", auth,async (req,res)=>{
    try{
        console.log(req.user);

        // for singal device
        req.user.tokens = req.user.tokens.filter((curElement)=>{
            return curElement.token !== req.token;
        })

        // logout from all device
        // req.user.tokens = [];

        res.clearCookie("jwt");


        console.log("Logout successfully");
        await req.user.save();
        res.render("login");
    }catch(e){
        res.status(500).send(e);
    }
})
app.get("/logouteverywhere", auth,async (req,res)=>{
    try{
        console.log(req.user);

        // for singal device
        // req.user.tokens = req.user.tokens.filter((curElement)=>{
        //     return curElement.token !== req.token;
        // })

        // logout from all device
        req.user.tokens = [];

        res.clearCookie("jwt");


        console.log("Logout successfully");
        await req.user.save();
        res.render("login");
    }catch(e){
        res.status(500).send(e);
    }
})

// create a new user in our database
app.post('/register',async (req,res)=>{
    try{
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        if(password === cpassword){
            const registerPatient = new Patient({
                firstname : req.body.firstname,
                lastname : req.body.lastname,  
                email : req.body.email,
                gender : req.body.gender,
                phone : req.body.phone,
                age : req.body.age,
                password : req.body.password,
                confirmPassword : cpassword
            })

            console.log("The success part:"+registerPatient);

            const token = await registerPatient.generateAuthToken();
            console.log("The success part jwt:"+token);

            
            res.cookie("jwt",token,{
                expires:new Date(Date.now()+500000),
                httpOnly:true
            });

            
            const registered = await registerPatient.save();
            console.log("The page part:"+registered);
            // console.log(registered);
            res.status(201).render("index");
        }else{
            res.send("password not matching");
        }
    }catch(e){
        res.status(400).send(e);
        console.log("The error part is"+e)
    }
})


// Login check
app.post('/login',async (req,res)=>{
    try{
        const email = req.body.email;  
        const password = req.body.password;
        console.log(`${email} and password is ${password}`);
        const useremil = await Patient.findOne({email});
        const isMatch = await bcrypt.compare(password, useremil.password);

        let name = useremil.firstname;

        const token = await useremil.generateAuthToken();
        // console.log("The success part: "+token);

        res.cookie("jwt",token,{
            expires:new Date(Date.now()+500000),
            httpOnly:true,
            // secure:true
        });

        // if((useremil.email===email) && (useremil.password===password)){
        if(isMatch){
            res.status(201).render("index",{
                Name : name
            });
        }else{
            res.send("Invalid Email or password");
        }
    }catch(e){
        res.status(400).send("Invalid Email or Password..........");
    }
})


app.listen(port,()=>{
    console.log(`Listning at port number ${port}`)
})