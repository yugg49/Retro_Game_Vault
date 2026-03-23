# Retro_Game_Vault
Retro Game Vault — Project Explanation 🎮

What is this project?
Retro Game Vault is a web-based video game search engine that lets users discover, save and compare video games — both classic retro titles and modern releases. Think of it like a personal game library where you can search any game, bookmark your favourites and compare two games head to head.

What API does it use?
RAWG Video Games Database API — https://rawg.io/apidocs
RAWG is one of the largest video game databases in the world with over 500,000 games. It provides free access to game data including cover art, ratings, release dates, platforms, genres and developer information. No payment required — just a free API key.

What features will it have?
Search
Users can type any game name into a search bar and results appear instantly. It uses a technique called "debounce" which means it waits until the user stops typing before sending the request — this prevents unnecessary API calls on every single keypress.

Platform Filtering
Users can filter results by gaming platform — PC, PlayStation, Xbox, Nintendo Switch or Mobile. So if you only want to see PlayStation games, one click narrows it down.

Wishlist / Favourites
Any game can be saved to a personal wishlist by clicking a star icon. This wishlist is stored in the browser's memory (localStorage) so it stays saved even after closing and reopening the browser — no account or login needed.

Game Grid with Ratings
Games are displayed in a visual grid showing large cover art, star ratings, release year and platform icons — similar to how Netflix shows movies.
Compare Mode (Challenge Feature)
Users can select any two games and view them side by side in a comparison table. It shows stats like Metacritic score, release date, average playtime, genres and developer — with the "better" stat highlighted so you can instantly see which game wins each category.

