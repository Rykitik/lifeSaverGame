const maxHeartsCount = 10;

// Listeners
$('#welcomeForm').on('submit', welcomeFormSubmit);
$('#welcomeForm input[type="text"]').on('input', welcomeFormInput);
$('#screenRating .start-over').on('click', raitingStartOver);
$('#screenLoss .start-over').on('click', lossStartOver);

// Functions
function showBox(box) {
    box.addClass('active');
}

function hideBox(box) {
    box.removeClass('active');
}

function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function gameOpen() {
    showBox($('#screenWelcome > .box-wrapper'));
}

function startGame(game, heroName) {
    this.game = new Game($('.game > .field'), heroName);
    this.game.start();
}

// FunctionsListeners: обработчики прослушки

function welcomeFormInput() {
    if(this.value !== '')
        $('#welcomeForm > button[type="submit"]').prop('disabled', false);
    else
        $('#welcomeForm > button[type="submit"]').prop('disabled', true);
}

function welcomeFormSubmit(e) {
    e.preventDefault();
    hideBox($('#screenWelcome > .box-wrapper'));
    startGame(this.game, $('#welcomeForm input[type="text"]').val());
}



function raitingStartOver() {
    
    hideBox($('#screenRating > .box-wrapper'));
    gameOpen();
}

function lossStartOver() {
    hideBox($('#screenLoss > .box-wrapper'));
    gameOpen();
}

// Class
class Game{
    constructor(field, heroName) {
        this.field = field;
        this.isOn = false;
        this.hero = null;
        this.heroName = heroName;
        this.width = this.field.width();
        this.height = this.field.height();
        this.time = 0;
        this.hearts = 0;
        this.cells = [];

        this.playerMoveListener = this.playerMove.bind(this);
    }

    setHeroMoveListener() {
        window.addEventListener('keydown', this.playerMoveListener);
    }
       
    removeHeroMoveListener() {
        window.removeEventListener('keydown', this.playerMoveListener);
    } 

    //functions
    getCellsAmount() {
        return {
            x: Math.floor(this.width / 64),
            y: Math.floor(this.height / 64)
        }
    }

    setCellsType(type, count = 10) {
        let amount = count;
        while(amount > 0) {
            const cell = this.cells[randomInt(0, this.cells.length - 1)];
            if (cell.type === 'ground') {
                cell.updateType(type);
                amount--;
            }
        }
    }
    
    findCellByCoordinate(x, y) {
        return this.cells.find(cell => cell.x === x && cell.y === y);
    }

    updateHeartsBar() {
        $('#hudHearts').text(`${this.hearts}/${maxHeartsCount}`);
    }

    addHeart() {
        if (this.hearts != maxHeartsCount)
            this.hearts = this.hearts + 1;
        this.updateHeartsBar()
    }

    playerMove(e) {
        switch(e.code) {
            case 'KeyD':
                this.hero.moveTo('right');
                break;
            case 'KeyA':
                this.hero.moveTo('left');
                break;
            case 'KeyW':
                this.hero.moveTo('up');
                break;
            case 'KeyS':
                this.hero.moveTo('down');
                break;
        }
    }

    setHeartsToZero() {
        $('#hudHearts').text(`0/10`);
    }

    updateTimer() {
        this.time++;
        let minutes = Math.floor(this.time / 60);
        let seconds = this.time % 60;
        if (minutes < 10)
            minutes = '0' + minutes;
        if (seconds < 10)
            seconds = '0' + seconds;
        $('#hudTime').text(`${minutes}:${seconds}`);
    }    

    startTimer() {
        const timeUpdating = setInterval(()=> {
            this.updateTimer();
            if(!this.isOn) {
                $('#hudTime').text(`00:00`);
                clearInterval(timeUpdating);
            }
        }, 1000);
    }

    start() {
        this.hero = new Hero(this);
        this.isOn = true;
        this.renderCells();
        this.setHeroMoveListener();
        $('#hudUsername').text(this.heroName);
        this.startTimer();
    }
    
    finish() {
        this.isOn = false;
        this.removeHeroMoveListener();
        this.removeCells();
        this.setHeartsToZero();
    }

    complete() {
        this.sendResult();
        this.finish();
        this.showResult();
        showBox($('#screenRating > .box-wrapper'));
    }

    fail () {
        this.finish();
        showBox($('#screenLoss .box-wrapper'));
    }

