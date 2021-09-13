// DOM Elements
var searchInput = document.getElementById("search-input");
var searchButton = document.getElementById("search-button");
var confirmLocationModal = document.getElementById("confirm-location-modal");
var searchHistoryItems = document.getElementById("search-history-items");
var currentWeatherCity = document.getElementById("current-weather-city");
var currentWeatherData = document.getElementById("current-weather");
var forecastEl = document.getElementById("forecast");
var clearHistory = document.getElementById("clear-btn");

// Other Variables
var displayName;
var searchTerms = [];
var searchHistory = [];
var apikey = config.OpenWeatherAPI;

// display the location
var defineDisplayName = function (location) {
  var city = location.adminArea5;
  var state = location.adminArea3;
  var country = location.adminArea1;

  var tempDisplayName = [];
  if (city) {
    tempDisplayName.push(city);
  }
  if (state) {
    tempDisplayName.push(state);
  }
  if (country) {
    tempDisplayName.push(country);
  }

  // return the joined array
  return tempDisplayName.join(", ");
};

// multiple results by surfacing a modal and prompting user to choose
var confirmLocation = function (locationsArray) {
  var formBody = confirmLocationModal.querySelector(
    "#confirm-location-form-body"
  );
  formBody.innerHTML = "";

  // Modal
  for (let i = 0; i < locationsArray.length; i++) {
    // create the div container
    var searchResultContainer = document.createElement("div");
    searchResultContainer.classList.add(
      "search-result-item",
      "uk-form-controls",
      "uk-margin"
    );

    // radio button creation
    var searchResultInput = document.createElement("input");
    searchResultInput.setAttribute("type", "radio");
    searchResultInput.setAttribute("name", "search-result");
    searchResultInput.setAttribute("id", "search-result-" + i);
    searchResultInput.setAttribute(
      "data-location",
      JSON.stringify(locationsArray[i])
    );
    searchResultContainer.appendChild(searchResultInput);

    var modalDisplayName = defineDisplayName(locationsArray[i]);
    var searchResultLabel = document.createElement("label");
    searchResultLabel.innerText = modalDisplayName;
    searchResultLabel.setAttribute("for", "search-result-" + i);
    searchResultContainer.appendChild(searchResultLabel);
    // appendingChild to the container to the form
    formBody.appendChild(searchResultContainer);
  }
  UIkit.modal("#confirm-location-modal").show();
};

// Display Name and coordinates
var saveLocation = function (location) {
  displayName = defineDisplayName(location);
  if (searchTerms.includes(displayName)) {
    var index = searchTerms.indexOf(displayName);
    searchTerms.splice(index, 1);
    searchHistory.splice(index, 1);
    // removing the element
    var dataLocationName = displayName.split(" ").join("+");
    var searchHistoryItem = searchHistoryItems.querySelector(
      "[data-location-name='" + dataLocationName + "']"
    );
    searchHistoryItems.removeChild(searchHistoryItem);
  }
  var cityData = {
    displayName: displayName,
    coords: location.latLng,
  };

  // updating the search history arrays and remove the last element if has 5 items
  if (searchTerms.length == 5) {
    searchTerms.splice(0, 1);
    searchHistory.splice(0, 1);
    var fifthChild = searchHistoryItems.childNodes[4];
    searchHistoryItems.removeChild(fifthChild);
  }
  searchTerms.push(displayName);
  searchHistory.push(cityData);
  localStorageHistory = {
    searchTerms: searchTerms,
    searchHistory: searchHistory,
  };
  localStorage.setItem("searchHistory", JSON.stringify(localStorageHistory));
  createSearchHistoryElement(cityData);
};

// using map api to get geocode based on search
var getCoordinates = function (searchTerm) {
  searchTerm = searchTerm.split(" ").join("+");
  var geocodingApiUrl =
    "https://www.mapquestapi.com/geocoding/v1/address?key=MxMEt0lAXnEnzLPH7q3pPeMkwmaa422h&location=" +
    searchTerm;
  fetch(geocodingApiUrl).then(function (res) {
    if (res.ok) {
      res.json().then(function (data) {
        var locations = data.results[0].locations;
        if (locations.length == 1) {
          saveLocation(locations[0]);
          getWeather(locations[0].latLng);
        } else {
          confirmLocation(locations); // prompt the user to confirm the location
        }
      });
    } else {
      console.log("Couldn't get the coordinates from the map API: ", res.text);
    }
  });
};

