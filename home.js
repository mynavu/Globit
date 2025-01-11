import { totalStamps } from './totalStamps.js';
import { matchList } from './matchList.js';

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
          customization.style.display = (customization.style.display === "none" || customization.style.display === "") ? "flex" : "none";
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

    modeButton.checked ? darkMode() : lightMode();

    modeButton.addEventListener('change', () => {
        modeButton.checked ? darkMode() : lightMode();
    });