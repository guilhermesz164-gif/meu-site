const socket = io();

// Elementos da interface
const loginScreen = document.getElementById("login-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const quizScreen = document.getElementById("quiz-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const resultScreen = document.getElementById("result-screen");

// Formulários de Login
const loginOptions = document.getElementById("login-options");
const createForm = document.getElementById("create-form");
const joinForm = document.getElementById("join-form");

const showCreateBtn = document.getElementById("show-create-btn");
const showJoinBtn = document.getElementById("show-join-btn");
const useDefaultQuizBtn = document.getElementById("use-default-quiz-btn");
const showCreatorBtn = document.getElementById("show-creator-btn");
const quizCreatorForm = document.getElementById("quiz-creator-form");
const questionsList = document.getElementById("questions-list");
const addQuestionBtn = document.getElementById("add-question-btn");
const createCustomRoomBtn = document.getElementById("create-custom-room-btn");
const backToCreateFormBtn = document.getElementById("back-to-create-form");
const joinRoomBtn = document.getElementById("join-room-btn");

const hostNameInput = document.getElementById("host-name");
const gameModeSelect = document.getElementById("game-mode-select");
const playerNameInput = document.getElementById("player-name");
const roomPinInput = document.getElementById("room-pin");

const playerAvatarPreview = document.getElementById("player-avatar-preview");
const rollAvatarBtn = document.getElementById("roll-avatar-btn");
const emojiBar = document.getElementById("emoji-bar");

// Lobby
const lobbyPinDisplay = document.getElementById("lobby-pin-display");
const playersList = document.getElementById("players-list");
const startGameBtn = document.getElementById("start-game-btn");
const hostQrContainer = document.getElementById("host-qr-container");
const qrcodeElement = document.getElementById("qrcode");
let qrCodeInstance = null;

// Quiz
const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const questionCount = document.getElementById("question-count");
const timerDisplay = document.getElementById("timer-display");
const timerPath = document.getElementById("timer-path");
const waitingMsg = document.getElementById("waiting-msg");

// Host Panel
const hostPanel = document.getElementById("host-panel");
const answeredCountSpan = document.getElementById("answered-count");
const totalCountSpan = document.getElementById("total-count");
const skipBtn = document.getElementById("skip-btn");

// Results
const leaderboardList = document.getElementById("leaderboard-list");
const roundFeedback = document.getElementById("round-feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackSubtitle = document.getElementById("feedback-subtitle");

const resultIconGlow = document.getElementById("result-icon-glow");
const podiumContainer = document.getElementById("podium-container");
const finalLeaderboardList = document.getElementById("final-leaderboard-list");
const restartBtn = document.getElementById("restart-btn");
const waitingRestartMsg = document.getElementById("waiting-restart-msg");

let myName = "";
let currentOptions = [];
let myAnswer = null;
let isHost = false;
let isEliminated = false;
let myAvatarSeed = Math.floor(Math.random() * 100000).toString();

const letters = ["A", "B", "C", "D"];

// --- SISTEMA DE ÁUDIO (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new (AudioContext)();
let isMuted = false;

document.getElementById('mute-btn')?.addEventListener('click', (e) => {
    isMuted = !isMuted;
    e.target.textContent = isMuted ? '🔇' : '🔊';
});

function playTone(freq, type, duration, vol = 0.1) {
    if (isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playTick() { playTone(800, 'sine', 0.1, 0.05); }
function playCorrectSound() { 
    playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 200); // G5
}
function playWrongSound() {
    playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => playTone(250, 'sawtooth', 0.4, 0.1), 150);
}
// -----------------------------------------

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Atualizar o avatar inicial
if (playerAvatarPreview) {
    playerAvatarPreview.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${myAvatarSeed}`;
}

if (rollAvatarBtn) {
    rollAvatarBtn.addEventListener("click", () => {
        myAvatarSeed = Math.floor(Math.random() * 100000).toString();
        playerAvatarPreview.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${myAvatarSeed}`;
    });
}

showCreateBtn.addEventListener("click", () => {
    loginOptions.classList.add('hidden');
    createForm.classList.remove('hidden');
});

