import { totalStamps } from './totalStamps.js';
import { matchList } from './matchList.js';

const indexedDB = window.indexedDB ||
window.mozIndexedDF ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;
/*
indexedDB.deleteDatabase("GeoJSONImagesDB");
indexedDB.deleteDatabase("GeoJSONImagesDB").onsuccess = function () {
    console.log("IndexedDB deleted successfully.");
};
localStorage.clear();
*/

const request = indexedDB.open("GeoJSONImagesDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("images")) {
            db.createObjectStore("images", { keyPath: "id" });
        }
        console.log("Database setup complete.");
};

request.onsuccess = function (event) {
    db = event.target.result;
};

request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.errorCode);
};

mapboxgl.accessToken = 'pk.eyJ1IjoibXluYXZ1IiwiYSI6ImNtM3NzaWhpejAxM3Qya29tcTltOGhqd2EifQ.NF_TfdXji0T4Mn-qDeyzQw';

const submitButton = document.getElementById('submitButton');

const header = document.querySelector(".header");

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mynavu/cm3std23v009l01sd8csudg7h', // Light mode
    projection: 'globe',
    zoom: 1.5,
    center: [-90, 40]
});

// The Data
let geojson = {
                "type": "FeatureCollection",
                "features": [
                ]
              };

let currentLocation = {
                "type": "FeatureCollection",
                "features": [
                ]
              };

// Retrieve stored data from localStorage (if exists)
let pointId = 0;
let countriesPost = [];
let stampList = [];
const storedId = localStorage.getItem('idCount');
const storedGeojson = localStorage.getItem('value');
const storedCountries = localStorage.getItem('countries_stored');
const storedStamps = localStorage.getItem('stamps_stored');
const savedState = localStorage.getItem('checkboxState');

if (storedGeojson) {
    geojson = JSON.parse(storedGeojson);
}

if (storedId) {
    pointId = JSON.parse(storedId);
}

document.addEventListener('DOMContentLoaded', () => {
    if (storedCountries) {
        countriesPost = JSON.parse(storedCountries);
    }
    updateNumberOfCountries();
    if (storedStamps) {
        stampList = JSON.parse(storedStamps);
    }
});

// Function to add GeoJSON source and layer for points
function addPointsLayer(map, geojson) {
    if (!map.getSource('points')) {
        map.addSource('points', {
            type: 'geojson',
            data: geojson
        });
    }
    if (!map.getLayer('points-layer')) {
        map.loadImage('./pointer1.png', (error, image) => {
            if (error) throw error;
            if (!map.hasImage('custom-pointer')) {
                map.addImage('custom-pointer', image);
            }
            map.addLayer({
                id: 'points-layer',
                type: 'symbol',
                source: 'points',
                layout: {
                    'icon-image': 'custom-pointer',
                    'icon-size': 0.07,
                    'icon-allow-overlap': true,
                    'icon-offset': [0, -280]
                }
            });
        });
    }
}

function addCurrentLocation(map, currentLocation) {
    // Check if the source already exists to avoid errors
    if (!map.getSource('currentPoint')) {
        map.addSource('currentPoint', {
            type: 'geojson',
            data: currentLocation
        });
    }
    if (!map.getLayer('current-points-layer')) {
        map.loadImage('./pointerface7.png', (error, image) => {
            if (error) throw error;
            if (!map.hasImage('custom-pointer3')) {
                map.addImage('custom-pointer3', image);
            }
            map.addLayer({
                id: 'current-points-layer',
                type: 'symbol',
                source: 'currentPoint',
                layout: {
                    'icon-image': 'custom-pointer3',
                    'icon-size': 0.2,
                    'icon-allow-overlap': true,
                    'icon-offset': [25, -185]
                }
            });
        });
    }
}

