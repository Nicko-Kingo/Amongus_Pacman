/* Totally Not Among Us - a pac man style game
*
*  You play as the red imposter tasked with collecting 
*  all the pellets on the map while avoiding the crew
*
*  You can collect a power pellet to start murdering the crew 
*  to temporarily disable them
*/

//Map variable - Symbol legend
//w = wall
//n = nothng (prevents coins from spawning)
//g = ghost
//s = ghost scatter point
//default: spawn a coin
var tiles = [
  "wwwwwwwwwwwwwwwwwwnw",
  "ws            ww  sw",
  "w   w w wwgww      w",
  "w www w wgggw ww   w",
  "w w   w wwwww wwww w",
  "w w  cw       w    w",
  "w www w    wwww wwww",
  "w   w      wc     ww",
  "www wwwwww w  www ww",
  "n c      w ww www  w",
  "w  w w     w    w  n",
  "wwww w   w      wc w",
  "w    wwwww wwwwww ww",
  "w  w   w      w   ww",
  "w ww   w      w  www",
  "w w    w      ww  cw",
  "w w   cw  www  w   w",
  "w ww www  w    www w",
  "ws        w       sw",
  "wnwwwwwwwwwwwwwwwwww",
  
];

//Crew member variables
var scatter = [];
var scatterI = 0;
var crew = [];
var ghostFrame = 5;


//A* variables
var graph = [];
var cost = [];
var inq = [];
var comefrom = [];
var path = [];
var q = [];
var pathLen = 0;
var pathFound = 0;

var qLen = 0;
var qStart = 0;

//Game state variable
//0 - main menu
//1 - lose
//2 - start game
//3 - win screen
//4 - instructions
//5 - game credits
let gameState = 0;

//coins
var coins = [];

//music variable
let drip;


//Sprite variables
var sus;
var crewSprites = [];

//Preloaded images of the among us sprites
function preload() {
  sus = loadImage("Imposter.png");
  
  crewSprites.push(loadImage("CrewMember.png"));
  crewSprites.push(loadImage("CrewMember2.png"));
  crewSprites.push(loadImage("CrewMember3.png"));
  crewSprites.push(loadImage("CrewMember4.png"));

  
}

//Checks where the ghosts should go if the imposter is empowered
function initScatter()
{
  
  for(let i = 0; i < tiles.length; i++)
    {
      for(let j = 0; j < tiles[i].length; j++)
        {
          if(tiles[i][j] == 's')
          {
            let stuff = [i, j];
            scatter.push(stuff);
          }
        }
    }
}


//Draws the map, including open space and walls
//The color is light green to resemble grass
function drawMap()
{
  
  for(let i = 0; i < tiles.length; i++)
    {
      for(let j = 0; j < tiles[i].length; j++)
        {
          if(tiles[i][j] == 'w')
          {
            
            push();
            if(i == 0 || tiles[i-1][j] != 'w')
              line(j*20,i*20,j*20+20,i*20);
            if(i == 19 || tiles[i+1][j] != 'w')
              line(j*20,i*20+20,j*20+20,i*20+20);
            if(j == 0 || tiles[i][j-1] != 'w')
              line(j*20,i*20,j*20,i*20+20);
            if(j == 19 || tiles[i][j+1] != 'w')
              line(j*20+20,i*20,j*20+20,i*20+20);
            

            graph[i][j] = -1;
            
            pop();
          }
          else
          {
            graph[i][j] = 0;
            
          }

        }
    }

}

//Initializes coins:
//if there is no character - spawn a normal coin
//if there is a c - spawn a power pellet
//if there is a n - doesn't spawn a coin
function initCoins()
{
  for(let i = 0; i < tiles.length; i++)
    {
      for(let j = 0; j < tiles[i].length; j++)
        {
          if(tiles[i][j] == ' ')
          {
            
            coins.push(new coin(j*20+10, i*20+10, false));
          }
          else if(tiles[i][j] == 'c')
            coins.push(new coin(j*20+10, i*20+10, true));
          else if(tiles[i][j] == 'g')
          {
            crew.push(new ghost(j*20+10, i*20+10, ghostFrame, scatter[scatterI][0] * 20 +10, scatter[scatterI][1] * 20 + 10, crewSprites[scatterI]));

            ghostFrame+=5;
            scatterI++;
   
          }
          
          //else
          //  coins.push(new coin(j*20+10, i*20+10));
        }
    }
}