// api call to get weather based on set coord lat:x and lng:y
var getWeather = function (coords) {
  var weatherApiUrl =
    "https://api.openweathermap.org/data/2.5/onecall?lat=" +
    coords.lat +
    "&lon=" +
    coords.lng +
    "&units=imperial&exclude=minutely,hourly&appid=" +
    apikey;
  fetch(weatherApiUrl).then(function (res) {
    if (res.ok) {
      res.json().then(function (data) {
        displayWeather(data); // display the current weather and forecast
      });
    } else {
      console.log(
        "Couldn't get the weather data from the openweathermap API: ",
        res.text
      );
    }
  });
};

// creating search history card
var createSearchHistoryElement = function (searchHistoryData) {
  var searchHistoryHeader = document.querySelector("#search-history-title");
  searchHistoryHeader.style.display = "block";

  var newCard = document.createElement("div");
  newCard.classList =
    "uk-card-default uk-card uk-card-body uk-card-hover uk-card-small uk-text-center search-history-item";
  newCard.textContent = searchHistoryData.displayName;
  newCard.setAttribute(
    "data-location-name",
    searchHistoryData.displayName.split(" ").join("+")
  );
  searchHistoryItems.insertBefore(newCard, searchHistoryItems.firstChild);
};

//display search history card if there are any data in localStorage
var displaySearchHistory = function () {
  var loadedSearchHistory = JSON.parse(localStorage.getItem("searchHistory"));
  if (loadedSearchHistory) {
    searchTerms = loadedSearchHistory.searchTerms;
    searchHistory = loadedSearchHistory.searchHistory;
    for (var i = 0; i < searchTerms.length; i++) {
      if (!searchTerms.includes(searchHistory[i])) {
        createSearchHistoryElement(searchHistory[i]);
      }
    }
  }
};

// display icon code and img element
var displayIcon = function (iconElement, iconCode, iconAlt) {
  var iconSrc = "https://openweathermap.org/img/w/" + iconCode + ".png";
  iconElement.setAttribute("src", iconSrc);
  iconElement.setAttribute("alt", iconAlt);
};

// Weatherdata object to display weather, Today's date
var displayWeather = function (weatherData) {
  currentWeatherCity.textContent = displayName;

  var dateElement = currentWeatherData.querySelector("#current-weather-date");
  var unixDate = weatherData.current.dt;
  var formattedDate = moment.unix(unixDate).format("dddd, MMMM Do");
  dateElement.textContent = formattedDate;

  // display the weather description
  var iconElement = currentWeatherData.querySelector("#current-weather-icon");
  var iconCode = weatherData.current.weather[0].icon;
  var iconAlt = weatherData.current.weather[0].description + " icon";
  displayIcon(iconElement, iconCode, iconAlt);

  // display the humidity
  var humidityElement = currentWeatherData.querySelector(
    "#current-weather-humidity"
  );
  var humidity = weatherData.current.humidity; // percentage
  humidityElement.textContent = "Humidity: " + humidity + "%";

  // display the current temperature
  var temperatureElement = currentWeatherData.querySelector(
    "#current-weather-current-temp"
  );
  var temperature = Math.floor(weatherData.current.temp);
  temperatureElement.textContent = "Current Temperature: " + temperature + "°F";

  // display the minimum temperature
  var minTempElement = currentWeatherData.querySelector(
    "#current-weather-min-temp"
  );
  var minTemp = Math.floor(weatherData.daily[0].temp.min);
  minTempElement.textContent = "Low: " + minTemp + "°F";

  // display the maximum temperature
  var maxTempElement = currentWeatherData.querySelector(
    "#current-weather-max-temp"
  );
  var maxTemp = Math.floor(weatherData.daily[0].temp.max);
  maxTempElement.textContent = "High: " + maxTemp + "°F";

  // display the wind speed
  var windSpeedElement = currentWeatherData.querySelector(
    "#current-weather-wind-speed"
  );
  var windSpeed = weatherData.current.wind_speed;
  windSpeedElement.textContent = "Wind Speed: " + windSpeed + " miles per hour";

  // display the uv index
  var uvIndexElement = currentWeatherData.querySelector(
    "#current-weather-uv-index"
  );
  uvIndexElement.innerHTML = "";
  uvIndexElement.textContent = "UV Index: ";

  var uvIndexSpan = document.createElement("span");
  var uvIndex = weatherData.current.uvi;
  uvIndexSpan.textContent = uvIndex;

  // update uv index text color https://www.aimatmelanoma.org/melanoma-101/prevention/what-is-ultraviolet-uv-radiation/
  if (uvIndex >= 8) {
    uvIndexSpan.classList.add("uk-text-danger");
  } else if (uvIndex >= 3) {
    uvIndexSpan.classList.add("uk-text-warning");
  } else {
    uvIndexSpan.classList.add("uk-text-success");
  }
  uvIndexElement.appendChild(uvIndexSpan);

  // display the weatherPanel and currentWeatherContainer now that we have weather data
  var weatherPanel = document.querySelector("#weather-panel");
  var currentWeatherContainer = document.querySelector(
    "#current-weather-container"
  );
  weatherPanel.style.display = "block";
  currentWeatherContainer.style.display = "block";

  // display the forecast
  displayForecast(weatherData.daily);
};

