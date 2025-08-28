// script.js

// --- DOM Elements ---
const signupLoginBtn = document.getElementById('signupLoginBtn');
const transferToNairaBtn = document.getElementById('transferToNairaBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const selectPremierLeagueBtn = document.getElementById('selectPremierLeague');
const selectLaLigaBtn = document.getElementById('selectLaLiga');
const playMatchBtn = document.getElementById('playMatchBtn');

const usernameDisplay = document.getElementById('usernameDisplay');
const dollarBalanceDisplay = document.getElementById('dollarBalance');
const nairaBalanceDisplay = document.getElementById('nairaBalance');
const accountNumberDisplay = document.getElementById('accountNumber');
const selectedLeagueDisplay = document.getElementById('selectedLeagueDisplay');
const matchCountdownDisplay = document.getElementById('matchCountdown');
const currentMatchRoundDisplay = document.getElementById('currentMatchRound');
const upcomingMatchesForPredictionDiv = document.getElementById('upcomingMatchesForPrediction');
const predictionMessage = document.getElementById('predictionMessage');
const leagueTableBody = document.getElementById('leagueTableBody');
const matchResultsList = document.getElementById('matchResultsList');
const nairaRateDisplay = document.getElementById('nairaRate');

// Modals and their elements
const signupLoginModal = document.getElementById('signupLoginModal');
const transferModal = document.getElementById('transferModal');
const withdrawModal = document.getElementById('withdrawModal');
const closeButtons = document.querySelectorAll('.close-button');

const authForm = document.getElementById('authForm');
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

const transferAmountInput = document.getElementById('transferAmount');
const confirmTransferBtn = document.getElementById('confirmTransferBtn');

const withdrawAmountInput = document.getElementById('withdrawAmount');
const bankNameInput = document.getElementById('bankName');
const bankAccountNumInput = document.getElementById('bankAccountNum');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');

// --- Global State ---
let currentUser = null;
let users = JSON.parse(localStorage.getItem('footballUsers')) || {};

let selectedLeague = null;
let currentMatchRound = 0;
let leagueData = {}; // Stores clubs, fixtures, table for each league
let countdownInterval = null;
let predictionMade = null; // { matchId: 'teamA-teamB', predictedWinner: 'Team Name' }
const NAIRA_RATE = 1200; // Example rate

// --- Club Data (20 clubs per league) ---
const premierLeagueClubs = [
    { name: "Arsenal", short: "ARS" }, { name: "Aston Villa", short: "AVL" }, { name: "Bournemouth", short: "BOU" },
    { name: "Brentford", short: "BRE" }, { name: "Brighton", short: "BHA" }, { name: "Burnley", short: "BUR" },
    { name: "Chelsea", short: "CHE" }, { name: "Crystal Palace", short: "CRY" }, { name: "Everton", short: "EVE" },
    { name: "Fulham", short: "FUL" }, { name: "Liverpool", short: "LIV" }, { name: "Luton Town", short: "LUT" },
    { name: "Man City", short: "MCI" }, { name: "Man Utd", short: "MUN" }, { name: "Newcastle", short: "NEW" },
    { name: "Nott'm Forest", short: "NFO" }, { name: "Sheffield Utd", short: "SHU" }, { name: "Spurs", short: "TOT" },
    { name: "West Ham", short: "WHU" }, { name: "Wolves", short: "WOL" }
];

const laLigaClubs = [
    { name: "Alavés", short: "ALA" }, { name: "Athletic Club", short: "ATH" }, { name: "Atlético Madrid", short: "ATM" },
    { name: "Barcelona", short: "BAR" }, { name: "Betis", short: "BET" }, { name: "Cádiz", short: "CAD" },
    { name: "Celta Vigo", short: "CEL" }, { name: "Getafe", short: "GET" }, { name: "Girona", short: "GIR" },
    { name: "Granada", short: "GRA" }, { name: "Las Palmas", short: "LPA" }, { name: "Mallorca", short: "MAL" },
    { name: "Osasuna", short: "OSA" }, { name: "Rayo Vallecano", short: "RAY" }, { name: "Real Madrid", short: "RMA" },
    { name: "Real Sociedad", short: "RSO" }, { name: "Sevilla", short: "SEV" }, { name: "Valencia", short: "VAL" },
    { name: "Villarreal", short: "VIL" }, { name: "Almería", short: "ALM" }
];


// --- Helper Functions ---

function showModal(modal) {
    modal.style.display = 'block';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

function updateAccountDisplay() {
    if (currentUser) {
        usernameDisplay.textContent = currentUser.username;
        dollarBalanceDisplay.textContent = currentUser.dollarBalance.toFixed(2);
        nairaBalanceDisplay.textContent = currentUser.nairaBalance.toFixed(2);
        accountNumberDisplay.textContent = currentUser.accountNumber;
        transferToNairaBtn.disabled = false;
        withdrawBtn.disabled = false;
        signupLoginBtn.textContent = "Logout";
    } else {
        usernameDisplay.textContent = 'Guest';
        dollarBalanceDisplay.textContent = '0.00';
        nairaBalanceDisplay.textContent = '0.00';
        accountNumberDisplay.textContent = '*****';
        transferToNairaBtn.disabled = true;
        withdrawBtn.disabled = true;
        signupLoginBtn.textContent = "Sign Up / Login";
    }
}

function saveUsers() {
    localStorage.setItem('footballUsers', JSON.stringify(users));
}

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateFixtures(clubs) {
    let fixtures = [];
    const numClubs = clubs.length;
    const rounds = (numClubs - 1) * 2; // Home and away matches

    // Initialize all possible match pairs
    let allMatches = [];
    for (let i = 0; i < numClubs; i++) {
        for (let j = i + 1; j < numClubs; j++) {
            allMatches.push({ home: clubs[i], away: clubs[j] });
            allMatches.push({ home: clubs[j], away: clubs[i] }); // Reverse fixture
        }
    }
    // Simple shuffling for now, a proper round-robin algorithm is more complex
    allMatches.sort(() => Math.random() - 0.5);

    // Distribute into 38 rounds (approximately 10 matches per round for 20 teams)
    // This is a simplified distribution. A true round-robin scheduling is complex.
    const matchesPerRound = numClubs / 2; // Each team plays once per round
    for (let i = 0; i < rounds; i++) {
        fixtures[i] = [];
        let teamsInRound = new Set();
        let matchesForThisRound = [];

        // Try to pick matches for this round without team duplicates
        for (let k = 0; k < allMatches.length; k++) {
            const match = allMatches[k];
            if (!teamsInRound.has(match.home.name) && !teamsInRound.has(match.away.name)) {
                matchesForThisRound.push(match);
                teamsInRound.add(match.home.name);
                teamsInRound.add(match.away.name);
                allMatches.splice(k, 1); // Remove from available matches
                k--; // Adjust index due to splice
            }
            if (matchesForThisRound.length === matchesPerRound) break;
        }
        fixtures[i] = matchesForThisRound;
        if (matchesForThisRound.length < matchesPerRound) {
            console.warn(`Could not fill round ${i + 1} completely.`);
            // If we couldn't fill it, try to re-add remaining matches later or deal with it
        }
    }
    return fixtures.filter(round => round.length > 0); // Remove any empty rounds
}


function initializeLeague(leagueName, clubs) {
    if (!leagueData[leagueName]) {
        leagueData[leagueName] = {
            clubs: clubs,
            table: clubs.map(club => ({
                ...club,
                P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0
            })),
            fixtures: generateFixtures(clubs),
            matchResults: [],
            currentRound: 0
        };
    }
    currentMatchRound = leagueData[leagueName].currentRound;
    updateLeagueTable();
    updateMatchResults();
    updateMatchRoundDisplay();
    displayUpcomingMatchesForPrediction();
}

function updateLeagueTable() {
    if (!selectedLeague || !leagueData[selectedLeague]) {
        leagueTableBody.innerHTML = '<tr><td colspan="10">Select a league to see the table.</td></tr>';
        return;
    }

    const table = leagueData[selectedLeague].table
        .sort((a, b) => {
            if (a.Pts !== b.Pts) return b.Pts - a.Pts;
            if (a.GD !== b.GD) return b.GD - a.GD;
            return b.GF - a.GF;
        });

    leagueTableBody.innerHTML = '';
    table.forEach((club, index) => {
        const row = leagueTableBody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${club.name}</td>
            <td>${club.P}</td>
            <td>${club.W}</td>
            <td>${club.D}</td>
            <td>${club.L}</td>
            <td>${club.GF}</td>
            <td>${club.GA}</td>
            <td>${club.GD}</td>
            <td>${club.Pts}</td>
        `;
    });
}

function updateMatchResults() {
    if (!selectedLeague || !leagueData[selectedLeague]) {
        matchResultsList.innerHTML = '';
        return;
    }

    matchResultsList.innerHTML = '';
    const results = leagueData[selectedLeague].matchResults;
    results.slice(-10).reverse().forEach(match => { // Show last 10 results
        const listItem = document.createElement('li');
        listItem.textContent = `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name} (Round ${match.round})`;
        matchResultsList.appendChild(listItem);
    });
}

function updateMatchRoundDisplay() {
    if (!selectedLeague || !leagueData[selectedLeague]) {
        currentMatchRoundDisplay.textContent = 'Match Round: 0 / 38';
        return;
    }
    const totalRounds = leagueData[selectedLeague].fixtures.length;
    currentMatchRoundDisplay.textContent = `Match Round: ${currentMatchRound} / ${totalRounds}`;
    playMatchBtn.disabled = !currentUser || currentMatchRound >= totalRounds;
}

function simulateMatch(homeTeam, awayTeam) {
    const homeGoals = Math.floor(Math.random() * 5); // 0-4 goals
    const awayGoals = Math.floor(Math.random() * 4); // 0-3 goals (slight home advantage)
    return { homeGoals, awayGoals };
}

function updateTableWithMatchResult(homeTeam, awayTeam, homeGoals, awayGoals) {
    const table = leagueData[selectedLeague].table;
    const findClub = (name) => table.find(c => c.name === name);

    const homeClub = findClub(homeTeam.name);
    const awayClub = findClub(awayTeam.name);

    homeClub.P++;
    awayClub.P++;
    homeClub.GF += homeGoals;
    homeClub.GA += awayGoals;
    awayClub.GF += awayGoals;
    awayClub.GA += homeGoals;
    homeClub.GD = homeClub.GF - homeClub.GA;
    awayClub.GD = awayClub.GF - awayClub.GA;

    if (homeGoals > awayGoals) {
        homeClub.W++;
        awayClub.L++;
        homeClub.Pts += 3;
    } else if (awayGoals > homeGoals) {
        awayClub.W++;
        homeClub.L++;
        awayClub.Pts += 3;
    } else {
        homeClub.D++;
        awayClub.D++;
        homeClub.Pts += 1;
        awayClub.Pts += 1;
    }
}

function displayUpcomingMatchesForPrediction() {
    upcomingMatchesForPredictionDiv.innerHTML = '';
    predictionMessage.textContent = '';

    if (!selectedLeague || !leagueData[selectedLeague] || currentMatchRound >= leagueData[selectedLeague].fixtures.length) {
        upcomingMatchesForPredictionDiv.innerHTML = '<p>No matches to predict yet.</p>';
        return;
    }

    const currentRoundFixtures = leagueData[selectedLeague].fixtures[currentMatchRound];
    if (!currentRoundFixtures || currentRoundFixtures.length === 0) {
        upcomingMatchesForPredictionDiv.innerHTML = '<p>No matches for the current round.</p>';
        return;
    }

    currentRoundFixtures.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match-prediction-item');
        const matchId = `${match.home.short}-${match.away.short}`;

        matchDiv.innerHTML = `
            <span>${match.home.name} vs ${match.away.name}</span>
            <button class="predict-btn" data-match-id="${matchId}" data-predicted-winner="${match.home.name}">Predict ${match.home.short} Win</button>
            <button class="predict-btn" data-match-id="${matchId}" data-predicted-winner="Draw">Predict Draw</button>
            <button class="predict-btn" data-match-id="${matchId}" data-predicted-winner="${match.away.name}">Predict ${match.away.short} Win</button>
        `;
        upcomingMatchesForPredictionDiv.appendChild(matchDiv);
    });

    // Add event listeners for prediction buttons
    document.querySelectorAll('.predict-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            if (!currentUser) {
                alert('Please sign up or login to make a prediction.');
                return;
            }
            const matchId = event.target.dataset.matchId;
            const predictedWinner = event.target.dataset.predictedWinner;

            predictionMade = { matchId, predictedWinner };
            predictionMessage.textContent = `Prediction made for match ${matchId}: ${predictedWinner}. Good luck!`;
            alert(`You predicted ${predictedWinner} for the match ${matchId}!`);

            // Disable all prediction buttons after one is made for the round
            document.querySelectorAll('.predict-prediction-item button').forEach(btn => btn.disabled = true);
        });
    });
}


// --- Event Handlers ---

signupLoginBtn.addEventListener('click', () => {
    if (currentUser) {
        // Logout
        currentUser = null;
        predictionMade = null; // Clear prediction on logout
        updateAccountDisplay();
        saveUsers();
        alert('You have been logged out.');
        // Reset game state if needed, or disable prediction
        upcomingMatchesForPredictionDiv.innerHTML = '<p>Login to make predictions.</p>';
    } else {
        showModal(signupLoginModal);
    }
});

transferToNairaBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('Please login to transfer funds.');
        return;
    }
    nairaRateDisplay.textContent = NAIRA_RATE;
    showModal(transferModal);
});

withdrawBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('Please login to withdraw funds.');
        return;
    }
    showModal(withdrawModal);
});

closeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        hideModal(event.target.closest('.modal'));
    });
});

window.addEventListener('click', (event) => {
    if (event.target === signupLoginModal) hideModal(signupLoginModal);
    if (event.target === transferModal) hideModal(transferModal);
    if (event.target === withdrawModal) hideModal(withdrawModal);
});


// Auth Form
registerBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    if (users[username]) {
        alert('Username already exists. Please choose a different one or login.');
        return;
    }

    const accountNumber = generateAccountNumber();
    users[username] = {
        username,
        password,
        dollarBalance: 10.00, // Starting balance
        nairaBalance: 0.00,
        accountNumber
    };
    saveUsers();
    alert('Registration successful! You can now login.');
    regUsernameInput.value = '';
    regPasswordInput.value = '';
});

loginBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    if (!users[username] || users[username].password !== password) {
        alert('Invalid username or password.');
        return;
    }

    currentUser = users[username];
    updateAccountDisplay();
    hideModal(signupLoginModal);
    alert(`Welcome back, ${currentUser.username}!`);
    displayUpcomingMatchesForPrediction(); // Refresh predictions for logged-in user
});

// Transfer Funds
confirmTransferBtn.addEventListener('click', () => {
    const amount = parseFloat(transferAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount to transfer.');
        return;
    }
    if (currentUser.dollarBalance < amount) {
        alert('Insufficient dollar balance.');
        return;
    }

    currentUser.dollarBalance -= amount;
    currentUser.nairaBalance += amount * NAIRA_RATE;
    saveUsers();
    updateAccountDisplay();
    hideModal(transferModal);
    alert(`Successfully transferred $${amount.toFixed(2)} to ₦${(amount * NAIRA_RATE).toFixed(2)}.`);
    transferAmountInput.value = '';
});

// Withdraw Funds
confirmWithdrawBtn.addEventListener('click', () => {
    const amount = parseFloat(withdrawAmountInput.value);
    const bankName = bankNameInput.value.trim();
    const bankAccountNum = bankAccountNumInput.value.trim();

    if (isNaN(amount) || amount < 25000) { // Minimum withdrawal of ₦25,000
        alert('Minimum withdrawal amount is ₦25,000.');
        return;
    }
    if (!bankName || !bankAccountNum) {
        alert('Please fill in all bank details.');
        return;
    }
    if (currentUser.nairaBalance < amount) {
        alert('Insufficient Naira balance.');
        return;
    }

    currentUser.nairaBalance -= amount;
    saveUsers();
    updateAccountDisplay();
    hideModal(withdrawModal);
    alert(`Withdrawal of ₦${amount.toFixed(2)} to ${bankName} account ${bankAccountNum} successful! Funds will be processed.`);
    withdrawAmountInput.value = '';
    bankNameInput.value = '';
    bankAccountNumInput.value = '';
});

// League Selection
selectPremierLeagueBtn.addEventListener('click', () => {
    selectedLeague = 'PremierLeague';
    selectedLeagueDisplay.textContent = 'Selected: English Premier League';
    initializeLeague('PremierLeague', premierLeagueClubs);
    playMatchBtn.disabled = !currentUser; // Enable if user is logged in
    currentMatchRound = 0; // Reset round for new league selection
    predictionMade = null; // Clear prediction for new league
    updateMatchRoundDisplay();
});

selectLaLigaBtn.addEventListener('click', () => {
    selectedLeague = 'LaLiga';
    selectedLeagueDisplay.textContent = 'Selected: Spanish La Liga';
    initializeLeague('LaLiga', laLigaClubs);
    playMatchBtn.disabled = !currentUser; // Enable if user is logged in
    currentMatchRound = 0; // Reset round for new league selection
    predictionMade = null; // Clear prediction for new league
    updateMatchRoundDisplay();
});


// Play Match Round
playMatchBtn.addEventListener('click', () => {
    if (!selectedLeague) {
        alert('Please select a league first.');
        return;
    }
    if (!currentUser) {
        alert('Please sign up or login to play matches.');
        return;
    }
    if (currentMatchRound >= leagueData[selectedLeague].fixtures.length) {
        alert('All match rounds have been played for this league!');
        playMatchBtn.disabled = true;
        return;
    }

    playMatchBtn.disabled = true;
    let countdown = 60; // 1 minute countdown
    matchCountdownDisplay.textContent = `Next match in: ${countdown}s`;

    countdownInterval = setInterval(() => {
        countdown--;
        matchCountdownDisplay.textContent = `Next match in: ${countdown}s`;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            matchCountdownDisplay.textContent = 'Match Round Starting!';
            simulateCurrentMatchRound();
        }
    }, 1000);
});

function simulateCurrentMatchRound() {
    const currentRoundFixtures = leagueData[selectedLeague].fixtures[currentMatchRound];
    if (!currentRoundFixtures) {
        console.error("No fixtures found for current round:", currentMatchRound);
        return;
    }

    let predictionResult = 'no prediction';
    let predictionAmount = 5.00; // Amount risked on prediction

    for (const match of currentRoundFixtures) {
        const { homeGoals, awayGoals } = simulateMatch(match.home, match.away);
        updateTableWithMatchResult(match.home, match.away, homeGoals, awayGoals);

        leagueData[selectedLeague].matchResults.unshift({ // Add to start for latest display
            round: currentMatchRound + 1,
            home: match.home,
            away: match.away,
            homeGoals,
            awayGoals
        });

        // Check prediction
        if (predictionMade && predictionMade.matchId === `${match.home.short}-${match.away.short}`) {
            let actualWinner = null;
            if (homeGoals > awayGoals) actualWinner = match.home.name;
            else if (awayGoals > homeGoals) actualWinner = match.away.name;
            else actualWinner = 'Draw';

            if (predictionMade.predictedWinner === actualWinner) {
                currentUser.dollarBalance += predictionAmount;
                predictionResult = 'win';
                alert(`🎉 Prediction Win! 🎉 You won $${predictionAmount.toFixed(2)} on ${match.home.name} vs ${match.away.name}.`);
            } else {
                currentUser.dollarBalance -= predictionAmount;
                predictionResult = 'lose';
                alert(`😭 Prediction Loss! 😭 You lost $${predictionAmount.toFixed(2)} on ${match.home.name} vs ${match.away.name}.`);
            }
            saveUsers();
            updateAccountDisplay();
        }
    }

    currentMatchRound++;
    leagueData[selectedLeague].currentRound = currentMatchRound; // Save current round
    predictionMade = null; // Reset prediction after round is played
    predictionMessage.textContent = 'Make a new prediction for the next round!';

    updateLeagueTable();
    updateMatchResults();
    updateMatchRoundDisplay();
    displayUpcomingMatchesForPrediction(); // Show next round's matches for prediction
    playMatchBtn.disabled = false; // Re-enable button for next round
}


// --- Initial Setup ---
function init() {
    updateAccountDisplay();
    nairaRateDisplay.textContent = NAIRA_RATE;
    // Load previously selected league if any, or prompt user to select
    if (selectedLeague && leagueData[selectedLeague]) {
        selectedLeagueDisplay.textContent = `Selected: ${selectedLeague === 'PremierLeague' ? 'English Premier League' : 'Spanish La Liga'}`;
        initializeLeague(selectedLeague, leagueData[selectedLeague].clubs);
    } else {
        selectedLeagueDisplay.textContent = 'No league selected.';
        playMatchBtn.disabled = true;
    }
}

init();