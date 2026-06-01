let particles = [];
let missiles = [];
let explosions = [];
let palette = ['#fbf8cc', '#fde4cf', '#ffcfd2', '#f1c0e8', '#cfbaf0', '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0'];
let lastSpawnTime = 0;
let score = 0;
let timeLeft = 30; // 設定挑戰時間為 30 秒
let gameState = "PLAYING"; // PLAYING, GAMEOVER
let restartBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 建立重新開始按鈕，初始隱藏
  restartBtn = createButton('重新開始');
  restartBtn.style('font-size', '20px');
  restartBtn.style('padding', '10px 20px');
  restartBtn.position(width / 2 - 50, height / 2 + 50);
  restartBtn.mousePressed(restartGame);
  restartBtn.hide();

  initGame();
}

function initGame() {
  particles = [];
  missiles = [];
  explosions = [];
  score = 0;
  timeLeft = 30;
  gameState = "PLAYING";
  lastSpawnTime = millis();
  
  // 初始產生 10 個物件
  for (let i = 0; i < 10; i++) {
    spawnParticle();
  }
}

function draw() {
  background(0); // 背景設定為黑色

  if (gameState === "PLAYING") {
    // 處理倒數計時
    if (frameCount % 60 === 0 && timeLeft > 0) {
      timeLeft--;
    }
    if (timeLeft <= 0) {
      gameState = "GAMEOVER";
      restartBtn.show();
    }

    // 每隔 5 秒產生一個新物件
    if (millis() - lastSpawnTime > 5000) {
      spawnParticle();
      lastSpawnTime = millis();
    }

    // 更新與顯示粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].display();

      // 碰撞偵測
      for (let j = missiles.length - 1; j >= 0; j--) {
        let d = dist(particles[i].pos.x, particles[i].pos.y, missiles[j].pos.x, missiles[j].pos.y);
        if (d < particles[i].size / 2) {
          explosions.push(new Explosion(particles[i].pos.x, particles[i].pos.y, particles[i].color));
          particles.splice(i, 1);
          missiles.splice(j, 1);
          score++;
          break;
        }
      }
    }

    // 更新與顯示飛彈
    for (let i = missiles.length - 1; i >= 0; i--) {
      missiles[i].update();
      missiles[i].display();
      if (missiles[i].isOffScreen()) {
        missiles.splice(i, 1);
      }
    }

    // 更新與顯示爆炸
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].update();
      explosions[i].display();
      if (explosions[i].isFinished()) {
        explosions.splice(i, 1);
      }
    }

    // 繪製中央指標
    drawArrowPointer();

    // 介面顯示
    displayHUD();
  } else if (gameState === "GAMEOVER") {
    displayGameOver();
  }
}

function displayHUD() {
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  textAlign(RIGHT, TOP);
  text("Time: " + timeLeft + "s", width - 20, 20);
}

function displayGameOver() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(64);
  text("遊戲結束", width / 2, height / 2 - 50);
  textSize(32);
  text("最後得分: " + score, width / 2, height / 2 + 10);
}

function spawnParticle() {
  let x = random(width);
  let y = random(height);
  let size = random(40, 100);
  let col = color(random(palette));
  particles.push(new Particle(x, y, size, col));
}

// 滑鼠點擊發射飛彈
function mousePressed() {
  if (gameState === "PLAYING") {
    let angle = atan2(mouseY - height / 2, mouseX - width / 2);
    missiles.push(new Missile(width / 2, height / 2, angle));
  }
}

function restartGame() {
  restartBtn.hide();
  initGame();
}

// 繪製畫面中央的旋轉箭頭
function drawArrowPointer() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  stroke(255);
  strokeWeight(3);
  line(0, 0, 50, 0); // 箭身
  line(50, 0, 40, -10); // 箭頭上側
  line(50, 0, 40, 10);  // 箭頭下側
  noFill();
  ellipse(0, 0, 10, 10); // 中心點
  pop();
}

// 當視窗大小改變時，自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restartBtn.position(width / 2 - 50, height / 2 + 50);
}

class Particle {
  constructor(x, y, size, col) {
    this.pos = createVector(x, y);
    this.size = size;
    this.color = col;
    // 隨機移動速度
    this.vel = p5.Vector.random2D().mult(random(0.5, 2.5));
    this.isCircle = false;
  }

  update() {
    // 移動位置
    this.pos.add(this.vel);

    // 邊界反彈
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;

    // 檢查滑鼠是否靠近物件 (距離小於物件大小的一倍)
    let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    if (d < this.size) {
      this.isCircle = true;
    } else {
      this.isCircle = false;
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // 1. 繪製主體外表
    noStroke();
    fill(this.color);
    if (this.isCircle) {
      // 靠近時變為圓圈
      ellipse(0, 0, this.size * 1.5);
    } else {
      // 平時為星狀弧形外表
      this.drawStarArc(0, 0, this.size * 0.6, this.size * 0.8, 12);
    }

    // 2. 繪製眼睛 (白色)
    let eyeSpacing = this.size * 0.25;
    let eyeSize = this.size * 0.2;
    fill(255);
    ellipse(-eyeSpacing, -eyeSpacing / 2, eyeSize); // 左眼
    ellipse(eyeSpacing, -eyeSpacing / 2, eyeSize);  // 右眼

    // 3. 繪製黑眼珠 (會隨滑鼠移動)
    fill(0);
    this.drawPupil(-eyeSpacing, -eyeSpacing / 2, eyeSize);
    this.drawPupil(eyeSpacing, -eyeSpacing / 2, eyeSize);

    // 4. 繪製笑嘴 (弧形)
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(0, eyeSpacing / 2, eyeSize * 1.5, eyeSize, 0, PI);

    pop();
  }

  // 繪製星狀弧形的方法
  drawStarArc(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      let ex = x + cos(a + halfAngle) * radius1;
      let ey = y + sin(a + halfAngle) * radius1;
      vertex(ex, ey);
    }
    endShape(CLOSE);
  }

  // 計算並繪製眼珠移動
  drawPupil(x, y, eyeSize) {
    let angle = atan2(mouseY - (this.pos.y + y), mouseX - (this.pos.x + x));
    let pupilDist = eyeSize * 0.25;
    let px = x + cos(angle) * pupilDist;
    let py = y + sin(angle) * pupilDist;
    ellipse(px, py, eyeSize * 0.5);
  }
}

// 飛彈類別
class Missile {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle).mult(7); // 飛彈速度較快
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    push();
    stroke(255, 255, 0);
    strokeWeight(4);
    point(this.pos.x, this.pos.y);
    pop();
  }

  isOffScreen() {
    return (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height);
  }
}

// 爆炸效果類別
class Explosion {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.color = col;
    this.lifespan = 255;
    this.particles = [];
    for (let i = 0; i < 8; i++) {
      this.particles.push(p5.Vector.random2D().mult(random(1, 4)));
    }
  }

  update() {
    this.lifespan -= 10;
  }

  display() {
    push();
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
    for (let p of this.particles) {
      let px = this.pos.x + p.x * (255 - this.lifespan) * 0.1;
      let py = this.pos.y + p.y * (255 - this.lifespan) * 0.1;
      ellipse(px, py, 5);
    }
    pop();
  }

  isFinished() {
    return this.lifespan < 0;
  }
}
