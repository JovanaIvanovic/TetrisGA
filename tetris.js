let grid = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
];

//Shapes
let shapes = {
    I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    J: [[2,0,0], [2,2,2], [0,0,0]],
    L: [[0,0,3], [3,3,3], [0,0,0]],
    O: [[4,4], [4,4]],
    S: [[0,5,5], [5,5,0], [0,0,0]],
    T: [[0,6,0], [6,6,6], [0,0,0]],
    Z: [[7,7,0], [0,7,7], [0,0,0]]
};

//Block colors
let colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

//Used to help create a seeded generated random number for choosing shapes
let rndSeed = 1;

//Block shapes
let currentShape = {x: 0, y: 0, shape: undefined};
let upcomingShape;
//stores upcoming shapes
let bag = [];
//index for shapes in the bag, where we are in the bag
let bagIndex = 0;

//GAME VALUES
let score = 0;
let speed = 500;
//list of available game speeds
let speeds = [500,100,1,0];
let speedIndex = 0;
let changeSpeed = false;
//for storing current state, we can load later
let saveState;
//stores current game state
let roundState;

//turn ai on or off( u can play)
let ai = true;
//drawing game or updating algorithms
let draw = true;
//how many so far?
let movesTaken = 0;
//max number of moves allowed in a generation
let moveLimit = 500;
//consists of  7 move parameters
let moveAlgorithm = {};
//set to highest rate move
let inspectMoveSelection = false;

//Genetic algorithm values
let populationSize = 50;
//stores genomes
let genomes = [];
//index of current genome in genomes array
let currentGenome = -1;
//generation number
let generation = 0;
//stores values for a generation
let archive = {
    populationSize: 0,
    currentGeneration: 0,
    elites: [], //Those to reproduce
    genomes: []
};
//rate of mutation
let mutationRate = 0.05;
//helps calculate mutation
let mutationStep = 0.2;

function initialize(){
    archive.populationSize = populationSize; //Initialise pop size
    //get the next available shape from the bag
    nextShape();
    //applies the shape to the grid
    applyShape();

    saveState = getState();
    roundState = getState();
    //create an initial population of genomes
    createInitialPopulation();

    //the game loop
    let loop = function () {
        if(changeSpeed){
            //restart the clock
            //stop time
            clearInterval(interval);
            interval = setInterval(loop, speed);
            changeInterval = false;
        }
        if(speed===0){
            draw = false;
            update();
            update();
            update();
        }
        else{
            //draw the elements
            draw = true;
        }
        //update regardless
        update();
        if (speed === 0) {
            //now draw elements
            draw = true;
            //now update the score
            updateScore();
        }


    };
    //timer interval
    let interval = setInterval(loop, speed);
}

document.onLoad = initialize(); //JS calls initialize on load

window.onkeydown = function (event) {
    //key options

    let characterPressed = String.fromCharCode(event.keyCode);
    if (event.keyCode === 38) {
        rotateShape();
    } else if (event.keyCode === 40) {
        moveDown();
    } else if (event.keyCode === 37) {
        moveLeft();
    } else if (event.keyCode === 39) {
        moveRight();
    } else if (shapes[characterPressed.toUpperCase()] !== undefined) {
        removeShape();
        currentShape.shape = shapes[characterPressed.toUpperCase()];
        applyShape();
    } else if (characterPressed.toUpperCase() === "Q") {
        saveState = getState();
    } else if (characterPressed.toUpperCase() === "W") {
        loadState(saveState);
    } else if (characterPressed.toUpperCase() === "D") {
        //slow down
        speedIndex--;
        if (speedIndex < 0) {
            speedIndex = speeds.length - 1;
        }
        speed = speeds[speedIndex];
        changeSpeed = true;
    } else if (characterPressed.toUpperCase() === "E") {
        //speed up
        speedIndex++;
        if (speedIndex >= speeds.length) {
            speedIndex = 0;
        }
        //adjust speed index
        speed = speeds[speedIndex];
        changeSpeed = true;
        //Turn on/off AI
    } else if (characterPressed.toUpperCase() === "A") {
        ai = !ai;
    } else if (characterPressed.toUpperCase() === "R") {
        //load saved generation values
        loadArchive(prompt("Insert archive:"));
    } else if (characterPressed.toUpperCase() ==="G") {
        if (localStorage.getItem("archive") === null) {
            alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
        } else {
            prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
        }
    } else if (characterPressed.toUpperCase() === "F") {
        //?
        inspectMoveSelection = !inspectMoveSelection;
    } else {
        return true;
    }
    //outputs game state to the screen (post key press)
    output();
    return false;
};

