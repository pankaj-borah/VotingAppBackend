const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt')

router.post('/signUp', async(req, res)=> {
    try {
        const request = req.body;
        const adminUser = await User.findOne({role: 'admin'});
        const adhaarRegex = /^\d{12}$/
        // Check if there is already an admin user
        if(request.role === 'admin' && adminUser) {
            res.status(400).json({error: 'Admin aldready exist'});
        }
        
        // Validate Aadhar Card Number must have exactly 12 digit
        if (!adhaarRegex.test(request.adhaarNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        };
        console.log('****', request)
        // Check if a user with the same Aadhar Card Number already exists
        const adhaarNumber = await User.findOne({adhaarNumber: request.adhaarNumber});
        if(adhaarNumber){
            res.status(400).json({error: `User with ${request.adhaarNumber} already exists.`});
        }
        console.log('save the user')
        // Create a new User document using the Mongoose model
        const newUser = new User(request);
        // Save the new user to the database
        const response = await newUser.save();
        console.log('user saved')
        const payload = {
            id: response.id
        }
    
        //generate token for the signed up user
        const token = generateToken(payload);
    
        res.status(200).json({response: response, token: token});
    
    } catch (err) {
        res.status(500).json({error: 'Internal server error.'});
    }
})

router.post('/login', async(req, res)=> {
    try {
        const {adhaarNumber, password} = req.body;

        // Check if aadharCardNumber or password is missing
        if (!aadharCardNumber || !password) {
            return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
        }

        // Find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: adhaarNumber});

        // If user does not exist or password does not match, return error
        if(!user || !(await user.comparePassword(password))) {
            res.status(400).json({error: `User with ${adhaarNumber} does not exist.`});
        }

        // generate Token 
        const payload = {
            id: user.id,
        }

        //generate token for the user
        const token = generateToken(payload);

        res.status(200).json(res.json({token}));

    } catch(err) {
        res.status(500).json({error: 'Internal server error.'});
    }
})

router.get('/profile', jwtAuthMiddleware, async(req, res)=> {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});
    } catch(err) {
        res.status(500).json({error: 'Internal server error.'});
    }
})

router.put('/profile/pasword', jwtAuthMiddleware, async(req, res)=> {
    try {
        const userId = req.user.id; // Extract the id from the token
        const { currentPassword, newPassword } = req.body; // Extract current and new passwords from request body
        
        // Check if currentPassword and newPassword are present in the request body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        // Find the user by userID
        const user = await User.findById(userId);

        // If user does not exist or password does not match, return error
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        // Update the user's password
        user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({ message: 'Password updated' });
        
    } catch(err) {
        res.status(500).json({error: 'Internal server error.'});
    }
})

module.exports = router;