const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const catchAsync = require('../utils/catchAsync')
const ExpressError = require('../utils/ExpressError')
const Campground = require('../models/campground')
const { campgroundSchema } = require('../schemas.js')

const validateCampgroundId = (req, res, next) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    req.flash('error', 'Invalid campground id.')
    return res.redirect('/campgrounds')
  }

  next()
}

const validateCampground = (req, res, next) => {
  // Show every Joi failure at once instead of failing on the first field.
  const { error } = campgroundSchema.validate(req.body, { abortEarly: false })

  if (error) {
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  }

  next()
}

router.get(
  '/',
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find()
    res.render('campgrounds/index', { campgrounds })
  })
)

// Render blank form for a new campground.
router.get('/new', (req, res) => {
  res.render('campgrounds/new')
})

// Validate id params before any findById calls below.
router.use('/:id', validateCampgroundId)

router.post(
  '/',
  validateCampground,
  catchAsync(async (req, res) => {
    const campground = new Campground(req.body.campground)
    await campground.save()
    req.flash('success', 'Successfully made a new campground')
    res.redirect(`/campgrounds/${campground._id}`)
  })
)
router.get(
  '/:id/edit',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id)
    if (!campground) {
      req.flash('error', 'Cannot find that campground!')
      return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { campground })
  })
)
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id).populate('reviews')
    if (!campground) {
      req.flash('error', 'Cannot find that campground!')
      return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground })
  })
)

router.put(
  '/:id',
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params
    // Keep Mongoose validators active during updates.
    const campground = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.campground },
      { new: true, runValidators: true }
    )
    if (!campground) throw new ExpressError('Campground Not Found', 404)
    req.flash('success', 'Successfully updated campground')
    res.redirect(`/campgrounds/${campground._id}`)
  })
)
router.delete(
  '/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndDelete(id)
    if (!campground) throw new ExpressError('Campground Not Found', 404)
    req.flash('success', 'Successfully deleted campground')
    res.redirect(`/campgrounds`)
  })
)

module.exports = router