showJoinBtn.addEventListener("click", () => {
    loginOptions.classList.add('hidden');
    joinForm.classList.remove('hidden');
});

function backToOptions() {
    createForm.classList.add('hidden');
    joinForm.classList.add('hidden');
    quizCreatorForm.classList.add('hidden');
    loginOptions.classList.remove('hidden');
}

// Ler PIN da URL se existir
const urlParams = new URLSearchParams(window.location.search);
const pinFromUrl = urlParams.get('pin');
if (pinFromUrl) {
    roomPinInput.value = pinFromUrl;
    loginOptions.classList.add('hidden');
    joinForm.classList.remove('hidden');
}

// Criar Sala (Host) - ODS 7 Padrão
useDefaultQuizBtn.addEventListener("click", () => {
    myName = hostNameInput.value.trim() || "Anfitrião";
    socket.emit('createRoom', { name: myName, gameMode: gameModeSelect.value });
});

// Criador de Quiz Personalizado
showCreatorBtn.addEventListener("click", () => {
    createForm.classList.add('hidden');
    quizCreatorForm.classList.remove('hidden');
    questionsList.innerHTML = "";
    addQuestionField();
});

backToCreateFormBtn.addEventListener("click", () => {
    quizCreatorForm.classList.add('hidden');
    createForm.classList.remove('hidden');
});

function addQuestionField() {
    const qCount = questionsList.children.length + 1;
    const div = document.createElement('div');
    div.className = "question-form-block";
    div.innerHTML = `
        <button class="remove-question-btn" onclick="this.parentElement.remove()" title="Remover Pergunta">X</button>
        <input type="text" placeholder="Pergunta ${qCount}" class="q-text" required>
        <input type="url" placeholder="URL da Imagem (Opcional)" class="q-img">
        <input type="text" placeholder="Opção A" class="q-opt" required>
        <input type="text" placeholder="Opção B" class="q-opt" required>
        <input type="text" placeholder="Opção C" class="q-opt" required>
        <input type="text" placeholder="Opção D" class="q-opt" required>
        <select class="q-ans">
            <option value="0">Resposta Correta: A</option>
            <option value="1">Resposta Correta: B</option>
            <option value="2">Resposta Correta: C</option>
            <option value="3">Resposta Correta: D</option>
        </select>
    `;
    questionsList.appendChild(div);
}

addQuestionBtn.addEventListener("click", addQuestionField);

createCustomRoomBtn.addEventListener("click", () => {
    const blocks = document.querySelectorAll('.question-form-block');
    if (blocks.length === 0) return alert("Adicione pelo menos uma pergunta.");
    
    const customQuestions = [];
    let isValid = true;
    
    blocks.forEach(block => {
        const text = block.querySelector('.q-text').value.trim();
        const imgUrl = block.querySelector('.q-img').value.trim();
        const opts = Array.from(block.querySelectorAll('.q-opt')).map(input => input.value.trim());
        const ans = parseInt(block.querySelector('.q-ans').value);
        
        if (!text || opts.some(o => !o)) isValid = false;
        
        customQuestions.push({ question: text, imageUrl: imgUrl || null, options: opts, answer: ans });
    });
    
    if (!isValid) return alert("Preencha todos os campos obrigatórios do quiz.");
    
    myName = hostNameInput.value.trim() || "Anfitrião";
    socket.emit('createRoom', { name: myName, gameMode: gameModeSelect.value, questions: customQuestions });
});