const weatherDisplay = document.querySelector('.weatherDisplay');
const weatherIcon = {
    "01d" : '<i class="weatherIcon bi bi-brightness-high-fill"></i>',
    "02d" : '<i class="weatherIcon bi bi-cloud-sun-fill"></i>',
    "03d" : '<i class="weatherIcon bi bi-cloud-fill"></i>',
    "04d" : '<i class="weatherIcon bi bi-clouds-fill"></i>',
    "09d" : '<i class="weatherIcon bi bi-cloud-drizzle-fill"></i>',
    "10d" : '<i class="weatherIcon bi bi-cloud-rain-heavy-fill"></i>',
    "11d" : '<i class="weatherIcon bi bi-cloud-lightning-fill"></i>',
    "13d" : '<i class="weatherIcon bi bi-cloud-snow-fill"></i>',
    "50d" : '<i class="weatherIcon bi bi-cloud-haze2-fill"></i>',
    "01n" : '<i class="weatherIcon bi bi-moon-fill"></i>',
    "02n" : '<i class="weatherIcon bi bi-cloud-moon-fill"></i>',
    "03n" : '<i class="weatherIcon bi bi-cloud-fill"></i>',
    "04n" : '<i class="weatherIcon bi bi-clouds-fill"></i>',
    "09n" : '<i class="weatherIcon bi bi-cloud-drizzle-fill"></i>',
    "10n" : '<i class="weatherIcon bi bi-cloud-rain-heavy-fill"></i>',
    "11n" : '<i class="weatherIcon bi bi-cloud-lightning-fill"></i>',
    "13n" : '<i class="weatherIcon bi bi-cloud-snow-fill"></i>',
    "50n" : '<i class="weatherIcon bi bi-cloud-haze2-fill"></i>'
};

let locationAccess = false;

navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    map.flyTo({
        center: [longitude, latitude],
        zoom: 3,
        speed: 0.8
    });
    locationAccess = true;
    //console.log("CURRENT LOCATION", latitude, longitude);
    const point = {
                   "type": "Feature",
                   "geometry": {
                       "type": "Point",
                       "coordinates": [longitude, latitude]
                       }
                   };
    if (currentLocation.features.length === 0) {
   currentLocation.features.push(point);
   };
   //console.log(currentLocation.features);

   if (currentLocation.features.length > 0) {
       if (map.isStyleLoaded()) {
              addCurrentLocation(map, currentLocation);
              // Add weather here
              const weather = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=71eda31f2208ffe09fa48962d3a84835`;
              fetch(weather)
              .then(response => response.json())
              .then(data => {
                console.log(data.weather, data.main);
                const tempInCelsius = Math.floor(parseFloat(data.main.temp) - 273.15).toString();
                const iconName = data.weather[0].icon;
                weatherDisplay.innerHTML = `${weatherIcon[iconName]} &nbsp ${tempInCelsius}°`;
                weatherDisplay.style.display = "block";

              })
              .catch(error => console.log("error"));
       }
       /*

       else {
           map.on('style.load', () => {
               addCurrentLocation(map, currentLocation);
           });
           map.on('load', () => {
               addCurrentLocation(map, currentLocation);
           });
       }
       */
   }

});

// Add points when the map initially loads and re-add points whenever the style is reloaded
const menu = document.querySelector('.menu');
const button = document.getElementById('customButton');

map.on('load', () => {
    addPointsLayer(map, geojson);
    if (currentLocation.features.length) {
        addCurrentLocation(map, currentLocation);
    };
});

map.on('style.load', () => {
    menu.style.display = "none";
    customButton.style.display = "none";
    addPointsLayer(map, geojson);
    if (currentLocation.features.length) {
        addCurrentLocation(map, currentLocation);
    }
    menu.style.display = "flex";
    customButton.style.display = "flex";
});

const numberOfPosts = document.querySelector('.numberOfPosts');

function updateNumberOfPosts() {
    numberOfPosts.innerHTML = `Posts: ${geojson.features.length}`;
}
updateNumberOfPosts();

let hoverPopup = null;
let clickPopup = null;
const entry = document.getElementById('entry');
const text = document.querySelector('.text');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');

// When you are NOT adding a new point or CLICKING a point but want to HOVER
map.on('mouseenter', 'points-layer', (e) => {
    if (!clickPopup && text.style.display !== 'block') {
    map.getCanvas().style.cursor = 'pointer';
    const coordinates = e.lngLat;
    const location = e.features[0]?.properties?.location;

    hoverPopup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            })
            .setLngLat(coordinates)
            .setHTML(location)
            .addTo(map);
    }
});
// Hide popup when the mouse LEAVES
map.on('mouseleave', 'points-layer', () => {
    if (text.style.display !== 'block') {
    map.getCanvas().style.cursor = '';}
    if (hoverPopup) {
        hoverPopup.getElement().style.transition = "opacity 1s ease-out";
        hoverPopup.getElement().style.opacity = 0;
        setTimeout(() => {
            hoverPopup.remove();
            hoverPopup = null;
        }, 50);
    }
});

function enablePointAdding() {
    map.getCanvas().style.cursor = 'pointer';
    text.style.display = 'block';
    map.on('click', addPoint);
}

function disablePointAdding() {
    map.getCanvas().style.cursor = '';
    text.style.display = 'none';
    map.off('click', addPoint);
}

const numberOfCountries = document.querySelector('.numberOfCountries');
function updateNumberOfCountries() {
    numberOfCountries.innerHTML = `Countries Visited: ${countriesPost.length}`;
    localStorage.setItem('countries_stored', JSON.stringify(countriesPost));
    //console.log("COUNTRIES STORED:", localStorage.getItem('countries_stored'));
}

function deletePoint(index) {
    const featureToDelete = geojson.features[index];
    const deletedCountry = featureToDelete.properties.country;
    geojson.features.splice(index, 1);
    const deletedIndex = countriesPost.findIndex(country => country.name === deletedCountry);
    if (deletedIndex !== -1) {
        countriesPost[deletedIndex].count -= 1;
        if (countriesPost[deletedIndex].count === 0) {
            countriesPost.splice(deletedIndex, 1);
        }
    }
    // Update the map data and UI
    map.getSource('points').setData(geojson);
    localStorage.setItem('value', JSON.stringify(geojson));
    localStorage.setItem('idCount', JSON.stringify(pointId));
    updateNumberOfCountries();
}

const clearPreviousEntry = () => {
     imagePreview.src = '';
     imagePreview.style.display = 'none';
     imageInput.value = '';
}

const replaceSubmitButton = () => {
    const submitButton = document.getElementById('submitButton');
    submitButton.replaceWith(submitButton.cloneNode(true)); // Remove old listeners
}

function receiveStamp(location) {
    console.log("Location:", location);
    matchList.forEach(({ regex, stamp }) => {
        if (location.match(regex)) {
            if (!stampList.includes(stamp)) {
                stampList.push(stamp);
                stampNotify(stamp);
                }
        }
    });
    localStorage.setItem('stamps_stored', JSON.stringify(stampList));
    console.log(stampList);
    console.log("List", stampList);
    console.log("DATA: ", localStorage.getItem('stamps_stored'));
}

// NOTIFICATIONS FOR STAMPS
const stampNotif = document.querySelector(".stampNotif");
const area = document.querySelector(".area");

function stampNotify(stamp) {
    const formattedStamp = stamp.replaceAll("_", " ");
    const HTMLString = `
    <div class="stampNotif">
        <img src="stamps/${stamp}.PNG">
        <div class="achievement">
            <h3>New Stamp Unlocked!</h3>
            <h1>${formattedStamp}</h1>
            <p> Click <a href="stamps.html">here</a> to view </p>
        </div>
    </div>
    `;
    area.insertAdjacentHTML('beforeend', HTMLString);
    setTimeout(() => {
    area.innerHTML = "";
    }, 8000)
};

function addPoint(e) {
    //console.log("E:", e);
    let description = "";
    let location = "";
    let countryName = "";
    let indexLocation = 0;
    disablePointAdding();
    const coordinates = e.lngLat;
    const { lng, lat } = e.lngLat;
    const reverseGeoCode = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&language=en&access_token=${mapboxgl.accessToken}`;
    fetch(reverseGeoCode)
    .then(response => response.json())
    .then(data => {
        const lastIndex = data.features.length - 1;
        const oddOrEven = (data.features.length) % 2;
        if (oddOrEven === 0) {
            indexLocation = (data.features.length / 2) - 1;

        } else {
            indexLocation = ((data.features.length + 1) / 2) - 1;
            if (indexLocation === -1) {
                indexLocation = 0;
            }
        }
        //console.log(data.features);
        location = data.features[indexLocation].properties.full_address;
        //console.log("location", location);
        //console.log("coordinates", coordinates);
        countryName = data.features[indexLocation].properties.context.country.name;
        //console.log("countryName", countryName);
        const newFeature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [coordinates.lng, coordinates.lat]
                },
                "properties": {
                    "description": "",
                    "country": countryName,
                    "location": location
                },
                "id": pointId++
            };
            geojson.features.push(newFeature);
            updateNumberOfPosts();
            map.getSource('points').setData(geojson);
            entry.showModal();
            if (countryName !== "") {
                   const index = countriesPost.findIndex(item => item.name === countryName);
                   if (index === -1) {
                      countriesPost.push({ name: countryName, count: 1 });
                   } else {
                      countriesPost[index].count += 1;
                   }
                }
    })
    .catch(error => {
    location = "Unknown Location";
    const newFeature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [coordinates.lng, coordinates.lat]
            },
            "properties": {
                "description": "",
                "country": countryName,
                "location": location
            },
            "id": pointId++
        };
        geojson.features.push(newFeature);
        updateNumberOfPosts();
        map.getSource('points').setData(geojson);
        entry.showModal();
    });
    replaceSubmitButton();
    //console.log("geojson.features", geojson.features);
    const newSubmitButton = document.getElementById('submitButton');
    newSubmitButton.innerText = 'Post';
    clearPreviousEntry();
    // Initialize description
    document.querySelector('input[name="description"]').value = description;
    map.getSource('points').setData(geojson);
    //console.log("Countries", countriesPost);

    // Make the entry box appear and the exit button
    exitButton.style.display = 'block';

    newSubmitButton.addEventListener('click', function () {
        // Update the latest input for the image and the description
        description = document.querySelector('input[name="description"]').value;
        const lastFeature = geojson.features[geojson.features.length - 1];
        lastFeature.properties.description = description;
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imageBlob = e.target.result;
                const featureId = lastFeature.id;
                if (db) {
                const transaction = db.transaction("images", "readwrite");
                const store = transaction.objectStore("images");
                store.put({ id: featureId, data: imageBlob });
                console.log(`Image saved in IndexedDB with Feature ID: ${featureId}`);
                } else {
                    console.error("Database not ready yet.");
                }
                map.getSource('points').setData(geojson);
                localStorage.setItem('value', JSON.stringify(geojson));
                localStorage.setItem('idCount', JSON.stringify(pointId));
                receiveStamp(lastFeature.properties.location);
                updateNumberOfCountries();
            };
            reader.readAsDataURL(file);
        } else {
            alert("You must upload an image.");
            return;
        }
        // Hide entry form and reset UI
        entry.close();
        clearPreviousEntry();
        button.style.display = 'block';
    });
}