//The imposter - is sus
class player
{
  constructor(x,y)
  {
    this.x = x;
    this.y = y;
    this.tile = [int(this.x/20), int(this.y/20)];
    this.dir = [0,0];
    this.drip = 0;
  }
  
  draw()
  {
    //circle(this.x,this.y,16);
    imageMode(CENTER);
    image(sus,this.x,this.y,20,20);
    this.tile = [int(this.x/20), int(this.y/20)];
    this.move();
    
    
    
    
    //Some gamer shit right here vvv
    
    //x teleportation
    if(this.dir[0] == -1 && this.x < 9 )
    {
      image(sus,400 + this.x, this.y + 20, 20,20);
      if(this.x <= -16)
      {
        this.x = 400 + this.x;
        this.y += 20;
      }
    }
    if(this.dir[0] == 1 && this.x > 391 )
    {
      image(sus, 0 - (400 - this.x), this.y - 20, 20,20);
      if(this.x >= 416)
      {
        this.x = 16;
        this.y -= 20;
      }
    }
    
    //y teleportation
    if(this.dir[1] == 1 && this.y < 9 )
    {
      circle(this.x - 340, 400 + this.y, 16);
      if(this.y <= -16)
      {
        this.x -= 340;
        this.y = 384;
      }
    }
    if(this.dir[1] == -1 && this.y > 391 )
    {
      circle(this.x + 340, 0 - (400 - this.y), 16);
      if(this.y >= 416)
      {
        this.y = 16;
        this.x += 340;
      }
    }
    
    if(this.drip > 0)
      this.drip--;
    
    
  }
  
  move()
  {
    
      //Keypressed

      if(keyIsDown(UP_ARROW))
      {
        this.dir[0] = 0;
        this.dir[1] = 1;
        
        //Check if we can move before moving
        //This is how I will do collisions
        if(this.collision())
          this.y -= 1.5;
        
      }
      else if(keyIsDown(DOWN_ARROW))
      {
        this.dir[0] = 0;
        this.dir[1] = -1;
        
        if(this.collision())
          this.y += 1.5;
      }

      else if(keyIsDown(LEFT_ARROW))
      {
        this.dir[0] = -1;
        this.dir[1] = 0;
        
        if(this.collision())
          this.x -= 1.5;
      }
      else if(keyIsDown(RIGHT_ARROW))
      {
        this.dir[0] = 1;
        this.dir[1] = 0;
        
        if(this.collision())
          this.x += 1.5;
      }
      
  

    
  }
  
  collision()
  { 
    let ret = true;
    
    
    
    //Rare bug, concerning y for x axis collisions
    //and x for y axis collisions
    if(this.dir[0]) //x axis collision - left or right
    {
      if(this.x + 11 > 400 || this.x - 11 < 0)
        return true;
      if(this.y + 5 > 400 || this.y - 5 < 0)
        return true;
      
      let xbbU = int((this.y - 5)/20);
      let xbbD = int((this.y + 5)/20);
      let xCheck = int((this.x + (11*this.dir[0]))/20);
      
      if( tiles[xbbU][xCheck] == 'w' || tiles[xbbD][xCheck] == 'w')
        ret = false;

    }
    else if(this.dir[1]) //y axis collisions - up or down
    {
      if(this.y + 12 > 400 || this.y - 12 < 0)
        return true;
      
      let ybbU = int((this.x - 5)/20);
      let ybbD = int((this.x + 5)/20);
      let yCheck = int((this.y + (11*-this.dir[1]))/20);
      
      
      if( tiles[yCheck][ybbU] == 'w' || tiles[yCheck][ybbD] == 'w')
        ret = false;

    }
    
    return ret; 
  }
}


