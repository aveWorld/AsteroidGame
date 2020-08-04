window.addEventListener('load', () => {
let best_score = []
class Game {
  constructor() {
    this.container = document.getElementById('content');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.prevUpdateTime = 0;
    this.height = 0;
    this.width = 0;
    this.ship = { //our ship object
      x: this.container.clientWidth/2 - 40,
      y: this.container.clientHeight/2 - 40,
      img: '',
      velocity: 10,
      acceleration: 1,
      moving: false,
      rotateRight: false,
      rotateLeft: false,
      alfa: 0,
      r: 40,
      canShoot: true,
      bullets: []
    }
    this.asteroids = [];
    this.score = 0;
    this.asteroidSpawnTime = 10000 //asteroid spawn timer
    this.asteroidVelocity = 0.5 //Velocity will increase with time
    this.imageFrameNumber = 0; //used for animation of explosion
    this.tickCount = 0;
    this.explode = []
    this.init();
  }

  init() {
    window.addEventListener("resize", x => this.onResize());
    this.onResize();
    //adding image
    this.shipImg = new Image(); // initializing ship image
    this.shipImg.src = "../static/img/ship.png"
    this.ship.img = this.shipImg
    this.asteroidImg = new Image();
    this.asteroidImg.src = "../static/img/asteroid.png"
    this.space = new Image();
    this.space.src = "../static/img/space.jpg"
    this.explosion = new Image()
    this.explosion.src = "../static/img/explosion_sprite.png"

    //adding music
    this.fire = new Sound("../static/music/fire.wav", 5, 0.5);
    this.beat = new Sound("../static/music/beat1.wav", 1, 0.5);
    this.bang = new Sound("../static/music/bangSmall.wav", 3, 0.5);
    // this.ctx.drawImage(this.ship.img,this.ship.x, this.ship.y) //drawing our ship image
    window.addEventListener('keydown', this.handleKeyDown, false)
    window.addEventListener('keyup', this.handleKeyUp, false)

    for(let i = 0; i < 4; i++) {
      this.asteroids.push({
        x: Math.random() * 100 + (250*i),
        y: Math.random() > 0.5? -10 : this.container.clientHeight + 10,
        velocityX: Math.random() * this.asteroidVelocity + 0.5,
        velocityY: Math.random() * this.asteroidVelocity + 0.5,
        r: 92
      })
    }
    //spawning asteroids
    setInterval(() => {
      this.asteroidSpawnTime *= 0.95
      this.asteroidVelocity += 0.2
      for(let i = 0; i < 4; i++) {
        this.asteroids.push({
          x: Math.random() * 100 + (250*i),
          y: Math.random() > 0.5? -10 : this.container.clientHeight + 10,
          velocityX: Math.random() * this.asteroidVelocity + 0.5,
          velocityY: Math.random() * this.asteroidVelocity + 0.5,
          r: 92
        })
      }
    }, this.asteroidSpawnTime)
   
    
    requestAnimationFrame((time) => this.update(time));
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  update(time) {
    

    const dt = time - this.prevUpdateTime;
    this.prevUpdateTime = time;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.drawImage(this.space,0,0,this.canvas.width, this.canvas.height)
    this.ctx.font = "30px Comic Sans MS"
    this.ctx.fillStyle = "red";
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 200, 50);
    this.handleShipMoving()
    this.collision()
    this.rotateShip();
    this.handleAsteroids();
    this.handleBullets()
    this.explosionAnimation()

    requestAnimationFrame((time) => this.update(time));
  }

 

  handleKeyDown = e => { //handling our ship movement
    switch(e.keyCode) {
      case 32:
        this.handleShooting()
        break
      case 38: //up arrow
        this.ship.moving = true
        break  
      case 39: //right arrow
        this.ship.rotateRight = true
        // this.ship.alfa += this.ship.velocity
        break
      case 37: //left arrow
        this.ship.rotateLeft = true
        // this.ship.alfa -= this.ship.velocity
        break 
    }
  }

  explosionAnimation = (x,y) => {
    if(this.explode.length > 0){
      if(this.imageFrameNumber > 4){
          this.tickCount = 0;
          this.imageFrameNumber = 0
          this.explode = []
          return
      }
      this.tickCount++
      if(this.tickCount > 5){
          this.imageFrameNumber++
          this.tickCount = 0;
      }
      this.ctx.drawImage(this.explosion, this.imageFrameNumber * 64, 0, 64, 64, this.explode[0].x - 23, this.explode[0].y - 23, 64, 64)
    }
  }

  //logic of our ship movements
  handleShipMoving = () => {
    if(this.ship.moving) {
      this.ship.y -= this.ship.velocity * Math.cos(this.ship.alfa * Math.PI/180)/5 * this.ship.acceleration
      this.ship.x += this.ship.velocity * Math.sin(this.ship.alfa * Math.PI/180)/5 * this.ship.acceleration
      this.currentSpeedY = this.ship.velocity
      this.currentSpeedX = this.ship.velocity
      if(this.ship.acceleration < 1.8) this.ship.acceleration += 0.01
      this.explosureAnimation()
    }
    else {
      this.ship.acceleration = 1
      this.ship.x += 0.1 //make impression like in space
      this.ship.y += 0.1 //make impression like in space
    }
    if(this.ship.rotateRight) {
      this.ship.alfa += this.ship.velocity/5
    }
    if(this.ship.rotateLeft) {
      this.ship.alfa -= this.ship.velocity/5
    }
  }

  handleKeyUp = e => { //handling our ship movement
    switch(e.keyCode) {
      case 32:
        this.ship.canShoot = true
        break
      case 38:
        this.ship.moving = false
        break  
      case 39:
        this.ship.rotateRight = false
        // this.ship.alfa += 0
        break
      case 37:
        this.ship.rotateLeft = false
        // this.ship.alfa += 0
        break 
    }
  }

  rotateShip = () => {
    //save cordinates in stack with ctx.save then rotate them and take it back from stack  
    this.ctx.save();
    this.ctx.translate(this.ship.x, this.ship.y);
    this.ctx.rotate(this.ship.alfa * Math.PI/180);
    this.ctx.translate(-this.ship.x, -this.ship.y);
    this.ctx.drawImage(this.ship.img,this.ship.x - this.ship.r, this.ship.y - this.ship.r)
    this.ctx.restore();
  }

  collision = () => {
    if(this.ship.x <= 0) this.ship.x = this.canvas.width
    else if(this.ship.x >= this.canvas.width + this.ship.r) this.ship.x = this.ship.r
    if(this.ship.y <= 0) this.ship.y = this.canvas.height + this.ship.r
    else if(this.ship.y >= this.canvas.height + 100) this.ship.y = 100
  }

  handleShooting = () => {
    if(this.ship.canShoot){
      this.fire.play()
      this.ship.canShoot = false;
      this.ship.bullets.push({
        x: this.ship.x + this.ship.r * Math.sin(this.ship.alfa * Math.PI/180),
        y: this.ship.y - this.ship.r * Math.cos(this.ship.alfa * Math.PI/180),
        angleX: Math.sin(this.ship.alfa * Math.PI/180),
        angleY: Math.cos(this.ship.alfa * Math.PI/180)
      })
      }
  }
  //asteroid movement and collisions
  handleAsteroids = () => {
    this.asteroids.map(asteroid => {
      if(Math.sqrt(Math.pow(asteroid.x - this.ship.x, 2) + Math.pow(asteroid.y - this.ship.y, 2)) < this.ship.r + asteroid.r * 4/5){  //asteroid is a bit smaller than his projection, so I decided to to * 4/5 to make asteroid size like projection size 
        console.log(asteroid, this.ship)
        this.explode.push({x: this.ship.x, y: this.ship.y})
        this.ctx = null
        new EndGame(this.score)
      }
      asteroid.y += asteroid.velocityY
      asteroid.x += asteroid.velocityX
      this.ctx.drawImage(this.asteroidImg,asteroid.x - asteroid.r, asteroid.y - asteroid.r, asteroid.r*2, asteroid.r*2)
      if(asteroid.x < -100 || asteroid.x > this.canvas.width + 100) {
        asteroid.velocityX = -asteroid.velocityX
      }
      if(asteroid.y < -100 || asteroid.y > this.canvas.height + 100) {
        asteroid.velocityY = -asteroid.velocityY
      }
    })
  }
  //creating bullets and handling their collisions with asteroids
  handleBullets = () => {
    this.ship.bullets.map((bullet,i) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 4, 0,Math.PI * 2);
      this.ctx.fill();
      // this.ctx.fillStyle = '#FF0000';
      bullet.x += 8 * bullet.angleX;
      bullet.y -= 8 * bullet.angleY;
      //detection collision between bullet and asteroid
      this.asteroids.map((asteroid,j) => {
        if(Math.sqrt(Math.pow(asteroid.x - bullet.x, 2) + Math.pow(asteroid.y - bullet.y, 2)) < 4 + asteroid.r * 4/5) { //4 is our buller radius
          this.ship.bullets.splice(i,1)
          if(asteroid.r == 92){
             this.createSmallAsteroid(asteroid.x, asteroid.y) //92 is radius of big asteroid, so if we hit big it should fall to two smaller peaces
             this.score += 10;
            this.asteroids.splice(j,1)
          }
          else {
            this.explode.push({x: asteroid.x, y: asteroid.y})
            this.asteroids.splice(j,1)
            this.score += 15;
          }
          this.bang.play()
        }
      })
      //checking if bullet is out of canvas, if true delete bullet
      if(bullet.x < -50 || bullet.x > this.canvas.width + 50) {
            this.ship.bullets.splice(i,1)
          }
      else if(bullet.y < -50 || bullet.y > this.canvas.height + 50) {
           this.ship.bullets.splice(i,1)
          }
    })
  }

  createSmallAsteroid = (x,y) => {
    for(let i = 0; i < 2; i++){
    this.asteroids.push({
      x: x + Math.random() * 30 + 55,
      y: y + Math.random() * 30 - 55,
      velocityX: Math.random() * 2.5 + this.asteroidVelocity,
      velocityY: Math.random() * 1.5 + this.asteroidVelocity,
      r: 46
    })
   }
  }

  explosureAnimation = () => {
      
   
  }
}

class Sound{
  constructor(src, maxStreams = 1, vol) {
    this.src = src;
    this.maxStreams = maxStreams;
    this.vol = vol
    this.streamNum = 0;
    this.streams = [];
    for (let i = 0; i < this.maxStreams; i++) {
      this.streams.push(new Audio(src));
      this.streams[i].volume = vol;
    }
  }
  
  play = () => {
          this.streamNum = (this.streamNum + 1) % this.maxStreams;
          this.streams[this.streamNum].play();
  }

  stop = () => {
      this.streams[this.streamNum].pause();
      this.streams[this.streamNum].currentTime = 0;
  }
}

class EndGame{
  constructor(score) {
    this.score = score
    best_score.push(this.score)
    this.div = document.querySelector('.end-game')
    this.div.style.display = "block"
    this.scoreDiv = document.getElementById('score')
    this.scoreDiv.innerHTML = score
    this.bestScoreDiv = document.getElementById('best-score')
    this.bestScoreDiv.innerHTML = Math.max(...best_score)
    this.playAgain = document.getElementById('play_again')
    this.playAgain.addEventListener('click', () => {
      console.log('play again')
      this.div.style.display = "none"
      new Game
    })
  }
}

new Game();

})