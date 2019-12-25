const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        validate(val) {
            if(!validator.isEmail(val)) {
                throw new Error('Not a valid email!!!!')
            }
        }
    },
    password : {
        type : String,
        required : true,
        minlength : 7,
        trim : true,
        validate(val) {
            if(val.toLowerCase().includes("password")) {
                throw new Error('Password cannot be "password" ' )
            }
        }
    },                          
    age : {
        type : Number,
        default : 0,
        validate(val) {
            if(val < 0) {
                throw new Error('Age cannot be negative!!!!')
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})

//virtual property for establishing relationship between user and task model
userSchema.virtual('tasks',{
    ref : 'tasks',
    localField : '_id',
    foreignField : 'owner'
})

//function to display public profile hiding passwords and tokens

userSchema.methods.toJSON = function() {
    const user = this
    const publicUser = user.toObject()

    delete publicUser.password
    delete publicUser.tokens
    delete publicUser.avatar

    return publicUser
}

//function to generate authentication tokens

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id.toString()},process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token : token})
    await user.save()
    return token
 }

//Verifying whether the email and pwd matches with the database
    
userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne({email})

    if(!user) {
        throw new Error('Unable to login!!!!')
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if(!isMatch) {
        throw new Error('Unable to login');
        
    }

    return user
}

//hashing password before saving data

userSchema.pre('save',async function(next) {
    const user = this
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

//removing all the tasks after user is deleted

userSchema.pre('remove',async function(next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('users',userSchema)

module.exports = User