const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");
const startScreenEl = document.getElementById("start-screen");
const gameOverEl = document.getElementById("game-over");

let score = 0;
let gameState = "START"; // "START", "PLAYING", "GAMEOVER"

// Player (Chef Hat)
const player = {
    x: 185,
    y: 500,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    gravity: 0.38,
    jumpStrength: -11.5, // Increased bounce strength to guarantee reaching next platform
    speed: 5
};

// Controls
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (gameState === "START" && (e.key === " " || e.key === "Enter")) {
        startGame();
    }
});
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Platforms - Gap maximum fixed to <= 120px
let platforms = [];

function generateInitialPlatforms() {
    platforms = [
        { x: 140, y: 550, width: 120, height: 15, speed: 0 },
        { x: 60,  y: 430, width: 100, height: 15, speed: 1.2 },
        { x: 220, y: 310, width: 100, height: 15, speed: -1.5 },
        { x: 90,  y: 190, width: 100, height: 15, speed: 1.5 },
        { x: 200, y: 70,  width: 100, height: 15, speed: -1.2 }
    ];
}

// Items
let items = [];

function generateInitialItems() {
    items = [
        { x: 100, y: 390, radius: 12, type: 'good' },
        { x: 260, y: 270, radius: 12, type: 'burnt' },
        { x: 130, y: 150, radius: 12, type: 'good' }
    ];
}

function startGame() {
    score = 0;
    scoreEl.textContent = score;
    gameState = "PLAYING";
    startScreenEl.style.display = "none";
    gameOverEl.style.display = "none";
    resetPlayerPosition();
    generateInitialPlatforms();
    generateInitialItems();
}

function resetPlayerPosition() {
    player.x = 185;
    player.y = 500;
    player.vx = 0;
    player.vy = player.jumpStrength;
}

function drawPlayer() {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Red Band
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(player.x, player.y + player.height - 8, player.width, 8);
}

function drawPlatforms() {
    ctx.fillStyle = "#8d6e63";
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = "#5d4037";
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });
}

function drawItems() {
    items.forEach(item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        if (item.type === 'good') {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.strokeStyle = "#d84315";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "#c62828";
            ctx.beginPath();
            ctx.arc(item.x - 3, item.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = "#3e2723";
            ctx.fill();
            ctx.strokeStyle = "#1b0000";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function update() {
    if (gameState !== "PLAYING") return;

    // Movement
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) player.vx = -player.speed;
    else if (keys["ArrowRight"] || keys["d"] || keys["D"]) player.vx = player.speed;
    else player.vx = 0;

    player.vy += player.gravity;
    player.x += player.vx;
    player.y += player.vy;

    // Screen wrap sides
    if (player.x < -player.width) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    // Moving platforms & jump bounce
    platforms.forEach(p => {
        p.x += p.speed;
        if (p.x <= 0 || p.x + p.width >= canvas.width) {
            p.speed *= -1;
        }

        if (
            player.vy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height >= p.y &&
            player.y + player.height <= p.y + p.height + player.vy + 4
        ) {
            player.vy = player.jumpStrength;
        }
    });

    // Item Collection
    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        let dx = (player.x + player.width/2) - it.x;
        let dy = (player.y + player.height/2) - it.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.width/2 + it.radius) {
            if (it.type === 'good') {
                score += 1;
                scoreEl.textContent = score;
                it.y = Math.random() * 200;
                it.x = Math.random() * (canvas.width - 40) + 20;
            } else if (it.type === 'burnt') {
                endGame();
            }
        }
    }

    // Camera scrolling
    if (player.y < canvas.height / 2) {
        let diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;

        platforms.forEach(p => {
            p.y += diff;
            if (p.y > canvas.height) {
                p.y = -15;
                p.width = 90 + Math.random() * 20;
                p.x = Math.random() * (canvas.width - p.width);
                p.speed = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
            }
        });

        items.forEach(it => {
            it.y += diff;
            if (it.y > canvas.height) {
                it.y = -20;
                it.x = Math.random() * (canvas.width - 40) + 20;
                it.type = Math.random() > 0.35 ? 'good' : 'burnt';
            }
        });
    }

    if (player.y > canvas.height) {
        endGame();
    }
}

function endGame() {
    gameState = "GAMEOVER";
    finalScoreEl.textContent = score;
    gameOverEl.style.display = "flex";
}

function resetGame() {
    startGame();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === "PLAYING") {
        update();
    }
    drawPlatforms();
    drawItems();
    drawPlayer();
    requestAnimationFrame(gameLoop);
}

generateInitialPlatforms();
generateInitialItems();
gameLoop();