function createInitialPopulation(){
    //inits the array
    genomes = [];

    for (let i = 0; i < populationSize; i++) {
        let genome ={
            //has genes
            id: Math.random(),
            //The weight of each row cleared by the given move. the more rows that are cleared, the more this weight increases
            rowsCleared: Math.random() - 0.5,
            //the absolute height of the highest column to the power of 1.5
            //added so that the algorithm can be able to detect if the blocks are stacking too high
            weightedHeight: Math.random() - 0.5,
            //The sum of all the column’s heights
            cumulativeHeight: Math.random() - 0.5,
            //the highest column minus the lowest column
            relativeHeight: Math.random() - 0.5,
            //the sum of all the empty cells that have a block above them (basically, cells that are unable to be filled)
            holes: Math.random() * 0.5,
            // the sum of absolute differences between the height of each column
            //(for example, if all the shapes on the grid lie completely flat, then the roughness would equal 0).
            roughness: Math.random() - 0.5,

        };
        //add to array
        genomes.push(genome);
    }
    evaluateNextGenome();
}
//Evaluates next genome in the population. If there's none evolves the population.
function evaluateNextGenome(){
    //Increment genome index

    currentGenome++;
    console.log(currentGenome);
    if(currentGenome === genomes.length){
        evolve();
    }

    //Load current gameState
    loadState(roundState);
    //Reset moves taken
    movesTaken= 0;
    makeNextMove();
}
//evolves the population and goes to next generation
function evolve() {
    console.log("Generation " + generation + " evaluated.");

    currentGenome = 0;
    generation++;
    reset();
    roundState = getState();
    //decreasing order
    genomes.sort(function (a,b) {
        return b.fitness - a.fitness;
    });
    archive.elites.push(clone(genomes[0]));
    console.log("Elite's fitness: "+ genomes[0].fitness);

    //remove half of the genomes, leave the fittest
    while(genomes.length> populationSize/2){
        genomes.pop();
    }

    let totalFitness = 0;
    for(let i= 0; i<genomes.length; i++){
        totalFitness += genomes[i].fitness;
    }

    //Find a random genome from array
    //This is a fitness function, we choose who to breed randomly
    function getRandomGenome() {
        return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
    }

    let children = [];
    //add the fittest genome to array
    children.push(clone(genomes[0]));
    //add population sized amount of children
    while (children.length < populationSize) {
        //crossover between two random genomes to make a child
        children.push(makeChild(getRandomGenome(), getRandomGenome()));
    }
    genomes = [];
    genomes = genomes.concat(children);
    //store this in our archive
    archive.genomes = clone(genomes);
    //and set current gen
    archive.currentGeneration = clone(generation);
    console.log(JSON.stringify(archive));
    //store archive(short term memory)
    localStorage.setItem("archive", JSON.stringify(archive));
}

function makeChild(mum, dad){

    //Init the child => Choose random beetwen mum and dad
    //Crossover
    let child = {
        //unique id
        id : Math.random(),
        rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
        weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
        cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
        relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
        holes: randomChoice(mum.holes, dad.holes),
        roughness: randomChoice(mum.roughness, dad.roughness),
        //no fitness. yet.
        fitness: -1
    };
    //Mutation => Mutate each of the parameters

    if (Math.random() < mutationRate) {
        child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
    }
    if (Math.random() < mutationRate) {
        child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
    }
    return child;

}

