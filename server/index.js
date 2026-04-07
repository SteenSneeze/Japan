require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const citiesRoutes = require('./routes/cities');
const placesRoutes = require('./routes/places');
const itineraryRoutes = require('./routes/itinerary');
const flightsRoutes = require('./routes/flights');
const accommodationsRoutes = require('./routes/accommodations');
const linksRoutes = require('./routes/links');
const costsRoutes = require('./routes/costs');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/accommodations', accommodationsRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/costs', costsRoutes);

// Serve built React client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialise DB:', err);
  process.exit(1);
});
