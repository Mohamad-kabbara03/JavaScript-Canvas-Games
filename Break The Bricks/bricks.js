// Keyboard Input
const inputKeys = {};
let score = 0;
let lives = 3;

addEventListener('keydown', (e) => { inputKeys[e.code] = true; }, false);
addEventListener('keyup', (e) => { inputKeys[e.code] = false; }, false);

// Game Engine Class
class Game {
    constructor() {
        this.canvas = document.getElementById("myCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.sprites = [];
    }

    update() {
        for (let sprite of this.sprites) {
            sprite.update(this.sprites);
        }
    }

    draw() {
        // Clear background with dark aesthetic
        this.ctx.fillStyle = "#1e1e24";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let sprite of this.sprites) {
            sprite.draw(this.ctx);
        }

        this.drawUI();
    }

    drawUI() {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 20px 'Segoe UI', sans-serif";
        this.ctx.fillText(`Score: ${score}`, 20, 35);
        this.ctx.fillText(`Lives: ${lives}`, this.canvas.width - 100, 35);

        if (score === 15) {
            this.drawOverlay("YOU WIN!", "#4CAF50");
        } else if (lives <= 0) {
            this.drawOverlay("GAME OVER", "#E53935");
        }
    }

    drawOverlay(title, color) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = color;
        this.ctx.font = "bold 48px 'Segoe UI', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "20px 'Segoe UI', sans-serif";
        this.ctx.fillText("Reload page to play again", this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.textAlign = "start"; // reset alignment
    }

    addSprite(pSprite) {
        this.sprites.push(pSprite);
    }
}

class Sprite {
    update() {}
    draw(ctx) {}
}

class Ball extends Sprite {
    constructor(centerX, centerY, radius, color) {
        super();
        this.x = centerX;
        this.y = centerY;
        this.r = radius;
        this.color = color;

        // Base speed magnitude
        this.speed = 5;
        this.dx = 3;
        this.dy = -3;
        this.gameOver = false;
    }

    update() {
        if (lives <= 0 || score >= 15) return;

        // Move Ball
        this.x += this.dx;
        this.y += this.dy;

        // Wall Collisions (Left & Right)
        if (this.x - this.r <= 0) {
            this.x = this.r;
            this.dx = Math.abs(this.dx); // force right
        } else if (this.x + this.r >= 800) {
            this.x = 800 - this.r;
            this.dx = -Math.abs(this.dx); // force left
        }

        // Top Wall Collision
        if (this.y - this.r <= 0) {
            this.y = this.r;
            this.dy = Math.abs(this.dy); // force down
        }

        // Bottom Boundary (Life Lost)
        if (this.y - this.r > 600) {
            lives--;
            this.reset();
        }
    }

    reset() {
        this.x = 400;
        this.y = 350;
        this.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
        this.dy = -3;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
        ctx.closePath();
    }
}

class Paddle extends Sprite {
    constructor(pX, pY, pW, pH, pColor, pBall) {
        super();
        this.x = pX;
        this.y = pY;
        this.w = pW;
        this.h = pH;
        this.color = pColor;
        this.ball = pBall;
        this.speed = 7;
    }

    update() {
        if (lives <= 0 || score >= 15) return;

        // Smooth Movement (Key A or Left Arrow / Key D or Right Arrow)
        if ((inputKeys['KeyA'] || inputKeys['ArrowLeft']) && this.x > 0) {
            this.x -= this.speed;
        }
        if ((inputKeys['KeyD'] || inputKeys['ArrowRight']) && (this.x + this.w) < 800) {
            this.x += this.speed;
        }

        // Ball Collision Check
        if (
            this.ball.x + this.ball.r >= this.x &&
            this.ball.x - this.ball.r <= this.x + this.w &&
            this.ball.y + this.ball.r >= this.y &&
            this.ball.y - this.ball.r <= this.y + this.h &&
            this.ball.dy > 0 // Only hit when falling down
        ) {
            // Angle reflection based on where the ball hits the paddle
            let hitPoint = (this.ball.x - (this.x + this.w / 2)) / (this.w / 2);
            this.ball.dx = hitPoint * 5; 
            this.ball.dy = -Math.abs(this.ball.dy); // reflect up
            this.ball.y = this.y - this.ball.r; // prevent sticking
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        // Rounded rectangle for aesthetic paddle
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Brick extends Sprite {
    constructor(brickWidth, brickHeight, posX, posY, pColor, pBall) {
        super();
        this.x = posX;
        this.y = posY;
        this.w = brickWidth;
        this.h = brickHeight;
        this.color = pColor;
        this.ball = pBall;
        this.active = true;
    }

    update() {
        if (!this.active) return;

        // AABB Collision check
        if (
            this.ball.x + this.ball.r >= this.x &&
            this.ball.x - this.ball.r <= this.x + this.w &&
            this.ball.y + this.ball.r >= this.y &&
            this.ball.y - this.ball.r <= this.y + this.h
        ) {
            this.active = false;
            this.ball.dy = -this.ball.dy; // Bounce ball
            score++;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 4);
        ctx.fill();
    }
}

// Initialization
const myGame = new Game();
const lBall = new Ball(400, 350, 8, '#00E5FF');

// Add Bricks in grid formation dynamically
const rows = 3;
const cols = 5;
const brickW = 130;
const brickH = 25;
const padding = 20;
const offsetLeft = 35;
const offsetTop = 60;
const colors = ['#FF5252', '#FF4081', '#E040FB'];

for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        let bx = offsetLeft + c * (brickW + padding);
        let by = offsetTop + r * (brickH + padding);
        myGame.addSprite(new Brick(brickW, brickH, bx, by, colors[r], lBall));
    }
}

const paddle = new Paddle(335, 530, 130, 16, '#00E676', lBall);
myGame.addSprite(lBall);
myGame.addSprite(paddle);

// Game Loop
function animate() {
    myGame.update();
    myGame.draw();
    requestAnimationFrame(animate);
}

animate();