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

// --- FUNÇÕES DE ARMAZENAMENTO E HISTÓRICO ---

/**
 * Carrega os nomes salvos no localStorage.
 * @returns {Array} Últimos 3 nomes.
 */
const loadUsersHistory = () => {
    try {
        const history = JSON.parse(localStorage.getItem('marioJumpUsers')) || [];
        return history;
    } catch (e) {
        console.error("Erro ao carregar histórico:", e);
        return [];
    }
};

/**
 * Salva o nome do usuário no histórico, mantendo apenas os 3 últimos.
 * @param {string} name 
 */
const saveUserName = (name) => {
    let history = loadUsersHistory();
    
    // Remove o nome antigo (se existir) para evitar duplicatas
    history = history.filter(n => n !== name);

    // Adiciona o nome no início
    history.unshift(name);

    // Limita o array aos 3 primeiros
    history = history.slice(0, 3);

    try {
        localStorage.setItem('marioJumpUsers', JSON.stringify(history));
    } catch (e) {
        console.error("Erro ao salvar histórico:", e);
    }
};

/**
 * Renderiza a lista de nomes do histórico na tela de login.
 */
const renderUsersHistory = () => {
    const history = loadUsersHistory();
    usersHistoryList.innerHTML = ''; // Limpa a lista atual

    if (history.length === 0) {
        userHistoryContainer.classList.add('hidden');
        return;
    }

    userHistoryContainer.classList.remove('hidden');

    history.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        li.addEventListener('click', () => {
            usernameInput.value = name;
            startButton.disabled = false;
        });
        usersHistoryList.appendChild(li);
    });
};


// --- FUNÇÕES DO JOGO ---

/**
 * Adiciona a classe 'jump' e remove após 500ms.
 */
const jump = () => {
    // SÓ permite o pulo se o jogo estiver rodando e não estiver pulando
    if (!isRunning || mario.classList.contains('jump')) return; 
    
    mario.classList.add('jump');

    setTimeout(() => {
        mario.classList.remove('jump');
    }, 500);
}

/**
 * Incrementa o score a cada 100ms.
 */
const startScoreCounter = () => {
    score = 0;
    scoreDisplay.textContent = score;
    scoreInterval = setInterval(() => {
        score++;
        scoreDisplay.textContent = score;
    }, 100);
}

/**
 * Inicia o loop principal de colisão.
 */
const startGameLoop = () => {
    isRunning = true;
    startScoreCounter();

    // Aplica as animações que estavam ausentes (pipe e clouds)
    pipe.style.animation = 'pipe-animation 1.5s infinite linear';
    clouds.style.animation = 'clouds-animation 20s infinite linear';

    gameLoop = setInterval(() => {
        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        // Lógica de COLISÃO
        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
            
            // --- FIM DE JOGO ---
            
            clearInterval(gameLoop);
            clearInterval(scoreInterval);
            isRunning = false;
            
            // Salva o nome do usuário no histórico
            saveUserName(userName);

            // Para e fixa a posição dos elementos
            pipe.style.animation = 'none';
            pipe.style.left = `${pipePosition}px`;

            mario.style.animation = 'none';
            mario.style.bottom = `${marioPosition}px`;

            // Configuração do Game Over
            mario.src = './images/gameOver.jpg';
            mario.style.width = '75px'; 
            mario.style.marginLeft = '50px'; 

            // Mostra a tela de Game Over
            finalScoreDisplay.textContent = `Sua pontuação final: ${score}`;
            gameBoard.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
        }
    }, 10);
};

/**
 * Reseta o jogo para um novo início (mantendo o mesmo usuário).
 */
const resetGame = () => {
    // Esconde o Game Over e mostra o Game Board
    gameOverScreen.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    
    // Reseta o Mario
    mario.src = './images/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '0'; 

    // **IMPORTANTE**: Reseta o Pipe e as Clouds para a posição inicial (fora da tela)
    pipe.style.animation = 'none'; // Garante que a animação anterior não esteja rodando
    pipe.style.right = '-80px'; 
    pipe.style.left = 'auto'; // Limpa o left fixado
    clouds.style.animation = 'none';
    clouds.style.right = '-550px';
    clouds.style.left = 'auto';
    
    // Inicia o loop do jogo, que aplica as animações corretas
    startGameLoop(); 
};

/**
 * Exibe a tela de login/troca de usuário.
 */
const showLoginScreen = () => {
    // Esconde Game Board e Game Over
    gameBoard.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    // Mostra o Login
    loginScreen.classList.remove('hidden');
    
    // Limpa o campo se for uma troca de usuário
    if (!userName || document.activeElement === changeUserButton) {
        usernameInput.value = '';
        userName = '';
        startButton.disabled = true;
    } else {
        usernameInput.value = userName;
        startButton.disabled = false;
    }
    
    // Renderiza a lista de usuários
    renderUsersHistory();
}

// --- EVENT LISTENERS ---

// 1. Controle do Botão INICIAR
usernameInput.addEventListener('input', () => {
    startButton.disabled = usernameInput.value.trim() === '';
});

startButton.addEventListener('click', () => {
    const inputName = usernameInput.value.trim();
    if (inputName) {
        userName = inputName;
        playerNameDisplay.textContent = userName.toUpperCase();

        // Troca a tela
        loginScreen.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        // Inicia o jogo
        resetGame(); 
    }
});

// 2. Controle do Salto (Jump)
document.addEventListener('keydown', (event) => {
    // Teclas de espaço ou seta para cima
    if ((event.key === ' ' || event.key === 'ArrowUp') && isRunning) {
        jump();
        event.preventDefault(); // Evita que a barra de espaço role a página
    }
});

// 3. Botões da Tela de Game Over
restartButton.addEventListener('click', () => {
    // Continua o jogo com o MESMO usuário
    resetGame();
});

changeUserButton.addEventListener('click', () => {
    // Volta para a tela de login para TROCAR o nome
    showLoginScreen();
});

// --- INICIALIZAÇÃO ---

// Inicia o aplicativo mostrando a tela de login
showLoginScreen();