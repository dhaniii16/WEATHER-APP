let map;

function loadMap(lat, lon) {
  if (map) map.remove(); // refresh map
  map = L.map('map').setView([lat, lon], 10);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([lat, lon]).addTo(map).bindPopup("You're here!").openPopup();
}
