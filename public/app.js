async function fetchBusLocations() {
  try {
    const response = await fetch('/buses');
    const buses = await response.json();

    const busList = document.getElementById('bus-list');
    busList.innerHTML = '';

    buses.forEach(bus => {
      const row = document.createElement('tr');

      // Status with color
      const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';

      row.innerHTML = `
        <td>${bus.bus_id}</td>
        <td>${bus.route_id}</td>
        <td class="${statusClass}">${bus.status}</td>
        <td>${bus.current_location.latitude.toFixed(5)}</td>
        <td>${bus.current_location.longitude.toFixed(5)}</td>
        <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
      `;

      busList.appendChild(row);
    });
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// Initial fetch
fetchBusLocations();

// Update every 5 seconds
setInterval(fetchBusLocations, 5000);