function getAllPossibleMoves() {
    //Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
    let lastState = getState();
    let possibleMoves = [];
    let possibleMoveRatings = [];
    let iterations = 0;
    //for each possible rotation
    for (let rots = 0; rots < 4; rots++) {

        let oldX = [];
        //for each iteration
        for (let t = -5; t <= 5; t++) {
            iterations++;
            loadState(lastState);
            //rotate shape
            for (let j = 0; j < rots; j++) {
                rotateShape();
            }
            //move left
            if (t < 0) {
                for (let l = 0; l < Math.abs(t); l++) {
                    moveLeft();
                }
                //move right
            } else if (t > 0) {
                for (let r = 0; r < t; r++) {
                    moveRight();
                }
            }
            //if the shape has moved at all
            if (!contains(oldX, currentShape.x)) {
                //move it down
                let moveDownResults = moveDown();
                while (moveDownResults.moved) {
                    moveDownResults = moveDown();
                }
                //set the 7 parameters of a genome
                let algorithm = {
                    rowsCleared: moveDownResults.rowsCleared,
                    weightedHeight: Math.pow(getHeight(), 1.5),
                    cumulativeHeight: getCumulativeHeight(),
                    relativeHeight: getRelativeHeight(),
                    holes: getHoles(),
                    roughness: getRoughness()
                };
                //rate each move
                let rating = 0;
                rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
                rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
                rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
                rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
                rating += algorithm.holes * genomes[currentGenome].holes;
                rating += algorithm.roughness * genomes[currentGenome].roughness;
                //if the move loses the game, lower its rating
                if (moveDownResults.lose) {
                    rating -= 500;
                }
                //push all possible moves, with their associated ratings and parameter values to an array
                possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
                //update the position of old X value
                oldX.push(currentShape.x);
            }
        }
    }
    //get last state
    loadState(lastState);
    //return array of all possible moves
    return possibleMoves;
}


function getHighestRatedMove(moves) {
    //Returns the highest rated move in the given array of moves.
    //start these values off small
    let maxRating = -10000000000000;
    let maxMove = -1;
    let ties = [];
    //iterate through the list of moves
    for (let index = 0; index < moves.length; index++) {
        //if the current moves rating is higher than our maxrating
        if (moves[index].rating > maxRating) {
            //update our max values to include this moves values
            maxRating = moves[index].rating;
            maxMove = index;
            //store index of this move
            ties = [index];
        } else if (moves[index].rating === maxRating) {
            //if it ties with the max rating
            //add the index to the ties array
            ties.push(index);
        }
    }
    //eventually we'll set the highest move value to this move var
    let move = moves[ties[0]];
    //and set the number of ties
    move.algorithm.ties = ties.length;
    return move;
}


function makeNextMove() {

    movesTaken ++;
    if(movesTaken> moveLimit){
        //update genome fitness value using game score
        genomes[currentGenome].fitness = clone(score);
        evaluateNextGenome();
    }else{
        //make a move
        let oldDraw = clone(draw);
        draw = false;
        let possibleMoves = getAllPossibleMoves();
        let lastState = getState();
        nextShape();

        for(let i= 0; i<possibleMoves.length; i++){
            let nextMove = getHighestRatedMove(getAllPossibleMoves());
            //add that rating to an array of highest rates moves
            possibleMoves[i].rating += nextMove.rating;
        }

        loadState(lastState);
        //get the highest rated move ever
        let move = getHighestRatedMove(possibleMoves);
        //then rotate the shape as it says too
        for (let rotations = 0; rotations < move.rotations; rotations++) {
            rotateShape();
        }
        //and move left as it says
        if (move.translation < 0) {
            for (let lefts = 0; lefts < Math.abs(move.translation); lefts++) {
                moveLeft();
            }
            //and right as it says
        } else if (move.translation > 0) {
            for (let rights = 0; rights < move.translation; rights++) {
                moveRight();
            }
        }

        //update our move algorithm
        if (inspectMoveSelection) {
            moveAlgorithm = move.algorithm;
        }
        //and set the old drawing to the current
        draw = oldDraw;
        //output the state to the screen
        output();
        //and update the score
        updateScore();
    }
}


function seededRandom(min, max) {
    max = max || 1;
    min = min || 0;

    rndSeed = (rndSeed * 9301 + 49297) % 233280;
    let rnd = rndSeed / 233280;

    return Math.floor(min + rnd * (max - min));
}