function editPoint(index) {
    const feature = geojson.features[index];
    if (!feature) return;
    const transaction = db.transaction("images", "readonly");
    const store = transaction.objectStore("images");
    const getRequest = store.get(feature.id);
    getRequest.onsuccess = function () {
        const imageBlob = getRequest.result?.data;
        if (imageBlob) {
            imagePreview.src = imageBlob;
            imagePreview.style.display = 'block';
        }
        // Populate description field
        document.querySelector('input[name="description"]').value = feature.properties.description || "";
        button.style.display = 'none';
        entry.showModal();
        // Reset file input
        imageInput.value = '';
        // Update on submit
        replaceSubmitButton();
        const newSubmitButton = document.getElementById('submitButton');
        newSubmitButton.addEventListener('click', function () {
            const newDescription = document.querySelector('input[name="description"]').value;
            button.style.display = 'block';
            if (newDescription) {
                feature.properties.description = newDescription;
            }
            const file = imageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const newImageBlob = e.target.result;
                    const writeTransaction = db.transaction("images", "readwrite");
                    const writeStore = writeTransaction.objectStore("images");
                    writeStore.put({ id: feature.id, data: newImageBlob });
                    localStorage.setItem('value', JSON.stringify(geojson));
                };
                reader.readAsDataURL(file);
            } else {
                map.getSource('points').setData(geojson);
            }
            localStorage.setItem('value', JSON.stringify(geojson));
            entry.close(); // Hide edit form
            imagePreview.style.display = 'none'; // Hide image preview
        });
    };
    getRequest.onerror = function () {
        console.error(`Failed to retrieve image for Feature ID: ${feature.id}`);
    };
}

