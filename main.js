if (window.location.pathname.includes("index.html")) {

/*
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
            db.createObjectStore("images", { keyPath: "id" }); // Key is the Feature ID
        }
        console.log("Database setup complete.");
};

request.onsuccess = function (event) {
    console.log("IndexedDB opened successfully!");
    db = event.target.result;
    // Now you can save images to this database
};

request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.errorCode);
};

*/
mapboxgl.accessToken = 'pk.eyJ1IjoibXluYXZ1IiwiYSI6ImNtM3NzaWhpejAxM3Qya29tcTltOGhqd2EifQ.NF_TfdXji0T4Mn-qDeyzQw';

//https://api.mapbox.com/search/geocode/v6/reverse?longitude=50&latitude=50&language=en&access_token=pk.eyJ1IjoibXluYXZ1IiwiYSI6ImNtM3NzaWhpejAxM3Qya29tcTltOGhqd2EifQ.NF_TfdXji0T4Mn-qDeyzQw
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
//localStorage.removeItem('countries_stored');
const storedCountries = localStorage.getItem('countries_stored');
//localStorage.removeItem('stamps_stored');
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

map.on('load', () => {
    // Add GeoJSON source for points (only once)
    map.addSource('points', {
        type: 'geojson',
        data: geojson
    });

    // Load and add custom icon for points
    map.loadImage('./pointer.png', (error, image) => {
        if (error) throw error;
        map.addImage('custom-pointer', image);
        // Add layer for custom marker points
        map.addLayer({
            id: 'points-layer',
            type: 'symbol',
            source: 'points',
            layout: {
                'icon-image': 'custom-pointer', // Custom marker from above
                'icon-size': 0.07,
                'icon-allow-overlap': true,
                'icon-offset': [0, -280]
            }
        });
    });
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
        // Apply the fade-out effect using CSS
        hoverPopup.getElement().style.transition = "opacity 1s ease-out";
        hoverPopup.getElement().style.opacity = 0;

        // Remove the popup after the fade-out duration (1 second)
        setTimeout(() => {
            hoverPopup.remove(); // Remove the popup from the map
            hoverPopup = null;   // Reset the popup variable
        }, 50);
    }
});


// ADD A POINT TO THE MAP
// Enable adding points
function enablePointAdding() {
    map.getCanvas().style.cursor = 'pointer';
    text.style.display = 'block';
    map.on('click', addPoint);
}

