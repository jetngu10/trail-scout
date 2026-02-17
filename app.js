/* Imports/Requires */
const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')

const ExpressError = require('./utils/ExpressError')
const campgrounds = require('./routes/campgrounds')
const reviews = require('./routes/review')

const app = express()

// Database connection
mongoose.connect('mongodb://localhost:27017/yelp-cg')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  console.log('Database connected')
})

// View engine setup
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Session setup
const sessionConfig = {
  secret: 'thisshouldbeabettersecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

// Global middleware
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
// Session must be registered before flash, since flash data is stored in session.
app.use(session(sessionConfig))
app.use(flash())

// Expose one-request flash messages to every rendered view.
app.use((req, res, next) => {
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

// Routes
app.get('/', (req, res) => {
  res.render('home')
})
app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)

// Catch-all for any request that did not match a route above.
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
})

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err
  if (!err.message) err.message = 'Oh No, Something Went Wrong!'
  res.status(statusCode).render('errors', { err })
})

app.listen(3000, () => {})