//addPointsLayer(map, geojson);

const confirmLocation = document.getElementById('confirmLocation');
const currentLocationButton = document.getElementById('currentLocationButton');
const somewhereElseButton = document.getElementById('somewhereElseButton');
const exitButton2 = document.querySelector('.exit-button2');

// Event listener for the button
let currentLocationListenerAdded = false;
button.addEventListener('click', function () {
    button.style.display = 'none';
    confirmLocation.showModal();
    if (!currentLocationListenerAdded) {
        currentLocationButton.addEventListener('click', () => {
            if (locationAccess) {
                confirmLocation.close();
                button.style.display = "block";
                const currentCoords = currentLocation.features[0].geometry.coordinates;
                const simulatedEvent = {
                    lngLat: {
                        lng: currentCoords[0],
                        lat: currentCoords[1]
                    },
                    point: null,
                    originalEvent: null,
                    type: "geolocate",
                    target: map,
                    _defaultPrevented: false
                };
                addPoint(simulatedEvent);
            } else {
            alert("Please enable location services in your browser settings to use this feature. Refresh the page once enabled.");
            button.style.display = "block";
            };
        });
        currentLocationListenerAdded = true;
    }
    somewhereElseButton.addEventListener('click', () => {
        enablePointAdding();
    });
    exitButton2.addEventListener('click', () => {
        event.preventDefault();
        confirmLocation.close();
        button.style.display = "block";
    });
});

imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';

        };
    }
});

//CLICKING A POPUP
map.on('click', 'points-layer', function(e) {
    if (text.style.display !== 'block') {
        const coordinates = e.lngLat;
        const feature = e.features[0];
        console.log('Feature:', feature);

        const featureIndex = geojson.features.findIndex(f => f.id === feature.id);
        console.log("featureIndex: ", featureIndex, "feature.id: ", feature.id, "feature", feature)
        const transaction = db.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        const getRequest = store.get(feature.id);
        let image;
        getRequest.onsuccess = function () {
                const imageBlob = getRequest.result?.data;
                if (imageBlob) {
                    console.log(`Image loaded for Feature ID: ${feature.id}`);
                    image = `<img src="${imageBlob}" style="width: 200px; display: block; " />`
                    const location = feature.properties.location;
                            const description = feature.properties.description || "No description";
                            if (clickPopup) {
                                clickPopup.remove();
                            }
                            clickPopup = new mapboxgl.Popup()
                                .setLngLat(coordinates)
                                .setHTML(`
                                    <div class="popup">
                                        <p class="location_description margin">📍<i>${location}</i></p>
                                        ${image}
                                        <p class="location_description">${description}</p>
                                        <div class="container-delete">
                                            <button id="edit-btn-${featureIndex}" class="edit-btn">Edit <i class="bi bi-pen-fill"></i></button>
                                        </div>
                                        <div class="container-delete">
                                            <button id="delete-btn-${featureIndex}" class="delete-btn">Delete <i class="bi bi-trash-fill"></i> </button>
                                        </div>
                                    </div>
                                `)
                                .addTo(map);
                            // Listeners for the buttons
                            setTimeout(() => {
                                // Ensure the DOM has rendered before adding listeners
                                document.getElementById(`edit-btn-${featureIndex}`).addEventListener('click', () => {
                                    replaceSubmitButton();
                                    const newSubmitButton = document.getElementById('submitButton');
                                    newSubmitButton.innerText = 'Edit';
                                    editPoint(featureIndex);
                                    exitButton.style.display = 'none';
                                });
                                document.getElementById(`delete-btn-${featureIndex}`).addEventListener('click', () => {
                                    deletePoint(featureIndex);
                                    clickPopup.remove();
                                    updateNumberOfPosts();
                                });
                            }, 100); // Short delay to ensure DOM availability
                            clickPopup.on('close', () => {
                                    clickPopup = null; // Cleanup the reference
                                });
                } else {
                    console.warn(`No image found for Feature ID: ${feature.id}`);
                            image = `<p>No image available</p>`;
                }
            };
    }
});

const confirmCloseButton = document.getElementById('confirmCloseButton')