function loadArchive(archiveString) {
    archive = JSON.parse(archiveString);
    genomes = clone(archive.genomes);
    populationSize = archive.populationSize;
    generation = archive.currentGeneration;
    currentGenome = 0;
    reset();
    roundState = getState();
    console.log("Archive loaded!");
}

function loadState(state) {
    grid = clone(state.grid);
    currentShape = clone(state.currentShape);
    upcomingShape = clone(state.upcomingShape);
    bag = clone(state.bag);
    bagIndex = clone(state.bagIndex);
    rndSeed = clone(state.rndSeed);
    score = clone(state.score);
    output();
    updateScore();
}


function update() {
    //Updates the game
    //if we have our AI turned on and the current genome is nonzero
    //make a move
    if (ai && currentGenome !== -1) {
        //move the shape down
        let results = moveDown();
        //if that didn't do anything
        if (!results.moved) {
            //if we lost
            if (results.lose) {
                //update the fitness
                genomes[currentGenome].fitness = clone(score);
                //move on to the next genome
                evaluateNextGenome();
            } else {
                //if we didnt lose, make the next move
                makeNextMove();
            }
        }
    } else {
        //else just move down
        moveDown();
    }
    //output the state to the screen
    output();
    //and update the score
    updateScore();
}

function moveDown() {
    //Moves the current shape down if possible.
    //array of possibilities
    let result = {lose: false, moved: true, rowsCleared: 0};
    //remove the shape, because we will draw a new one
    removeShape();
    //move it down the y axis
    currentShape.y++;
    //if it collides with the grid
    if (collides(grid, currentShape)) {
        //update its position
        currentShape.y--;
        //apply (stick) it to the grid
        applyShape();
        //move on to the next shape in the bag
        nextShape();
        //clear rows and get number of rows cleared
        result.rowsCleared = clearRows();
        //check again if this shape collides with our grid
        if (collides(grid, currentShape)) {
            //reset
            result.lose = true;
            if (ai) {
            } else {
                reset();
            }
        }
        result.moved = false;
    }
    //apply shape, update the score and output the state to the screen
    applyShape();
    score++;
    updateScore();
    output();
    return result;
}

// Moves the current shape to the left if possible.
function moveLeft() {
    //remove current shape, slide it over, if it collides though, slide it back
    removeShape();
    currentShape.x--;
    if (collides(grid, currentShape)) {
        currentShape.x++;
    }
    //apply the new shape
    applyShape();
}

//Moves the current shape to the right if possible.
function moveRight() {
    removeShape();
    currentShape.x++;
    if (collides(grid, currentShape)) {
        currentShape.x--;
    }
    applyShape();
}

function rotateShape() {
    //Rotates the current shape clockwise if possible.
    //slide it if we can, else return to original rotation
    removeShape();
    currentShape.shape = rotate(currentShape.shape, 1);
    if (collides(grid, currentShape)) {
        currentShape.shape = rotate(currentShape.shape, 3);
    }
    applyShape();
}

function clearRows() {
    //Clears any rows that are completely filled.
    //empty array for rows to clear
    let rowsToClear = [];
    //for each row in the grid
    for (let row = 0; row < grid.length; row++) {
        let containsEmptySpace = false;
        //for each column
        for (let col = 0; col < grid[row].length; col++) {
            //if its empty
            if (grid[row][col] === 0) {
                //set this value to true
                containsEmptySpace = true;
            }
        }
        //if none of the columns in the row were empty
        if (!containsEmptySpace) {
            //add the row to our list, it's completely filled!
            rowsToClear.push(row);
        }
    }
    //increase score for up to 4 rows. it maxes out at 12000
    if (rowsToClear.length === 1) {
        score += 400;
    } else if (rowsToClear.length === 2) {
        score += 1000;
    } else if (rowsToClear.length === 3) {
        score += 3000;
    } else if (rowsToClear.length >= 4) {
        score += 12000;
    }
    //new array for cleared rows
    let rowsCleared = clone(rowsToClear.length);
    //for each value
    for (let toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
        //remove the row from the grid
        grid.splice(rowsToClear[toClear], 1);
    }
    //shift the other rows
    while (grid.length < 20) {
        grid.unshift([0,0,0,0,0,0,0,0,0,0]);
    }
    //return the rows cleared
    return rowsCleared;
}

