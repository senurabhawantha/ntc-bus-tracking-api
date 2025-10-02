// app.js - fetch and update bus locations every 5 seconds
async function fetchBusLocations() {
  try {
    const response = await fetch('/buses'); // fetch all buses from API
    const buses = await response.json();

    const busContainer = document.getElementById('bus-list');
    busContainer.innerHTML = ''; // clear old data

    buses.forEach(bus => {
      const busDiv = document.createElement('div');
      busDiv.innerHTML = `
        Bus ID: ${bus.bus_id} - Status: ${bus.status} <br>
        Location: Latitude: ${bus.current_location.latitude.toFixed(5)}, 
                  Longitude: ${bus.current_location.longitude.toFixed(5)}
        <hr>
      `;
      busContainer.appendChild(busDiv);
    });

  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// Fetch immediately and then every 2 seconds
fetchBusLocations();
setInterval(fetchBusLocations, 2000);
