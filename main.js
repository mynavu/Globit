import { totalStamps } from './totalStamps.js';
import { matchList } from './matchList.js';

if (window.location.pathname === '/' || window.location.pathname.includes('/index')) {
  console.log("index.html found in the path");

const indexedDB = window.indexedDB ||
window.mozIndexedDF ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;
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

// Retrieve stored data from localStorage (if exists)
let pointId = 0;
let countriesPost = [];
let stampList = [];
//localStorage.clear();
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
    // Check if the source already exists to avoid errors
    if (!map.getSource('points')) {
        map.addSource('points', {
            type: 'geojson',
            data: geojson
        });
    }
    // Check if the layer already exists to avoid duplication
    if (!map.getLayer('points-layer')) {
        map.loadImage('./pointer.png', (error, image) => {
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

// Add points when the map initially loads and re-add points whenever the style is reloaded
map.on('load', () => {
    addPointsLayer(map, geojson);
});
map.on('style.load', () => {
    addPointsLayer(map, geojson);
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
const button = document.getElementById('customButton');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const menu = document.querySelector('.menu');

window.onload = () => {
    button.style.display = "block";
    menu.style.display = "flex";
}

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
    console.log("COUNTRIES STORED:", localStorage.getItem('countries_stored'));
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
     imageInput.value = ''; // Reset file input
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
        console.log(data.features);
        location = data.features[indexLocation].properties.full_address;
        console.log("location", location);
        console.log("coordinates", coordinates);
        countryName = data.features[indexLocation].properties.context.country.name;
        console.log("countryName", countryName);
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
    const newSubmitButton = document.getElementById('submitButton');
    newSubmitButton.innerText = 'Post';
    clearPreviousEntry();
    // Initialize description
    document.querySelector('input[name="description"]').value = description;
    map.getSource('points').setData(geojson);
    console.log("Countries", countriesPost);

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
            // Update GeoJSON even if no file is uploaded
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
        const imageBlob = getRequest.result?.data; // Access result only after onsuccess
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
            // Update description
            if (newDescription) {
                feature.properties.description = newDescription;
            }
            // Check if a new file was uploaded
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
                // If no new file, just update the GeoJSON
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

// Event listener for the button
button.addEventListener('click', function () {
    button.style.display = 'none';
    enablePointAdding();
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
                            // Remove previous click popup
                            if (clickPopup) {
                                clickPopup.remove();
                            }
                            // Create new click popup
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

                            // Add event listeners for the buttons
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
                                    clickPopup.remove(); // Close popup after deleting
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
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    imageInput.value = ''; // Clear file input

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

map.on('mouseup', () => {
    userInteracting = false;
    spinGlobe();
});

map.on('dragend', () => {
    userInteracting = false;
    spinGlobe();
});

map.on('pitchend', () => {
    userInteracting = false;
    spinGlobe();
});
map.on('rotateend', () => {
    userInteracting = false;
    spinGlobe();
});

    // When animation is complete, start spinning if there is no ongoing interaction
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
    if (modeButton.checked) {
        darkMode();
    } else {
        lightMode();
    }

modeButton.addEventListener('change', () => {
    if (modeButton.checked) {
        darkMode();
    } else {
        lightMode();
    }
});

// SETTINGS
const settingsButton = document.querySelector('.menuFriend');
const customization = document.querySelector('.customization');

settingsButton.addEventListener("click", () => {
    if (customization.style.display === "none" || customization.style.display === "") {
    customization.style.display = "flex";
    } else {
    customization.style.display = "none";
    }
})

/* ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ---------------------------------------------------------------------------------------------------------------------------------- */

} else if (window.location.pathname.includes("/stamps")) {
      const settingsButton = document.querySelector('.menuFriend');
      const customization = document.querySelector('.customization');
      const allStamps = document.querySelector('.allStamps');
      const allCountries = document.querySelector('.allCountries');

      settingsButton.addEventListener("click", () => {
          if (customization.style.display === "none" || customization.style.display === "") {
              customization.style.display = "flex";
          } else {
              customization.style.display = "none";
          }
      });

    //DARK MODE LIGHT MODE
    const mode = document.querySelector(".mode");
    const modeButton = document.getElementById('check');
    const pfp = document.querySelector(".pfp");
    const backgroundColor = document.querySelector(".background");
    const savedState = localStorage.getItem("checkboxState");

    function darkMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
    }

    function lightMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Light";
        pfp.src = "earth_pfp.png";
        backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
    }

    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };

    if (modeButton.checked) {
        darkMode();
    } else {
        lightMode();
    }

    modeButton.addEventListener('change', () => {
        if (modeButton.checked) {
            darkMode();
        } else {
            lightMode();
        }
    });

const storedCountries = localStorage.getItem('countries_stored');
const storedStamps = localStorage.getItem('stamps_stored');
const storedGeojson = localStorage.getItem('value');

const mostPostedCountry = document.querySelector('.mostPostedCountry');
const mostPostedCountryImg = document.querySelector('.mostPostedCountryImg');
const mostPostedCountryData = document.querySelector('.mostPostedCountryData');
const mostPostedCountryStatement = document.querySelector('.mostPostedCountryStatement');

const postsNumber = document.querySelector('.postsNumber');
const stampsNumber = document.querySelector('.stampsNumber');
const countriesNumber = document.querySelector('.countriesNumber');

const suggestionImg = document.querySelector('.suggestionImg');
const suggestionCountry = document.querySelector('.country');
const suggestionCity = document.querySelectorAll('.city');
const suggestionStatement = document.querySelector('.suggestionStatement');

const stampsReminder = document.querySelector('.stampsReminder');
const countriesReminder = document.querySelector('.countriesReminder');

const credits = document.querySelector(".credits");

let stampList = [];

      document.addEventListener('DOMContentLoaded', () => {
          if (storedCountries) {
              let countriesPost = JSON.parse(storedCountries);
              if (countriesPost.length > 0) {
                  countriesReminder.style.display = "none";
                  countriesNumber.innerText = countriesPost.length;
                  console.log("countriesPost", countriesPost);
                  console.log("Country list length",countriesPost.length);
                  countriesPost.forEach((country) => {
                      const countryName = country.name;
                      const formattedCountry = countryName.replaceAll(' ', '_');
                      if (formattedCountry === "Türkiye") {
                        const HTMLString = `<img src="https://flagdownload.com/wp-content/uploads/Flag_of_Turkey_Flat_Round_Corner-1024x1024.png">`;
                        allCountries.insertAdjacentHTML('beforeend', HTMLString);
                        console.log(HTMLString);
                      } else if (formattedCountry === "People's_Republic_of_China") {
                        const HTMLString = `<img src="https://flagdownload.com/wp-content/uploads/Flag_of_Peoples_Republic_of_China_Flat_Round_Corner-1024x1024.png">`;
                        allCountries.insertAdjacentHTML('beforeend', HTMLString);
                        console.log(HTMLString);
                      } else {
                        const HTMLString = `<img src="https://flagdownload.com/wp-content/uploads/Flag_of_${formattedCountry}_Flat_Round_Corner-1024x1024.png">`;
                        allCountries.insertAdjacentHTML('beforeend', HTMLString);
                        console.log(HTMLString);
                      }
                  });

                  const maxCountry = countriesPost.reduce((maxObj, currentObj) => (currentObj.count > maxObj.count ? currentObj : maxObj), countriesPost[0]);
                  console.log("MaxCountry", maxCountry);
                  mostPostedCountry.innerHTML = maxCountry.name;

                  const formattedCountry = maxCountry.name.replaceAll(' ', '_');
                  console.log("formattedCountry",formattedCountry);
                  if (formattedCountry === "Türkiye") {
                  mostPostedCountryImg.src = "https://flagdownload.com/wp-content/uploads/Flag_of_Turkey_Flat_Round_Corner-1024x1024.png";
                  } else if (formattedCountry === "People's_Republic_of_China") {
                  mostPostedCountryImg.src = "https://flagdownload.com/wp-content/uploads/Flag_of_Peoples_Republic_of_China_Flat_Round_Corner-1024x1024.png";
                  } else {
                  mostPostedCountryImg.src = `https://flagdownload.com/wp-content/uploads/Flag_of_${formattedCountry}_Flat_Round_Corner-1024x1024.png`;
                  };
                  mostPostedCountryData.innerHTML = `You posted in ${maxCountry.name} ${maxCountry.count} times!`

              }  else {
              console.log("None");
              mostPostedCountryStatement.innerHTML = "";
              countriesReminder.style.display = "block";
              mostPostedCountryData.innerHTML = "Start posting to get a recap of your journey!"};

          }

          if (storedStamps) {
              console.log("YES STAMP STORED")
              stampList = JSON.parse(storedStamps);
              if (stampList.length > 0) {
              credits.style.display = "block";
              stampsReminder.style.display = "none";
              } else {
              stampsReminder.style.display = "block";
              credits.style.display = "none";
              }
          } else {
              credits.style.display = "none";
          }
              const stampsLeft = totalStamps.filter((stamp) => (!stampList.includes(stamp.city)));
              const randomIndex = Math.floor(Math.random() * stampsLeft.length);
              const randomSuggestion = stampsLeft[randomIndex];
              suggestionCountry.innerText = randomSuggestion.country;
              suggestionCity.forEach((randomCity)=> (randomCity.innerText = randomSuggestion.city));
              const formattedCity = randomSuggestion.city.replaceAll(" ", "_");
              suggestionImg.src = `stamps/${formattedCity}.PNG`;

              stampsNumber.innerText = stampList.length;
              console.log("Stamp list length",stampList.length);
              stampList.forEach((stamp) => {
                let formattedStamp = stamp.replaceAll(' ', '_');
                const HTMLString = `<img src="stamps/${formattedStamp}.PNG">`;
                allStamps.insertAdjacentHTML('beforeend', HTMLString);
              });

          if (storedGeojson) {
            let geojson = JSON.parse(storedGeojson);
            console.log(geojson);
            console.log(geojson.features.length);
            postsNumber.innerText = geojson.features.length;
          }
      });
}

/* ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ----------------------------------------------------------------------------------------------------------------------------------
   ---------------------------------------------------------------------------------------------------------------------------------- */

else if (window.location.pathname.includes("/home")) {

const storedCountries = localStorage.getItem('countries_stored');
const storedStamps = localStorage.getItem('stamps_stored');
const storedGeojson = localStorage.getItem('value');

const mostPostedCountry = document.querySelector('.mostPostedCountry');
const mostPostedCountryImg = document.querySelector('.mostPostedCountryImg');
const mostPostedCountryData = document.querySelector('.mostPostedCountryData');

const postsNumber = document.querySelector('.postsNumber');
const stampsNumber = document.querySelector('.stampsNumber');
const countriesNumber = document.querySelector('.countriesNumber');

const suggestionImg = document.querySelector('.suggestionImg');
const suggestionCountry = document.querySelector('.country');
const suggestionCity = document.querySelectorAll('.city');
const suggestionStatement = document.querySelector('.suggestionStatement');
const mostPostedCountryStatement = document.querySelector('.mostPostedCountryStatement');

let stampList = [];

const imgDisplay = document.querySelector(".imgDisplay");
const descriptionDisplay = document.querySelector(".descriptionDisplay");
const locationDisplay = document.querySelector(".locationDisplay");
const mainbar2 = document.querySelector(".mainbar2");

document.addEventListener('DOMContentLoaded', () => {
if (storedCountries) {
              let countriesPost = JSON.parse(storedCountries);
              if (countriesPost.length > 0) {
                  const maxCountry = countriesPost.reduce((maxObj, currentObj) => (currentObj.count > maxObj.count ? currentObj : maxObj), countriesPost[0]);
                  console.log("MaxCountry", maxCountry);
                  mostPostedCountry.innerHTML = maxCountry.name;
                  const formattedCountry = maxCountry.name.replaceAll(' ', '_');
                  console.log("formattedCountry",formattedCountry);
                  if (formattedCountry === "Türkiye") {
                  mostPostedCountryImg.src = "https://flagdownload.com/wp-content/uploads/Flag_of_Turkey_Flat_Round_Corner-1024x1024.png";
                  } else if (formattedCountry === "People's_Republic_of_China") {
                  mostPostedCountryImg.src = "https://flagdownload.com/wp-content/uploads/Flag_of_Peoples_Republic_of_China_Flat_Round_Corner-1024x1024.png";
                  } else {
                  mostPostedCountryImg.src = `https://flagdownload.com/wp-content/uploads/Flag_of_${formattedCountry}_Flat_Round_Corner-1024x1024.png`;
                  };
                  mostPostedCountryData.innerHTML = `You posted in ${maxCountry.name} ${maxCountry.count} times!`
              }  else {
              mostPostedCountryStatement.innerHTML = "";
              mostPostedCountryData.innerHTML = "Start posting to get a recap of your journey!"};
          }

          if (storedStamps) {
              stampList = JSON.parse(storedStamps);
          }
              const stampsLeft = totalStamps.filter((stamp) => (!stampList.includes(stamp.city)));
              const randomIndex = Math.floor(Math.random() * stampsLeft.length);
              const randomSuggestion = stampsLeft[randomIndex];
              suggestionCountry.innerText = randomSuggestion.country;
              suggestionCity.forEach((randomCity)=> (randomCity.innerText = randomSuggestion.city));
              const formattedCity = randomSuggestion.city.replaceAll(" ", "_");
              suggestionImg.src = `stamps/${formattedCity}.PNG`;
              stampsNumber.innerText = stampList.length;
              console.log("Stamp list length",stampList.length);
              const postReminder = document.querySelector(".postReminder");

    const indexedDB = window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB ||
        window.shimIndexedDB;

    const request = indexedDB.open("GeoJSONImagesDB", 1);
    let db;

    // IndexedDB setup
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("images")) {
            db.createObjectStore("images", { keyPath: "id" }); // Create object store
        }
        console.log("Database setup complete.");
    };

    // Open IndexedDB and initialize db
    request.onsuccess = async function (event) {
        db = event.target.result; // Initialize db after success
        // Now proceed with processing storedGeojson
        if (storedGeojson) {
            let geojson = JSON.parse(storedGeojson);
            postsNumber.innerText = geojson.features.length;
            console.log(geojson);
            const postReminder = document.querySelector(".postReminder");

            if (geojson.features.length > 0) {
                postReminder.style.display = "none";
                // Process posts in order
                for (const feature of geojson.features) {
                    await new Promise((resolve) => {
                        const transaction = db.transaction("images", "readonly");
                        const store = transaction.objectStore("images");
                        const getRequest = store.get(feature.id);

                        getRequest.onsuccess = function () {
                            const imageBlob = getRequest.result?.data;
                            if (imageBlob) {
                                const HTMLString = `
                                <div class="post">
                                    <div class="profileDisplay">
                                        <img class="pfp2" src="earth_pfp.png">
                                        <div class="usernameAndLocation">
                                            <h4 class="username2">Guest</h4>
                                            <h5 class="locationDisplay average">${feature.properties.location}</h5>
                                        </div>
                                    </div>
                                    <img class="imgDisplay" src="${imageBlob}">
                                    <h5 class="descriptionDisplay average">${feature.properties.description}</h5>
                                </div>
                                `;
                                mainbar2.insertAdjacentHTML("beforeend", HTMLString);
                            }
                            resolve();
                        };
                        getRequest.onerror = function () {
                            console.error(`Error retrieving data for feature ID ${feature.id}`);
                            resolve();
                        };
                    });
                }
            } else {
                postReminder.style.display = "block";
            }
        }
    };

    request.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.errorCode);
    };
});
      const settingsButton = document.querySelector('.menuFriend');
      const customization = document.querySelector('.customization');

      settingsButton.addEventListener("click", () => {
          if (customization.style.display === "none" || customization.style.display === "") {
              customization.style.display = "flex";
          } else {
              customization.style.display = "none";
          }
      });

    //DARK MODE LIGHT MODE
    const mode = document.querySelector(".mode");
    const modeButton = document.getElementById('check');
    const pfp = document.querySelector(".pfp");
    const backgroundColor = document.querySelector(".background2");
    const savedState = localStorage.getItem("checkboxState");

    function darkMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
    };

    function lightMode() {
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Light";
        pfp.src = "earth_pfp.png";
        backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
    }

    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };

    if (modeButton.checked) {
        darkMode();
    } else {
        lightMode();
    }

    modeButton.addEventListener('change', () => {
        if (modeButton.checked) {
            darkMode();
        } else {
            lightMode();
        }
    });
}

