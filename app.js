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

/*

    TODO:
        [*] Form for testing
        [*] Add user
            [*] Create user schema
            [*] Listen at POST /api/exercise/new-user
            [*] Write to DB
            [*] Return username and _id as json
    FIXME:
            [*] Don't allow >1 user of same username
    TODO: 
        [*] Add exercise
            - example response: 
                {
                    "_id":"5f900e942e4b4c2d4f3f6d20",
                    "username":"BobbyDazzlersMum",
                    "date":"Wed Oct 21 2020",
                    "duration":1,
                    "description":"Pull Up"
                }
            [*] Listen at POST /api/exercise/add
            [*] Create exercise schema
            [*] Write to db            
        FIXME: 
            [*] Dates

*/

// Define schemas for users and exercises
const { Schema } = mongoose
const userSchema = new Schema({
    username: {
        type: String, 
        required: true,
        unique: true
    }
})
const User = mongoose.model('User', userSchema)
const exerciseSchema = new Schema({
    username: String,
    date: { type: Date, default: Date.now },
    duration: {type: Number, required: true},
    description: {type: String, required: true}
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Add User
app.post('/api/exercise/new-user', async(req,res, next)=>{
    await User.create({username: req.body.username}, (err,data) =>{
        if(err){res.send('That username is already taken')}
        else{res.json({"username": data.username, "_id": data._id})}
    })
})

// Add Exercise
app.post('/api/exercise/add', async(req,res)=>{
    var { userID, description, duration, date } = req.body

    dateToPost = date !== ''
        ? (new Date(date)).toString().split(' ').slice(0,4).join(' ')
        : (new Date).toString().split(' ').slice(0,4).join(' ')

    await User.findById(userID, (err, data)=>{
        if(err){res.send('Could not locate that user ID.')}
        else{
            Exercise.create({
                username: data.username,
                date: dateToPost,
                duration,
                description
            }, (err, data)=>{
                if(err){return console.error(err)}
                else{res.json(data)}
            })
        }
    })
})




// Listen on port 3000, or as definied in .env
var listener = app.listen(process.env.PORT || 3000, ()=>{
    console.log(`App listening on port ${listener.address().port}`)
})