// Eventos de Sala Criada
socket.on('roomCreated', (pin) => {
    isHost = true;
    lobbyPinDisplay.textContent = pin;
    startGameBtn.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    waitingRestartMsg.classList.add('hidden');
    emojiBar.classList.add('hidden'); // Host projeta, não clica em emojis
    
    // Mostrar QR Code para o Host
    hostQrContainer.classList.remove('hidden');
    qrcodeElement.innerHTML = "";
    const joinUrl = window.location.origin + "?pin=" + pin;
    if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(qrcodeElement, {
            text: joinUrl,
            width: 160,
            height: 160,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    showScreen(lobbyScreen);
});

// Entrar na Sala (Jogador)
joinRoomBtn.addEventListener("click", () => {
    const pin = roomPinInput.value.trim();
    myName = playerNameInput.value.trim() || "Convidado";
    
    if (pin.length !== 6) {
        alert("O PIN deve ter 6 números.");
        return;
    }
    
    socket.emit('joinRoom', { 
        pin, 
        name: myName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${myAvatarSeed}`
    });
});

socket.on('roomJoined', (pin) => {
    isHost = false;
    isEliminated = false;
    lobbyPinDisplay.textContent = pin;
    startGameBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');
    waitingRestartMsg.classList.remove('hidden');
    hostQrContainer.classList.add('hidden');
    emojiBar.classList.remove('hidden'); // Jogadores veem botões de emoji
    showScreen(lobbyScreen);
});

socket.on('roomError', (msg) => {
    alert(msg);
    showScreen(loginScreen);
    backToOptions();
    emojiBar.classList.add('hidden');
});

// Atualizar o Lobby
socket.on('updateLobby', (players) => {
    playersList.innerHTML = "";
    players.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("player-chip");
        if (p.isHost) {
            div.innerHTML = `👑 <b style="font-size: 1.1rem;">${p.name}</b>`;
            div.style.borderColor = "var(--primary)";
            div.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.3)";
            div.style.padding = "10px 20px";
        } else {
            let kickHtml = isHost ? `<button class="kick-btn" onclick="socket.emit('kickPlayer', '${p.id}')" title="Expulsar">X</button>` : '';
            div.innerHTML = `<img src="${p.avatarUrl}" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1); margin-right: 15px; border: 3px solid var(--secondary); box-shadow: 0 0 15px var(--secondary-glow);"> <span style="font-size: 1.3rem; font-weight: 700; display:flex; align-items:center;">${p.name}</span> ${kickHtml}`;
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.justifyContent = "space-between"; // Para manter o X à direita
            div.style.padding = "5px 15px 5px 5px";
            div.style.flex = "1 1 auto";
        }
        playersList.appendChild(div);
    });
});

document.getElementById('copy-pin-btn')?.addEventListener('click', () => {
    const pin = lobbyPinDisplay.textContent;
    navigator.clipboard.writeText(pin).then(() => {
        const btn = document.getElementById('copy-pin-btn');
        btn.textContent = "Copiado!";
        setTimeout(() => btn.textContent = "Copiar", 2000);
    });
});

// EMOJIS
document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        socket.emit('sendEmoji', btn.textContent);
    });
});

socket.on('showEmoji', (data) => {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'emoji-sender-name';
    nameSpan.textContent = data.senderName;
    
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = data.emoji;

    el.appendChild(nameSpan);
    el.appendChild(emojiSpan);
    
    // Variação aleatória no cantinho esquerdo
    const randomLeft = 20 + (Math.random() * 60); 
    el.style.left = `${randomLeft}px`;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
});

startGameBtn.addEventListener("click", () => {
    socket.emit('startGame');
});

// Receber Nova Pergunta
socket.on('newQuestion', (data) => {
    showScreen(quizScreen);
    waitingMsg.classList.add('hidden');
    hostPanel.classList.add('hidden');
    optionsContainer.classList.remove('answered', 'show-answer');
    myAnswer = null;
    
    questionText.textContent = data.question;
    questionCount.textContent = `Q ${data.questionNumber}/${data.totalQuestions}`;
    updateTimer(data.timeLeft, 20);

    if (data.imageUrl) {
        questionImage.src = data.imageUrl;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    optionsContainer.innerHTML = "";
    currentOptions = data.options;

    data.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-card";
        button.innerHTML = `
            <div class="option-letter">${letters[index]}</div>
            <span>${option}</span>
        `;
        if (!isHost && !isEliminated) {
            button.onclick = () => submitAnswer(index, button);
        } else {
            button.disabled = true;
            button.style.cursor = "default";
        }
        optionsContainer.appendChild(button);
    });
    
    if (isHost) {
        hostPanel.classList.remove('hidden');
        optionsContainer.style.opacity = "0.7";
    }

    if (isEliminated) {
        waitingMsg.textContent = "Você foi eliminado! Assista e torça (ou mande emojis).";
        waitingMsg.classList.remove('hidden');
        waitingMsg.style.borderColor = "var(--error)";
    } else {
        waitingMsg.textContent = "Aguardando outros jogadores...";
        waitingMsg.style.borderColor = "rgba(255,255,255,0.1)";
    }
});

