// Require .env for app configuration
require('dotenv').config({path:__dirname+'/.env'})

// Require express for handling requests
const express = require('express')
const app = express()

// Require cors for handling responses
const cors = require('cors')
app.use(cors())

// Use body-parser for handling POST submissions
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }));

// Set up directories for files:
const pageFiles = __dirname+'/views'
const publicFiles = __dirname+'/public'
app.use(express.static(publicFiles))

// Require mongoose for handling MongoDB
const mongoose = require('mongoose')

// Connect to database and test connection
mongoose.connect(
    process.env.MONGODB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'Connection error:'))
db.once('open', ()=>{console.log('Connected to MongoDB')})

// Handle request for homepage
app.get('/', (req, res)=>{
    res.sendFile(pageFiles+'/index.html')
})

// Define schemas for users and exercises
const { Schema } = mongoose
const userSchema = new Schema({
    username: {
        type: String, 
        required: true,
        unique: true
    },
    count: {type: Number, default: 0},
    log: [
        {
            _id: false,
            date: { type: Date, default: Date.now },
            duration: {type: Number, required: true},
            description: {type: String, required: true}
        }
    ]
})
const User = mongoose.model('User', userSchema)

/***************************
 *                        *
 *        API CALLS       *
 *                        *
/**************************/ 

// Add User
app.post('/api/exercise/new-user', async (req,res)=>{
    await User.create({username: req.body.username}, (err,data) =>{
        if(err){res.send('That username is already taken')}
        else{res.json({"username": data.username, "_id": data._id})}
    })
})

// Get array of users
app.get('/api/exercise/users', (req, res)=>{
    const userBase = User
        .find().select('username _id').exec()
        .then(data=>res.send(data))
        .catch(err=>console.error(err))
})

// Add Exercise
app.post('/api/exercise/add', async (req,res)=>{
    // Get form data
    var { userID, description, duration, date } = req.body
    // Format date 
    dateToPost = date !== ''
        ? (new Date(date))
        : (new Date)
    const exerciseToAdd = {
        date: dateToPost,
        duration,
        description
    }

    User.findById(userID)
        .then(user => {
            user.log.push(exerciseToAdd)
            ++user.count
            user.save()
                .then(updatedUser => {
                    res.json({
                        "_id": updatedUser._id,
                        "username": updatedUser.username,
                        "date": dateToPost.toString().split(' ').slice(0,4).join(' '),
                        "duration": duration,
                        "description": description
                    })
                }).catch(err=>res.send('Could not save'))
        }).catch(err=>res.send('Invalid userId'))
})

// Get exercise log
app.get('/api/exercise/log', (req, res)=>{
    
    User.findById(req.query.userId)
            .select('-__v')
        .then(user => {
            console.log(req.query.from, req.query.to)
            if(req.query.from !== undefined)
                { user.log = user.log.filter(item => {return item.date >= new Date(req.query.from)}) } 
            if(req.query.to !== undefined)
                { user.log = user.log.filter(item => {return item.date <= new Date(req.query.to)}) }
            if(req.query.limit !== undefined)
                { user.log = user.log.slice(0, req.query.limit) }
            res.json(user)
        }).catch(err => res.send('Invalid userId'))

})

// Listen on port 3000, or as definied in .env
var listener = app.listen(process.env.PORT || 3000, ()=>{
    console.log(`App listening on port ${listener.address().port}`)
})