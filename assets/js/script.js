// DOM Elements
var searchInput = document.getElementById("search-input");
var searchButton = document.getElementById("search-button");
var confirmLocationModal = document.getElementById("confirm-location-modal");
var searchHistoryItems = document.getElementById("search-history-items");
var currentWeatherCity = document.getElementById("current-weather-city");
var currentWeatherData = document.getElementById("current-weather");
var forecastEl = document.getElementById("forecast");

var displayName;
var searchTerms = [];
var searchHistory = [];

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
    var searchCity = event.target.getAttribute("data-location-name");
    getCoordinates(searchCity);
  }
};

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

searchButton.addEventListener("click", searchButtonHandler);
searchHistoryItems.addEventListener("click", searchHistoryHandler);
confirmLocationModal.addEventListener("submit", confirmLocationHandler);
