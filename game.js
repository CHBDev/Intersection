var width = window.innerWidth;
var height = window.innerHeight;
var longer = Math.max(width, height);
var shorter = Math.min(width, height);
var longerScaled = longer / 800;
var shorterScaled = shorter / 800;

//=============== TUNING ====================
var removeAtSize = 5 * longerScaled;
var enemyMinSize = 10 * longerScaled;
var enemyMaxSize = 100 * longerScaled
var playerSpeed = 50 * longerScaled; //1 to 100
var enemyCount = 80;
var maxPlayerMoves = 3;
var playerRadius = 15 * longerScaled;
var pX = playerRadius * 2;
var pY = playerRadius * 2;
var enemyScaleUpAmount = 10;
var enemyScaleDownAmount = .1;
var enemyScaleSpeed = 5000; //2000 to 10000 ish
var circleBaseColor = "rgba(10,10,10,0.2)";
var circleExplodeColor = "rgba(255,255,255,0.74)";
var circleCollideGood = "rgba(124,255,124,0.74)";
var circleCollideBad = "rgba(255,124,124,0.74)";
var circleCollideMiddle = "rgba(124,124,255,0.74)";
var percentGood = .14;
var percentBad = .14;
var enemyStrokeWidth = 1;
var highScoreValue = 50;
var lowScoreValue = -15;
var midScoreValue = 10;
var forceReload = true;

///======================= GLOBALS ======================

var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
svg.append("rect").attr().style("fill","black").attr("height", height).attr("width",width).attr("stroke", "white").attr("stroke-width", 3);
document.body.style.fontSize = "" + (shorterScaled * 26) + "px";
var drag = d3.behavior.drag()
.on('dragstart', function() { player.style('fill', 'orange'); })
.on('drag', function() { player
  .attr("cx", Math.max(playerRadius, Math.min(width - playerRadius, d3.event.x)))
  .attr("cy", Math.max(playerRadius, Math.min(height - playerRadius, d3.event.y))) })
.on('dragend', function() { player.style('fill', 'white'); });

var playerMoves = [];
var roundScore = 0;
var scoreValueSet = [];
var scoreBoard;
var chain = 0;
var lastScore = 0;
var thisScore = 0;
var netScore = 0;
var chainMod = 0;
var menu;
var paused = true;
var preventClicks = true;
var centerNumber;
var enemyData;
var chainText;

var player;

//============ functions ====================

var flashInitialColors = function(){
  var thing;
  svg.selectAll(".enemy").each(function(){
    thing = d3.select(this);
    thing.style('fill', thing.attr('flashColor'))
    .transition()
    .duration(500)
    .style('fill', circleBaseColor)
    .each("end", function(){
      d3.select(this).attr('scalingDown', "up-first");
    });

  });
}

var collisionLoop = function () {

  if(paused === true){
    return;
  }
  svg.selectAll(".enemy").each(function(d,i){
    checkCollisions(loopScale(d3.select(this))) ;
    loopScale(d3.select(this));
  });

};

var loopScale = function(obj){

  if(obj.attr("doneWith") === "true"){
    return obj;
  }

  if(+obj.attr("r") <= removeAtSize){
    obj.attr("shouldScale", false);
    obj.attr("doneWith", true);
    obj.transition().duration(400).style("opacity", 1e-6);
    return obj;
  }

  if(obj.attr("dying") === "true"){
    return obj;
  }

  if(obj.attr("scalingDown") === "down-first"){
    obj.attr("scalingDown", true)
    .attr("r", +obj.attr('r') * .9)
    obj.transition()
    .duration(enemyScaleSpeed * (4 + Math.random()) * 1.1)
    .ease("linear")
    .attr("r",enemyScaleDownAmount * (+obj.attr("r")) );
    return obj;
  }

  if(obj.attr("scalingDown") === "up-first"){
    obj.attr("scalingDown", false)
    .attr("r", +obj.attr('r') * .9)
    obj.transition()
    .duration(enemyScaleSpeed * (4 + Math.random()) )
    .ease("linear")
    .attr("r",enemyScaleUpAmount * (+obj.attr("r")) );
    return obj;
  }

  if(obj.attr("shouldScale") !== "true"){
    obj.transition().duration(1).attr("r", obj.attr("r"));
    return obj;
  }

  return obj;

};

