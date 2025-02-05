
const judgeName = sessionStorage.getItem("judgeName");
let judgedData = []; // Store JSON data for updating later
let timer;
let timeLeft = 600; // Default to 10 minutes (600 seconds)
let isPaused = true; // Track if timer is paused
const alarmSound = document.getElementById("alarm-sound");



// **Logout Functionality**
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logout-btn");
    const judgeNameDisplay = document.getElementById("judge-name");
    judgeNameDisplay.textContent = judgeName; // Display judge name

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            sessionStorage.clear(); // Clear login session
            setTimeout(() => {
                window.location.href = "YTAClogin.html"; // Redirect after clearing
            }, 100); // Delay for session storage clearance
        });
    }
    if (!judgeName) {
        window.location.href = "YTAClogin.html";
        return;
    }
});


// Function to update score dynamically when slider moves
function updateScore(criteria) {
    let slider = document.getElementById(criteria);
    let scoreDisplay = document.getElementById(`${criteria}-score`);

    if (slider && scoreDisplay) {
        scoreDisplay.textContent = slider.value; // Update the span text with slider value
    }
}





// Function to update timer display
function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById("timer-display").textContent = 
        `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Function to start or pause the timer
function toggleTimer() {
    const startButton = document.getElementById("start-timer-btn");

    if (isPaused) {
        // Start or resume countdown
        isPaused = false;
        startButton.textContent = "Pause"; // Change button text
        startButton.style.backgroundColor = "#ff4d4d"; // Change button color

        timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                startButton.textContent = "Start"; // Reset button text when time runs out
                isPaused = true;
                // **Play the alarm when time is up**
                alarmSound.play();
                startButton.textContent = "Start"; // Change button text back to "Start"
                startButton.style.backgroundColor = "#4facfe";
                return;
            }
            timeLeft--;
            updateTimerDisplay();
        }, 1000);
    } else {
        // Pause countdown
        isPaused = true;
        clearInterval(timer);
        startButton.textContent = "Start"; // Change button text back to "Start"
        startButton.style.backgroundColor = "#4facfe";
    }
}

// Function to reset the timer
function resetTimer() {
    clearInterval(timer);
    timeLeft = 600; // Reset to 10 minutes
    updateTimerDisplay();
    document.getElementById("start-timer-btn").textContent = "Start";
    document.getElementById("start-timer-btn").style.backgroundColor = "#4facfe";
}

// Function to adjust time manually (increase/decrease)
function adjustTimer(change) {
    timeLeft = Math.max(60, timeLeft + change * 60); // Prevent going below 1 min
    updateTimerDisplay();
}

// Attach event listeners to buttons
document.getElementById("start-timer-btn").addEventListener("click", toggleTimer);
document.getElementById("reset-timer-btn").addEventListener("click", resetTimer);
document.getElementById("increase-timer-btn").addEventListener("click", () => adjustTimer(1));
document.getElementById("decrease-timer-btn").addEventListener("click", () => adjustTimer(-1));

// Initialize display
updateTimerDisplay();





// Your web app's Firebase configuration
if (!firebase.apps.length) {
    const firebaseConfig = {
        apiKey: "AIzaSyAfZqEg-q_fvM-TToBTDEKIF8LP0MDzeaA",
        authDomain: "ytacjudging.firebaseapp.com",
        databaseURL: "https://ytacjudging-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ytacjudging",
        storageBucket: "ytacjudging.firebasestorage.app",
        messagingSenderId: "653853475745",
        appId: "1:653853475745:web:965ae40af18a40642081e0"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
}


const database = firebase.database();
const auth = firebase.auth();

// Anonymous Login (Since you have your own login page)
auth.signInAnonymously()
    .then(() => console.log("✅ Anonymous Judge Logged In"))
    .catch(error => console.error("❌ Anonymous login failed:", error));




// ✅ Function to Load Judging Teams from Firebase
async function loadTeams() {
    let judgeName = sessionStorage.getItem("judgeName");
    if (!judgeName) {
        alert("Error: Judge name not found in session.");
        return;
    }

    try {
        const snapshot = await database.ref("Judged_Data").once("value");
        if (snapshot.exists()) {
            const judgedData = snapshot.val();

            // Filter teams assigned to this judge
            const assignedTeams = Object.keys(judgedData).filter(teamKey =>
                judgedData[teamKey].Judgename === judgeName
            );

            if (assignedTeams.length === 0) {
                alert("No teams assigned for this judge.");
                return;
            }

            populateDropdown(judgedData, assignedTeams);
        } else {
            console.error("No team data found.");
        }
    } catch (error) {
        console.error("Error loading Firebase data:", error);
    }
}

// ✅ Populate Dropdown with Judge's Assigned Teams
function populateDropdown(data, assignedTeams) {
    const teamDropdown = document.getElementById("group");
    teamDropdown.innerHTML = '<option value="">Please select a team</option>';

    assignedTeams.forEach(teamKey => {
        let option = document.createElement("option");
        option.value = teamKey;
        option.textContent = data[teamKey].Team;
        teamDropdown.appendChild(option);
    });

    teamDropdown.addEventListener("change", () => displayTeamDetails(data, teamDropdown.value));
}

// ✅ Display Team Details for Judging
async function displayTeamDetails(data, teamKey) {
    if (!teamKey) return;

    try {
        // Fetch the latest team data from Firebase
        const snapshot = await database.ref(`Judged_Data/${teamKey}`).once("value");

        if (snapshot.exists()) {
            const team = snapshot.val(); // Get the latest data

            requestAnimationFrame(() => {
                document.getElementById("members").innerHTML = `
                    <li>${team.Member1 || ""}</li>
                    ${team.Member2 ? `<li>${team.Member2}</li>` : ""}
                    ${team.Member3 ? `<li>${team.Member3}</li>` : ""}
                `;

                document.getElementById("project-name").textContent = team["Project name"] || "No project name";

                 // ✅ Correctly map Firebase keys to slider IDs
                 const criteriaMap = {
                    "Originality & Creativity": "OC",
                    "Usefulness & Practicality": "UP",
                    "Functionality & User-friendliness": "FU",
                    "Cost - effective": "CE",
                    "Impact": "IM",
                    "Presentation": "PR"
                };

                Object.entries(criteriaMap).forEach(([firebaseKey, elementID]) => {
                    let slider = document.getElementById(elementID);  // Get the slider
                    let scoreDisplay = document.getElementById(`${elementID}-score`);  // Get the score display

                    if (slider) {
                        let value = team[firebaseKey] !== undefined ? team[firebaseKey] : 0;
                        slider.value = value;  // ✅ Set the slider value
                        if (scoreDisplay) {
                            scoreDisplay.textContent = value;  // ✅ Update the displayed score
                        }
                    } else {
                        console.warn(`⚠ Slider not found: ${elementID}`);
                    }
                });

                document.getElementById("general-comment").value = team["Comment"] || "";
                document.getElementById("award-selection").value = team["Title"] || "";

                document.getElementById("group-details").style.display = "block";
            });
        } else {
            console.error("Team data not found in Firebase.");
        }
    } catch (error) {
        console.error("Error retrieving team details:", error);
    }
}


// ✅ Update Scores in Firebase (Each Judge's Scores Are Stored Separately)
async function submitScores() {
    const selectedTeam = document.getElementById("group").value;
    const judgeName = sessionStorage.getItem("judgeName");

    if (!selectedTeam || !judgeName) {
        alert("Please select a team.");
        return;
    }

    // Get updated scores
    const updatedScores = {
        "Originality & Creativity": parseInt(document.getElementById("OC").value),
        "Usefulness & Practicality": parseInt(document.getElementById("UP").value),
        "Functionality & User-friendliness": parseInt(document.getElementById("FU").value),
        "Cost - effective": parseInt(document.getElementById("CE").value),
        "Impact": parseInt(document.getElementById("IM").value),
        "Presentation": parseInt(document.getElementById("PR").value),
        "Comment": document.getElementById("general-comment").value,
        "Title": document.getElementById("award-selection").value
    };

    try {
        // ✅ Directly update team scores (NO nested Judges object)
        await database.ref(`Judged_Data/${selectedTeam}`).update(updatedScores);
        // ✅ Show success modal
        document.getElementById("success-message").textContent = "✅ Scores submitted successfully!";
        document.getElementById("success-modal").style.display = "flex"; // Make modal visible
    } catch (error) {
        console.error("Error updating scores:", error);
    }
}

function closeModal() {
    document.getElementById("success-modal").style.display = "none";
}


// ✅ Attach event listener to submit button
document.getElementById("submit-scores").addEventListener("click", submitScores);

// ✅ Load teams when the page loads
document.addEventListener("DOMContentLoaded", loadTeams);
