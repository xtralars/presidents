function getOrdinal(n) {
    let s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
document.addEventListener("DOMContentLoaded", () => {
    let allPresidents = [];
    let currentPresident = null;
    let attempts = 5;
    let selectedIndex = -1; // Tracks which suggestion is highlighted

    // DOM Elements
    const flagImage = document.getElementById("flagImage");
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const messageDisplay = document.getElementById("messageDisplay");
    const suggestions = document.getElementById("suggestions");
    
    const inputSection = document.getElementById("inputSection");
    const bonusSection = document.getElementById("bonusSection");
    const bonusQuestionText = document.getElementById("bonusQuestionText");
    const optionsContainer = document.getElementById("optionsContainer");

    async function init() {
        try {
            const response = await fetch("https://api.sampleapis.com/presidents/presidents");
            allPresidents = await response.json();
            startNewRound();
        } catch (error) {
            messageDisplay.textContent = "Error loading data.";
        }
    }

    function startNewRound() {
    attempts = 5;
    selectedIndex = -1;
    currentPresident = allPresidents[Math.floor(Math.random() * allPresidents.length)];
    
    // 1. Get the number hint element
    const hintDisplay = document.getElementById("presidentNumberHint");
    
    // 2. Set the text (e.g., "The 1st President")
    hintDisplay.textContent = `The ${getOrdinal(currentPresident.id)} President`;

    // Reset UI to Stage 1
    flagImage.src = currentPresident.photo;
    guessInput.value = "";
    messageDisplay.textContent = "";
    messageDisplay.style.color = "#333";
    
    inputSection.style.display = "flex";
    bonusSection.style.display = "none";
    suggestions.style.display = "none";
}

    // --- STAGE 1: Check Name ---
    function checkName() {
        const guess = guessInput.value.trim().toLowerCase();
        if (!guess) return;

        if (guess === currentPresident.name.toLowerCase()) {
            messageDisplay.style.color = "green";
            messageDisplay.textContent = "Correct! Bonus: When did they serve?";
            suggestions.style.display = "none";
            setTimeout(showYearsBonus, 1500);
        } else {
            attempts--;
            if (attempts > 0) {
                messageDisplay.style.color = "red";
                messageDisplay.textContent = `Wrong! ${attempts} attempts left.`;
                guessInput.value = "";
            } else {
                gameOver(`Wrong! It was ${currentPresident.name}.`);
            }
        }
    }

    // --- Suggestion Keyboard Logic ---
    guessInput.addEventListener("keydown", (e) => {
        const items = suggestions.querySelectorAll("li");
        
        if (suggestions.style.display === "block" && items.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault(); // Stop cursor from moving
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSuggestionHighlight(items);
            } 
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSuggestionHighlight(items);
            } 
            else if (e.key === "Enter") {
                if (selectedIndex >= 0) {
                    e.preventDefault();
                    // Fill input with highlighted suggestion
                    guessInput.value = items[selectedIndex].textContent;
                    suggestions.style.display = "none";
                    checkName(); // Submit immediately
                }
            }
        } else if (e.key === "Enter") {
            checkName(); // Regular submit if no suggestions open
        }
    });

    function updateSuggestionHighlight(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add("selected-suggestion");
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove("selected-suggestion");
            }
        });
    }

    // --- Suggestion Filtering ---
    guessInput.addEventListener("input", () => {
        const val = guessInput.value.toLowerCase();
        suggestions.innerHTML = "";
        selectedIndex = -1; // Reset highlight on new typing

        if (!val) { 
            suggestions.style.display = "none"; 
            return; 
        }
        
        const matches = allPresidents
            .filter(p => p.name.toLowerCase().includes(val))
            .slice(0, 6); // Show top 6 matches

        if (matches.length > 0) {
            matches.forEach((m, idx) => {
                const li = document.createElement("li");
                li.textContent = m.name;
                li.addEventListener("click", () => {
                    guessInput.value = m.name;
                    suggestions.style.display = "none";
                    checkName();
                });
                suggestions.appendChild(li);
            });
            suggestions.style.display = "block";
        } else {
            suggestions.style.display = "none";
        }
    });

    // --- STAGE 2 & 3 Logic (Keep existing) ---
    function showYearsBonus() {
        inputSection.style.display = "none";
        bonusSection.style.display = "block";
        messageDisplay.textContent = "";
        bonusQuestionText.textContent = `Which years did ${currentPresident.name} serve?`;
        const correct = currentPresident.yearsInOffice;
        const options = generateChoices(correct, "yearsInOffice");
        renderButtons(options, (choice) => {
            if (choice === correct) {
                messageDisplay.style.color = "green";
                messageDisplay.textContent = "Correct! Final Bonus: Who was the VP?";
                setTimeout(showVPBonus, 1500);
            } else {
                gameOver(`Wrong! They served ${correct}.`);
            }
        });
    }

    function showVPBonus() {
        messageDisplay.textContent = "";
        bonusQuestionText.textContent = `Who was the Vice President for the ${getOrdinal(currentPresident.id)} President, ${currentPresident.name}?`;
        const correct = currentPresident.vicePresidents.join(", ");
        const options = generateChoices(correct, "vicePresidents");
        renderButtons(options, (choice) => {
            if (choice === correct) {
                messageDisplay.style.color = "green";
                messageDisplay.textContent = "Amazing! You got them all correct!";
                setTimeout(() => location.reload(), 3000);
            } else {
                gameOver(`Wrong! The VP was ${correct}.`);
            }
        });
    }

    function generateChoices(correctValue, key) {
        let choices = [correctValue];
        while (choices.length < 4) {
            let rand = allPresidents[Math.floor(Math.random() * allPresidents.length)];
            let val = Array.isArray(rand[key]) ? rand[key].join(", ") : rand[key];
            if (val && !choices.includes(val)) choices.push(val);
        }
        return choices.sort(() => Math.random() - 0.5);
    }

    function renderButtons(options, callback) {
        optionsContainer.innerHTML = "";
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.className = "bonus-btn";
            btn.onclick = () => callback(opt);
            optionsContainer.appendChild(btn);
        });
    }

    function gameOver(msg) {
        messageDisplay.style.color = "red";
        messageDisplay.textContent = msg;
        setTimeout(() => location.reload(), 3000);
    }

    submitGuess.onclick = checkName;
    init();
});
