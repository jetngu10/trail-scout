/* Imports/Requries */
const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const Campground = require('./models/campground')
const ejsMate = require('ejs-mate')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const { campgroundSchema } = require('./schemas.js')

// Connect to the local Mongo instance and keep a reference handy for logging.
mongoose.connect('mongodb://localhost:27017/yelp-cg')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  console.log('Database connected')
})

// Basic Express + EJS wiring.
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.listen(3000, (req, res) => {})

// Joi validation middleware to protect route handlers from bad payloads.
const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body)
  console.log(error)

  if (error) {
    // Stop execution early and surface a descriptive validation error.
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, error.statusCode)
  } else {
    next()
  }
}
app.engine('ejs', ejsMate)

// Landing page.
app.get('/', (req, res) => {
  res.render('home')
})
app.get(
  '/campgrounds',
  catchAsync(async (req, res, next) => {
    try {
      // Fetch every campground for the index page.
      const campgrounds = await Campground.find()
      res.render('campgrounds/index', { campgrounds })
    } catch (e) {
      next(e)
    }
  })
)

// Render blank form for a new campground.
app.get('/campgrounds/new', (req, res) => {
  res.render('campgrounds/new')
})

app.post(
  '/campgrounds',
  validateCampground,
  catchAsync(async (req, res, next) => {
    // if (!req.body.campground)
    //   throw new ExpressError('Invalid Campground Data', 400)
    const campground = new Campground(req.body.campground)
    await campground.save()
    res.redirect(`/campgrounds/${campground._id}`)
  })
)
app.get(
  '/campgrounds/:id/edit',
  catchAsync(async (req, res) => {
    const { id } = req.params
    // Load the campground to populate the edit form.
    const campground = await Campground.findById(id)
    res.render('campgrounds/edit', { campground })
  })
)
app.get(
  '/campgrounds/:id',
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params
    // Show page for a single campground.
    const campground = await Campground.findById(id)

    res.render('campgrounds/show', { campground })
  })
)

app.put(
  '/campgrounds/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    // Apply edits from the form, then redirect to detail view.
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground
    })
    await campground.save()
    res.redirect(`/campgrounds/${campground._id}`)
  })
)
app.delete(
  '/campgrounds/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    // Permanently remove the campground, then return to index.
    await Campground.findByIdAndDelete(id)

    res.redirect(`/campgrounds`)
  })
)

// Catch-all for any request that did not match a route above.
app.all(/(.*)/, (res, req, next) => {
  next(new ExpressError('Page Not Found', 404))
})
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err
  if (!err.message) err.message = 'Oh No, Something Went Wrong!'
  res.status(statusCode).render('errors', { err })
})