//A* is basically done, just need to extrapolate it for 
//Each ghost (the route array), also need to make the search happen
//based on frames
class ghost extends player
{
  constructor(x,y, frame, scatterx, scattery, im)
  {
    super(x,y);
    
    this.frame = frame;  //frame to hunt player on
    this.moveTimer = 0;
    this.route = new Array(20);
    
    this.tile = [int(this.x/20), int(this.y/20)];
    this.dir = [0,0];
    
    for(let i = 0; i < 20; i++)
      this.route[i] = new Array(20);
    
    
    this.homeX = x;
    this.homeY = y;
    
    this.canKill = true;
    
    this.scatter = [0, 0];
    this.scatter[0] = scatterx;
    this.scatter[1] = scattery;
    
    this.deadTimer = 180;
    this.image = im;
    
  }
  
  search()
  {
    
    for(let i = 0; i < tiles.length; i++)
    {
      for(let j = 0; j < tiles[i].length; j++)
        {
          this.route[i][j] = ' ';
        }
    }
    
    path = [];
    q = [];
    
    for (i=0; i<400; i++) {
      path.push(new p5.Vector(0, 0));
      q.push(new qObj(0, 0));
    }
    
    if(!this.canKill)
    {
      target.x = this.homeX;
      target.y = this.homeY;
    }
    else if(!p.drip)
    {
      target.x = p.x;
      target.y = p.y;
    }
    else
    {
      target.x = this.scatter[0];
      target.y = this.scatter[1];
    }
    
    
    
    finalDest.x = target.x;
    finalDest.y = target.y;
    targetPos.x = floor(finalDest.y / 20);
    targetPos.y = floor(finalDest.x / 20);
    var i = floor(this.y / 20);
    var j = floor(this.x / 20);
    initGraph(i, j);
    pathFound = 0;
    pathLen = 0;
    findAStarPath(i, j);
    
    for(let i = 0; i < 400; i++)
    {

      this.route[int(path[i].y/20)][int(path[i].x/20)] = 'g';
    }
    
    pathLen--;

  }
  
  draw()
  {
    push();
    fill('red');
    //circle(this.x,this.y,16);
    imageMode(CENTER);
    image(this.image, this.x,this.y, 20, 20);
    pop();
    
    /*
    for(let i = 0; i < tiles.length; i++)
    {
      for(let j = 0; j < tiles[i].length; j++)
        {
          if(this.route[i][j] == 'g')
            rect(j*20, i*20, 5)
        }
    }
    */
    
  }
  
  chase()
  {
    this.tile = [int(this.x/20), int(this.y/20)];
    
    if(!this.moveTimer){
    
    if(this.tile[0] > 0 && this.route[this.tile[1]][this.tile[0] - 1] == 'g')
    {    
      this.dir[0] = -1;
      this.route[this.tile[1]][this.tile[0] - 1] = ' ';
      this.dir[1] = 0;
      this.moveTimer = 20;
      
      this.route[this.tile[1]][this.tile[0]] = ' ';
    }
    else if(this.tile[0] < 19 && this.route[this.tile[1]][this.tile[0] + 1] == 'g')
    {    
      this.dir[0] = 1;
      this.route[this.tile[1]][this.tile[0] + 1] = ' ';
      this.dir[1] = 0;
      this.moveTimer = 20;
      
      this.route[this.tile[1]][this.tile[0]] = ' ';
    }
    else if(this.tile[1] > 0 && this.route[this.tile[1] - 1][this.tile[0]] == 'g')
    {    
      this.dir[1] = 1;
      this.route[this.tile[1] - 1][this.tile[0]] = ' ';
      this.dir[0] = 0;
      this.moveTimer = 20;
      
      this.route[this.tile[1]][this.tile[0]] = ' ';
    }
    else if(this.tile[1] < 19 && this.route[this.tile[1] + 1][this.tile[0]] == 'g')
    {    
      this.dir[1] = -1;
      this.route[this.tile[1] + 1][this.tile[0]] = ' ';
      this.dir[0] = 0;
      this.moveTimer = 20;
      
      this.route[this.tile[1]][this.tile[0]] = ' ';
    }
    else
    {
      this.dir[0] = 0;
      this.dir[1] = 0;
    }
      
    }
    
  }
  