const exitButton = document.querySelector('.exit-button');
exitButton.addEventListener('click', () => {
    confirmCloseButton.showModal();
});

const cancelButton = document.getElementById('cancelButton');
const discardButton = document.getElementById('discardButton');

cancelButton.addEventListener('click', () => {
    confirmCloseButton.close();
})

discardButton.addEventListener('click', () => {
    confirmCloseButton.close();
    clearPreviousEntry();
    entry.close();
    button.style.display = 'block';
    deletePoint(geojson.features.length-1);
    updateNumberOfPosts();
})

/* ---------------------------------------------------------------------------------------------------------------------------------- */
// SPINNING
const secondsPerRevolution = 120;
const maxSpinZoom = 5;
const slowSpinZoom = 3;
let userInteracting = false;
let spinEnabled = false;

function spinGlobe() {
    const zoom = map.getZoom();
    if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
                            distancePerSecond *= zoomDif;

        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
}

map.on('mousedown',() => {
    userInteracting = true;
});

const events = ['mouseup', 'dragend', 'pitchend', 'rotateend'];
events.forEach((event) => {
    map.on(event, () => {
        userInteracting = false;
        spinGlobe();
    })
})
  // When animation is complete, spin again
map.on('moveend', () => {
    spinGlobe();
});

const spinButton = document.getElementById('check1');
const spinText = document.querySelector('.spin')

spinButton.addEventListener('change', () => {
    spinEnabled = spinButton.checked;
    if (spinButton.checked) {
        spinGlobe();
        spinText.innerText = 'Spinning: On';
    } else {
        map.stop();
        spinText.innerText = 'Spinning: Off';
    }
})

//SEARCH BAR AND OTHER CONTROLS
document.addEventListener('DOMContentLoaded', () => {
    map.on('load', () => {
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            types: 'address,poi',
            proximity: [-73.99209, 40.68933]
        });
        map.addControl(geocoder, 'top-right');

        // Fullscreen and Navigation Controls
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        const zoomButton = document.querySelector('.mapboxgl-ctrl-fullscreen');
        const searchBar = document.querySelector('.mapboxgl-ctrl-geocoder');

        zoomButton.addEventListener("click", () => {
            if (!zoomButton.classList.contains("zoomed")) {
                zoomButton.classList.add("zoomed");
                customization.style.display = "none";
                menu.style.display = "none";
                customButton.style.display = "none";
                searchBar.style.display = "none";
            } else {
                zoomButton.classList.remove("zoomed");
                customization.style.display = "flex";
                menu.style.display = "flex";
                customButton.style.display = "flex";
                searchBar.style.display = "block";
            }
        });

    });
});

//DARK MODE LIGHT MODE
const mode = document.querySelector(".mode");
const modeButton = document.getElementById('check');
const spinStyle = document.querySelector(".modeButton1");
const pfp = document.querySelector(".pfp")

function darkMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        map.setStyle('mapbox://styles/mynavu/cm4b3wrge01bm01si09uyal4o');
        map.on('style.load', () => {
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        spinStyle.style.backgroundColor = "#001f61";
        spinStyle.style.setProperty('--before-background-color', 'white');
        spinStyle.style.setProperty('--before-box-shadow', '0 0 10px white');
        });
}

function lightMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        map.setStyle('mapbox://styles/mynavu/cm3std23v009l01sd8csudg7h'); // Light mode style
        map.on('style.load', () => {
        mode.innerText = "Mode: Light";
        pfp.src = "earth_pfp.png";
        spinStyle.style.backgroundColor = "#6bd8ff";
        spinStyle.style.setProperty('--before-background-color', '#fffc00');
        spinStyle.style.setProperty('--before-box-shadow', '0 0 10px #fffc00');
        });
}

    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };
    modeButton.checked ? darkMode() : lightMode();

modeButton.addEventListener('change', () => {
    modeButton.checked ? darkMode() : lightMode();
});

// SETTINGS
const settingsButton = document.querySelector('.menuFriend');
const customization = document.querySelector('.customization');

settingsButton.addEventListener("click", () => {
    customization.style.display = (customization.style.display === "none" || customization.style.display === "") ? "flex" : "none";
})