var clearOverlap = function(){
  var e = {};
  var d3Obj;
  var e2 = {};
  var distanceE;

  svg.selectAll(".enemy").each(function(d,i){
    d3Obj = d3.select(this);
    e.x = +d3Obj.attr('cx');
    e.y = +d3Obj.attr('cy');
    e.radius = +d3Obj.attr('r');
    e.thing = d3Obj;

    svg.selectAll(".enemy").each(function(d,i){
      e2.thing = d3.select(this);

      if(e2.thing.attr("eID") === e.thing.attr("eID")){
          //do nothing
        }else if(e2.thing.attr("dying") === "true" || e.thing.attr("dying") === "true"){
          //do nothing
        }else{
          e2.x = +e2.thing.attr('cx');
          e2.y = +e2.thing.attr('cy');
          e2.radius = +e2.thing.attr('r');
          distanceE = lineDistance(e,e2);

          if(distanceE <= e.radius + e2.radius ){

            if(e.radius < e2.radius && e.thing.attr("startingZone") !== "true"){
              enemyDestroyEnemy(e.thing, 1000);
            }else{
              enemyDestroyEnemy(e2.thing, 1000);
            }
          }
        }
      });
  });
};

var checkCollisions = function(d3Obj) {
  var p = {};
  p.x = +player.attr('cx');
  p.y = +player.attr('cy');
  p.radius = +player.attr('r');
  var e = {};
  e.x = +d3Obj.attr('cx');
  e.y = +d3Obj.attr('cy');
  e.radius = +d3Obj.attr('r');
  e.thing = d3Obj;

  var e2 = {};
  var distanceE;

  svg.selectAll(".enemy").each(function(d,i){
    e2.thing = d3.select(this);

    if(e2.thing.attr("eID") === e.thing.attr("eID")){
      //do nothing
    }else if(e2.thing.attr("dying") === "true" || e.thing.attr("dying") === "true"){
      //do nothing
    }else{

      e2.x = +e2.thing.attr('cx');
      e2.y = +e2.thing.attr('cy');
      e2.radius = +e2.thing.attr('r');

      distanceE = lineDistance(e,e2);

      if(distanceE <= e.radius + e2.radius){

        if(e.thing.attr("scalingDown") !== "true"){
          e.thing.attr("scalingDown", "down-first");
        }
        if(e2.thing.attr("scalingDown") !== "true"){
          e2.thing.attr("scalingDown", "down-first");
        }
      }
    }

  });

  if(e.thing.attr("dying") === "true"){
    return;
  }

  if ( lineDistance(p, e) < e.radius + (playerRadius * .9) ) {
    if(d3Obj.attr("startingZone") !== "true"){
      playerHitEnemy(d3Obj);
    }else{
      d3Obj.attr("fill", circleBaseColor);
    }

  }
};

var changeChainText = function(text, color, obj){
  //these are never removed, but now we reload the page each time
  //**reload page changes
  chainText = svg.append('text').attr('class', 'splashText').attr("text-anchor", "middle").attr("dy", "0.3em")
  .style("stroke", "white").style("stroke-width", .5)
  .text(text).style('fill', color).style("opacity", 1)
  .transition().duration(3000).style("opacity", 1e-6);
  chainText.attr("x", obj.attr('cx')).attr('y', obj.attr('cy'));

};

var doScoreFor = function(obj){

   thisScore = +obj.attr("scoreValue");
  if(lastScore === highScoreValue && thisScore === highScoreValue){
    chain++;
    changeChainText("X" + chain, circleCollideGood, obj);
  }else if(lastScore === lowScoreValue && thisScore === lowScoreValue){
    chain++;
    changeChainText("X" + chain, circleCollideBad, obj);
  }else if(lastScore === midScoreValue && thisScore === midScoreValue){
    chain++;
    changeChainText("X" + chain, circleCollideMiddle, obj);
  }else{
    chain = 0;
  }
  chainMod = chain * ((chain + 1) * .25) + 1;
  lastScore = thisScore;
  thisScore = thisScore * ( +obj.attr('r') / enemyMinSize );


  netScore = thisScore * chainMod;
  roundScore += netScore;
};

