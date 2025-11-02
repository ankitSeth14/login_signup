const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');


router.post('/signup', async (req, res) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({message : "Please enter all fields"});
        }
        if(password.length<6){
            return res.status(400).json({message : "Password must be at least 6 characters"});
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message : "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password : hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({id : newUser._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

        res.status(201).json({token, user : {
            id : newUser._id,
            name : newUser.name,
            email : newUser.email
        }});    
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({message : "Server Error"});
    }
});

router.post('/login', async (req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message : "Please enter all fields"});
        }

        const user = await User.findOne({email});
        console.log(user);
        if(!user){
            return res.status(404).json({message : "User does not exist"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message : "Invalid credentials"});
        }

        const token = jwt.sign({id : user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

        res.status(200).json({token, user : {
            id : user._id,
            name : user.name,
            email : user.email
        }});

    }catch(err){
        console.error(err.message);
        res.status(500).json({message : "Server Error"});
    }
});

router.get('/me', authMiddleware, async (req, res) => {
 try{
      res.json({
           user: req.user._id,
           name: req.user.name,
           email: req.user.email
      });
 }catch(err){
    console.error(err.message);
    res.status(500).json({message : "Server Error"});
 }
});
module.exports = router;