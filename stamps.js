import { totalStamps } from './totalStamps.js';
import { matchList } from './matchList.js';

const settingsButton = document.querySelector('.menuFriend');
      const customization = document.querySelector('.customization');
      const allStamps = document.querySelector('.allStamps');
      const allCountries = document.querySelector('.allCountries');

      settingsButton.addEventListener("click", () => {
          customization.style.display = (customization.style.display === "none" || customization.style.display === "") ? "flex" : "none";
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

    modeButton.checked ? darkMode() : lightMode();

    modeButton.addEventListener('change', () => {
        modeButton.checked ? darkMode() : lightMode();
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