function updateTimer(timeLeft, maxTime = 20) {
    timerDisplay.textContent = timeLeft;
    const percentage = (timeLeft / maxTime) * 100;
    timerPath.style.strokeDasharray = `${percentage}, 100`;
    
    if (timeLeft <= 5 && timeLeft > 0) {
        timerPath.style.stroke = "var(--error)";
        playTick();
    } else {
        timerPath.style.stroke = "var(--secondary)";
    }
}

socket.on('timer', (timeLeft) => {
    updateTimer(timeLeft, 20);
});

// Host - Acompanhar Respostas
socket.on('playerAnswered', (data) => {
    if (isHost) {
        answeredCountSpan.textContent = data.answered;
        totalCountSpan.textContent = data.total;
    }
});

skipBtn.addEventListener("click", () => {
    if (isHost) socket.emit('skipQuestion');
});

// Enviar Resposta
function submitAnswer(selectedIndex, button) {
    if (isEliminated) return;
    myAnswer = selectedIndex;
    socket.emit('submitAnswer', selectedIndex);
    
    const options = document.querySelectorAll(".option-card");
    options.forEach(opt => opt.disabled = true);
    
    optionsContainer.classList.add('answered');
    button.classList.add('selected');
    waitingMsg.classList.remove('hidden');
}

// Mostrar Resposta e Placar Parcial
socket.on('showAnswer', (results) => {
    optionsContainer.classList.add('show-answer');
    
    const options = document.querySelectorAll(".option-card");
    options.forEach((btn, index) => {
        if (index === results.correctAnswer) {
            btn.classList.add('correct');
        } else if (index === myAnswer) {
            btn.classList.add('incorrect');
        }
    });

    setTimeout(() => {
        showScreen(leaderboardScreen);
        
        roundFeedback.classList.remove('correct', 'incorrect', 'hidden');
        
        const me = results.players.find(p => p.name === myName);
        if (me && me.eliminated) isEliminated = true;

        if (isHost) {
            roundFeedback.classList.add('hidden'); // Ocultar para o host
        } else if (isEliminated && myAnswer !== results.correctAnswer) {
            playWrongSound();
            feedbackIcon.textContent = "☠️";
            feedbackTitle.textContent = "ELIMINADO!";
            feedbackSubtitle.textContent = "Você está fora do modo sobrevivência.";
            roundFeedback.classList.add('incorrect');
        } else if (myAnswer === results.correctAnswer) {
            playCorrectSound();
            feedbackIcon.textContent = "✨";
            feedbackTitle.textContent = "Correto!";
            feedbackSubtitle.textContent = `+${me ? me.lastScore : 0} pontos` + (me && me.streak > 1 ? ` (🔥 Combo x${me.streak})` : "");
            roundFeedback.classList.add('correct');
        } else if (myAnswer === null) {
            playWrongSound();
            feedbackIcon.textContent = "⏳";
            feedbackTitle.textContent = "Tempo Esgotado!";
            feedbackSubtitle.textContent = "Mais sorte na próxima";
            roundFeedback.classList.add('incorrect');
        } else {
            playWrongSound();
            feedbackIcon.textContent = "❌";
            feedbackTitle.textContent = "Incorreto!";
            feedbackSubtitle.textContent = "A resposta era a Letra " + letters[results.correctAnswer];
            roundFeedback.classList.add('incorrect');
        }
        
        leaderboardList.innerHTML = "";
        results.players.slice(0, 5).forEach((p, index) => {
            const li = document.createElement("li");
            let prefix = `${index + 1}.`;
            if (index === 0) prefix = "🥇";
            else if (index === 1) prefix = "🥈";
            else if (index === 2) prefix = "🥉";

            const streakIcon = p.streak >= 3 ? `<span style="font-size: 1.2rem; margin-left: 5px;" title="Streak de ${p.streak}">🔥</span>` : "";
            const eliminatedText = p.eliminated ? `<span style="color: var(--error); font-size: 0.9rem; font-weight:bold; margin-left:10px;">ELIMINADO</span>` : "";

            li.innerHTML = `
                <div class="player-info-container">
                    <span class="rank-prefix" style="width: 35px; text-align: center;">${prefix}</span> 
                    <img src="${p.avatarUrl || ''}" class="player-avatar-img" alt="Avatar"> 
                    <span class="player-name-text" style="${p.eliminated ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${p.name} ${streakIcon} ${eliminatedText}</span>
                </div>
                <span class="points-text" style="font-size: 1.3rem;">${p.score} pts</span>
            `;
            leaderboardList.appendChild(li);
        });
    }, 2500);
});