function removeShape() {
    //Removes the current shape from the grid.
    for (let row = 0; row < currentShape.shape.length; row++) {
        for (let col = 0; col < currentShape.shape[row].length; col++) {
            if (currentShape.shape[row][col] !== 0) {
                grid[currentShape.y + row][currentShape.x + col] = 0;
            }
        }
    }
}

function applyShape() {
    //Applies the current shape to the grid.
    //for each value in the current shape (row x column)
    for (let row = 0; row < currentShape.shape.length; row++) {
        for (let col = 0; col < currentShape.shape[row].length; col++) {
            //if its non-empty
            if (currentShape.shape[row][col] !== 0) {
                //set the value in the grid to its value. Stick the shape in the grid!
                grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
            }
        }
    }
}

function nextShape() {
    //Cycles to the next shape in the bag.

    //increment the bag index
    bagIndex += 1;
    //if we're at the start or end of the bag
    if (bag.length === 0 || bagIndex === bag.length) {
        //generate a new bag of genomes
        generateBag();
    }
    //if almost at end of bag
    if (bagIndex === bag.length - 1) {
        //store previous seed
        let prevSeed = rndSeed;
        //generate upcoming shape
        upcomingShape = randomProperty(shapes);
        //set random seed
        rndSeed = prevSeed;
    } else {
        //get the next shape from our bag
        upcomingShape = shapes[bag[bagIndex + 1]];
    }
    //get our current shape from the bag
    currentShape.shape = shapes[bag[bagIndex]];
    //define its position
    currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
    currentShape.y = 0;
}

function generateBag() {
    // Generates the bag of shapes.
    bag = [];
    let contents = "";
    //7 shapes
    for (let i = 0; i < 7; i++) {
        //generate shape randomly
        let shape = randomKey(shapes);
        while(contents.indexOf(shape) !== -1) {
            //Doesnt allow it to add the same shapes
            shape = randomKey(shapes);
        }
        //update bag with generated shape
        bag[i] = shape;
        contents += shape;
    }
    //reset bag index
    bagIndex = 0;
}

