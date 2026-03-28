const express = require("express");
const router = express.Router();
const { Country, State, City } = require("country-state-city");

// Get all countries
router.get("/countries", (req, res) => {
  try {
    const countries = Country.getAllCountries();
    res.json(countries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load countries" });
  }
});

// Get all states of a country
router.get("/states/:countryCode", (req, res) => {
  try {
    const states = State.getStatesOfCountry(req.params.countryCode);
    res.json(states);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load states" });
  }
});

// Get all cities of a state
router.get("/cities/:countryCode/:stateCode", (req, res) => {
  try {
    const cities = City.getCitiesOfState(
      req.params.countryCode,
      req.params.stateCode
    );
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cities" });
  }
});

module.exports = router;
