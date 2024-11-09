let map;

// Initialize the map
function initMap() {
    map = L.map('map').setView([0, 0], 2); // Set initial view (default to [0,0] before geolocation)
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'b6c80afe73fe8301f2295cc4b9b18896'; // Replace with your OpenWeatherMap API key

    initMap(); // Initialize the map

    // Event listener for fetching weather by user's location
    document.getElementById('get-location-weather').addEventListener('click', () => {
        if (navigator.geolocation) {
            // Get current position of the user
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Center the map on the user's location
                map.setView([lat, lon], 13); // Set zoom level to 13 for close-up view
                L.marker([lat, lon]).addTo(map) // Add a marker at the user's location
                    .bindPopup('You are here!')
                    .openPopup();
                getWeatherDataByLocation(lat, lon, apiKey); // Fetch weather based on user's location
            }, error => {
                console.error('Error getting location:', error);
                alert('Unable to retrieve location. Please check your location settings and try again.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });

    // Event listener for fetching weather by city name
    document.getElementById('get-weather').addEventListener('click', () => {
        const city = document.getElementById('city-input').value.trim(); // Get and trim city name
        if (city) {
            getWeatherDataByCity(city, apiKey);
        } else {
            alert('Please enter a valid city name.');
        }
    });
});

// Function to fetch weather data by city name
function getWeatherDataByCity(city, apiKey) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.cod === "200") {
                const lat = data.city.coord.lat;
                const lon = data.city.coord.lon;

                // Center the map on the city coordinates
                map.setView([lat, lon], 13); // Set zoom level to 13 for close-up view
                L.marker([lat, lon]).addTo(map) // Add a marker for the city's location
                    .bindPopup(`${city}`)
                    .openPopup();

                // Display the forecast
                displayForecast(data.list, data.city);
            } else {
                document.getElementById('weather-info').innerHTML = `<p>City not found. Please try again.</p>`;
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById('weather-info').innerHTML = `<p>Error fetching weather data. Please try again later.</p>`;
        });
}

// Function to fetch weather data by user's latitude and longitude
function getWeatherDataByLocation(lat, lon, apiKey) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "200") {
                displayForecast(data.list, data.city);
            } else {
                document.getElementById('weather-info').innerHTML = `<p>Location not found. Please try again.</p>`;
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}

// Function to display the forecast data
function displayForecast(forecastData, cityData) {
    const weatherInfo = document.getElementById('weather-info');
    weatherInfo.innerHTML = '';

    // Display city details
    const weatherDetail = document.createElement('div');
    weatherDetail.className = 'weather-detail';
    weatherDetail.innerHTML = `
        <h2>Weather Forecast for ${cityData.name}, ${cityData.country}</h2>
    `;
    weatherInfo.appendChild(weatherDetail);

    // Group forecast data by day
    const days = {};
    forecastData.forEach(entry => {
        const date = new Date(entry.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!days[day]) {
            days[day] = [];
        }
        days[day].push({
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temperature: entry.main.temp,
            feelsLike: entry.main.feels_like,
            pressure: entry.main.pressure,
            humidity: entry.main.humidity,
            visibility: entry.visibility / 1000,
            windSpeed: entry.wind.speed,
            windDirection: entry.wind.deg,
            clouds: entry.clouds.all,
            description: entry.weather[0].description,
            iconUrl: `http://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`
        });
    });

    // Display each day in a horizontal section
    for (const [day, forecasts] of Object.entries(days)) {
        const dayForecast = document.createElement('div');
        dayForecast.className = 'day-forecast';
        dayForecast.innerHTML = `<h2>${day}</h2>`;

        const horizontalSection = document.createElement('div');
        horizontalSection.className = 'horizontal';
        forecasts.forEach(forecast => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <p><strong>${forecast.time}</strong></p>
                <p>Temp: ${forecast.temperature}°C</p>
                <p>Feels Like: ${forecast.feelsLike}°C</p>
                <p>Pressure: ${forecast.pressure} hPa</p>
                <p>Humidity: ${forecast.humidity}%</p>
                <p>Visibility: ${forecast.visibility} km</p>
                <p>Wind Speed: ${forecast.windSpeed} m/s</p>
                <p>Wind Direction: ${forecast.windDirection}°</p>
                <p>Clouds: ${forecast.clouds}%</p>
                <p>Description: ${forecast.description}</p>
                <img src="${forecast.iconUrl}" alt="${forecast.description}" class="weather-icon">
            `;
            horizontalSection.appendChild(forecastItem);
        });
        dayForecast.appendChild(horizontalSection);
        weatherInfo.appendChild(dayForecast);
    }
}