function reset() {
    //Resets the game
    score = 0;
    grid = [[0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
    ];
    movesTaken = 0;
    generateBag();
    nextShape();
}

function collides(scene, object) {
    //Determines if the given grid and shape collide with one another.
    //for the size of the shape (row x column)
    for (let row = 0; row < object.shape.length; row++) {
        for (let col = 0; col < object.shape[row].length; col++) {
            //if its not empty
            if (object.shape[row][col] !== 0) {
                //if it collides, return true
                if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function rotate(matrix, times) {
    //for rotating a shape, how many times should we rotate
    //for each time
    for (let t = 0; t < times; t++) {
        //flip the shape matrix
        matrix = transpose(matrix);
        //and for the length of the matrix, reverse each column
        for (let i = 0; i < matrix.length; i++) {
            matrix[i].reverse();
        }
    }
    return matrix;
}

function transpose(array) {
    //flip row x column to column x row
    return array[0].map(function(col, i) {
        return array.map(function(row) {
            return row[i];
        });
    });
}

function output() {
    //Outputs the state to the screen.
    if (draw) {
        let output = document.getElementById("output");
        let html = "<h1>Tetris GA</h1><h5>Evolutionary approach to Tetris AI</h5>var grid = [";
        let space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        for (let i = 0; i < grid.length; i++) {
            if (i === 0) {
                html += "[" + grid[i] + "]";
            } else {
                html += "<br />" + space + "[" + grid[i] + "]";
            }
        }
        html += "];";
        for (let c = 0; c < colors.length; c++) {
            html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
            html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
        }
        output.innerHTML = html;
    }
}

function updateScore() {
    //Updates the side information.
    if (draw) {
        let scoreDetails = document.getElementById("score");
        let html = "<br /><br /><h2>&nbsp;</h2><h2>Score: " + score + "</h2>";
        html += "<br /><b>--Upcoming--</b>";
        for (let i = 0; i < upcomingShape.length; i++) {
            let next =replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
            html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
        }
        for (let l = 0; l < 4 - upcomingShape.length; l++) {
            html += "<br />";
        }
        for (let c = 0; c < colors.length; c++) {
            html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
            html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
        }
        html += "<br />Speed: " + speed;
        if (ai) {
            html += "<br />Moves: " + movesTaken + "/" + moveLimit;
            html += "<br />Generation: " + generation;
            html += "<br />Individual: " + (currentGenome + 1)  + "/" + populationSize;
            html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
            if (inspectMoveSelection) {
                html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(moveAlgorithm, null, 2) + "</pre>";
            }
        }
        html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
        scoreDetails.innerHTML = html;
    }
}

function getState() {
    //Returns the current game state in an object.
    return{
        grid: clone(grid),
        currentShape: clone(currentShape),
        upcomingShape: clone(upcomingShape),
        bag: clone(bag),
        bagIndex: clone(bagIndex),
        rndSeed: clone(rndSeed),
        score: clone(score)
    };
}

function getCumulativeHeight() {
    //Returns the cumulative height of all the columns.
    removeShape();
    let peaks = [20,20,20,20,20,20,20,20,20,20];
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] !== 0 && peaks[col] === 20) {
                peaks[col] = row;
            }
        }
    }
    let totalHeight = 0;
    for (let i = 0; i < peaks.length; i++) {
        totalHeight += 20 - peaks[i];
    }
    applyShape();
    return totalHeight;
}

function getHoles() {
    // Returns the number of holes in the grid

    removeShape();
    let peaks = [20,20,20,20,20,20,20,20,20,20];
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] !== 0 && peaks[col] === 20) {
                peaks[col] = row;
            }
        }
    }
    let holes = 0;
    for (let x = 0; x < peaks.length; x++) {
        for (let y = peaks[x]; y < grid.length; y++) {
            if (grid[y][x] === 0) {
                holes++;
            }
        }
    }
    applyShape();
    return holes;
}

function getRoughness() {
    // Returns the roughness of the grid.

    removeShape();
    let peaks = [20,20,20,20,20,20,20,20,20,20];
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] !== 0 && peaks[col] === 20) {
                peaks[col] = row;
            }
        }
    }
    let roughness = 0;

    for (let i = 0; i < peaks.length - 1; i++) {
        roughness += Math.abs(peaks[i] - peaks[i + 1]);

    }
    applyShape();
    return roughness;
}

function getRelativeHeight() {
    //Returns the range of heights of the columns on the grid.
    removeShape();
    let peaks = [20,20,20,20,20,20,20,20,20,20];
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] !== 0 && peaks[col] === 20) {
                peaks[col] = row;
            }
        }
    }
    applyShape();
    return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
}


function getHeight() {
    //Returns the height of the biggest column on the grid.
    removeShape();
    let peaks = [20,20,20,20,20,20,20,20,20,20];
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] !== 0 && peaks[col] === 20) {
                peaks[col] = row;
            }
        }
    }
    applyShape();
    return 20 - Math.min.apply(Math, peaks);
}

function randomProperty(obj) {
    //Returns a random property from the given object.
    return(obj[randomKey(obj)]);
}

function randomKey(obj) {
    //Returns a random property key from the given object.
    let keys = Object.keys(obj);
    //Keys are names of obj parameters
    let i = seededRandom(0, keys.length);
    return keys[i];
}

function replaceAll(target, search, replacement) {
    //'g' means replace all not stop at first
    return target.replace(new RegExp(search, 'g'), replacement);
}

function randomWeightedNumBetween(min, max) {
    return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
}

function randomChoice(propOne, propTwo) {
    if (Math.round(Math.random()) === 0) {
        return clone(propOne);
    } else {
        return clone(propTwo);
    }
}

function clone(obj) {
    //Clones an object, returns the same object but not the exact object!
    return JSON.parse(JSON.stringify(obj));
}

function contains(a, obj) {
    let i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}