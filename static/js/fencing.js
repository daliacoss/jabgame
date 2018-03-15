/*

Copyright Decky Coss 2017

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

REVISION_NUMBER = "B(abycastles)";
YEAR = "2018";

function Player(sprite, direction) {
    this.direction = direction;
    this.sprite = sprite;
    this.maxVelocity = {x: 30, y: 25};
    this.maxStunFrames = 0;
    this.maxStunFramesHeadOn = 60;
    this.maxStunFramesAfterWallHit = 60;

    sprite.anchor.set(0, 0.5);

    if (direction == 1){
        sprite.scale.x = -1;
        this._goalX = sprite.game.width;
    }
    else if (direction == -1){
        sprite.anchor.set(0, 0.5);
        this._goalX = 0;
    }

    sprite.animations.add("idle", [0]);
    sprite.animations.add("stunned", [0,0,0,1], 15, true);
    sprite.animations.add("hidden", [1]);

    // _y: from 0 (high) to 2 (low)
    this._homeX = this.sprite.x;
    this._sounds = {};
    this.initialize();
}

Player.prototype.initialize = function(){
    this.sprite.animations.play("idle");

    //redundant when called by constructor, but might be required after round
    this.sprite.x = this._homeX;

    this._isDead = false;
    this._velocity = {x: 0, y: 0};
    this._targetSpritePosition = {x: this._homeX, y: 0};
    this.setGuardPosition(1, true, true);
    this._isThrusting = false;
    this._isRetracting = false;
    this._x = this.sprite.x;
    this._y = this.sprite.y;
    this._stunTimer = 0;
    this._willHitWall = false;
}

Player.prototype.playSound = function(key){
    if (!this._sounds[key]){
        var adjustedKey = key;
        if (["attack", "moveGuard"].indexOf(key) != -1){
            adjustedKey += (this.direction > 0) ? "P1" :
                           (this.direction < 0) ? "P2" :
                           "";
        }
        this._sounds[key] = this.sprite.game.sound.play(adjustedKey);
    }
    else {
        this._sounds[key].play();
    }
}

Player.prototype.stopSound = function(key){
    var adjustedKey = (key == "attack" && this.direction > 0) ? "attackP1" :
          (key == "attack" && this.direction < 0) ? "attackP2" :
          key;
    if (this._sounds[key]){
        this._sounds[key].stop();
    }
}

Player.prototype.setGuardPosition = function(y, force, moveInstantly, initiatedByController){
    if ( ((y < 0 || y > 2 || this._velocity.y != 0 || this.isThrusting() || this.isRetracting()) && !force) ){
        return;
    }
    this._guardPosition = y;

    if (y < 0){
        this._targetSpritePosition.y = 0 + (this.sprite.height / 2);
    }
    else if (y > 2){
        this._targetSpritePosition.y = this.sprite.game.height - (this.sprite.height / 2);
    }
    else {
        this._targetSpritePosition.y = this.sprite.game.world.centerY + ((y - 1) * 200);
    }

    if (y < 0 || y > 2){
        this._willHitWall = true;
    }
    if (moveInstantly){
        this._y = this._targetSpritePosition.y;
    }
    
    if (initiatedByController){
        this.playSound("moveGuard");
    }

}

Player.prototype.getGuardPosition = function(){
    return this._guardPosition;
}

Player.prototype.isThrusting = function(){
    return this._isThrusting;
}

Player.prototype.isRetracting = function(){
    return this._isRetracting;
}

Player.prototype.isStunned = function(){
    return this._stunTimer > 0;
}

Player.prototype.isDead = function(){
    return this._isDead;
}

Player.prototype.getX = function(){
    return this._x;
}

Player.prototype.getY = function(){
    return this._y;
}

Player.prototype.getHomeX = function(){
    return this._homeX;
}

Player.prototype.getGoalX = function(){
    return this._goalX;
}

Player.prototype.getVelocityX = function(){
    return this._velocity.x;
}

Player.prototype.getVelocityY = function(){
    return this._velocity.y;
}

Player.prototype.isOverlappingX = function(other){
    if (this.direction != other.direction * -1){
        return;
    }

    return (this.direction > 0) ? this._x >= other.getX() :
           (this.direction < 0) ? this._x <= other.getX() :
           false;
}

Player.prototype.getTopEdge = function(){
    return this._y - (this.sprite.height / 2);
}


Player.prototype.getBottomEdge = function(){
    return this._y + (this.sprite.height / 2);
}

Player.prototype.moveUp = function(force){
    if (this._isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition - 1, force, false, true);
}

Player.prototype.moveDown = function(force){
    if (this._isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition + 1, force, false, true);
}

Player.prototype.thrust = function(){
    if (this._isDead || this.isStunned()){
        return;
    }

    if (this._velocity.y != 0 || this.isThrusting() || this.isRetracting()){
        return;
    }

    this._targetSpritePosition = {
        x: this._goalX,
        y: this._y
    }
    this._isThrusting = true;
    
    this.playSound("attack");
}

Player.prototype.retract = function(retractImmediately){
    this._targetSpritePosition.x = this._homeX;
    this._isThrusting = false;

    if (retractImmediately){
        this._x = this._targetSpritePosition.x;
        this._y = this._targetSpritePosition.y;
    }
    else {
        this._isRetracting = true;
    }
}

Player.prototype.stun = function(headOn){
    // +1 to account for the timer being decremented at the end of the update loop
    this._stunTimer = (headOn) ? this.maxStunFramesHeadOn + 1 : this.maxStunFramesAfterWallHit + 1;
    if (this.isThrusting){
        this.retract();
    }
    this.sprite.animations.play("stunned");
}

Player.prototype.kill = function(){
    this._isDead = true;
    this.sprite.animations.play("idle");
}

Player.prototype.hide = function(){
    this.sprite.animations.play("hidden");
}

Player.prototype.forceUp = function(){
    this.retract(true);
    this.moveUp(true);
}

Player.prototype.forceDown = function(){
    this.retract(true);
    this.moveDown(true);
}

Player.prototype.parryUp = function(){
    if (this._guardPosition == 0){
        this.setGuardPosition(1, true);
    }
    this.playSound("parry");
}

Player.prototype.parryDown = function(){
    if (this._guardPosition == 2){
        this.setGuardPosition(1, true);
    }
    this.playSound("parry");
}

Player.prototype.hitCeiling = function(){
    this.setGuardPosition(0);
    this.stun();
    //this.currentSound = this.sprite.game.sound.play("crash");
    this.playSound("crash");
}

Player.prototype.hitFloor = function(){
    this.setGuardPosition(2);
    this.stun();
    //this.currentSound = this.sprite.game.sound.play("crash");
    this.playSound("crash");
}

Player.prototype.hitHeadOn = function(){
    this.stun(true);
    //this.currentSound = this.sprite.game.sound.play("headon");
    this.stopSound("attack");
    this.playSound("headon");
}

Player.prototype.update = function(){
    if (this._isDead){
        return;
    }

    if (this.isThrusting() || this.isRetracting()){
        var xDiff = this._targetSpritePosition.x - this._x;
        // we have reached our target
        if (Math.abs(xDiff) <= Math.abs(this._velocity.x)){
            this._x = this._targetSpritePosition.x;
            this._velocity.x = 0;
            if (this._x == this._homeX){
                this._isRetracting = false;
            }
        }
        else {
            var xDir = (xDiff > 0) ? 1 : -1;
            //todo: replace next line with proper acceleration
            this._velocity.x = this.maxVelocity.x * xDir;
            this._x += this._velocity.x;
        }
    }

    else {
        var yDiff = this._targetSpritePosition.y - this._y;
        if (Math.abs(yDiff) <= Math.abs(this._velocity.y)){
            this._y = this._targetSpritePosition.y;
            this._velocity.y = 0;
        }
        else {
            var yDir = (yDiff > 0) ? 1 : -1;
            //todo: replace next line with proper acceleration
            this._velocity.y = this.maxVelocity.y * yDir;
            this._y += this._velocity.y;
        }

        if (this.getTopEdge() <= 0){
            this.hitCeiling();

        }
        else if (this.getBottomEdge() >= this.sprite.game.height){
            this.hitFloor();
        }
    }

    if (this._stunTimer > 0){
        this._stunTimer--;
        if (this._stunTimer == 0){
            this.sprite.animations.play("idle");
        }
    }
}

Player.prototype.draw = function(){
    this.sprite.x = this._x;
    this.sprite.y = this._y;
}

window.onload = function() {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', {
        preload: preload, create: create, update: update
    });
    var scaleManager = new Phaser.ScaleManager(game, game.width, game.height);
    var graphics = new Phaser.Graphics(game, 0, 0);

    var player1;
    var player2;
    var splashScreen;
    var helpScreen;
    var pressToStartLabel;
    var titleLabel;
    var subtitleLabel;
    var creditsLabel;
    var controlsP1Label;
    var controlsP2Label;
    var controlsP1HeaderLabel;
    var controlsP2HeaderLabel;
    var rulesLabel;
    var pressToStartFightLabel;
    var countdownLabel;
    var pressToRestartLabel;
    var victoryMarkersP1 = [];
    var victoryMarkersP2 = [];
    
    var soundLoaders;
    var sounds = {};

    var areSoundsLoaded;

    var playerInputHandler;
    var startKeyHandler;
    var debugKeyHandler;
    var frameSkipKeyHandler;
    var playerControls = {
        "upP1": "W",
        "downP1": "S",
        "thrustP1": "D",
        'upP2': "UP",
        "downP2": "DOWN",
        "thrustP2": "LEFT"
    }
    var startKey = Phaser.KeyCode.SPACEBAR;

    var timeToStart = 3;
    var timer;
    var begunRound = false;
    var begunGame = false;
    var showedHelpScreen = false;
    var numRoundsMax = 9;
    var numVictoriesP1 = 0;
    var numVictoriesP2 = 0;
    var numGamesPlayed = 0;
    
    var debugMode = false;
    var frozen = false;

    function preload () {      
        soundLoaders = {
            "crash": game.load.audio("crash", ["sounds/jab_hitceilingorfloor.ogg", "sounds/jab_hitceilingorfloor.mp3"]),
            "headon": game.load.audio("headon", ["sounds/jab_headon.ogg", "sounds/jab_headon.mp3"]),
            "attackP1": game.load.audio("attackP1", ["sounds/jab_attackp1.ogg", "sounds/jab_attackp1.mp3"]),
            "attackP2": game.load.audio("attackP2", ["sounds/jab_attackp2.ogg", "sounds/jab_attackp2.mp3"]),
            "moveGuardP1": game.load.audio("moveGuardP1", ["sounds/jab_moveguardp1.ogg", "sounds/jab_moveguardp1.mp3"]),
            "moveGuardP2": game.load.audio("moveGuardP2", ["sounds/jab_moveguardp2.ogg", "sounds/jab_moveguardp2.mp3"]),
            "parry": game.load.audio("parry", ["sounds/jab_parry.ogg", "sounds/jab_parry.mp3"]),
            "countdown3": game.load.audio("countdown3", "sounds/jab_fshigh.wav"),
            "countdown2": game.load.audio("countdown2", "sounds/jab_cslow.wav"),
            "countdown1": game.load.audio("countdown1", "sounds/jab_fslow.wav"),
            "countdown0": game.load.audio("countdown0", "sounds/jab_go.wav"),
            "wonP1": game.load.audio("wonP1", "sounds/wonp1.wav"),
            "wonP2": game.load.audio("wonP2", "sounds/wonp2.wav"),
            "gameover": game.load.audio("gameover", ["sounds/jab_gameover.ogg", "sounds/jab_gameover.mp3"]),
        };

    }
    function showSplashScreen(){

        pressToStartLabel.text = "PRESS SPACE KEY TO CONTINUE";
        titleLabel.text = "I JAB AT THEE";
        subtitleLabel.text = "a game for two players\nby decky coss";
        creditsLabel.text = "revision " + REVISION_NUMBER + "\n" +
                            "(c) decky coss " + YEAR + "\n" +
                            "\"Hack\" font by christopher simpkins (https://github.com/chrissimpkins/Hack)\n" +
                            "made with love for christopher psukhe";

        startKeyHandler = game.input.keyboard.addKey(startKey);
        startKeyHandler.onDown.add(function(){
            if (!showedHelpScreen){
                showHelpScreen();
            }
            else if (!begunGame){
                beginGame();
            }
        });
        
        splashScreen.visible = true;
    }
    
    function showHelpScreen(){
        splashScreen.visible = false;

        var keyNameToChar = function(n){
            return (n == "UP") ? "▲" :
                   (n == "DOWN") ? "▼" :
                   (n == "RIGHT") ? "►" :
                   (n == "LEFT") ? "◄" :
                   n;
        }

        controlsP1HeaderLabel.text = "PLAYER 1 CONTROLS";
        controlsP2HeaderLabel.text = "PLAYER 2 CONTROLS";
        controlsP1Label.text = "move up:       " + keyNameToChar(playerControls.upP1) + "\n" +
                               "move down:     " + keyNameToChar(playerControls.downP1) + "\n" +
                               "thrust:        " + keyNameToChar(playerControls.thrustP1);
        controlsP2Label.text = "move up:       " + keyNameToChar(playerControls.upP2) + "\n" +
                               "move down:     " + keyNameToChar(playerControls.downP2) + "\n" +
                               "thrust:        " + keyNameToChar(playerControls.thrustP2);
        rulesLabel.text = "The first fighter to hit their opponent's edge of the screen wins\nthe round. (Ties are possible.)\n\n" +
                          "Move your weapon up and down to parry your opponent's attacks and\npass their guard.\n\n" +
                          "If you hit your opponent's weapon head-on, or if you are parried\ninto the ceiling or floor, you will be stunned.\n\n" +
                          "While stunned, you can move your weapon up and down, but you\ncannot attack.";
        pressToStartFightLabel.text = "PRESS SPACE KEY TO FIGHT";

        helpScreen.visible = true;
        showedHelpScreen = true;
    }

    function create () {
        // create the weapon spritesheets

        var weaponLength = 800;
        var weaponThickness = 70;
        var tipLength = 100;
        game.stage.backgroundColor = 0x000000;
        graphics.beginFill(0xffffff);
        graphics.drawPolygon([
            {x: 0, y: weaponThickness / 2},
            {x: tipLength, y: 0},
            {x: weaponLength, y: 0},
            {x: weaponLength, y: weaponThickness},
            {x: tipLength, y: weaponThickness},
        ])
        graphics.endFill();

        graphics.beginFill(0xffffff, 0);
        graphics.drawRect(weaponLength, 0, weaponLength, 70);
        graphics.endFill();

        this.cache.addSpriteSheet("player", null, graphics.generateTexture().baseTexture.source, weaponLength, weaponThickness, 2);
        graphics.clear();

        // create the victory marker spritesheets

        var markerSize = 20;
        var markerLineWidth = 6;
        graphics.beginFill(0xffffff, 1);
        graphics.drawRect(0, 0, markerSize, markerSize);
        graphics.endFill();

        graphics.lineStyle(markerLineWidth, 0xffffff, 1);
        graphics.beginFill(0xffffff, 0);
        graphics.drawRect(markerSize, 0, markerSize, markerSize);
        graphics.endFill();
        this.cache.addSpriteSheet("victoryMarker", null, graphics.generateTexture().baseTexture.source, markerSize, markerSize, 2);
        graphics.clear();

        // add the text labels
        
        splashScreen = game.add.group()
        helpScreen = game.add.group()

        countdownLabel = game.add.text(game.world.centerX, 100, "", { font: "64px Hack, monospace", fill: "#ffffff", align: "center" });
        pressToRestartLabel = game.add.text(game.world.centerX, 300, "", { font: "32px Hack, monospace", fill: "#ffffff", align: "center" });
        [countdownLabel, pressToRestartLabel].forEach(function(v){
            v.anchor.set(0.5);
        });

        creditsLabel = game.add.text(game.world.centerX, 550, "", { font: "11px Hack, monospace", fill: "#ffffff", align: "center" });
        pressToStartLabel = game.add.text(game.world.centerX, 460, "", { font: "32px Hack, monospace", fill: "#ffffff", align: "center" });
        titleLabel = game.add.text(game.world.centerX, 180, "", { font: "64px Hack, monospace", fill: "#ffffff", align: "center" });
        subtitleLabel = game.add.text(game.world.centerX, 320, "", { font: "28px Hack, monospace", fill: "#ffffff", align: "center" });

        controlsP1Label = game.add.text(game.world.centerX - 200, 120, "", { font: "20px Hack, monospace", fill: "#ffffff", align: "center" });
        controlsP2Label = game.add.text(game.world.centerX + 200, 120, "", { font: "20px Hack, monospace", fill: "#ffffff", align: "center" });
        controlsP1HeaderLabel = game.add.text(game.world.centerX - 200, 60, "", { font: "24px Hack, monospace", fill: "#ffffff", align: "center" });
        controlsP2HeaderLabel = game.add.text(game.world.centerX + 200, 60, "", { font: "24px Hack, monospace", fill: "#ffffff", align: "center" });
        rulesLabel = game.add.text(game.world.centerX, 350, "", { font: "20px Hack, monospace", fill: "#ffffff", align: "left" });
        pressToStartFightLabel = game.add.text(game.world.centerX, 550, "", { font: "28px Hack, monospace", fill: "#ffffff", align: "center" });

        [creditsLabel, pressToStartLabel, titleLabel, subtitleLabel].forEach(function(v){
            v.anchor.set(0.5);
            splashScreen.addChild(v);
        });
        [rulesLabel, controlsP1HeaderLabel, controlsP2HeaderLabel, controlsP1Label, controlsP2Label, pressToStartFightLabel].forEach(function(v){
            v.anchor.set(0.5);
            helpScreen.addChild(v);
        });


        timer = game.time.events;
        
        // create the input handler

        playerInputHandler = game.input.keyboard.addKeys(function(){
            controls = [];
            Object.keys(playerControls).forEach(function(v,i){
                controls[v] = Phaser.KeyCode[playerControls[v]];
            });
            return controls;
        }());
        
        // allow splash screen to show when assets have loaded
        
        game.sound.setDecodedCallback(Object.keys(soundLoaders), function(){
            areSoundsLoaded = true;
            timer.add(500, showSplashScreen, this);
        }, this);
    }
    
    function playSound(key){
        if (!sounds[key]){
            sounds[key] = game.sound.play(key);
        }
        else {
            sounds[key].play();
        }
    }
    
    function beginGame(){
        

        if (numGamesPlayed == 0){

            // add the sprites

            var victoryMarkerSpacing = 20;
            var victoryMarkerX = 40;
            var victoryMarkerY = 560;
            for (var i = 0; i < (numRoundsMax + 1) / 2; i++){
                var vm = [victoryMarkersP1, victoryMarkersP2];
                for (var j = 0; j < 2; j++){
                    var x = (j == 0) ? victoryMarkerX + ((victoryMarkerSpacing + 25) * i) :
                            game.width - victoryMarkerX - ((victoryMarkerSpacing + 25) * i);
                    vm[j][i] = game.add.sprite(x, victoryMarkerY, "victoryMarker");
                    vm[j][i].anchor.set(0.5);
                    vm[j][i].animations.add("empty", [1]);
                    vm[j][i].animations.add("won", [0]);
                    vm[j][i].animations.play("empty");
                }
            }

            player1 = new Player(game.add.sprite(350, game.world.centerY, "player"), 1);
            player2 = new Player(game.add.sprite(450, game.world.centerY, "player"), -1);

            // set controls

            playerInputHandler.upP1.onDown.add(pressedUpP1);
            playerInputHandler.downP1.onDown.add(pressedDownP1);
            playerInputHandler.thrustP1.onDown.add(pressedThrustP1);
            playerInputHandler.upP2.onDown.add(pressedUpP2);
            playerInputHandler.downP2.onDown.add(pressedDownP2);
            playerInputHandler.thrustP2.onDown.add(pressedThrustP2);
        }

        else {
            for (var i = 0; i < (numRoundsMax + 1) / 2; i++){
                var vm = [victoryMarkersP1, victoryMarkersP2];
                for (var j = 0; j < 2; j++){
                    vm[j][i].animations.play("empty");
                }
            }
            player1.initialize();
            player2.initialize();
            pressToRestartLabel.text = "";
        }

        splashScreen.visible = false;
        helpScreen.visible = false;

        numVictoriesP1 = 0;
        numVictoriesP2 = 0;

        begunGame = true;
        beginRound(true);
    }

    function updatePreGameTimer(){
        if (timeToStart > 0){
            countdownLabel.text = timeToStart.toString();
            playSound("countdown" + timeToStart.toString());
        }
        else {
            begunRound = true;
            countdownLabel.text = "FIGHT";
            playSound("countdown0");
        }
        timeToStart--;
        
    }

    function clearPreGameTimer(){
        countdownLabel.text = "";
    }
    
    function areAssetsLoaded(){
        return areSoundsLoaded;
    }

    function beginRound(isFirstRound){
        if (!isFirstRound){
            player1.initialize();
            player2.initialize();
        }
        begunRound = false;

        if (numVictoriesP1 > numRoundsMax / 2){
            if (numVictoriesP2 > numRoundsMax / 2){
                endGame(-1);
            }
            else {
                endGame(0);
            }
            return;
        }
        else if (numVictoriesP2 > numRoundsMax / 2){
            endGame(1);
            return;
        }

        timer = game.time.events;
        timeToStart = 3;
        for (var i = 0; i <= timeToStart; i++){
            timer.add(1000 * i, updatePreGameTimer, this);
        }
        timer.add((timeToStart * 1000) + 500, clearPreGameTimer, this);
        timer.start();
    }

    function pressedUpP1(key){
        if (!begunRound){
            return;
        }
        player1.moveUp();
    }

    function pressedDownP1(key){
        if (!begunRound){
            return;
        }
        player1.moveDown();
    }

    function pressedThrustP1(key){
        if (!begunRound){
            return;
        }
        player1.thrust();
    }
    function pressedUpP2(key){
        if (!begunRound){
            return;
        }
        player2.moveUp();
    }

    function pressedDownP2(key){
        if (!begunRound){
            return;
        }
        player2.moveDown();
    }

    function pressedThrustP2(key){
        if (!begunRound){
            return;
        }
        player2.thrust();
    }

    function update() {
        if (!begunGame || frozen){
            return;
        }
        
        player1.update();
        player2.update();
        postUpdate(player1, player2);

        if (debugMode){
            frozen = true;
        }
    }

    function endGame(winner) {
        if (winner == 0){
            countdownLabel.text = "LEFT SIDE WINS";
            player2.hide();
        }
        else if (winner == 1){
            countdownLabel.text = "RIGHT SIDE WINS";
            player1.hide();
        }
        else if (winner == -1){
            countdownLabel.text = "DRAW";
        }
        player1.setGuardPosition(2, true, true);
        player2.setGuardPosition(2, true, true);
        player1.draw();
        player2.draw();
        pressToRestartLabel.text = "PRESS SPACE KEY TO RESTART";
        begunGame = false;
        numGamesPlayed++;
        
        playSound("gameover");
    }

    function markVictory(id){
        if (id == 0){
            victoryMarkersP1[numVictoriesP1 - 1].animations.play("won");
            playSound("wonP1");
        }
        else if (id == 1){
            victoryMarkersP2[numVictoriesP2 - 1].animations.play("won");
            playSound("wonP2");
        }
    }

    function postUpdate(player1, player2){
        if (player1.isDead() || player2.isDead()){
            return;
        }

        for (var i = 0; i < 2; i++){
            var p = (i == 0) ? player1 : player2;
            var other = (i == 0) ? player2 : player1;

            if (p.isThrusting() && p.getX() == p.getGoalX()){
                //p.retract();
                other.kill();
            }
            else if (p.isThrusting() && p.isOverlappingX(other) && p.getGuardPosition() == other.getGuardPosition()){
                if (other.getY() == p.getY()){
                    p.hitHeadOn();
                }
                else if (other.getTopEdge() < p.getTopEdge() && p.getTopEdge() < other.getBottomEdge() && other.getVelocityY() > 0){
                    other.parryDown();
                    p.forceDown();
                }
                else if (p.getTopEdge() < other.getTopEdge() && other.getTopEdge() < p.getBottomEdge() && other.getVelocityY() < 0){
                    other.parryUp();
                    p.forceUp();
                }
            }

        }

        if (player1.isDead() || player2.isDead()){
            timer = game.time.events;
            var t = 1000;
            if (player2.isDead()){
                numVictoriesP1++;
                timer.add(1000, markVictory, this, 0);
                if (player1.isDead()){
                    numVictoriesP2++;
                    t += 700;
                    timer.add(t, markVictory, this, 1);
                }
            }
            else {
                numVictoriesP2++;
                timer.add(t, markVictory, this, 1);
            }

            t += 700;
            timer.add(t, beginRound, this, false);
        }

        player1.draw();
        player2.draw();
    }
};
