function Player(sprite, direction) {
    this.direction = direction;
    this.sprite = sprite;
    this.maxVelocity = {x: 60, y: 40};
    this.velocity = {x: 0, y: 0};
    this.isDead = false;
    
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
    sprite.animations.add("stunned", [0,1], 5, true);
    sprite.animations.play("idle");
    
    // _y: from 0 (high) to 2 (low)
    this.setGuardPosition(1);
    this._isThrusting = false;
    this._homeX = sprite.x;
    this._x = sprite.x;
    this._y = sprite.y;
}

Player.prototype.setGuardPosition = function(y){
    if (y < 0 || y > 2 || this.velocity.y != 0 || this.isThrusting()){
        return;
    }
    this._guardPosition = y;
    this._targetSpritePosition = {x: this._x, y: this.sprite.game.world.centerY + ((y - 1) * 200)};
}

Player.prototype.getGuardPosition = function(){
    return this._guardPosition;
}

Player.prototype.isThrusting = function(){
    return this._isThrusting;
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

Player.prototype.moveUp = function(){
    if (this.isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition - 1);
}

Player.prototype.moveDown = function(){
    if (this.isDead){
        return;
    }

    this.setGuardPosition(this._guardPosition + 1);
}

Player.prototype.thrust = function(){
    if (this.isDead){
        return;
    }

    if (this.velocity.y != 0 || this.isThrusting()){
        return;
    }
    
    this._targetSpritePosition = {
        x: this._goalX,
        y: this._y
    }
    this._isThrusting = true;
}

Player.prototype.retract = function(){
    this._targetSpritePosition.x = this._homeX;
}

Player.prototype.update = function(){
    if (this.isDead){
        return;
    }

    if (this.isThrusting()){
        var xDiff = this._targetSpritePosition.x - this._x;
        // we have reached our target
        if (Math.abs(xDiff) <= Math.abs(this.velocity.x)){
            this._x = this._targetSpritePosition.x;
            this.velocity.x = 0;
            if (this._x == this._homeX){
                this._isThrusting = false;
            }
        }
        else {
            var xDir = (xDiff > 0) ? 1 : -1;
            //todo: replace next line with proper acceleration
            this.velocity.x = this.maxVelocity.x * xDir;
            this._x += this.velocity.x;
        }
    }

    else {
        var yDiff = this._targetSpritePosition.y - this._y;
        if (Math.abs(yDiff) <= Math.abs(this.velocity.y)){
            this._y = this._targetSpritePosition.y;
            this.velocity.y = 0;
        }
        else {
            var yDir = (yDiff > 0) ? 1 : -1;
            //todo: replace next line with proper acceleration
            this.velocity.y = this.maxVelocity.y * yDir;
            this._y += this.velocity.y;
        }
    }
}

Player.prototype.draw = function(){
    this.sprite.x = this._x;
    this.sprite.y = this._y;
}

window.onload = function() {
    
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { create: create, update: update });

    var scaleManager = new Phaser.ScaleManager(game, game.width, game.height);
    var player1;
    var player2;
    var graphics = new Phaser.Graphics(game, 0, 0);
    var controls;

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
        player2 = new Player(game.add.sprite(450, 100, "player"), -1);
        
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
    
    function pressedUpP1(key){
        player1.moveUp();
    }

    function pressedDownP1(key){
        player1.moveDown();
    }

    function pressedThrustP1(key){
        player1.thrust();
    }
    function pressedUpP2(key){
        player2.moveUp();
    }

    function pressedDownP2(key){
        player2.moveDown();
    }

    function pressedThrustP2(key){
        player2.thrust();
    }
    
    function moveUp() {
        
    }

    function update() {
        player1.update();
        player2.update();
        postUpdate(player1, player2);
    }

    function postUpdate(player1, player2){
        console.log(player2.getX(), player2.getGoalX());
        for (var i = 0; i < 2; i++){
            var p = (i == 0) ? player1 : player2;
            var other = (i == 0) ? player2 : player1;

            if (p.isThrusting() && p.getX() == p.getGoalX()){
                p.retract();
                other.isDead = true;
            }
        }
        
        player1.draw();
        player2.draw();
    }
};
