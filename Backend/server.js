require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler') 
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const port = process.env.PORT || 3500;

connectDB()

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json())     //this will let our app receive and parse that json data

app.use(cookieParser);  //3rd party middleware

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/root'))
app.use('/users', require('./routes/userRoutes.js'))

app.all('*', (req,res)=>{
    res.status(404)
    if(req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if(req.accepts('json')) {
        res.join({message: '404 not found'})
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler);

mongoose.connection.once('open', ()=> {
    console.log('connected to mongoDB');
    app.listen(port, ()=> console.log(`Server is listening at port ${port}`))
})

mongoose.connection.on('error', err =>{
    console.log(err);
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})