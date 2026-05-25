const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: red;">⚠️ Erro: Arquivos do Site Não Encontrados!</h1>
            <h2>O servidor Node.js está rodando perfeitamente no Render!</h2>
            <p>Porém, ele não conseguiu encontrar a sua pasta <b>public</b>.</p>
            <p>Isso acontece porque quando você enviou os arquivos para o GitHub, você provavelmente <b>esqueceu de enviar a pasta "public"</b> (onde ficam o index.html, style.css e script.js).</p>
            <p><b>Solução:</b> Vá no seu GitHub e faça o upload da pasta "public" inteira para lá. O Render vai atualizar automaticamente em alguns minutos!</p>
        </div>
    `);
});

const defaultQuestions = [
    { question: "Qual das opções abaixo melhor define o termo 'Energia Limpa'?", options: ["Energia gerada pela queima de combustíveis", "Energia que não lança poluentes na atmosfera", "Energia extraída do carvão vegetal", "Qualquer energia muito barata"], answer: 1, imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80" },
    { question: "Qual é o foco principal do ODS 7?", options: ["Erradicação da pobreza", "Energia limpa e acessível", "Água potável e saneamento", "Educação de qualidade"], answer: 1, imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80" },
    { question: "Qual das seguintes fontes de energia é considerada limpa e renovável?", options: ["Carvão mineral", "Gás Natural", "Petróleo", "Energia Solar"], answer: 3, imageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80" },
    { question: "Por que é importante investir em energia limpa e acessível?", options: ["Para reduzir a emissão de gases de efeito estufa", "Para aumentar o aquecimento global", "Para esgotar os recursos naturais", "Para tornar a energia mais cara"], answer: 0, imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80" },
    { question: "Até que ano a ONU estabeleceu a meta de garantir acesso universal a serviços de energia modernos?", options: ["2025", "2040", "2030", "2050"], answer: 2, imageUrl: null },
    { question: "Qual é a principal fonte de energia consumida no mundo atualmente?", options: ["Energia Solar", "Energia Nuclear", "Combustíveis Fósseis", "Energia Eólica"], answer: 2, imageUrl: null },
    { question: "O que é matriz energética?", options: ["A quantidade de energia consumida por uma pessoa", "O conjunto de fontes de energia utilizadas em uma região ou país", "O processo de gerar energia a partir do sol", "Uma forma de medir a poluição do ar"], answer: 1, imageUrl: null },
    { question: "Qual país é o maior produtor de energia solar do mundo?", options: ["Brasil", "Estados Unidos", "China", "Alemanha"], answer: 2, imageUrl: null },
    { question: "A energia eólica é gerada a partir de qual recurso natural?", options: ["Ventos", "Marés", "Luz do sol", "Calor interno da Terra"], answer: 0, imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80" },
    { question: "O que significa o termo 'eficiência energética'?", options: ["Produzir o máximo de energia possível", "Usar menos energia para realizar a mesma tarefa", "Desperdiçar energia de forma controlada", "Usar apenas energia solar em casa"], answer: 1, imageUrl: null },
    { question: "O que é a energia de Biomassa?", options: ["Energia gerada através de fissão nuclear", "Energia gerada a partir de matéria orgânica", "Energia das marés", "Energia vinda do calor da terra"], answer: 1, imageUrl: null },
    { question: "Qual o principal benefício da energia limpa para a saúde pública?", options: ["Redução de doenças respiratórias", "Aumento da imunidade contra vírus", "Prevenção de doenças genéticas", "Redução de doenças infecciosas"], answer: 0, imageUrl: null },
    { question: "A energia hidrelétrica é muito usada no Brasil. Qual é seu impacto ambiental?", options: ["Emissão massiva de CO2", "Inundação de grandes áreas e impacto na fauna", "Poluição radioativa", "Geração de chuva ácida"], answer: 1, imageUrl: "https://images.unsplash.com/photo-1548695607-9c73430ba065?w=800&q=80" },
    { question: "O que são 'green jobs' (empregos verdes)?", options: ["Trabalhos em florestas", "Empregos no agronegócio", "Trabalhos que preservam o meio ambiente", "Empregos voluntários"], answer: 2, imageUrl: null },
    { question: "Qual destas tecnologias é essencial para o futuro da energia renovável?", options: ["Motores a diesel", "Baterias de alta capacidade", "Fornos a carvão", "Centrais nucleares"], answer: 1, imageUrl: null },
    { question: "O biogás é uma fonte gerada pela decomposição. Ele é composto por:", options: ["Oxigênio", "Nitrogênio", "Hélio", "Metano"], answer: 3, imageUrl: null },
    { question: "O que são painéis fotovoltaicos?", options: ["Equipamentos que aquecem a água", "Conversores de luz solar em eletricidade", "Painéis de propaganda eficientes", "Geradores movidos a vento"], answer: 1, imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" },
    { question: "O que significa 'acessível' no contexto do ODS 7?", options: ["Para grandes empresas", "Energia com preço justo e que chegue a todos", "Fácil de fabricar", "Energia importada"], answer: 1, imageUrl: null },
    { question: "Qual a energia renovável proveniente do calor do interior da Terra?", options: ["Geotérmica", "Eólica", "Solar", "Hidrelétrica"], answer: 0, imageUrl: null }
];

// Estrutura de dados das salas
const rooms = {};
const socketRoomMap = {};

function generatePIN() {
    let pin;
    do {
        pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digitos
    } while (rooms[pin]);
    return pin;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. Criar uma nova sala
    socket.on('createRoom', (data) => {
        const name = typeof data === 'object' ? data.name : data;
        const customQuestions = typeof data === 'object' && data.questions && data.questions.length > 0 ? data.questions : null;
        const gameMode = typeof data === 'object' && data.gameMode ? data.gameMode : 'classic';
        
        const pin = generatePIN();
        rooms[pin] = {
            pin: pin,
            hostId: socket.id,
            gameMode: gameMode,
            gameState: 'LOBBY',
            questions: customQuestions || defaultQuestions,
            players: {},
            currentQuestionIndex: 0,
            timer: null,
            timeout: null,
            timeLeft: 0
        };
        
        socket.join(pin);
        socketRoomMap[socket.id] = pin;
        
        // Adiciona o host como jogador também (avatar padronizado para o host)
        rooms[pin].players[socket.id] = { 
            id: socket.id, 
            name: name || 'Anfitrião', 
            score: 0, 
            answer: null,
            answerTimeLeft: 0,
            streak: 0,
            eliminated: false,
            avatarUrl: ''
        };
        
        socket.emit('roomCreated', pin);
        emitLobbyUpdate(pin);
    });

    // 2. Entrar em uma sala existente
    socket.on('joinRoom', (data) => {
        const pin = data.pin;
        const name = data.name;
        const avatarUrl = data.avatarUrl;

        if (rooms[pin] && rooms[pin].gameState === 'LOBBY') {
            socket.join(pin);
            socketRoomMap[socket.id] = pin;
            rooms[pin].players[socket.id] = { 
                id: socket.id, 
                name: name || 'Convidado', 
                score: 0, 
                answer: null,
                answerTimeLeft: 0,
                streak: 0,
                eliminated: false,
                avatarUrl: avatarUrl
            };
            
            socket.emit('roomJoined', pin);
            emitLobbyUpdate(pin);
        } else {
            socket.emit('roomError', 'Sala não encontrada ou jogo já em andamento.');
        }
    });

    // 3. Iniciar Jogo (Apenas Host)
    socket.on('startGame', () => {
        const pin = socketRoomMap[socket.id];
        const room = rooms[pin];
        
        if (room && room.hostId === socket.id && (room.gameState === 'LOBBY' || room.gameState === 'LEADERBOARD')) {
            room.currentQuestionIndex = 0;
            for (let id in room.players) {
                room.players[id].score = 0;
                room.players[id].eliminated = false;
            }
            sendQuestion(pin);
        }
    });

    // 4. Receber Resposta
    socket.on('submitAnswer', (index) => {
        const pin = socketRoomMap[socket.id];
        const room = rooms[pin];

        if (room && room.gameState === 'QUESTION' && room.players[socket.id] && room.players[socket.id].answer === null && room.hostId !== socket.id && !room.players[socket.id].eliminated) {
            room.players[socket.id].answer = index;
            room.players[socket.id].answerTimeLeft = room.timeLeft;
            
            // Verifica quantos responderam (ignorando host e eliminados)
            const playersOnly = Object.values(room.players).filter(p => p.id !== room.hostId && !p.eliminated);
            const answeredCount = playersOnly.filter(p => p.answer !== null).length;
            
            // Avisa a sala sobre a nova resposta (para o host atualizar o contador)
            io.to(pin).emit('playerAnswered', { answered: answeredCount, total: playersOnly.length });
            
            if (playersOnly.length > 0 && answeredCount === playersOnly.length) {
                endQuestion(pin);
            }
        }
    });

    // Pular Pergunta (Apenas Host)
    socket.on('skipQuestion', () => {
        const pin = socketRoomMap[socket.id];
        const room = rooms[pin];
        if (room && room.hostId === socket.id && room.gameState === 'QUESTION') {
            endQuestion(pin);
        }
    });

    // 5. Reiniciar Sala (Apenas Host)
    socket.on('returnToLobby', () => {
        const pin = socketRoomMap[socket.id];
        const room = rooms[pin];

        if (room && room.hostId === socket.id && room.gameState === 'LEADERBOARD') {
            resetRoom(pin);
            io.to(pin).emit('goToLobby');
            emitLobbyUpdate(pin);
        }
    });

    // --- PODERES DO HOST & REAÇÕES ---
    socket.on('kickPlayer', (playerId) => {
        const pin = socketRoomMap[socket.id];
        const room = rooms[pin];
        if (room && room.hostId === socket.id && room.players[playerId]) {
            io.to(playerId).emit('roomError', 'Você foi expulso da sala pelo anfitrião.');
            io.sockets.sockets.get(playerId)?.leave(pin);
            delete room.players[playerId];
            delete socketRoomMap[playerId];
            emitLobbyUpdate(pin);
        }
    });

    socket.on('sendEmoji', (emoji) => {
        const pin = socketRoomMap[socket.id];
        if (pin && rooms[pin]) {
            const senderName = rooms[pin].players[socket.id] ? rooms[pin].players[socket.id].name : "Alguém";
            io.to(pin).emit('showEmoji', { emoji: emoji, senderName: senderName });
        }
    });
    // ---------------------------------

    // 6. Desconexão
    socket.on('disconnect', () => {
        const pin = socketRoomMap[socket.id];
        if (pin && rooms[pin]) {
            const room = rooms[pin];
            delete room.players[socket.id];
            delete socketRoomMap[socket.id];

            // Se a sala ficou vazia, destrói a sala
            if (Object.keys(room.players).length === 0) {
                if (room.timer) clearInterval(room.timer);
                if (room.timeout) clearTimeout(room.timeout);
                delete rooms[pin];
                console.log(`Room ${pin} destroyed.`);
            } else {
                // Se o Host saiu, a sala é encerrada para todos
                if (room.hostId === socket.id) {
                    io.to(pin).emit('roomError', 'O criador da sala se desconectou.');
                    io.to(pin).socketsLeave(pin);
                    if (room.timer) clearInterval(room.timer);
                    if (room.timeout) clearTimeout(room.timeout);
                    delete rooms[pin];
                } else {
                    // Apenas atualiza o lobby ou checa se os restantes já responderam
                    if (room.gameState === 'LOBBY') {
                        emitLobbyUpdate(pin);
                    } else if (room.gameState === 'QUESTION') {
                        const playersOnly = Object.values(room.players).filter(p => p.id !== room.hostId && !p.eliminated);
                        const answeredCount = playersOnly.filter(p => p.answer !== null).length;
                        io.to(pin).emit('playerAnswered', { answered: answeredCount, total: playersOnly.length });
                        
                        if (playersOnly.length > 0 && answeredCount === playersOnly.length) {
                            endQuestion(pin);
                        }
                    }
                }
            }
        }
    });
});

function resetRoom(pin) {
    const room = rooms[pin];
    room.gameState = 'LOBBY';
    room.currentQuestionIndex = 0;
    if (room.timer) clearInterval(room.timer);
    if (room.timeout) clearTimeout(room.timeout);
    for (let id in room.players) {
        room.players[id].score = 0;
        room.players[id].answer = null;
        room.players[id].answerTimeLeft = 0;
        room.players[id].streak = 0;
        room.players[id].eliminated = false;
    }
}

function emitLobbyUpdate(pin) {
    const room = rooms[pin];
    if (!room) return;
    
    const playersList = Object.values(room.players).map(p => ({
        ...p,
        isHost: p.id === room.hostId
    }));
    
    io.to(pin).emit('updateLobby', playersList);
}

function getCurrentQuestionData(pin) {
    const room = rooms[pin];
    const q = room.questions[room.currentQuestionIndex];
    return {
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options,
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
        timeLeft: room.timeLeft
    };
}

function sendQuestion(pin) {
    const room = rooms[pin];
    room.gameState = 'QUESTION';
    for (let id in room.players) {
        room.players[id].answer = null;
        room.players[id].answerTimeLeft = 0;
    }
    
    room.timeLeft = 20;
    io.to(pin).emit('newQuestion', getCurrentQuestionData(pin));
    
    // Envia o status inicial de respostas (0 / total ativos)
    const playersOnly = Object.values(room.players).filter(p => p.id !== room.hostId && !p.eliminated);
    io.to(pin).emit('playerAnswered', { answered: 0, total: playersOnly.length });
    
    if (room.timer) clearInterval(room.timer);
    
    room.timer = setInterval(() => {
        room.timeLeft--;
        io.to(pin).emit('timer', room.timeLeft);
        if (room.timeLeft <= 0) {
            endQuestion(pin);
        }
    }, 1000);
}

function endQuestion(pin) {
    const room = rooms[pin];
    if (room.timer) clearInterval(room.timer);
    room.gameState = 'SHOW_ANSWER';
    const q = room.questions[room.currentQuestionIndex];
    
    const playersOnly = Object.values(room.players).filter(p => p.id !== room.hostId);
    
    for (let p of playersOnly) {
        if (p.eliminated) continue;

        if (p.answer === q.answer) {
            p.streak++;
            const baseScore = 500 + Math.floor((p.answerTimeLeft / 20) * 500);
            const bonus = p.streak > 1 ? (p.streak - 1) * 100 : 0;
            p.lastScore = baseScore + bonus;
            p.score += p.lastScore;
        } else {
            p.streak = 0;
            p.lastScore = 0;
            if (room.gameMode === 'survival') {
                p.eliminated = true;
            }
        }
    }
    
    const results = {
        correctAnswer: q.answer,
        players: playersOnly.map(p => ({
            name: p.name,
            score: p.score,
            streak: p.streak,
            lastScore: p.lastScore,
            eliminated: p.eliminated,
            avatarUrl: p.avatarUrl
        })).sort((a, b) => b.score - a.score)
    };
    
    io.to(pin).emit('showAnswer', results);
    
    room.timeout = setTimeout(() => {
        room.currentQuestionIndex++;
        // Check if there are any non-eliminated players left in survival mode
        const activePlayers = playersOnly.filter(p => !p.eliminated).length;

        if (room.currentQuestionIndex < room.questions.length && (room.gameMode === 'classic' || activePlayers > 0)) {
            sendQuestion(pin);
        } else {
            room.gameState = 'LEADERBOARD';
            io.to(pin).emit('gameOver', playersOnly.map(p => ({
                name: p.name,
                score: p.score,
                streak: p.streak,
                eliminated: p.eliminated,
                avatarUrl: p.avatarUrl
            })).sort((a,b) => b.score - a.score));
        }
    }, 5000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