// Disable adding points
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

    // Remove the feature from geojson
    geojson.features.splice(index, 1);

    // Update countriesPost
    const deletedIndex = countriesPost.findIndex(country => country.name === deletedCountry);
    if (deletedIndex !== -1) {
        countriesPost[deletedIndex].count -= 1;
        // Remove country if count is zero
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


// REGULAR EXPRESSIONS FOR STAMPS
const matchList = [{regex : /(?:Washington)(?:.*United States)/i , stamp : "Washington"},
{regex : /(?:Tokyo)(?:.*Japan)/i , stamp : "Tokyo"},
{regex : /(?:Seoul)(?:.*Korea)/i , stamp : "Seoul"},
{regex : /(?:Vancouver)(?:.*Canada)/i , stamp : "Vancouver"},
{regex : /(?:Moscow)(?:.*Russia)/i , stamp : "Moscow"},
{regex : /(?:Paris)(?:.*France)/i , stamp : "Paris"},
{regex : /(?:Cape)(?:.*South Africa)/i , stamp : "Cape_Town"},
{regex : /(?:Rome)(?:.*Italy)/i , stamp : "Rome"},
{regex : /(?:Oaxaca)(?:.*Mexico)/i , stamp : "Oaxaca"},
{regex : /(?:Cappadocia)(?:.*Turkey)/i , stamp : "Cappadocia"},
{regex : /(?:Chefchaouen)(?:.*Morocco)/i , stamp : "Chefchaouen"},
{regex : /(?:Amsterdam)(?:.*Netherlands)/i , stamp : "Amsterdam"},
{regex : /(?:Barcelona)(?:.*Spain)/i , stamp : "Barcelona"},
{regex : /(?:Beijing)(?:.*China)/i , stamp : "Beijing"},
{regex : /(?:Cairo)(?:.*Egypt)/i , stamp : "Cairo"},
{regex : /(?:Cartagena)(?:.*Colombia)/i , stamp : "Cartagena"},
{regex : /(?:(E|É)vora)(?:.*Portugal)/i , stamp : "Evora"},
{regex : /(?:Hawaii)(?:.*United States)/i , stamp : "Hawaii"},
{regex : /(?:Jerusalem)(?:.*Israel)/i , stamp : "Jerusalem"},
{regex : /(?:London)(?:.*England)/i , stamp : "London"},
{regex : /(?:Los Angeles)(?:.*United States)/i , stamp : "Los_Angeles"},
{regex : /(?:Naples)(?:.*Italy)/i , stamp : "Naples"},
{regex : /(?:New York)(?:.*United States)/i , stamp : "New_York"},
{regex : /(?:Paris)(?:.*France)/i , stamp : "Paris"},
{regex : /(?:Port Louis)(?:.*Mauritius)/i , stamp : "Port_Louis"},
{regex : /(?:Singapore)/i , stamp : "Singapore"},
{regex : /(?:Oia)(?:.*Greece)/i , stamp : "Santorini"},
{regex : /(?:Sydney)(?:.*Australia)/i , stamp : "Sydney"},
{regex : /(?:Nuuk)(?:.*Greenland)/i , stamp : "Nuuk"},
{regex : /(?:Bordeaux)(?:.*France)/i , stamp : "Bordeaux"},
{regex : /(?:Christchurch)(?:.*New Zealand)/i , stamp : "Christchurch"},
{regex : /(?:Havana)(?:.*Cuba)/i , stamp : "Havana"},
{regex : /(?:Istanbul)(?:.*(Turkey|Türkiye))/i , stamp : "Istanbul"},
{regex : /(?:Hamburg)(?:.*Germany)/i , stamp : "Hamburg"},
{regex : /(?:Hong Kong)/i , stamp : "Hong_Kong"}];

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
        <img src="/stamps/${stamp}.PNG">
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
                    "image": null,
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
                "image": null,
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

    // Remove old listeners and add a fresh one
    newSubmitButton.addEventListener('click', function () {
        // Update the latest input for the image and the description
        description = document.querySelector('input[name="description"]').value;
        const lastFeature = geojson.features[geojson.features.length - 1];
        lastFeature.properties.description = description;
        const file = imageInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                lastFeature.properties.image = e.target.result;
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

/*
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
                    "image": null,
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
                "image": null,
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

    // Remove old listeners and add a fresh one
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

                lastFeature.properties.image = null;
                map.getSource('points').setData(geojson);
                localStorage.setItem("geojson", JSON.stringify(geojson));
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
*/

function editPoint(index) {
    const feature = geojson.features[index];
    if (!feature) return;
    document.querySelector('input[name="description"]').value = feature.properties.description;
    button.style.display = 'none';

    // Update the image preview with the stored image data
    imagePreview.src = feature.properties.image; // Base64 or image URL
    entry.showModal();
    imagePreview.style.display = 'block';

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

        // Check if a new file was uploaded, usually it will be cleared and empty
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                feature.properties.image = e.target.result; // Base64 image data
                map.getSource('points').setData(geojson); // Update GeoJSON source
                localStorage.setItem('value', JSON.stringify(geojson));


            };
            reader.readAsDataURL(file);
        } else {
            // If no new file, just update the GeoJSON with the existing data
            map.getSource('points').setData(geojson);
        }
        localStorage.setItem('value', JSON.stringify(geojson));

        entry.close(); // Hide edit form
        imagePreview.style.display = 'none'; // Hide image preview
    });
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
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';

        };
        reader.readAsDataURL(file); // Convert file to base64 string
    }
});


// IF YOU PRESS A POPUP OF A POST
/*
e.features[0] is the feature (point) that was clicked on in the map.
e is the event object containing information about the click.
e.features is an array of features (usually 1 feature for a single click).
e.features[0] gives you access to the first feature (the clicked point).

e looks like {
                 "lngLat": {
                     "lng": 103.8198,  // Longitude of the click position
                     "lat": 1.3521     // Latitude of the click position
                 },
                 "point": {
                     "x": 150,   // X coordinate of the click relative to the canvas (screen position)
                     "y": 200    // Y coordinate of the click relative to the canvas (screen position)
                 },
                 "features": [
                     {
                         "type": "Feature",      // GeoJSON type
                         "geometry": {
                             "type": "Point",     // Type of geometry (Point in this case)
                             "coordinates": [103.8198, 1.3521]  // Coordinates of the clicked point (Longitude, Latitude)
                         },
                         "properties": {
                             "description": "Sample Description",  // Custom property you added to the feature
                             "image": "data:image/png;base64,...", // Base64-encoded image data if uploaded
                             "country": "Singapore"                // The country of the point (e.g., "Singapore")
                         },
                         "id": 0  // Unique identifier for the feature (based on your GeoJSON)
                     }
                 ],
                 "type": "click",  // Type of event (click in this case)
                 "target": map,    // The map object itself
                 "originalEvent": { ... } // Raw browser event data
             }

*/