    sendResult() {

    $.ajax({
            url: 'server.php',
            method: 'POST',
            data: {
                ratingName: this.heroName,
                ratingTime: this.time
            },
            success: function(response) {
                // Здесь Вы можете обработать ответ сервера, например, сообщить, что данные успешно сохранены
                console.log('Данные успешно сохранены:', response);
            },
            error: function(error) {
                // Здесь Вы можете обработать ошибки выполнения запроса, например, показать сообщение об ошибке
                console.error('Произошла ошибка:', error);
            }
        });
    }

    showResult() {
        $('#rating-name').text(this.heroName);
        $('#rating-time').text(this.time);
    }

    renderCells() {
        const cellsAmount = this.getCellsAmount();
        for(let i = 0; i < cellsAmount.y; i++) {
            for(let j = 0; j < cellsAmount.x; j++) {
                if(i === this.hero.x && j === this.hero.y)
                    this.cells.push(new Cell(this, j * 64, i * 64, 'player'));
                else
                    this.cells.push(new Cell(this, j * 64, i * 64, 'ground'));
            }
        }
        this.setCellsType('stone');
        this.setCellsType('heart');
    }

    removeCells() {
        this.cells.forEach(cell => {
            cell.el.remove();
        });
    }
}

class Hero{
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
    }

    moveTo(direction) {
        let x = this.x;
        let y = this.y;
        if (direction === 'left') x -= 64;
        else if (direction === 'right') x += 64;
        else if (direction === 'down') y += 64;
        else if (direction === 'up') y -= 64;

        const cell = this.game.findCellByCoordinate(x, y);
        if (cell && cell.type !== 'stone') {
            if (cell.type === 'heart') {
                this.game.addHeart();
                if (this.game.hearts === 10)
                this.game.complete();
            }
            cell.updateType('player');
            this.game.findCellByCoordinate(this.x, this.y).updateType();
            setTimeout(() => {
                const cellOnTop = this.game.findCellByCoordinate(x, y - 64);
                if (cellOnTop && (cellOnTop.type === 'stone' || cellOnTop.type === 'heart'))
                    this.game.cells.push( new Cell(this.game, cellOnTop.x, cellOnTop.y, cellOnTop.type, 'falling'));
             });
            this.x = x;
            this.y = y;
        }
    }
}

class Cell{
    constructor(game, x, y, type, state = 'standing') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.state = state;     // 'standing' or 'falling'
        this.fallingTime = 10;  // 1 px per time(ms)
        this.el = $(`
        <div class="cell ${this.type}" style="left: ${this.x}px; top: ${this.y}px;"></div)
        `)

        this.game.field.append(this.el);
        if (this.state === 'falling') {
            if (this.type === 'heart')
                this.clearCellOnCurrentPosition();
            this.startMove();
        }
    }
        // functions

    updateType(type = '') {
        this.el.removeClass(this.type);
        this.type = type;
        this.el.addClass(this.type);
    }

    startMove() {
        let destroyed = false;
        setTimeout( () => {
            if (this.type === 'stone')
                this.clearCellOnCurrentPosition();
                const checkInterval = setInterval(() => {
                if (destroyed || !this.game.isOn) {
                    clearInterval(checkInterval);
                    return;
                }
                if (this.checkTouch()) {
                    this.el.remove();
                    destroyed = true;
                    if (this.type === 'heart') {
                        this.game.addHeart();
                    }       
                    else if (this.type === 'stone') 
                        this.game.fail();
                }
                this.y++;
                this.updatePosition();
                if (this.y % 64 === 0) {
                    const cell = this.game.findCellByCoordinate(this.x, this.y + 64);
                    if (!cell || cell && cell.type !== '' && cell.type !== 'player') {
                        const currentCell = this.game.findCellByCoordinate(this.x, this.y);
                        currentCell.updateType(this.type);
                        this.el.remove();
                        destroyed = true;
                    }
                }
            }, this.fallingTime);
        }, 1000);
    }

    checkTouch() {
        const hero = this.game.hero;
        if (this.x < hero.x + 63 && this.x + 63 > hero.x) {
            if (this.y < hero.y + 63 && this.y + 63 > hero.y) {
                return true;
            }
        }
        return false;
    }

    clearCellOnCurrentPosition() {
        const currentCell = this.game.findCellByCoordinate(this.x, this.y);
        currentCell.updateType();
    }

    updatePosition() {
        this.el.css('top', this.y);
    }

}

// Code main.js
let game;
gameOpen();