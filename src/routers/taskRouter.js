const express = require('express')
const Task = require('../models/task')
const auth = require('../middlewares/authentication')
const router = new express.Router()


//route for creating new task 

router.post('/tasks',auth,async (req,res) => {
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

//route for getting all the tasks

router.get('/tasks',auth,async (req,res) => {

    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path : 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort : {
                    createdAt : -1
                }
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send()
    }
})

//route for getting task with particular id

router.get('/tasks/:id',auth,async (req,res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({_id, owner: req.user._id})
            if(!task) {
                return res.status(404).send()
            }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

//route for updating task with id

router.patch('/tasks/:id',auth, async(req,res) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidUpdate = updates.every((upd) => allowedUpdates.includes(upd))
        
    if(!isValidUpdate) {
            return res.status(400).send({error : 'Invalid Update Operation'})
        }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})
             
            if(!task) {
                res.status(404).send()
            }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send()
    }
})

//route for deleting task using id

router.delete('/tasks/:id',auth,async(req,res) => {

    try {
            const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
            if(!task) {
            return res.status(404).send()
            }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
    
})

module.exports = router