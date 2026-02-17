const express = require('express')
const mongoose = require('mongoose')
// mergeParams lets this router read :id from /campgrounds/:id/reviews.
const router = express.Router({ mergeParams: true })
const catchAsync = require('../utils/catchAsync')
const ExpressError = require('../utils/ExpressError')
const { reviewSchema } = require('../schemas.js')
const Review = require('../models/review')
const Campground = require('../models/campground')

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body, { abortEarly: false })

  if (error) {
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  }

  next()
}

const validateCampgroundId = (req, res, next) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    req.flash('error', 'Invalid campground id.')
    return res.redirect('/campgrounds')
  }

  next()
}

const validateReviewId = (req, res, next) => {
  const { reviewId } = req.params
  if (!mongoose.isValidObjectId(reviewId)) {
    req.flash('error', 'Invalid review id.')
    return res.redirect(`/campgrounds/${req.params.id}`)
  }

  next()
}

router.post(
  '/',
  validateCampgroundId,
  validateReview,
  catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id)
    if (!campground) throw new ExpressError('Campground Not Found', 404)
    const review = new Review(req.body.review)
    campground.reviews.push(review)
    await review.save()
    await campground.save()
    req.flash('success', 'Created new review')
    res.redirect(`/campgrounds/${campground._id}`)
  })
)
router.delete(
  '/:reviewId',
  validateCampgroundId,
  validateReviewId,
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params
    // Remove the review reference from the campground before deleting the review doc.
    const campground = await Campground.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId }
    })
    if (!campground) throw new ExpressError('Campground Not Found', 404)
    await Review.findByIdAndDelete(reviewId)
    req.flash('success', 'Deleted review')
    res.redirect(`/campgrounds/${id}`)
  })
)

module.exports = router