var playerHitEnemy = function(d3Obj){

  if(d3Obj.attr("dying") === "true" || d3Obj.attr("doneWith") === "true"){
    d3Obj.style("fill", circleExplodeColor)
    .attr("shouldScale", false)
    .attr("dying", true).transition().duration(500).style("opacity", 1e-6);
    return;
  }
  var scoreValue = +d3Obj.attr("scoreValue");

  d3Obj.attr("stroke-width", enemyStrokeWidth * 4);
  doScoreFor(d3Obj);
  var rad = +d3Obj.attr('r') * .125;

  if(scoreValue === highScoreValue){
    d3Obj.style("fill", circleCollideGood)
    .attr("dying", true).style("stroke-width", rad ).style("stroke-dasharray", (""+rad*2+","+ rad)).style("opacity",1).transition().duration(5000).style("opacity", 1e-6);
  }else if(scoreValue === midScoreValue){
    d3Obj.style("fill", circleCollideMiddle)
    .attr("dying", true).style("stroke-width", rad).style("stroke-dasharray", (""+ rad*2 +","+ rad)).style("opacity",1).transition().duration(5000).style("opacity", 1e-6);
  }else{
    d3Obj.style("fill", circleCollideBad)
    .attr("dying", true).style("stroke-width", rad).style("stroke-dasharray", (""+ rad*2 +","+ rad)).style("opacity",1).transition().duration(5000).style("opacity", 1e-6);
  }
};

var enemyDestroyEnemy = function(obj,speed){
  obj.style("fill", circleExplodeColor)
  .attr("dying", true);
  obj.transition().duration(speed).attr('r', removeAtSize * .9).style("opacity",1e-6);
};

function lineDistance( point1, point2 )
{
  var xs = 0;
  var ys = 0;

  xs = point2.x - point1.x;
  xs = xs * xs;

  ys = point2.y - point1.y;
  ys = ys * ys;

  return Math.sqrt( xs + ys );
}

var playerClicked = function(pos){
  if(preventClicks === true){
    return;
  }

  if(scoreBoard !== undefined && scoreBoard.attr("visible") === "true"){
    hideScoreBoard();
    return;
  }

  if(menu !== undefined && menu.attr("visible") === "true"){
    hideMainMenu();
    return;
  }

  if(paused === true){
    return;
  }

  if(playerMoves.length >= maxPlayerMoves + 1){
    //reached max moves
    //do UI here
    return;
  }
  queueMove(pos);
  if(player.attr("isMoving") !== "true"){
    executeMove();
  }

};

var queueMove = function(pos){

  pos.isDone = false;
  playerMoves.push(pos);
  svg.append("line").attr("class", "line").style("stroke", "white").style("stroke-dasharray", ("2,4")).style("stroke-width", playerRadius * .14)
  .attr("x1", playerMoves[playerMoves.length - 2].x)
  .attr("y1", playerMoves[playerMoves.length - 2].y)
  .attr("x2", playerMoves[playerMoves.length - 2].x)
  .attr("y2", playerMoves[playerMoves.length - 2].y)
  .transition().duration(500)
  .attr("x2", playerMoves[playerMoves.length - 1].x)
  .attr("y2", playerMoves[playerMoves.length - 1].y)
};

var executeMove = function(){
  console.log("executeMove");
  var i;
  for( i = 0; i < playerMoves.length; i++){
    if(playerMoves[i].isDone === true){
      continue;
    }else{
      playerMoves[i].isDone = true;
      player.attr("isMoving", true);
      var distance = lineDistance( {x:player.attr("cx"), y: player.attr("cy") },playerMoves[i] );

      player.transition()
      .duration(distance/playerSpeed*100)
      .attr("cx", playerMoves[i].x)
      .attr("cy", playerMoves[i].y)
      .ease("linear")
      .each("end", function(){
        var endGame = true;
        for(var i = 0; i < playerMoves.length; i++){
          if(playerMoves[i].isDone !== true){
            endGame = false;
          }
        }

        if(endGame === true && playerMoves.length >= maxPlayerMoves + 1){
          preventClicks = true;
          paused = true;
          player.attr("isMoving", true);
          doEndOfGame();
        }else{
          player.attr("isMoving", false);
          executeMove();
        }
      });
      break;
    }
  }
};

