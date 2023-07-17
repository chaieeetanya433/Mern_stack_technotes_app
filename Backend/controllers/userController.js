const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

//@desc Get all users
//@route Get /users
//@access Private

const getAllUsers = asyncHandler(async (req,res) => {
    //get all users from mongoDB
    const users = await User.find().select('-password').lean()
    //if no users
    if(!users?.length) {
        return res.status(400).json({message: 'No Users Found'})
    }
    res.json(users)
})

//@desc Create new users
//@route Post /users
//@access Private

const createNewUser = asyncHandler(async (req,res) => {
    const { username, password, roles } = req.body

    //confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'All fields are required'})
    }

    //check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()

    if(duplicate) {
        return res.status(409).json({message: 'Duplicate username'})
    }

    //Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles}
    
    //Create and Store new user
    const user = await User.create(userObject)

    if(user) {      //created
        res.status(201).json({ message: `New user ${username} created`})
    } else {
        res.status(400).json({ message: 'Invalid user data received'})
    }
})

//@desc update a user
//@route Patch /user
//@access Private

const updateUser = asyncHandler(async (req,res) => {
    const { id, username, roles, active, password} = req.body

    //confirm data
    if(!id || !password || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message : 'all fields are required'}) 
    }
    const user = await User.findById(id).exec()

    if(!user) {
        return res.status(400).json({message : 'User not found'})
    }

    //check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()

    //Allow updates to the original user
    if(duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message : 'Duplicate username'})
    }

    //now we're ready to update our user object with some of the info
    user.username = username
    user.roles = roles
    user.active = active

    if(password) {
        //Hashing the pass
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updateUser = await user.save()

    res.json({message : `${updateUser.username} updated`})
})

//@desc delete a user
//@route Delete /user
//@access Private

const deleteUser = asyncHandler(async (req,res) => {
    const { id }  = req.body
    
    if(!id) {
        return res.status(400).json({message: 'User ID required'})
    }

    const note = await Note.findOne({ user: id }).lean().exec()
    if(note) {
        return res.status(400).json({message: 'User has assigned notes'})
    }

    const user = await User.findById(id).exec()

    if(!user) {
        return res.status(400).json({message: 'User not found'})
    }

    //this result will receive the full object that is deleted
    const result = await user.deleteOne()

    const reply =  `Username ${result.username} with ID ${result._id}
    deleted`

    res.json(reply);

})

module.exports = {
    getAllUsers,
    updateUser,
    createNewUser,
    deleteUser
};



