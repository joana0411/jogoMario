const loginScreen = document.querySelector('.login-screen');
const gameBoard = document.querySelector('.game-board');
const gameOverScreen = document.querySelector('.game-over-screen');

const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const playerNameDisplay = document.getElementById('player-name');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const changeUserButton = document.getElementById('change-user-button');
const usersHistoryList = document.getElementById('users-history-list');
const userHistoryContainer = document.querySelector('.user-history-container');

const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const clouds = document.querySelector('.clouds');

let gameLoop;
let scoreInterval;
let score = 0;
let userName = '';
let isRunning = false;

const API_URL = 'https://59tbfzwf32.execute-api.us-east-2.amazonaws.com/prod/score';

// API GATEWAY / LAMBDA INTEGRATION 

const sendHighScore = async (finalScore) => {
    // 1. Pede o nome 
   const confirmation = confirm(`Fim de Jogo! Sua pontuação: ${finalScore}. Deseja salvar seu recorde como '${userName}'?`);
    
    if (!confirmation || !userName || finalScore <= 0) {
        return; // Não salva se cancelar ou se a pontuação for zero
    }

    // 2. Constrói o objeto de dados que o Lambda espera
    const data = {
        UserName: userName, // Vem da tela de login
        Score: finalScore
    };
    
    // 3. Envia a requisição POST para o API Gateway
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Sucesso ao salvar placar:', result);
            alert(`Pontuação salva com sucesso para ${userName}!`);
        } else {
            console.error('Erro ao salvar placar:', result);
            alert(`Erro (HTTP ${response.status}) ao salvar placar. Veja o console.`);
        }

    } catch (error) {
        console.error('Erro de rede ou CORS:', error);
        alert("Erro de comunicação com o servidor. Verifique o console e o CORS.");
    }
}


//  HISTÓRICO 

const loadUsersHistory = () => {
    try {
        return JSON.parse(localStorage.getItem('marioJumpUsers')) || [];
    } catch {
        return [];
    }
};

const saveUserName = (name) => {
    let history = loadUsersHistory().filter(n => n !== name);
    history.unshift(name);
    history = history.slice(0, 3);
    localStorage.setItem('marioJumpUsers', JSON.stringify(history));
};

const renderUsersHistory = () => {
    const history = loadUsersHistory();
    usersHistoryList.innerHTML = '';

    if (history.length === 0) {
        userHistoryContainer.classList.add('hidden');
        return;
    }

    userHistoryContainer.classList.remove('hidden');

    history.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        li.onclick = () => {
            usernameInput.value = name;
            startButton.disabled = false;
        };
        usersHistoryList.appendChild(li);
    });
};

// JOGO 

const resetMarioAnimation = () => {
    mario.classList.remove('jump');
    void mario.offsetWidth; // RESET da animação
    mario.style.animation = '';
};

const jump = () => {
     // o segundo pulo é bloqueado, evitando problemas de estado.
    if (!isRunning || mario.classList.contains('jump')) return; 
    mario.classList.add('jump');
      setTimeout(() => mario.classList.remove('jump'), 500); 
};

const startScoreCounter = () => {
    score = 0;
    scoreDisplay.textContent = score;

    scoreInterval = setInterval(() => {
        score++;
        scoreDisplay.textContent = score;
    }, 100);
};

const startGameLoop = () => {
    isRunning = true;
    startScoreCounter();

    pipe.style.animation = 'pipe-animation 1.5s infinite linear';
    clouds.style.animation = 'clouds-animation 20s infinite linear';

    gameLoop = setInterval(() => {
        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {

            // 1. PARAR TUDO
            clearInterval(gameLoop);
            clearInterval(scoreInterval);
            isRunning = false;

            // 2. TENTAR SALVAR NOVO RECORD (CHAMADA API)
            sendHighScore(score);

            // 3. SALVAR USUÁRIO LOCALMENTE
            saveUserName(userName);

            // 4. ANIMAÇÃO DE GAME OVER
            pipe.style.animation = 'none';
            pipe.style.left = `${pipePosition}px`;

            mario.style.animation = 'none';
            mario.style.bottom = `${marioPosition}px`;
            mario.src = './images/gameOver.jpg';
            mario.style.width = '75px';
            mario.style.marginLeft = '50px';

            finalScoreDisplay.textContent = `Sua pontuação final: ${score}`;
            gameBoard.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
        }
    }, 10);
};

const resetGame = () => {
    gameOverScreen.classList.add('hidden');
    gameBoard.classList.remove('hidden');

    mario.src = './images/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '0';

    resetMarioAnimation(); // PARA O PULO FUNCIONAR NOVAMENTE

    pipe.style.animation = 'none';
    pipe.style.right = '-80px';
    pipe.style.left = 'auto';

    clouds.style.animation = 'none';
    clouds.style.right = '-550px';
    clouds.style.left = 'auto';

    startGameLoop();
};

const showLoginScreen = () => {
    gameBoard.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    loginScreen.classList.remove('hidden');

    if (!userName) {
        usernameInput.value = '';
        startButton.disabled = true;
    }

    renderUsersHistory();
};

//  EVENTOS 

usernameInput.oninput = () => {
    startButton.disabled = usernameInput.value.trim() === '';
};

startButton.onclick = () => {
    const inputName = usernameInput.value.trim();
    if (inputName) {
        userName = inputName;
        playerNameDisplay.textContent = userName.toUpperCase();

        loginScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        resetGame();
    }
};

document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowUp') && isRunning) {
        e.preventDefault();
        jump();
    }
});

restartButton.onclick = () => resetGame();
changeUserButton.onclick = () => showLoginScreen();

showLoginScreen();