socket.on('goToLobby', () => {
    showScreen(lobbyScreen);
});

// Fim de Jogo (Pódio Animado)
socket.on('gameOver', (players) => {
    showScreen(resultScreen);
    resultIconGlow.classList.add('hidden'); // Hide the generic trophy since we have a podium
    
    podiumContainer.innerHTML = "";
    finalLeaderboardList.innerHTML = "";
    
    // Top 3 (Ordem visual na tela: 2º Esquerda, 1º Centro, 3º Direita)
    const podiumPlayers = players.slice(0, 3);
    const podiumLayout = [];
    if (podiumPlayers[1]) podiumLayout.push({ p: podiumPlayers[1], pos: 2 });
    if (podiumPlayers[0]) podiumLayout.push({ p: podiumPlayers[0], pos: 1 });
    if (podiumPlayers[2]) podiumLayout.push({ p: podiumPlayers[2], pos: 3 });

    podiumLayout.forEach(item => {
        const pillar = document.createElement('div');
        pillar.className = `podium-pillar podium-${item.pos}`;
        
        pillar.innerHTML = `
            <img src="${item.p.avatarUrl}" class="podium-avatar">
            <span style="font-weight: 800; font-size: 1.2rem; margin-top: 10px; color: var(--text-main); text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${item.p.name}</span>
            <span style="font-weight: 600; font-size: 1rem; opacity: 0.8;">${item.p.score} pts</span>
            <div style="font-size: 3rem; margin-top: auto; padding-bottom: 10px; opacity: 0.3; font-weight: 800;">${item.pos}º</div>
        `;
        podiumContainer.appendChild(pillar);
    });

    // Ranking final para o restante
    players.slice(3).forEach((p, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="player-info-container">
                <span class="rank-prefix" style="width: 40px; text-align: center;">${index + 4}.</span> 
                <img src="${p.avatarUrl || ''}" class="player-avatar-img" alt="Avatar" style="width: 40px; height: 40px;"> 
                <span class="player-name-text">${p.name}</span>
            </div>
            <span class="points-text" style="font-size: 1.1rem;">${p.score} pts</span>
        `;
        finalLeaderboardList.appendChild(li);
    });

    if (players.length > 0) {
        triggerConfetti(players[0].name === myName);
        if (players[0].name === myName) {
            playCorrectSound(); // Celebração extra pro vencedor
        }
    }
});

restartBtn.addEventListener("click", () => {
    socket.emit('returnToLobby');
});

// Efeito de Confetti
function triggerConfetti(isWinner) {
    if (typeof confetti === 'function') {
        if (isWinner || isHost) {
            var duration = 4000;
            var end = Date.now() + duration;

            (function frame() {
                confetti({ particleCount: 8, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#facc15', '#10b981', '#06b6d4', '#f8fafc'] });
                confetti({ particleCount: 8, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#facc15', '#10b981', '#06b6d4', '#f8fafc'] });

                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        } else {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#94a3b8', '#f8fafc'] });
        }
    }
}
