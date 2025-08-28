document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const usernameDisplay = document.getElementById('usernameDisplay');
    const dollarBalanceDisplay = document.getElementById('dollarBalance');
    const nairaBalanceDisplay = document.getElementById('nairaBalance');
    const accountNumberDisplay = document.getElementById('accountNumber');
    const signupLoginBtn = document.getElementById('signupLoginBtn');
    const transferToNairaBtn = document.getElementById('transferToNairaBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const selectPremierLeagueBtn = document.getElementById('selectPremierLeague');
    const selectLaLigaBtn = document.getElementById('selectLaLiga');
    const selectedLeagueDisplay = document.getElementById('selectedLeagueDisplay');
    const playMatchBtn = document.getElementById('playMatchBtn');
    const matchCountdownDisplay = document.getElementById('matchCountdown');
    const currentMatchRoundDisplay = document.getElementById('currentMatchRound');
    const upcomingMatchesForPredictionDiv = document.getElementById('upcomingMatchesForPrediction');
    const predictionMessage = document.getElementById('predictionMessage');
    const leagueTableBody = document.getElementById('leagueTableBody');
    const matchResultsList = document.getElementById('matchResultsList');

    // Modals
    const signupLoginModal = document.getElementById('signupLoginModal');
    const transferModal = document.getElementById('transferModal');
    const withdrawModal = document.getElementById('withdrawModal');
    const closeModalButtons = document.querySelectorAll('.close-button');

    // Auth Form
    const authForm = document.getElementById('authForm');
    const regUsernameInput = document.getElementById('regUsername');
    const regPasswordInput = document.getElementById('regPassword');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');

    // Transfer Form
    const transferAmountInput = document.getElementById('transferAmount');
    const nairaRateSpan = document.getElementById('nairaRate');
    const confirmTransferBtn = document.getElementById('confirmTransferBtn');

    // Withdraw Form
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const bankNameInput = document.getElementById('bankName');
    const bankAccountNumInput = document.getElementById('bankAccountNum');
    const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');


    // Global Game State
    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let selectedLeague = null;
    let leagueData = {}; // Stores all league data (teams, schedule, table)
    let currentMatchRound = 0;
    let matchesPerRound = 10; // Assuming 20 teams, 10 matches per round
    const PREDICTION_BET_AMOUNT = 3.00; // $3.00 per prediction
    const PREDICTION_WIN_AMOUNT = 3.50; // Win $1.50 if correct

    // Helper to open a modal
    function openModal(modal) {
        modal.style.display = 'block';
    }

    // Helper to close a modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Close modals when close button is clicked
    closeModalButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            closeModal(event.target.closest('.modal'));
        });
    });

    // Close modals when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === signupLoginModal) closeModal(signupLoginModal);
        if (event.target === transferModal) closeModal(transferModal);
        if (event.target === withdrawModal) closeModal(withdrawModal);
    });

    // --- Account Management ---

    function generateAccountNumber() {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function updateAccountDisplay() {
        if (currentUser) {
            usernameDisplay.textContent = currentUser.username;
            dollarBalanceDisplay.textContent = currentUser.dollarBalance.toFixed(2);
            nairaBalanceDisplay.textContent = currentUser.nairaBalance.toFixed(2);
            accountNumberDisplay.textContent = currentUser.accountNumber;
            signupLoginBtn.textContent = 'Logout';
            transferToNairaBtn.disabled = false;
            withdrawBtn.disabled = false;
        } else {
            usernameDisplay.textContent = 'Guest';
            dollarBalanceDisplay.textContent = '10.00'; // Default guest balance
            nairaBalanceDisplay.textContent = '0.00';
            accountNumberDisplay.textContent = '*****';
            signupLoginBtn.textContent = 'Sign Up / Login';
            transferToNairaBtn.disabled = true;
            withdrawBtn.disabled = true;
        }
    }

    signupLoginBtn.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            currentUser = null;
            localStorage.removeItem('loggedInUser');
            updateAccountDisplay();
            resetLeagueState(); // Reset league state on logout
            alert('Logged out successfully!');
        } else {
            // Open login/signup modal
            openModal(signupLoginModal);
        }
    });

    authForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission
    });

    registerBtn.addEventListener('click', () => {
        const username = regUsernameInput.value.trim();
        const password = regPasswordInput.value.trim();

        if (username && password) {
            if (users[username]) {
                alert('Username already exists!');
            } else {
                users[username] = {
                    password: password,
                    dollarBalance: 100.00, // Starting balance for new users
                    nairaBalance: 0.00,
                    accountNumber: generateAccountNumber(),
                    predictions: {} // To store user predictions: {matchId: predictedWinner}
                };
                saveUsers();
                alert('Registration successful! Please login.');
                regUsernameInput.value = '';
                regPasswordInput.value = '';
            }
        } else {
            alert('Please enter both username and password.');
        }
    });

    loginBtn.addEventListener('click', () => {
        const username = regUsernameInput.value.trim();
        const password = regPasswordInput.value.trim();

        if (username && password) {
            if (users[username] && users[username].password === password) {
                currentUser = users[username];
                localStorage.setItem('loggedInUser', username); // Store username of logged-in user
                updateAccountDisplay();
                closeModal(signupLoginModal);
                alert(`Welcome back, ${username}!`);
                regUsernameInput.value = '';
                regPasswordInput.value = '';
                // Reload league if one was previously selected
                if (selectedLeague) {
                    initLeague(selectedLeague);
                } else {
                    playMatchBtn.disabled = true;
                }
            } else {
                alert('Invalid username or password.');
            }
        } else {
            alert('Please enter both username and password.');
        }
    });

    // Check for logged-in user on page load
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser && users[storedUser]) {
        currentUser = users[storedUser];
        updateAccountDisplay();
    }


    transferToNairaBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please login to transfer funds.');
            return;
        }
        openModal(transferModal);
        // Fetch exchange rate (simulated)
        const rate = await getExchangeRate();
        nairaRateSpan.textContent = rate.toFixed(2);
    });

    confirmTransferBtn.addEventListener('click', () => {
        if (!currentUser) return;
        const amount = parseFloat(transferAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (currentUser.dollarBalance < amount) {
            alert('Insufficient Dollar balance.');
            return;
        }

        const nairaEquivalent = amount * parseFloat(nairaRateSpan.textContent);
        currentUser.dollarBalance -= amount;
        currentUser.nairaBalance += nairaEquivalent;
        saveUsers();
        updateAccountDisplay();
        closeModal(transferModal);
        alert(`Successfully transferred $${amount.toFixed(2)} to ₦${nairaEquivalent.toFixed(2)}`);
        transferAmountInput.value = '';
    });

    withdrawBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('Please login to withdraw funds.');
            return;
        }
        openModal(withdrawModal);
    });

    confirmWithdrawBtn.addEventListener('click', () => {
        if (!currentUser) return;
        const amount = parseFloat(withdrawAmountInput.value);
        const bankName = bankNameInput.value.trim();
        const bankAccountNum = bankAccountNumInput.value.trim();

        if (isNaN(amount) || amount < 25000) { // Minimum withdrawal amount
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
        closeModal(withdrawModal);
        alert(`Withdrawal of ₦${amount.toFixed(2)} to ${bankName} (${bankAccountNum}) successful!`);
        withdrawAmountInput.value = '';
        bankNameInput.value = '';
        bankAccountNumInput.value = '';
    });

    // Simulate fetching exchange rate
    async function getExchangeRate() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(Math.random() * (1200 - 800) + 800); // Rate between 800 and 1200
            }, 500);
        });
    }

    // --- League Simulation ---

    // Initial team data (Example for EPL)
    const premierLeagueTeams = [
        { name: "Arsenal", short: "ARS" }, { name: "Aston Villa", short: "AVL" },
        { name: "Bournemouth", short: "BOU" }, { name: "Brentford", short: "BRE" },
        { name: "Brighton", short: "BHA" }, { name: "Burnley", short: "BUR" },
        { name: "Chelsea", short: "CHE" }, { name: "Crystal Palace", short: "CRY" },
        { name: "Everton", short: "EVE" }, { name: "Fulham", short: "FUL" },
        { name: "Liverpool", short: "LIV" }, { name: "Luton Town", short: "LUT" },
        { name: "Man City", short: "MCI" }, { name: "Man Utd", short: "MUN" },
        { name: "Newcastle", short: "NEW" }, { name: "Nott'm Forest", short: "NFO" },
        { name: "Sheffield Utd", short: "SHU" }, { name: "Tottenham", short: "TOT" },
        { name: "West Ham", short: "WHU" }, { name: "Wolves", short: "WOL" }
    ];

    const laLigaTeams = [
        { name: "Alavés", short: "ALA" }, { name: "Almería", short: "ALM" },
        { name: "Athletic Club", short: "ATH" }, { name: "Atlético Madrid", short: "ATM" },
        { name: "Barcelona", short: "BAR" }, { name: "Betis", short: "BET" },
        { name: "Cádiz", short: "CAD" }, { name: "Celta Vigo", short: "CEL" },
        { name: "Getafe", short: "GET" }, { name: "Girona", short: "GIR" },
        { name: "Granada", short: "GRA" }, { name: "Las Palmas", short: "LPA" },
        { name: "Mallorca", short: "MAL" }, { name: "Osasuna", short: "OSA" },
        { name: "Rayo Vallecano", short: "RAY" }, { name: "Real Madrid", short: "RMA" },
        { name: "Real Sociedad", short: "RSO" }, { name: "Sevilla", short: "SEV" },
        { name: "Valencia", short: "VAL" }, { name: "Villarreal", short: "VIL" }
    ];


    function generateFixture(teams) {
        const fixture = [];
        const numTeams = teams.length;
        const totalRounds = (numTeams - 1) * 2; // Home and Away

        // Ensure an even number of teams for scheduling
        const teamsCopy = [...teams];
        if (numTeams % 2 !== 0) {
            teamsCopy.push({ name: 'BYE', short: 'BYE' }); // Add a dummy team for odd numbers
        }

        const n = teamsCopy.length;
        const teamIndices = Array.from({ length: n }, (_, i) => i);

        for (let round = 0; round < totalRounds; round++) {
            const currentRoundMatches = [];
            for (let i = 0; i < n / 2; i++) {
                const homeTeam = teamsCopy[teamIndices[i]];
                const awayTeam = teamsCopy[teamIndices[n - 1 - i]];

                if (homeTeam.name !== 'BYE' && awayTeam.name !== 'BYE') {
                    // Ensure unique match IDs
                    const matchId = `R${round + 1}-${homeTeam.short}-vs-${awayTeam.short}`;
                    currentRoundMatches.push({
                        id: matchId,
                        home: homeTeam.name,
                        away: awayTeam.name,
                        homeShort: homeTeam.short,
                        awayShort: awayTeam.short,
                        score: null
                    });
                }
            }
            fixture.push(currentRoundMatches);

            // Rotate teams (Round Robin algorithm)
            const lastTeam = teamIndices.pop();
            teamIndices.splice(1, 0, lastTeam);
        }
        return fixture;
    }


    function resetLeagueState() {
        selectedLeague = null;
        leagueData = {};
        currentMatchRound = 0;
        selectedLeagueDisplay.textContent = 'No league selected.';
        playMatchBtn.disabled = true;
        currentMatchRoundDisplay.textContent = 'Match Round: 0 / 38';
        upcomingMatchesForPredictionDiv.innerHTML = 'No matches to predict yet.';
        leagueTableBody.innerHTML = '<tr><td colspan="10">Select a league to see the table.</td></tr>';
        matchResultsList.innerHTML = '';
        matchCountdownDisplay.textContent = 'Next match in: --s';
    }

    function initLeague(leagueName) {
        resetLeagueState(); // Reset everything before initializing a new league

        selectedLeague = leagueName;
        selectedLeagueDisplay.textContent = selectedLeague === 'EPL' ? 'English Premier League' : 'Spanish La Liga';

        const teams = selectedLeague === 'EPL' ? premierLeagueTeams : laLigaTeams;
        matchesPerRound = teams.length / 2; // For 20 teams, 10 matches

        const initialTable = teams.map(team => ({
            name: team.name,
            short: team.short,
            P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0
        }));

        leagueData = {
            teams: teams,
            fixture: generateFixture(teams),
            table: initialTable,
            results: []
        };
        currentMatchRound = 0; // Reset round
        currentMatchRoundDisplay.textContent = `Match Round: ${currentMatchRound} / ${leagueData.fixture.length}`;
        updateLeagueTable();
        displayUpcomingMatchesForPrediction();
        playMatchBtn.disabled = false; // Enable play button
    }

    selectPremierLeagueBtn.addEventListener('click', () => initLeague('EPL'));
    selectLaLigaBtn.addEventListener('click', () => initLeague('LaLiga'));


    function simulateMatch() {
        if (!selectedLeague || currentMatchRound >= leagueData.fixture.length) {
            alert('Please select a league or the season has ended!');
            return;
        }

        const roundMatches = leagueData.fixture[currentMatchRound];
        const newResults = [];

        // Track user predictions for this round
        const userPredictionsThisRound = currentUser ? currentUser.predictions : {};
        const predictionOutcomes = {}; // {matchId: 'win'/'lose'/'none'}

        roundMatches.forEach(match => {
            const homeGoals = Math.floor(Math.random() * 5); // 0-4 goals
            const awayGoals = Math.floor(Math.random() * 4); // 0-3 goals

            match.score = `${homeGoals}-${awayGoals}`;
            newResults.push({ ...match, score: match.score });

            // Update table
            const homeTeamStats = leagueData.table.find(t => t.name === match.home);
            const awayTeamStats = leagueData.table.find(t => t.name === match.away);

            if (homeTeamStats && awayTeamStats) { // Ensure teams exist
                homeTeamStats.P++;
                awayTeamStats.P++;
                homeTeamStats.GF += homeGoals;
                homeTeamStats.GA += awayGoals;
                awayTeamStats.GF += awayGoals;
                awayTeamStats.GA += homeGoals;
                homeTeamStats.GD = homeTeamStats.GF - homeTeamStats.GA;
                awayTeamStats.GD = awayTeamStats.GF - awayTeamStats.GA;

                if (homeGoals > awayGoals) {
                    homeTeamStats.W++;
                    awayTeamStats.L++;
                    homeTeamStats.Pts += 3;
                    predictionOutcomes[match.id] = (userPredictionsThisRound[match.id] === match.home) ? 'win' :
                                                   (userPredictionsThisRound[match.id] === match.away) ? 'lose' :
                                                   'none';
                } else if (awayGoals > homeGoals) {
                    awayTeamStats.W++;
                    homeTeamStats.L++;
                    awayTeamStats.Pts += 3;
                    predictionOutcomes[match.id] = (userPredictionsThisRound[match.id] === match.away) ? 'win' :
                                                   (userPredictionsThisRound[match.id] === match.home) ? 'lose' :
                                                   'none';
                } else {
                    homeTeamStats.D++;
                    awayTeamStats.D++;
                    homeTeamStats.Pts += 1;
                    awayTeamStats.Pts += 1;
                    predictionOutcomes[match.id] = (userPredictionsThisRound[match.id] === 'draw') ? 'win' :
                                                   (userPredictionsThisRound[match.id] && userPredictionsThisRound[match.id] !== 'draw') ? 'lose' :
                                                   'none';
                }
            }
        });

        leagueData.results = newResults.concat(leagueData.results); // Add new results to the top
        currentMatchRound++;
        currentMatchRoundDisplay.textContent = `Match Round: ${currentMatchRound} / ${leagueData.fixture.length}`;

        updateLeagueTable();
        displayMatchResults();

        // Process user prediction outcomes
        if (currentUser) {
            let totalWinnings = 0;
            let totalLosses = 0;
            for (const matchId in predictionOutcomes) {
                if (predictionOutcomes[matchId] === 'win') {
                    totalWinnings += PREDICTION_WIN_AMOUNT;
                    console.log(`Prediction for ${matchId} was WIN. User wins $${PREDICTION_WIN_AMOUNT}`);
                } else if (predictionOutcomes[matchId] === 'lose') {
                    totalLosses += PREDICTION_BET_AMOUNT;
                    console.log(`Prediction for ${matchId} was LOSE. User loses $${PREDICTION_BET_AMOUNT}`);
                }
            }

            // Apply net winnings/losses
            const netAmount = totalWinnings - totalLosses;
            currentUser.dollarBalance += netAmount;
            if (netAmount > 0) {
                alert(`You won $${netAmount.toFixed(2)} from your predictions this round!`);
            } else if (netAmount < 0) {
                alert(`You lost $${Math.abs(netAmount).toFixed(2)} from your predictions this round.`);
            } else if (totalWinnings > 0 || totalLosses > 0) {
                 alert(`You broke even on your predictions this round!`);
            } else {
                alert(`No predictions made or processed this round.`);
            }


            // Clear predictions for the just played round
            currentUser.predictions = {}; // Clear predictions after round is played
            saveUsers();
            updateAccountDisplay();
        }


        // If season ends
        if (currentMatchRound >= leagueData.fixture.length) {
            playMatchBtn.disabled = true;
            upcomingMatchesForPredictionDiv.innerHTML = 'Season has ended!';
            predictionMessage.textContent = 'Season has ended. No more predictions.';
            alert('Season has ended! Check the final league table.');
        } else {
            // Display upcoming matches for the next round
            displayUpcomingMatchesForPrediction();
        }
    }


    function updateLeagueTable() {
        if (!selectedLeague || !leagueData.table) return;

        // Sort table: Pts > GD > GF > Name
        const sortedTable = [...leagueData.table].sort((a, b) => {
            if (b.Pts !== a.Pts) return b.Pts - a.Pts;
            if (b.GD !== a.GD) return b.GD - a.GD;
            if (b.GF !== a.GF) return b.GF - a.GF;
            return a.name.localeCompare(b.name);
        });

        leagueTableBody.innerHTML = '';
        sortedTable.forEach((team, index) => {
            const row = leagueTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${team.P}</td>
                <td>${team.W}</td>
                <td>${team.D}</td>
                <td>${team.L}</td>
                <td>${team.GF}</td>
                <td>${team.GA}</td>
                <td>${team.GD}</td>
                <td>${team.Pts}</td>
            `;
        });
    }

    function displayMatchResults() {
        if (!selectedLeague || !leagueData.results) return;

        matchResultsList.innerHTML = '';
        // Show only latest 10 results
        const latestResults = leagueData.results.slice(0, matchesPerRound); // Get results for the just played round

        latestResults.forEach(match => {
            const listItem = document.createElement('li');
            listItem.textContent = `${match.home} ${match.score} ${match.away}`;
            matchResultsList.appendChild(listItem);
        });
    }

    function displayUpcomingMatchesForPrediction() {
        upcomingMatchesForPredictionDiv.innerHTML = '';
        predictionMessage.textContent = '';

        if (!currentUser) {
            upcomingMatchesForPredictionDiv.innerHTML = '<p>Please log in to make predictions.</p>';
            return;
        }
        if (!selectedLeague || currentMatchRound >= leagueData.fixture.length) {
            upcomingMatchesForPredictionDiv.innerHTML = 'No upcoming matches to predict.';
            return;
        }

        const upcomingRoundMatches = leagueData.fixture[currentMatchRound];
        if (upcomingRoundMatches && upcomingRoundMatches.length > 0) {
            const form = document.createElement('form');
            form.id = 'predictionForm';

            upcomingRoundMatches.forEach(match => {
                const matchDiv = document.createElement('div');
                matchDiv.classList.add('prediction-match');
                matchDiv.innerHTML = `
                    <p><strong>${match.home} vs ${match.away}</strong></p>
                    <input type="radio" id="predict-${match.id}-home" name="predict-${match.id}" value="${match.home}">
                    <label for="predict-${match.id}-home">${match.home} Win</label>
                    <input type="radio" id="predict-${match.id}-away" name="predict-${match.id}" value="${match.away}">
                    <label for="predict-${match.id}-away">${match.away} Win</label>
                    <input type="radio" id="predict-${match.id}-draw" name="predict-${match.id}" value="draw">
                    <label for="predict-${match.id}-draw">Draw</label>
                `;
                form.appendChild(matchDiv);
            });

            const submitPredictionsBtn = document.createElement('button');
            submitPredictionsBtn.textContent = `Submit Predictions ($${PREDICTION_BET_AMOUNT.toFixed(2)} per match)`;
            submitPredictionsBtn.type = 'button'; // Prevent default form submission
            submitPredictionsBtn.addEventListener('click', () => submitPredictions(upcomingRoundMatches));
            form.appendChild(submitPredictionsBtn);

            upcomingMatchesForPredictionDiv.appendChild(form);
            predictionMessage.textContent = 'Select your winners for the upcoming matches.';
        } else {
            upcomingMatchesForPredictionDiv.innerHTML = 'No matches scheduled for the next round.';
        }
    }

    function submitPredictions(upcomingRoundMatches) {
        if (!currentUser) {
            alert('Please login to make predictions.');
            return;
        }

        const form = document.getElementById('predictionForm');
        let totalBets = 0;
        const currentPredictions = {};

        upcomingRoundMatches.forEach(match => {
            const selectedOption = form.querySelector(`input[name="predict-${match.id}"]:checked`);
            if (selectedOption) {
                currentPredictions[match.id] = selectedOption.value;
                totalBets++;
            }
        });

        if (totalBets === 0) {
            alert('Please select at least one prediction.');
            return;
        }

        const totalCost = totalBets * PREDICTION_BET_AMOUNT;
        if (currentUser.dollarBalance < totalCost) {
            alert(`Insufficient Dollar balance. You need $${totalCost.toFixed(2)} to place these bets.`);
            return;
        }

        // Store predictions in current user object
        currentUser.predictions = { ...currentUser.predictions, ...currentPredictions };
        saveUsers();
        alert(`Predictions submitted for ${totalBets} matches. Total cost: $${totalCost.toFixed(2)}`);
        predictionMessage.textContent = `Predictions for this round submitted! You bet on ${totalBets} matches.`;

        // Disable prediction form until next round
        const predictionInputs = form.querySelectorAll('input[type="radio"]');
        predictionInputs.forEach(input => input.disabled = true);
        form.querySelector('button').disabled = true;
    }


    // --- Game Controls ---
    let countdownInterval = null;

    playMatchBtn.addEventListener('click', () => {
        if (!selectedLeague) {
            alert('Please select a league first.');
            return;
        }
        if (currentMatchRound >= leagueData.fixture.length) {
            alert('Season has ended!');
            return;
        }

        playMatchBtn.disabled = true;
        let timeLeft = 60; // 60 seconds countdown
        matchCountdownDisplay.textContent = `Next match in: ${timeLeft}s`;

        countdownInterval = setInterval(() => {
            timeLeft--;
            matchCountdownDisplay.textContent = `Next match in: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                simulateMatch(); // Simulate match after countdown
                playMatchBtn.disabled = false;
                matchCountdownDisplay.textContent = 'Next match in: --s';
            }
        }, 1000);
    });

    // Initial load state
    updateAccountDisplay();
    // If a league was previously selected and the user logs in, re-init the league
    // This part is handled in the loginBtn event listener and initial storedUser check
    // However, if the page is just refreshed without login, and no league was selected, disable button.
    if (!selectedLeague) {
        playMatchBtn.disabled = true;
    }
});

