const express = require('express')
const User = require('../models/user')
const auth = require('../middlewares/authentication')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail,sendCancellationEmail} = require('../emails/account')

const router = new express.Router()

//route for creating new user/signing in

router.post('/users',async (req,res) => {
    const user = new User(req.body)
 
    try {
         await user.save()
         sendWelcomeEmail(user.email,user.name)
         const token = await user.generateAuthToken()
         res.status(201).send({user,token})
    } catch(e) {
         res.status(400).send(e)
    }
 })
 
//route for logging in user

router.post('/users/login',async(req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    } catch(e) {
        res.status(400).send()
    }
})

//route for logging out the user

router.post('/users/logout',auth,async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
}) 

//route for logging out from every device

router.post('/users/logoutAll',auth,async (req,res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

 //route for getting user profile
 
 router.get('/users/me',auth,async (req,res) => {
        res.send(req.user)
 })
 
 //route for updating user using id
 
 router.patch('/users/me',auth,async(req,res) => {
     const _id = req.params.id
     const updates = Object.keys(req.body)
     const allowedUpdates = ['name','email','password','age']
     const isValidUpdate = updates.every((upd) => allowedUpdates.includes(upd))
         
     if(!isValidUpdate) {
             return res.status(400).send({error : 'Invalid Update Operation'})
         }
 
     try {
         updates.forEach((update) => req.user[update] = req.body[update])
         await req.user.save()
         res.send(req.user)
     } catch(e) {
         res.status(400).send()
     }
 })
 
 //route for deleting user
 
 router.delete('/users/me',auth,async(req,res) => {
 
     try {
         await req.user.remove()
         sendCancellationEmail(req.user.email,req.user.name)
         res.send(req.user)
     } catch(e) {
         res.status(500).send()
     }
     
 })

 //route for uploading images
 const image = multer({
     limits : {
         fileSize : 1000000
     },
     fileFilter(req,file,cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Invalid file extension!!!!!'))
        }
        cb(undefined,true)
     }
 })
 router.post('/users/me/avatar',auth,image.single('avatar'),async (req,res) => {
    
     const buffer = await sharp(req.file.buffer).resize({width: 250,height: 250}).png().toBuffer()
     req.user.avatar = buffer
     await req.user.save()
    res.send()
 },(error,req,res,next) => {
     res.status(400).send({error : error.message})
 })

 //route for deleting the images

 router.delete('/users/me/avatar',auth,async(req,res) => {
     req.user.avatar = undefined
     await req.user.save()
     res.send()
 })

 //route for fetching avatar with id

 router.get('/users/:id/avatar',async(req,res) => {

     try {
         const user = await User.findById(req.params.id)
         if(!user || !user.avatar) {
            throw new Error()
         }

         res.set('Content-Type','image/png')
         res.send(user.avatar)

     } catch(e) {
        res.status(404).send()
     }
 })

 module.exports = router