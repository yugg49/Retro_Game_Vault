const container = document.getElementById("games");
const loader = document.getElementById("loader");

const API_KEY = "YOUR_API_KEY"; // 🔑 replace this

// Fetch games
async function fetchGames(url) {
  loader.style.display = "block";
  container.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();

    loader.style.display = "none";

    data.results.forEach(game => {
      const div = document.createElement("div");
      div.classList.add("card");

      div.innerHTML = `
        <img src="${game.background_image || 'https://via.placeholder.com/300'}">
        <div class="card-content">
          <h3>${game.name}</h3>
          <p class="rating">⭐ ${game.rating}</p>
          <p>📅 ${game.released || "N/A"}</p>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    loader.innerText = "❌ Failed to load data";
    console.error(error);
  }
}

// Initial load
fetchGames(`https://api.rawg.io/api/games?key=${API_KEY}`);

// Search
function handleSearch() {
  const query = document.getElementById("searchInput").value;

  if (query.trim() === "") {
    fetchGames(`https://api.rawg.io/api/games?key=${API_KEY}`);
  } else {
    fetchGames(`https://api.rawg.io/api/games?search=${query}&key=${API_KEY}`);
  }
}