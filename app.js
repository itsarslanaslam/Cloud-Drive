const express = require('express')
const userRouter = require('./routes/user.routes')
const dotenv = require('dotenv')
dotenv.config()
const cookieParser = require('cookie-parser')
const app = express()
const indexRouter = require('./routes/index.routes')

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs');
app.use('/', indexRouter)
app.use('/user', userRouter)

// 404 handler
app.use((req, res, next) => {
    res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3000, ()=>{
    console.log('Server is running on port 3000')
})