  move()
  {
    if(this.frame <= 0)
    {
      this.search();
      this.frame += 30; 
    }
    
    this.chase();
    
    if(this.dir[0] == -1)
      this.x--;
    else if(this.dir[0] == 1)
      this.x++;
    else if(this.dir[1] == -1)
      this.y++;
    else if(this.dir[1] == 1)
      this.y--;
    
    if(this.moveTimer > 0)
      this.moveTimer--;
    if(this.frame > 0)
      this.frame--;
    
    if(!this.canKill && this.homeX == this.x && this.homeY == this.y && this.deadTimer > 0)
      this.deadTimer--;
    
    if(this.deadTimer <= 0)
      this.canKill = true;
    
    this.collision();
  }
  
  collision()
  {
    this.tile = [int(this.x/20), int(this.y/20)];
    
    if(this.tile[0] == p.tile[0] && this.tile[1] == p.tile[1])
    {  
      if(p.drip)
      {
        
        this.canKill = false;
        this.deadTimer = 60;
      }
      else
        gameState = 1;
    }
      
    
    
  }
  
}

//Coin class - spawns pellets
//Can be power pellets
class coin
{
  constructor(x,y, power)
  {
    this.x = x;
    this.y = y;
    this.tile = [int(this.x/20), int(this.y/20)];
    this.power = power;
  }
  
  draw()
  {
    push();
    fill('gold');
    if(!this.power)
      circle(this.x,this.y, 5);
    else
      circle(this.x,this.y, 8);
    
    pop();
  }
  
}


var stars = [];
//Solely for the lose screen, why am I doing this???
class star
{
  constructor(x,y,speed)
  {
    this.x = x;
    this.y = y;
    this.speed = speed; //How fast it will move to the right
  }
  
  draw()
  {

    push();
    fill('white');
    circle(this.x,this.y,this.speed * 3);
    pop();
  }
  
  move()
  {
    this.x += this.speed;
  }
}


let fade = 0;            //fade out variable
let timer = 0;           //timer for timing events
let timerState = 0;      //What the screen should be doing
let texting = "Amogus";  //Will be typed when the imposter is ejected
let textTimer = 0;       //timer for the text
let textIndex = 0;       //Index for outputting one character at a time
let local = 0;           //Moves the imposter to the right of the screen
function loseScreen()
{
  //Starts the timer
  if(!timerState && fade < 255)
  {
    timer = millis();
    timerState = 1;
  }
  
  //A slow fade to black
  fill(0, fade);
  
  //A rectangle over the entire canvas
  rect(0,0,400,400);
  
  //if we should fade out or spawn stars
  if(fade < 255)
    fade+=2.5;
  else
  {
    //Stars initialization, appear on screen before movement
    while(stars.length < 20 && timerState == 1)
    {
      let ranX = int(random(10, 400));
      let ranY = int(random(10, 400));
      let sp   = int(random(1,3));
      
      stars.push(new star(ranX,ranY, sp));
    }
    
  }
  
  //Draws the stars
  for(let i in stars)
  {
      stars[i].draw();
  }
  
  //wait 2.5 seconds before moving stars to the right
  if(timerState != 2 && millis() - timer > 2500)
    timerState = 2;
  
  //moves things on the screen
  if(timerState == 2)
  {
    //Different star initialization, happens off screen to create 
    //A sense of movement
    while(stars.length < 20)
    {
      let ranX = int(random(-20, -10));
      let ranY = int(random(5, 400));
      let sp   = int(random(1,3));
      
      stars.push(new star(ranX,ranY, sp));
      
    }
    image(sus, local, 220, 100, 100);
    local+=1.25;
    
    
    for(let i in stars)
    {
      stars[i].move();
      if(stars[i].x > 400)
        stars.splice(i,1);
    }
  }
  
  //waits 5 seconds before starting to type
  if(millis() - timer > 5000)
  {
    push();
    textSize(15);
    textAlign(RIGHT);
    fill(255);
    text(texting.substring(0,textIndex), 220, 200);
    
    pop();
    if(textTimer <= 0)
    {
      textIndex++;
      textTimer = 10;
    }
    textTimer--;
  }
}

