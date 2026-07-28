window.requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(f){ return setTimeout(f, 1000/60); };

var score = 0;
var lives = 100;
var keysDown = {};
var gameStarted = false;

// Audio setup
var music = new Audio("music/5966459_space-shooter-theme_by_mpaudiosolutions_preview.mp3");
music.loop = true;

addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;

    if (!gameStarted) {
        music.play().catch(err => console.log("Audio play blocked until user interaction."));
        gameStarted = true;
    }
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

class Game {
    constructor() {
        this.canvas = document.getElementById("myCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.sprites = [];
        this.img = new Image();
        this.imgheight = 0;
        this.scrollSpeed = 2;
        this.img.src = "images/space.PNG"; 

        // State Flags
        this.isGameOver = false;
        this.isWin = false;
    }

    update() {
        // Stop updating physics/collisions if game ended
        if (this.isGameOver || this.isWin) return;

        // Check Win Condition (Win takes priority if both occur on same frame)
        if (score >= 50) { // Set your win target here
            this.isWin = true;
            return;
        }

        // Check Loss Condition
        if (lives <= 0) {
            lives = 0;
            this.isGameOver = true;
            return;
        }

        // Update all sprites
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].update(this.sprites);
        }

        // Clean up dead/off-screen sprites
        this.sprites = this.sprites.filter(sprite => {
            if (sprite instanceof enemies) return sprite.status !== 0;
            if (sprite instanceof bullets || sprite instanceof Enemybullets) return sprite.state !== 0;
            return true;
        });
    }

    addSprites(pSprites) {
        this.sprites.push(pSprites);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Scrolling background
        if (this.img.complete && this.img.naturalWidth !== 0) {
            this.ctx.drawImage(this.img, 0, this.imgheight);
            this.ctx.drawImage(this.img, 0, this.imgheight - this.canvas.height);
            this.imgheight += this.scrollSpeed;
            if (this.imgheight >= this.canvas.height) {
                this.imgheight = 0;
            }
        }

        // Draw active sprites
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].draw(this.ctx);
        }

        // HUD Overlay
        this.ctx.fillStyle = "rgb(250, 250, 250)";
        this.ctx.font = "24px Helvetica";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.fillText("Score: " + score, 20, 30);
        this.ctx.fillText("Lives: " + lives, 20, 60);

        // End Game Messages (Drawn ONCE here, not in individual sprites)
        if (this.isWin) {
            this.drawOverlay("YOU WIN!", "Press Reload to play again");
        } else if (this.isGameOver) {
            this.drawOverlay("GAME OVER", "Press Reload to try again");
        }
    }

    drawOverlay(title, subtitle) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "rgb(250, 250, 250)";
        this.ctx.textAlign = "center";
        
        this.ctx.font = "bold 48px Helvetica";
        this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.font = "24px Helvetica";
        this.ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
}

class Sprite {
    constructor() {}
    update() {}
    draw(pCtx) {}
}

class SpaceShip extends Sprite {
    constructor(pGame) {
        super();
        this.x = 500;
        this.y = 650;
        this.w = 60;
        this.h = 50;
        this.dx = 8;
        this.img = new Image();
        this.img.src = "images/Ship.png"; 
        this.gGame = pGame;
        this.counter = 60;
        this.shootAudio = new Audio("music/20831111_blaster-one-shot_by_spectrumstockmusic_preview.mp3");
    }

    update() {
        if (39 in keysDown && this.x <= 900) this.x += this.dx;
        if (37 in keysDown && this.x >= 0) this.x -= this.dx;
        if (38 in keysDown && this.y >= 400) this.y -= 8;
        if (40 in keysDown && this.y <= 650) this.y += 8;

        this.counter++;
        if (32 in keysDown && this.counter >= 15) {
            this.shootAudio.currentTime = 0;
            this.shootAudio.play().catch(() => {});
            this.gGame.addSprites(new bullets(this.x + this.w / 2 - 2, this.y, 7));
            this.counter = 0;
        }
    }

    draw(ctx) {
        if (this.img.complete && this.img.naturalWidth !== 0) {
            ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
        }
    }
}

class enemies extends Sprite {
    constructor(x, y, speed, pGame) {
        super();
        this.x = x;
        this.y = y;
        this.w = 50;
        this.h = 50;
        this.status = 1;
        this.speed = speed;
        this.eimage = new Image();
        this.eimage.src = "images/rship.png"; 
        this.pGame = pGame;
        this.counter = Math.floor(Math.random() * 60);
    }