var doEndOfGame = function(){

  var circle = svg.append("circle")
  .attr("cx", player.attr("cx"))
  .attr("cy", player.attr("cy"))
  .attr("r", playerRadius)
  .attr("stroke", "white")
  .style("stroke-width", playerRadius)
  .style("stroke-dasharray", (""+playerRadius+","+playerRadius))
  .attr("fill", "transparent")
  .transition()
  .duration(1000)
  .ease("elastic")
  .attr("r", playerRadius * 3)
  .each("end", function(){
    d3.select(this).remove()
    doScoreBoard();
  });

  circle.transition()
  .duration(1000)
  .ease("quad-out")
  .style("opacity", 0.01);
};

var doScoreBoard = function(){

 svg.selectAll('.enemy').style("opacity", 0);

 scoreBoard = svg.append('g');
 scoreBoard.attr("visible", true)
 .style("opacity", 0.1)
 .transition()
 .duration(250)
 .style("opacity", 1);

 scoreBoard.append("circle")
 .attr("class", "scoreBoard")
 .attr("r", shorter * .16)
 .attr("cx", width / 2)
 .attr("cy", height / 2)
 .attr("fill", "black")
 .style("stroke", "white")
 .style("stroke-width", enemyStrokeWidth * 3 * longerScaled);

  scoreBoard.append("text") // append text
  .attr("class", "scoreBoard")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "-1em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("SCORE"); // the text to display

  scoreBoard.append("text") // append text
  .attr("class", "scoreBoard")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", 0) // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("" + Math.round(100 + roundScore)); // the text to display

     setTimeout(function(){
      preventClicks = false;
      scoreBoard.append("text") // append text
      .attr("class", "scoreBoard")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "3em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("DONE"); // the text to display
   }, 2000)
   };

   var hideScoreBoard = function(){
    svg.selectAll(".line").remove();
    //svg.selectAll(".player").remove();
    player.attr("cx", pX).attr("cy", pY);
    scoreBoard.attr("visible", false);
    scoreBoard.selectAll('.scoreBoard').remove();
    scoreBoard.remove();

    if(forceReload){
      document.location.reload();
      return;
    }else{
     doGameMenu();
   }


 };

 var doGameMenu = function(){
  menu = menu || svg.append('g');
  menu.attr("visible", true)
  .style("opacity", 0.1)
  .transition()
  .duration(440)
  .style("opacity", 1);

  menu.append("circle")
  .attr("class", "menu")
  .attr("r", shorter * .16)
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .style("fill", "black")
  .style("stroke", "white")
  .style("stroke-width", enemyStrokeWidth * 3 * longerScaled);

  menu.append("text") // append text
  .attr("class", "menu")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "0") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("INTERSECTION"); // the text to display

  menu.append("text") // append text
  .attr("class", "menu")
  .classed("instructions", true)
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height * .8) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "0") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("4 points | 3 lines"); // the text to display

  menu.append("text") // append text
  .attr("class", "menu")
  .classed("instructions", true)
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height * .8) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "1em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("red bad | green great | blue good"); // the text to display

  menu.append("text") // append text
  .attr("class", "menu")
  .classed("instructions", true)
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height * .8) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "2em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("larger circles and chains multiply score"); // the text to display


  menu.append("text") // append text
  .attr("class", "menu")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "1em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("----  ----  ----"); // the text to display

     setTimeout(function(){
      preventClicks = false;
      menu.append("text") // append text
      .attr("class", "menu")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", "3em") // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text("START"); // the text to display
   }, 1000)
   };

   var hideMainMenu = function(){
    preventClicks = true;
    menu.attr("visible", false);
    menu.selectAll('.menu').remove();

  //do count down
  centerNumber = svg.append("text")
  .attr("class", "center")
     .style("fill", "white") // fill the text with black
     .attr("x", width/2) // set x position of left side of text
     .attr("y", height/2) // set y position of bottom of text
     .attr("dx", 0) // offset from x position anchor
     .attr("dy", 0) // offset from y position
     .attr("text-anchor", "middle") // y justification
     .text(""); // the text to display
     setTimeout(function(){ centerNumber.text("THREE")}, 400);
     setTimeout(function(){ centerNumber.text("TWO")}, 800);
     setTimeout(function(){ centerNumber.text("ONE")}, 1200);
     setTimeout(function(){
      newBoard();
      d3.timer(collisionLoop);
      centerNumber.remove();
    }, 1600);
   };

   var startGame = function(){
    svg.on("click", function(){ playerClicked.call(null,{x: d3.event.x, y: d3.event.y}) });
    doGameMenu();

    player = svg
    .append('circle')
    .attr("r", playerRadius)
    .attr("cx", pX )
    .attr("cy", pY )
    .style("fill", "white")
    .attr("class", "player");

  };

  var newBoard = function(){

    playerMoves = [];
    newScoreSet();
    player.attr("gameOver", false);
    player.attr("isMoving", false);

    playerMoves.push({x: pX, y:pY});

    setupEnemies();
    paused = false;
    preventClicks = false;
  };

  var newScoreSet = function(){
    scoreValueSet = [];
    for(var i = 0; i < enemyCount * percentGood; i++){
      scoreValueSet.push({score:highScoreValue,flashColor:circleCollideGood});
    }
    for(var i = 0; i < enemyCount * percentBad; i++){
      scoreValueSet.push({score:lowScoreValue,flashColor:circleCollideBad});
    }
    for(var i = scoreValueSet.length; i < enemyCount; i++){
      scoreValueSet.push({score:midScoreValue,flashColor:circleCollideMiddle});
    }
  }

  var makeRotate = function(props){
  //props.thing.attr("transform", "rotate(30,"+ (props.thing.x+props.thing.width/2) + ","+ (props.thing.y+props.thing.width/2) +")")
  props.thing.transition()
  .duration(5000)
  .style("rotate", 180)
}