//Win Screen
//Really simple, mimics the victory screen of Among us
function winScreen()
{
    if(!timerState && fade < 255)
  {
    timer = millis();
    timerState = 1;
  }
  
  //A slow fade to black
  fill(0, fade);
  
  //A rectangle over the entire canvas
  rect(0,0,400,400);
  
  
  if(fade < 255)
    fade+=2.5;
  else
  {
    push();
    fill('#0687fe');
    textSize(50);
    text("Victory", 110, 75);
    
    pop();
    
    image(sus, 200, 200, 100, 100);
  }
}

//Main menu, spawns random stars and showcases the crewmembers
var mmStars = [];
function mainMenu()
{
  push();
  fill(0);
  rect(0,0,400,400);
  
  while(mmStars.length < 20)
    {
      let ranX = int(random(10, 400));
      let ranY = int(random(10, 400));
      let sp   = int(random(1,3));
      
      mmStars.push(new star(ranX,ranY, sp));
    }
  
  for(let i in mmStars)
  {
      
      mmStars[i].draw();
  }
  
  fill(255);
  textSize(30);
  text("Totally not Among Us", 60, 75);
  
 
  image(sus, 20, 90, 100, 100);
  image(crewSprites[0], 100, 90, 100, 100);
  image(crewSprites[1], 150, 90, 100, 100);
  image(crewSprites[2], 200, 90, 100, 100);
  image(crewSprites[3], 250, 90, 100, 100);
  
  pop();
  
  push();
  noFill();
  stroke(255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(200,200,100,30);
  rect(200,250,100,30);
  rect(200,300,100,30);
  strokeWeight(1);
  fill(255);
  textSize(25);
  text("Play", 173, 207);
  textSize(18);
  text("Instructions", 155, 255);
  text("  Credits", 160, 305);
  
  //Button clicking
  let mX = mouseX;
  let mY = mouseY;
  if(mX >= 150 && mX <= 250)
  {
    if(mY >= 175 && mY <= 215)
    {
      push();
      strokeWeight(4);
      noFill();
      rect(200,200,100,30);
      pop();
      if(mouseIsPressed) gameState = 2;
    }
    else if(mY >= 235 && mY <= 265)
    {
      push();
      strokeWeight(4);
      noFill();
      rect(200,250,100,30);
      pop();
      if(mouseIsPressed) gameState = 4;
    }
    else if(mY >= 275 && mY <= 315)
    {
      push();
      strokeWeight(4);
      noFill();
      rect(200,300,100,30);
      pop();
      if(mouseIsPressed) gameState = 5;
    }
    
    
    
  }
  
  
  
  pop();
  
}


//Instructions menu
var inStars = [];
function instructions()
{
  push();
  fill(0);
  rect(0,0,400,400);
  
  //Spawns stars on the canvas
  while(inStars.length < 20)
    {
      let ranX = int(random(10, 400));
      let ranY = int(random(10, 400));
      let sp   = int(random(1,3));
      
      inStars.push(new star(ranX,ranY, sp));
    }
  
  for(let i in inStars)
  {
      
      inStars[i].draw();
  }
  pop();
  
  //Instructions and such
  push();
  fill(255);
  textSize(30);
  text("Instructions", 120, 50);
  
  textSize(20);
  text("You are the imposter (how sus):", 60, 100);
  text("Collect all of the pellets to win!", 60, 150);
  text("Avoid the crew (they know red is sus)", 30, 200);
  
  text("Eat a power pellet to kill the crew (Temporarily)", 75, 225, 250);
  
  text("Arrow keys to move around the ship", 40,325);
  
  pop();
  
  push();
  fill(255);
  textSize(15);
  text("Back", 5,397);
  pop();
  
  push();
  noFill();
  stroke(255);
  strokeWeight(3);
  rect(0,382,50, 20);
  pop();
  
  
  if(mouseX >= 0 && mouseX <= 50 
         && mouseY >= 385 && mouseY <= 400)
  {
    push();
    noFill();
    strokeWeight(3);
    stroke(255);
    rect(0,382,50, 20);
    pop();
       
    if(mouseIsPressed) gameState = 0;
  }
}

//Credits menu - gives credit to stuff I didn't make
//Draws stars for effect
function credits()
{
  push();
  fill(0);
  rect(0,0,400,400);
  
  while(inStars.length < 20)
  {
    let ranX = int(random(10, 400));
    let ranY = int(random(10, 400));
    let sp   = int(random(1,3));
      
    inStars.push(new star(ranX,ranY, sp));
  }
  
  for(let i in inStars)
  {
      
      inStars[i].draw();
  }
  pop();
  
  push();
  fill(255);
  textSize(30);
  text("Credits", 150, 50);
  
  textSize(20);
  text("Musical credit goes to Leonz on Youtube.com", 100, 100, 250);
  
  text("Crew Member sprites are credited to Innersloth", 100, 250, 250);
  
  pop();
  
  push();
  fill(255);
  textSize(15);
  text("Back", 5,397);
  pop();
  
  //Back Button
  push();
  noFill();
  stroke(255);
  strokeWeight(3);
  rect(0,382,50, 20);
  pop();
  
  if(mouseX >= 0 && mouseX <= 50 
         && mouseY >= 385 && mouseY <= 400)
  {
    push();
    noFill();
    strokeWeight(3);
    stroke(255);
    rect(0,382,50, 20);
    pop();
       
    if(mouseIsPressed) gameState = 0;
  }
}

//Target object - given by professor
var targetObj = function(x, y) {
  this.x = x;
  this.y = y;
};

//Q object - given by professor
var qObj = function(x, y) {
  this.x = x;
  this.y = y;
  this.fcost = 0;
};

//Set function for q objects - given by professor
qObj.prototype.set = function(a, b) {
  this.x = a;
  this.y = b;
};

var p, target, targetPos, finalDest;

//Sets up the canvas
//Limits the framerate
//Initializes memory
function setup() {
  createCanvas(400, 400);
  p = new player(210,210);
  initScatter();
  initCoins();
  frameRate(60); //Limits the framerate
  
  //Power pellet music
  drip = createAudio('Amogus.mp3');

  
  //Initializes memory for 
  //A* algorithm
  graph = new Array(20);
  cost = new Array(20);
  inq = new Array(20);
  comefrom = new Array(20);
  for (var i=0; i<20; i++) {
    graph[i] = new Array(20);
    cost[i] = new Array(20);
    inq[i] = new Array(20);
    comefrom[i] = new Array(20);
  }
  
  target = new targetObj(0, 0);
  targetPos = new targetObj(0, 0);
  finalDest = new targetObj(0, 0);
  
  for (i=0; i<400; i++) {
    path.push(new p5.Vector(0, 0));
    q.push(new qObj(0, 0));
  }
  
  for (i=0; i<20; i++) {
    for(var j=0; j<20; j++) {
      comefrom[i][j] = new p5.Vector(0, 0);
    }
  }
  
}

//Draw function controls what is drawn based
//On the game state
function draw() {
  background('#3e494b');
  
  if(coins.length == 0)
    gameState = 3;
  
  if(gameState == 0)
  {
    mainMenu();
  }
  else if(gameState < 4)
  {
    drawMap();
    p.draw();

    for(let g in crew)
    {
      crew[g].draw();

      if(gameState == 2)
        crew[g].move();
    }

    for(var c in coins)
    {
      if(coins[c].tile[0] === p.tile[0] && coins[c].tile[1] === p.tile[1] )
      {
        if(coins[c].power)
          p.drip += 900;

        coins.splice(c,1);

      }
      else
        coins[c].draw();
    }

    //Plays the audio
    if(p.drip > 0)
      drip.play();
    else
      drip.pause();

    if(gameState == 1)
    {  
      loseScreen();
      drip.pause();
    }
    else if(gameState == 3)
    {
      winScreen();
      drip.pause();
    }
  }
  else if(gameState == 4)
  {
    instructions();
  }
  else if(gameState == 5)
  {
    credits();
  }
}

//Debug keys to test game states
function keyPressed()
{
  if(keyCode == 76)
    gameState = 1;
  if(keyCode == 75)
    gameState = 2;
  if(keyCode == 87)
    gameState = 3;
}



//Graph function - provided by professor
var initGraph = function(x, y) {
  for (var i = 0; i< 20; i++) {
    for (var j = 0; j<20; j++) {
      if (graph[i][j] > 0) {
        graph[i][j] = 0;
      }
      inq[i][j] = 0;
      cost[i][j] = 0;
    }
  }
  graph[x][y] = 1;
};

//A-Star algorithm, here so I can see it better
//Provided by the professor
var findAStarPath = function(x, y) {
  var i, j, a, b;
  qLen = 0;
  graph[x][y] = 1;
  inq[x][y] = 1;
  q[qLen].set(x, y);
  q[qLen].fcost = 0;
  qLen++;
  pathLen = 0;
  qStart = 0;
  var findMinInQ = function()
  {
    var min = q[qStart].fcost;
    var minIndex = qStart;
    for (var i = qStart+1; i<qLen; i++) 
    {
      if (q[i].fcost < min) {
        min = q[i].qStart;
        minIndex = i;
      }
    }
    if (minIndex !== qStart) {  // swap
      var t1 = q[minIndex].x;
      var t2 = q[minIndex].y;
      var t3 = q[minIndex].fcost;
      q[minIndex].x = q[qStart].x;
      q[minIndex].y = q[qStart].y;
      q[minIndex].fcost = q[qStart].fcost;
      q[qStart].x = t1;
      q[qStart].y = t2;
      q[qStart].fcost = t3;
    }
  };
  var setComeFrom = function(a, b, i, j) {
    inq[a][b] = 1;
    comefrom[a][b].set(i, j);
    q[qLen].set(a, b);
    cost[a][b] = cost[i][j] + 10;
    q[qLen].fcost = cost[a][b] + dist(b*20+10, a*20+10, finalDest.x,
    finalDest.y);
    qLen++;
  };
  

  while ((qStart < qLen) && (pathFound === 0)) {
    findMinInQ();
    i = q[qStart].x;
    j = q[qStart].y;
    graph[i][j] = 1;
    qStart++;
    if ((i === targetPos.x) && (j === targetPos.y)) {
      pathFound = 1;
      path[pathLen].set(j*20+10, i*20+10);
      pathLen++;
    }
    a = i+1;
    b = j;
    if ((a < 20) && (pathFound === 0)) {
      if ((graph[a][b] === 0) && (inq[a][b] === 0)) {
        setComeFrom(a, b, i, j);
      }
    }
    a = i-1;
    b = j;
    if ((a >= 0) && (pathFound === 0)) {
      if ((graph[a][b] === 0) && (inq[a][b] === 0)) {
        setComeFrom(a, b, i, j);
      }
    }
    a = i;
    b = j+1;
    if ((b < 20) && (pathFound === 0)) {
      if ((graph[a][b] === 0) && (inq[a][b] === 0)) {
        setComeFrom(a, b, i, j);
      }
    }
    a = i;
    b = j-1;
    if ((b >= 0) && (pathFound === 0)) {
      if ((graph[a][b] === 0) && (inq[a][b] === 0)) {
        setComeFrom(a, b, i, j);
      }
    }
  }   // while
  while ((i !== x) || (j !== y)) {
    a = comefrom[i][j].x;
    b = comefrom[i][j].y;
    path[pathLen].set(b*20 + 10, a*20+10);
    pathLen++;
    i = a;
    j = b;
  }

};


