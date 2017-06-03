var doneLoadingFonts = true;

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

    // _y: from 0 (high) to 2 (low)
    this._homeX = this.sprite.x;
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

Player.prototype.setGuardPosition = function(y, force, moveInstantly){
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

Player.prototype.moveUp = function(force){
    if (this._isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition - 1, force);
}

Player.prototype.moveDown = function(force){
    if (this._isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition + 1, force);
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
}

Player.prototype.parryDown = function(){
    if (this._guardPosition == 2){
        this.setGuardPosition(1, true);
    }
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
            this.setGuardPosition(0);
            this.stun();
        }
        else if (this.getBottomEdge() >= this.sprite.game.height){
            this.setGuardPosition(2);
            this.stun();
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

window.onload = function() {

    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { create: create, update: update });
    var scaleManager = new Phaser.ScaleManager(game, game.width, game.height);
    var graphics = new Phaser.Graphics(game, 0, 0);

    var player1;
    var player2;
    var countdownLabel;
    var generalLabel;
    var titleLabel;
    var victoryMarkersP1 = [];
    var victoryMarkersP2 = [];

    var controls;
    var timeToStart = 3;
    var timer;
    var begunRound = false;
    var begunGame = false;
    var numRoundsMax = 3;
    var numVictoriesP1 = 0;
    var numVictoriesP2 = 0;
    var numGamesPlayed = 0;

    function preload () {

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

        countdownLabel = game.add.text(game.world.centerX, 100, "", { font: "64px Hack", fill: "#ffffff", align: "center" });
        countdownLabel.anchor.set(0.5);

        timer = game.time.events;
        timer.add(500, function(){
            generalLabel = game.add.text(game.world.centerX, 300, "", { font: "32px Hack", fill: "#ffffff", align: "center" });
            generalLabel.anchor.set(0.5);
            generalLabel.text = "PRESS ANY KEY TO BEGIN";
        }, this);

        game.input.keyboard.addCallbacks(this, function() {
            if (!begunGame){
                beginGame();
                console.log("missy is cute");
            }
        });

        //beginGame();
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

            controls = game.input.keyboard.addKeys( {
                "upP1": Phaser.KeyCode.W,
                "downP1": Phaser.KeyCode.S,
                "thrustP1": Phaser.KeyCode.D,
                'upP2': Phaser.KeyCode.UP,
                "downP2": Phaser.KeyCode.DOWN,
                "thrustP2": Phaser.KeyCode.LEFT
            });

            controls.upP1.onDown.add(pressedUpP1);
            controls.downP1.onDown.add(pressedDownP1);
            controls.thrustP1.onDown.add(pressedThrustP1);
            controls.upP2.onDown.add(pressedUpP2);
            controls.downP2.onDown.add(pressedDownP2);
            controls.thrustP2.onDown.add(pressedThrustP2);
        }

        else {
            console.log("missy is still cute")
            for (var i = 0; i < (numRoundsMax + 1) / 2; i++){
                var vm = [victoryMarkersP1, victoryMarkersP2];
                for (var j = 0; j < 2; j++){
                    vm[j][i].animations.play("empty");
                }
            }
            player1.initialize();
            player2.initialize();
        }

        // reset text labels
        generalLabel.text = "";

        numVictoriesP1 = 0;
        numVictoriesP2 = 0;

        begunGame = true;
        beginRound(true);
    }

    function updatePreGameTimer(){
        if (timeToStart > 0){
            countdownLabel.text = timeToStart.toString();
        }
        else {
            begunRound = true;
            countdownLabel.text = "FIGHT";
        }
        timeToStart--;
    }

    function clearPreGameTimer(){
        countdownLabel.text = "";
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
        if (!doneLoadingFonts || !begunGame){
            return;
        }

        player1.update();
        player2.update();
        postUpdate(player1, player2);
    }

    function endGame(winner) {
        if (winner == 0){
            countdownLabel.text = "LEFT SIDE WINS";
        }
        else if (winner == 1){
            countdownLabel.text = "RIGHT SIDE WINS";
        }
        else if (winner == -1){
            countdownLabel.text = "DRAW";
        }
        begunGame = false;
        numGamesPlayed++;
    }

    function markVictory(id){
        if (id == 0){
            victoryMarkersP1[numVictoriesP1 - 1].animations.play("won");
        }
        else if (id == 1){
            victoryMarkersP2[numVictoriesP2 - 1].animations.play("won");
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
                    p.stun(true);
                }
                else if (other.getTopEdge() < p.getTopEdge() && p.getTopEdge() < other.getBottomEdge() && other.getVelocityY() > 0){
                    other.parryDown();
                    p.forceDown();
                }
                else if (p.getTopEdge() < other.getTopEdge() && other.getTopEdge() < p.getBottomEdge() && other.getVelocityY() < 0){
                    // console.log(p.getTopEdge(), other.getTopEdge(), p.getBottomEdge());
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