var setRandomEnemyPosition = function(enemy){
  enemy.attr("cx", getRandomInt(0, width)).attr("cy", getRandomInt(0,height));
}

var setupEnemies = function(){
  var enemy;
  var props;

  if(enemyData === undefined){
    enemyData = [];

    for(var i = 0; i < enemyCount; i++){
      enemy = getRandomXYR();
      enemy.eID = "e" + i;
      enemyData.push(enemy);
      props = scoreValueSet.pop();
      enemy.score = props.score;
      enemy.flashColor = props.flashColor;
      enemy.startingZone = false;
    }
    enemyData[0].startingZone = true;
  }

  var things = svg.selectAll(".enemy")
  .data(enemyData);


  things.transition()
  .duration(1)
  .style("opacity", 1);

  things.attr("dying", false)
  .attr("shouldScale", true)
  .attr("scalingDown", "up-first")
  .attr("doneWith", false)
  .style("fill", circleBaseColor)
  .style("stroke", "white")
  .style("stroke-width", enemyStrokeWidth);

  things.enter()
  .append("circle")
  .attr("scoreValue", function(d){return d.score;})
  .attr("flashColor", function(d){return d.flashColor;})
  .attr("class", "enemy")
  .classed("startingZone", function(d){return d.startingZone})
  .attr("doneWith", false)
  .attr("cx", function(d){return d.x;})
  .attr("cy", function(d){return d.y;})
  .attr("r", function(d){return d.r;})
  .attr("dying", false)
  .attr("shouldScale", true)
  .attr("eID", function(d){return d.eID;})
  .attr("scalingDown", false)
  .style("fill", circleBaseColor)
  .style("stroke", "white")
  .style("stroke-width", enemyStrokeWidth)
  .on("mouseover", function(){
    var thing = d3.select(this);
    if(thing.attr("dying") !== "true" || paused !== false || preventClicks !== true){
     thing.style("stroke-width", enemyStrokeWidth).style("fill", thing.attr("flashColor"));
   }

 })
  .on("mouseout", function(){
    if(paused !== false || preventClicks !== true){
      d3.select(this).style("stroke-width", enemyStrokeWidth).style("fill", circleBaseColor);
    }
  });

 svg
  .selectAll(".startingZone")
  .attr("startingZone", true)
  .attr("shouldScale", false)
  .attr("cx", pX)
  .attr("cy", pY)
  .attr("r", playerRadius * 3)
  .style("stroke-width", playerRadius * .2).style("stroke-dasharray", ("" + playerRadius * .4 + "," + playerRadius * .15))
  .on("mouseout", function(){})
  .on("mouseover", function(){});

  flashInitialColors();
  clearOverlap();

};

var getRandomXYR = function(){
  var x = getRandomInt(0, width);
  var y = getRandomInt(0, height);
  var r = getRandomInt(enemyMinSize, enemyMaxSize)/2;
  return {x:x, y:y, r: r};
};

var getRandomInt = function(min, max){
  return Math.floor(Math.random() * (max - min));
};

startGame();


