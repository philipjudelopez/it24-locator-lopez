


const map = L.map('map').setView(
    [12.8797, 121.7740], 6
);

// GOOGLE SATELLITE MAP
L.tileLayer(
    'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
        maxZoom: 20,
        attribution: '&copy; Google Maps'
    }
).addTo(map);






// Map markers
const markerLayer = L.layerGroup().addTo(map);

// HTML elements
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const statusMessage = document.getElementById("status");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");

// Search history
let searchHistory = [];

// Prevent older requests from replacing newer results
let searchRequest = 0;

// Search form submission
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city.length < 2) {
        statusMessage.textContent = "Please enter a valid city name.";
        return;
    }

    searchCity(city);
});

// Search city using Open-Meteo Geocoding API
async function searchCity(city) {
    const requestNumber = ++searchRequest;

    statusMessage.textContent = "Searching for " + city + "...";

    // Remove previous markers
    markerLayer.clearLayers();

    try {
        const url =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city) +
            "&count=5&language=en&format=json";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to connect to the location service.");
        }

        const data = await response.json();

        // Ignore an outdated search response
        if (requestNumber !== searchRequest) return;

        if (!data.results || data.results.length === 0) {
            statusMessage.textContent = "No location found. Try another city.";
            return;
        }

        const locations = data.results;

        // Display all returned locations
        const bounds = [];

        locations.forEach(function (location) {
            const marker = L.marker([
                location.latitude,
                location.longitude
            ]).addTo(markerLayer);

            const placeName = [
                location.name,
                location.admin1,
                location.country
            ].filter(Boolean).join(", ");

            const googleMapsURL =
                "https://www.google.com/maps?q=" +
                location.latitude + "," + location.longitude;

            const popupContent = document.createElement("div");

            const title = document.createElement("strong");
            title.textContent = placeName;

            const link = document.createElement("a");
            link.href = googleMapsURL;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = " Open in Google Maps";
            link.style.display = "block";
            link.style.marginTop = "8px";
            link.style.color = "#197347";

            popupContent.appendChild(title);
            popupContent.appendChild(link);

            marker.bindPopup(popupContent);

            bounds.push([
                location.latitude,
                location.longitude
            ]);
        });

        // Zoom to the search results
        if (bounds.length === 1) {
            map.setView(bounds[0], 12);
            markerLayer.eachLayer(marker => marker.openPopup());
        } else {
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        statusMessage.textContent =
            locations.length + " location(s) found.";

        // Add the successful search to history
        addToHistory(city);

        // Clear the input after a successful search
        cityInput.value = "";

    } catch (error) {
        if (requestNumber !== searchRequest) return;

        statusMessage.textContent =
            "Something went wrong. Please try again.";

        console.error(error);
    }
}

// Add search to history
function addToHistory(city) {
    const existingIndex = searchHistory.findIndex(
        item => item.toLowerCase() === city.toLowerCase()
    );

    if (existingIndex !== -1) {
        searchHistory.splice(existingIndex, 1);
    }

    // Newest search appears first
    searchHistory.unshift(city);

    displayHistory();
}

// Display search history
function displayHistory() {
    historyList.innerHTML = "";

    if (searchHistory.length === 0) {
        const emptyItem = document.createElement("li");

        emptyItem.className = "empty-history";
        emptyItem.textContent = "No recent searches yet.";

        historyList.appendChild(emptyItem);
        return;
    }

    searchHistory.forEach(function (city) {
        const item = document.createElement("li");
        item.textContent = "📍 " + city;
        item.title = "Search for " + city;

        item.addEventListener("click", function () {
            cityInput.value = city;
            searchCity(city);
        });

        historyList.appendChild(item);
    });
}

// Clear search history
clearHistoryButton.addEventListener("click", function () {
    searchHistory = [];
    displayHistory();
});

// Initial history display
displayHistory();
