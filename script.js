document.addEventListener("DOMContentLoaded", () => {
    let presidents = [];
    let currentPresident;
    let attempts = 5;
    let selectedIndex = -1; 

    const flagImage = document.getElementById("flagImage"); // Keep ID from your HTML
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const messageDisplay = document.getElementById("messageDisplay");
    const suggestions = document.getElementById("suggestions");

    // 1. Fetch Presidents instead of Countries
    async function fetchPresidents() {
        try {
            const response = await fetch("https://api.sampleapis.com/presidents/presidents");
            const data = await response.json();
            
            // Map the API data to a simple format
            presidents = data.map(p => ({
                name: p.name,
                photo: p.photo
            }));
            
            resetGame();
        } catch (error) {
            console.error("Error fetching presidents:", error);
            messageDisplay.textContent = "Failed to load president data.";
        }
    }

    function pickRandomPresident() {
        const randomIndex = Math.floor(Math.random() * presidents.length);
        currentPresident = presidents[randomIndex];
        flagImage.src = currentPresident.photo;
        // Optional: Add an alt tag for accessibility
        flagImage.alt = "US President Portrait";
    }

    function resetGame() {
        if (presidents.length === 0) return;
        
        attempts = 5;
        guessInput.value = '';
        messageDisplay.textContent = "";
        messageDisplay.style.color = "#333";
        pickRandomPresident();
    }

    // 2. Updated Check Guess Logic with 5 attempts
    function checkGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            messageDisplay.textContent = "Please enter a name!";
            return;
        }

        if (userGuess.toLowerCase() === currentPresident.name.toLowerCase()) {
            messageDisplay.style.color = "green";
            messageDisplay.textContent = `Correct! It is ${currentPresident.name}.`;
            
            // Refresh/Reset after 2 seconds
            setTimeout(() => {
                resetGame(); 
            }, 2000);
        } else {
            attempts -= 1;
            if (attempts > 0) {
                messageDisplay.style.color = "red";
                messageDisplay.textContent = `Wrong! You have ${attempts} attempts left.`;
                guessInput.value = ''; // Clear input for next try
            } else {
                messageDisplay.style.color = "red";
                messageDisplay.textContent = `Game over! The correct answer was ${currentPresident.name}.`;
                
                // Refresh/Reset after 3 seconds so they can see the answer
                setTimeout(() => {
                    resetGame();
                }, 3000);
            }
        }
    }

    // 3. Updated Filter Logic
    function filterPresidents(query) {
        return presidents
            .map(p => p.name)
            .filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }

    function showSuggestions(matches) {
        suggestions.innerHTML = '';
        selectedIndex = -1;

        if (matches.length === 0 || !guessInput.value.trim()) {
            suggestions.style.display = 'none';
            return;
        }

        // Limit suggestions to top 5 so the list isn't too long
        matches.slice(0, 5).forEach(match => {
            const li = document.createElement('li');
            li.textContent = match;
            li.addEventListener('click', () => {
                guessInput.value = match;
                suggestions.style.display = 'none';
                checkGuess(); // Automatically check when they click a suggestion
            });
            suggestions.appendChild(li);
        });

        suggestions.style.display = 'block';
    }

    // --- Input Listeners (Kept same as your flag quiz) ---

    guessInput.addEventListener("input", () => {
        const query = guessInput.value;
        const matches = filterPresidents(query);
        showSuggestions(matches);
    });

    guessInput.addEventListener("keydown", (event) => {
        const visibleSuggestions = suggestions.querySelectorAll('li');

        if (event.key === "Enter") {
            if (selectedIndex >= 0) {
                guessInput.value = visibleSuggestions[selectedIndex].textContent;
                suggestions.style.display = 'none';
            }
            checkGuess();
        } else if (event.key === "ArrowDown") {
            event.preventDefault(); // Stop page scrolling
            selectedIndex = (selectedIndex + 1) % visibleSuggestions.length;
            updateHighlightedSuggestion(visibleSuggestions);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedIndex = (selectedIndex - 1 + visibleSuggestions.length) % visibleSuggestions.length;
            updateHighlightedSuggestion(visibleSuggestions);
        }
    });

    function updateHighlightedSuggestion(suggestionsList) {
        suggestionsList.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.style.backgroundColor = '#f0f0f0';
                suggestion.scrollIntoView({ block: 'nearest' });
            } else {
                suggestion.style.backgroundColor = '#fff';
            }
        });
    }

    submitGuess.addEventListener("click", checkGuess);

    document.addEventListener('click', (e) => {
        if (!guessInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });

    fetchPresidents();
});