    update(lArrayofSprites) {
        this.y += 1.5;
        if (this.y >= 750) this.reset();

        this.counter++;
        if (this.counter >= 90) {
            this.pGame.addSprites(new Enemybullets(this.x + this.w / 2, this.y + this.h, 4));
            this.counter = 0;
        }

        for (var i = 0; i < lArrayofSprites.length; i++) {
            if (lArrayofSprites[i] instanceof SpaceShip) {
                if (this.collideWithShip(lArrayofSprites[i])) {
                    this.reset();
                    lives = Math.max(0, lives - 5);
                }
            }
        }
    }

    reset() {
        this.y = -50;
        this.x = Math.random() * 850;
    }

    collideWithShip(pobject) {
        return (
            pobject.x + pobject.w >= this.x &&
            pobject.x <= this.x + this.w &&
            pobject.y + pobject.h >= this.y &&
            pobject.y <= this.y + this.h
        );
    }

    draw(ctx) {
        if (this.status === 1 && this.eimage.complete && this.eimage.naturalWidth !== 0) {
            ctx.drawImage(this.eimage, this.x, this.y, this.w, this.h);
        }
    }
}

class bullets extends Sprite {
    constructor(x, y, speed) {
        super();
        this.x = x;
        this.y = y;
        this.w = 4;
        this.h = 14;
        this.state = 1;
        this.speed = speed;
        this.bimage = new Image();
        this.destroyed = new Audio("music/7654170_space-shooter-blaster_by_cactusbear_preview.mp3");
        this.bimage.src = "images/bullet.png"; 
    }

    update(lArrayofSprites) {
        this.y -= this.speed;

        if (this.y <= -20) {
            this.state = 0;
        }

        for (var i = 0; i < lArrayofSprites.length; i++) {
            if (lArrayofSprites[i] instanceof enemies) {
                if (this.collideWithEnemy(lArrayofSprites[i])) {
                    lArrayofSprites[i].reset();
                    score += 1;
                    this.state = 0;
                    this.destroyed.currentTime = 0;
                    this.destroyed.play().catch(() => {});
                }
            }
        }
    }

    collideWithEnemy(pobject) {
        return (
            pobject.x + pobject.w >= this.x &&
            pobject.x <= this.x + this.w &&
            pobject.y + pobject.h >= this.y &&
            pobject.y <= this.y + this.h
        );
    }

    draw(ctx) {
        if (this.state === 1 && this.bimage.complete && this.bimage.naturalWidth !== 0) {
            ctx.drawImage(this.bimage, this.x, this.y, this.w, this.h);
        }
    }
}

class Enemybullets extends Sprite {
    constructor(x, y, speed) {
        super();
        this.x = x;
        this.y = y;
        this.w = 4;
        this.h = 14;
        this.state = 1;
        this.speed = speed;
        this.bimage = new Image();
        this.bimage.src = "images/bullet.png"; 
    }

    update(lArrayofSprites) {
        this.y += this.speed;

        if (this.y >= 770) {
            this.state = 0;
        }

        for (var i = 0; i < lArrayofSprites.length; i++) {
            if (lArrayofSprites[i] instanceof SpaceShip) {
                if (this.collideWithPlayer(lArrayofSprites[i])) {
                    this.state = 0;
                    lives = Math.max(0, lives - 1);
                }
            }
        }
    }

    collideWithPlayer(pobject) {
        return (
            pobject.x + pobject.w >= this.x &&
            pobject.x <= this.x + this.w &&
            pobject.y + pobject.h >= this.y &&
            pobject.y <= this.y + this.h
        );
    }

    draw(ctx) {
        if (this.state === 1 && this.bimage.complete && this.bimage.naturalWidth !== 0) {
            ctx.drawImage(this.bimage, this.x, this.y, this.w, this.h);
        }
    }
}

// Initialization
var myGame = new Game();
var ship = new SpaceShip(myGame);
myGame.addSprites(ship);

for (let i = 0; i < 6; i++) {
    myGame.addSprites(new enemies(i * 150 + 50, Math.random() * -200, 2, myGame));
}

function animate() {
    myGame.update();
    myGame.draw();
    requestAnimationFrame(animate);
}

animate();