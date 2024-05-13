/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
  lat: 47.267222,
  lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
  fullscreenControl: true,
  maxZoom: 12
}).setView([ibk.lat, ibk.lng], 11);


// thematische Layer 
let themaLayer = {
  stations: L.featureGroup(),//.addTo(map),
  temperature: L.featureGroup(),//.addTo(map),
  wind: L.featureGroup(),//.addTo(map),
  snowHeight: L.featureGroup().addTo(map)
}

// Hintergrundlayer
L.control.layers({
  "Relief avalanche.report": L.tileLayer(
    "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
  }).addTo(map),
  "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
  "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
  "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
  "Wetterstationen": themaLayer.stations,
  "Temperatur": themaLayer.temperature,
  "Wind": themaLayer.wind,
  "Snow Height": themaLayer.snowHeight,

}).addTo(map);

// Maßstab
L.control.scale({
  imperial: false,
}).addTo(map);

// Change default options from RainView2er GitHub
L.control.rainviewer({
  position: 'bottomleft',
  nextButtonText: '>',
  playStopButtonText: 'Play/Stop',
  prevButtonText: '<',
  positionSliderLabelText: "Hour:",
  opacitySliderLabelText: "Opacity:",
  animationInterval: 500,
  opacity: 0.5
}).addTo(map);


function getColor(value, ramp) {
  //console.log("getColor: value: ", value, "ramp: ", ramp);
  for (let rule of ramp) {
    //console.log("Rule: ",rule);
    if (value >= rule.min && value < rule.max) {
      return rule.color;
    }
  }
}

function showTemperature(geojson) {
  L.geoJSON(geojson, {
    filter: function (feature) {
      if (feature.properties.LT > -50 && feature.properties.LT < 50) {
        return true;
      }

    },
    pointToLayer: function (feature, latlng) {
      let color = getColor(feature.properties.LT, COLORS.temperature);
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "aws-div-icon",
          html: `<span style="background-color:${color};">${feature.properties.LT.toFixed(1)} °C </span>`
        })
      })
    }
  }).addTo(themaLayer.temperature);
}

function showWind(geojson) {
  L.geoJSON(geojson, {
    filter: function (feature) {
      // wind range 0 to 250 kmh
      if (feature.properties.WG > 0 && feature.properties.WG < 250) {
        return true;
      }

    },
    pointToLayer: function (feature, latlng) {
      let color = getColor(feature.properties.WG, COLORS.wind);
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "aws-div-icon-wind",
          html: `
          <span title="${feature.properties.WG.toFixed(1)} km/h">
          <i style="transform:rotate(${feature.properties.WR}deg); color:${color}" class="fa-solid fa-circle-arrow-down"></i>
          </span>
          `
        })
      })
    }
  }).addTo(themaLayer.wind);
}

function showSnowHeight(geojson) {
  L.geoJSON(geojson, {
    filter: function (feature) {
      // snowhwight range 0 to 400 cm
      if (feature.properties.HS > 0 && feature.properties.HS < 1000) {
        return true;
      }

    },
    pointToLayer: function (feature, latlng) {
      let color = getColor(feature.properties.HS, COLORS.snowHeight);
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "aws-div-icon",
          html: `<span style="background-color:${color};">${feature.properties.HS.toFixed(1)} cm </span>`
        })
      })
    }
  }).addTo(themaLayer.snowHeight);
}

// GeoJSON der Wetterstationen laden
async function showStations(url) {
  let response = await fetch(url);
  let geojson = await response.json();

  L.geoJson(geojson, {
    pointToLayer: function (feature, latlng) {
      //console.log("new entry")
      //console.log(feature.properties)
      return L.marker(latlng, {
        icon: L.icon({
          iconUrl: `icons/wifi.png`,
          iconAnchor: [16, 37],
          popupAnchor: [0, -37],
        }),
      })

    },
    onEachFeature: function (feature, layer) {
      let pointInTime = new Date(feature.properties.date);
      layer.bindPopup(`
            <h4>${feature.properties.name}</h4>
            <ul>
                <li><i class="fa-solid fa-temperature-three-quarters"></i> Lufttemperatur (°C): ${feature.properties.LT || "-"}</li>
                <li><i class="fa-solid fa-droplet"></i> Relative Luftfeuchte (%): ${feature.properties.RH || "-"}</li>
                <li><i class="fa-solid fa-wind"></i> Windgeschwindigkeit (km/h): ${feature.properties.WG || "-"}</li>
                <li><i class="fa-regular fa-snowflake"></i> Schneehöhe (cm): ${feature.properties.HS ? feature.properties.HS.toFixed(0) : "-"}</li>
            </ul>
            <span><i class="fa-regular fa-calendar"></i> ${pointInTime.toLocaleString()}</span>
                
          `)
    }
  }).addTo(themaLayer.stations);
  showTemperature(geojson);
  showWind(geojson);
  showSnowHeight(geojson);

}



showStations("https://static.avalanche.report/weather_stations/stations.geojson");
