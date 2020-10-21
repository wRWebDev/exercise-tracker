// Require .env for app configuration
require('dotenv').config({path:__dirname+'/.env'})

// Require express for handling requests
const express = require('express')
const app = express()

// Require cors for handling responses
const cors = require('cors')
app.use(cors())

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




// Listen on port 3000, or as definied in .env
var listener = app.listen(process.env.PORT || 3000, ()=>{
    console.log(`App listening on port ${listener.address().port}`)
})