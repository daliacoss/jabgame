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
    sprite.animations.play("idle");
    
    // _y: from 0 (high) to 2 (low)
    this._isDead = false;
    this._velocity = {x: 0, y: 0};
    this._homeX = sprite.x;
    this._targetSpritePosition = {x: this._homeX, y: 0};
    this.setGuardPosition(1, true, true);
    this._isThrusting = false;
    this._isRetracting = false;
    this._x = sprite.x;
    this._y = sprite.y;
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
    var player1;
    var player2;
    var graphics = new Phaser.Graphics(game, 0, 0);
    var controls;
    var countdownLabel;
    var timeToStart = 3;
    var timer;
    var begun = false;

    function preload () {

    }

    function create () {
        var rectangleLength = 800;
        var tipLength = 100;
        game.stage.backgroundColor = 0x000000;
        graphics.beginFill(0xffffff);
        // graphics.drawRect(0, 0, rectangleLength, 70);
        graphics.drawPolygon([
            {x: 0, y: 35},
            {x: tipLength, y: 0},
            {x: rectangleLength, y: 0},
            {x: rectangleLength, y: 70},
            {x: tipLength, y: 70},
        ])
        graphics.endFill();

        graphics.beginFill(0xffffff, 0);
        graphics.drawRect(rectangleLength, 0, rectangleLength, 70);
        graphics.endFill();

        this.cache.addSpriteSheet("player", null, graphics.generateTexture().baseTexture.source, rectangleLength, 70, 2);
        graphics.clear();
        
        player1 = new Player(game.add.sprite(350, game.world.centerY, "player"), 1);
        player2 = new Player(game.add.sprite(450, game.world.centerY, "player"), -1);
        
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

        countdownLabel = game.add.text(game.world.centerX, 100, "", { font: "64px Hack", fill: "#ffffff", align: "center" });
        countdownLabel.anchor.set(0.5);
        
        timer = game.time.events;
        for (var i = 0; i <= timeToStart; i++){
            timer.add(1000 * i, updatePreGameTimer, this);
        }
        timer.add((timeToStart * 1000) + 500, clearPreGameTimer, this);
    }
    
    function updatePreGameTimer(){
        if (timeToStart > 0){
            countdownLabel.text = timeToStart.toString();
        }
        else {
            begun = true;
            countdownLabel.text = "FIGHT";
        }
        timeToStart--;
    }
    
    function clearPreGameTimer(){
        countdownLabel.text = "";
    }
    
    function pressedUpP1(key){
        if (!begun){
            return;
        }
        player1.moveUp();
    }

    function pressedDownP1(key){
        if (!begun){
            return;
        }
        player1.moveDown();
    }

    function pressedThrustP1(key){
        if (!begun){
            return;
        }
        player1.thrust();
    }
    function pressedUpP2(key){
        if (!begun){
            return;
        }
        player2.moveUp();
    }

    function pressedDownP2(key){
        if (!begun){
            return;
        }
        player2.moveDown();
    }

    function pressedThrustP2(key){
        if (!begun){
            return;
        }
        player2.thrust();
    }

    function update() {
        if (!doneLoadingFonts){
            return;
        }

        player1.update();
        player2.update();
        postUpdate(player1, player2);
    }

    function postUpdate(player1, player2){
        for (var i = 0; i < 2; i++){
            var p = (i == 0) ? player1 : player2;
            var other = (i == 0) ? player2 : player1;

            if (p.isThrusting() && p.getX() == p.getGoalX()){
                p.retract();
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
        
        player1.draw();
        player2.draw();
    }
};
