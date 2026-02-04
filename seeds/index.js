const mongoose = require('mongoose')
const Campground = require('../models/campground')
const cities = require('./cities')
const { places, descriptors } = require('./seedhelpers')

mongoose.connect('mongodb://localhost:27017/yelp-cg')

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  console.log('Database Connected')
})

const sample = array => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
  await Campground.deleteMany({})
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000) + 1
    const price = Math.floor(Math.random() * 20) + 10
    const camp = new Campground({
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      image: `https://picsum.photos/400?random=${Math.random()}`,
      description: 'Hello',
      price
    })
    await camp.save()
  }
}

seedDB()