map.on('click', 'points-layer', function(e) {
    if (text.style.display !== 'block') {
    const coordinates = e.lngLat;
    const feature = e.features[0];
    console.log('Feature ID:', feature.id);
    console.log('Feature:', feature);

    const featureIndex = geojson.features.findIndex(f => f.id === feature.id);
    const location = feature.properties.location;
    const description = feature.properties.description || "No description";
    const image = feature.properties.image
        ? `<img src="${feature.properties.image}" style="width: 200px; display: block; " />`
        : "No image uploaded";

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
            console.log(featureIndex);
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
            proximity: [-73.99209, 40.68933] // Optional: Add your proximity coordinates
        });
        map.addControl(geocoder, 'top-right');

        // Fullscreen and Navigation Controls
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        const zoomButton = document.querySelector('.mapboxgl-ctrl-fullscreen');
        const menu = document.querySelector('.menu');
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

    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };

    if (modeButton.checked) {
        // Dark mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        map.setStyle('mapbox://styles/mynavu/cm4b3wrge01bm01si09uyal4o');
        map.on('style.load', () => {
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        spinStyle.style.backgroundColor = "#001f61";
        spinStyle.style.setProperty('--before-background-color', 'white');
        spinStyle.style.setProperty('--before-box-shadow', '0 0 10px white');
        });
    } else {
        // Light mode
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

modeButton.addEventListener('change', () => {
    if (modeButton.checked) {
        // Dark mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        map.setStyle('mapbox://styles/mynavu/cm4b3wrge01bm01si09uyal4o');
        map.on('style.load', () => {
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        spinStyle.style.backgroundColor = "#001f61";
        spinStyle.style.setProperty('--before-background-color', 'white');
        spinStyle.style.setProperty('--before-box-shadow', '0 0 10px white');
        });
    } else {
        // Light mode
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



/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */


} else if (window.location.pathname.includes("stamps.html")) {
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


    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };

    if (modeButton.checked) {
        // Dark mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
    } else {
        // Light mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Light";
        pfp.src = "earth_pfp.png";
        backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
    }

    modeButton.addEventListener('change', () => {
        if (modeButton.checked) {
            // Dark mode
            localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
            mode.innerText = "Mode: Dark";
            pfp.src = "earth_pfp2.png";
            backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
        } else {
            // Light mode
            localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
            mode.innerText = "Mode: Light";
            pfp.src = "earth_pfp.png";
            backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
        }
    });

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
const stampsReminder = document.querySelector('.stampsReminder');
const countriesReminder = document.querySelector('.countriesReminder');
const totalStamps = [{city: "Amsterdam", country: "Netherlands"}, {city: "Barcelona", country: "Spain"},
{city: "Beijing", country: "China"}, {city: "Bordeaux",country: "Paris"}, {city: "Cairo", country: "Egypt"},
{city: "Cape Town", country: "South Africa"}, {city: "Cappadocia",country: "Turkey"},
{city: "Cartagena", country: "Colombia"}, {city: "Chefchaouen", country: "Morocco"},
{city: "Christchurch", country: "New Zealand"}, {city: "Evora", country: "Portugal"},
{city: "Hamburg", country: "Germany"}, {city: "Havana", country: "Cuba"},
{city: "Hawaii", country: "United States"}, {city: "Hong Kong", country: "China"},
{city: "Istanbul", country: "Turkey"}, {city: "Jerusalem", country: "Israel"},
{city: "London", country: "England"}, {city: "Los Angeles", country: "United States"},
{city: "Moscow", country: "Russia"}, {city: "Naples", country: "Italy"},
{city: "New York", country: "United States"}, {city: "Nuuk", country: "Greenland"},
{city: "Oaxaca", country: "Mexico"}, {city: "Paris", country: "France"}, {city: "Port Louis", country: "Mauritius"},
{city: "Rome", country: "Italy"}, {city: "Santorini", country: "Greece"}, {city: "Seoul", country: "South Korea"},
{city: "Singapore", country: "Singapore"}, {city: "Sydney", country: "Australia"}, {city: "Tokyo", country: "Japan"},
{city: "Vancouver", country: "Canada"}, {city: "Washington", country: "United States"}];
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
              console.log("NO STAMPS STORED")

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

/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------------------------- */

else if (window.location.pathname.includes("home.html")) {

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
const totalStamps = [{city: "Amsterdam", country: "Netherlands"}, {city: "Barcelona", country: "Spain"},
{city: "Beijing", country: "China"}, {city: "Bordeaux",country: "Paris"}, {city: "Cairo", country: "Egypt"},
{city: "Cape Town", country: "South Africa"}, {city: "Cappadocia",country: "Turkey"},
{city: "Cartagena", country: "Colombia"}, {city: "Chefchaouen", country: "Morocco"},
{city: "Christchurch", country: "New Zealand"}, {city: "Evora", country: "Portugal"},
{city: "Hamburg", country: "Germany"}, {city: "Havana", country: "Cuba"},
{city: "Hawaii", country: "United States"}, {city: "Hong Kong", country: "China"},
{city: "Istanbul", country: "Turkey"}, {city: "Jerusalem", country: "Israel"},
{city: "London", country: "England"}, {city: "Los Angeles", country: "United States"},
{city: "Moscow", country: "Russia"}, {city: "Naples", country: "Italy"},
{city: "New York", country: "United States"}, {city: "Nuuk", country: "Greenland"},
{city: "Oaxaca", country: "Mexico"}, {city: "Paris", country: "France"}, {city: "Port Louis", country: "Mauritius"},
{city: "Rome", country: "Italy"}, {city: "Santorini", country: "Greece"}, {city: "Seoul", country: "South Korea"},
{city: "Singapore", country: "Singapore"}, {city: "Sydney", country: "Australia"}, {city: "Tokyo", country: "Japan"},
{city: "Vancouver", country: "Canada"}, {city: "Washington", country: "United States"}];
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
              console.log("None");
              mostPostedCountryStatement.innerHTML = "";
              mostPostedCountryData.innerHTML = "Start posting to get a recap of your journey!"};
          }

          if (storedStamps) {
              console.log("YES STAMP STORED")
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

          if (storedGeojson) {
            let geojson = JSON.parse(storedGeojson);
            postsNumber.innerText = geojson.features.length;
            console.log(geojson);
            if (geojson.features.length > 0) {
                postReminder.style.display = "none";
                geojson.features.forEach((feature) => {
                    const HTMLString = `
                    <div class="post">
                        <div class="profileDisplay">
                                <img class="pfp2" src="earth_pfp.png">
                                <h4 class="username2">Guest</h4>
                                <h5 class="locationDisplay average">${feature.properties.location}</h5>
                            </div>
                            <img class="imgDisplay" src="${feature.properties.image}">
                            <h5 class="descriptionDisplay average">${feature.properties.description}
                            </h5>
                        </div>
                    `;
                    mainbar2.insertAdjacentHTML("beforeend", HTMLString);

                })
            } else {
                postReminder.style.display = "block";
            }
          }
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

    if (savedState !== null) {
      modeButton.checked = JSON.parse(savedState);
    };

    if (modeButton.checked) {
        // Dark mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Dark";
        pfp.src = "earth_pfp2.png";
        backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
    } else {
        // Light mode
        localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
        mode.innerText = "Mode: Light";
        pfp.src = "earth_pfp.png";
        backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
    }

    modeButton.addEventListener('change', () => {
        if (modeButton.checked) {
            // Dark mode
            localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
            mode.innerText = "Mode: Dark";
            pfp.src = "earth_pfp2.png";
            backgroundColor.style.background = "linear-gradient(black 20%, #07122e 50%)";
        } else {
            // Light mode
            localStorage.setItem('checkboxState', JSON.stringify(modeButton.checked));
            mode.innerText = "Mode: Light";
            pfp.src = "earth_pfp.png";
            backgroundColor.style.background = "linear-gradient(white 20%, var(--blue) 50%)";
        }
    });




}

// https://www.lonelyplanet.com/north-korea