//5 day forecast
var displayForecast = function (forecastData) {
  // iterate through the first 5 days in the forecast data
  for (var i = 1; i < 6; i++) {
    // display the date
    var dateElement = forecastEl.querySelector("#forecast-date-" + i);
    var unixDate = forecastData[i].dt;
    dateElement.textContent = moment.unix(unixDate).format("MMMM Do");

    // display the icon
    var iconElement = forecastEl.querySelector("#forecast-icon-" + i);
    var iconCode = forecastData[i].weather[0].icon;
    var iconAlt = forecastData[i].weather[0].description;
    displayIcon(iconElement, iconCode, iconAlt);

    // display humidity
    var humidityElement = forecastEl.querySelector("#forecast-humidity-" + i);
    var humidity = forecastData[i].humidity;
    humidityElement.textContent = "Humidity: " + humidity + "%";

    // display min temperature
    var minTempElement = forecastEl.querySelector("#forecast-min-temp-" + i);
    var minTemp = Math.floor(forecastData[i].temp.min);
    minTempElement.textContent = "Low: " + minTemp + "°F";

    // display max temperature
    var maxTempElement = forecastEl.querySelector("#forecast-max-temp-" + i);
    var maxTemp = Math.floor(forecastData[i].temp.max);
    maxTempElement.textContent = "High: " + maxTemp + "°F";
  }

  // display the forecast container
  var forecastContainer = document.querySelector("#weather-forecast-container");
  forecastContainer.style.display = "block";
};

var searchButtonHandler = function (event) {
  event.preventDefault();
  confirmLocationModal
    .querySelector("#confirm-location-form-message")
    .classList.remove("uk-text-primary");
  var searchValue = searchInput.value;
  if (searchValue) {
    getCoordinates(searchValue);
    searchInput.value = "";
  }
};

var searchHistoryHandler = function (event) {
  if (event.target.classList.contains("search-history-item")) {
    var searchedCity = event.target.getAttribute("data-location-name");
    getCoordinates(searchedCity);
  }
};

//check if user has selected the radio button
var confirmLocationHandler = function (event) {
  event.preventDefault();
  var confirmedLocation;
  var radioButtons = document.getElementsByName("search-result");
  for (var i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      confirmedLocation = JSON.parse(
        radioButtons[i].getAttribute("data-location")
      );
    }
  }

  // choose a location to display the weather
  if (confirmedLocation) {
    UIkit.modal("#confirm-location-modal").hide();
    saveLocation(confirmedLocation);
    getWeather(confirmedLocation.latLng);
    confirmLocationModal
      .querySelector("#confirm-location-form-message")
      .classList.remove("uk-text-primary");
  } else {
    confirmLocationModal
      .querySelector("#confirm-location-form-message")
      .classList.add("uk-text-primary");
  }
};

function clearHistoryEl(event) {
  event.preventDefault();
  window.localStorage.clear();
  location.reload();
}

// event listener on load
displaySearchHistory();
searchButton.addEventListener("click", searchButtonHandler);
searchHistoryItems.addEventListener("click", searchHistoryHandler);
confirmLocationModal.addEventListener("submit", confirmLocationHandler);
clearHistory.addEventListener("click", clearHistoryEl);
