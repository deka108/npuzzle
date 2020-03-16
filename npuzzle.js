const ACTIONS = {
    "UP": "UP",
    "LEFT": "LEFT",
    "DOWN": "DOWN",
    "RIGHT": "RIGHT"
}

const getNFromPuzzle = (config) => {
    const N = Math.floor(Math.sqrt(config.length));
    
    if (N < 2 && N * N != config.size){
        throw "The length of config is not correct!";
    }

    const uniqueVals = new Set(config);
    if (uniqueVals.size != N * N){
        throw "Config contains invalid/duplicate entries!";
    }
    
    return N;
}

function PuzzleState(config, goalIndex, parent, action, cost){
    this.N = getNFromPuzzle(config);

    this.config = config;
    this.goalIndex = goalIndex;
    this.parent = parent;
    this.action = action;
    this.children = [];
    this.cost = cost;
    this.timestamp = Date.now();
    this.id = this.config.join(",");
    
    
    // get the index and (row, col) of empty block
    this.blankIdx = this.config.indexOf(0);

    this.h = this.calculateManhattan();
    this.totalCost = this.cost + this.h;
}

PuzzleState.prototype.isSolvable = function() {
    // count the number of inversions
    let inversion = 0;
    for (let i=0; i < this.N*this.N; i++){
        for (let j=i+1; j < this.N * this.N; j++){
            if (this.config[i] !== 0 && this.config[j] !== 0){
                if (this.config[i] > this.config[j]){
                    inversion += 1;
                }
            }            
        }
    }

    // odd
    if (this.N % 2 === 1){
        return inversion % 2 == 0;
    } else {
        let rowBlankIdx = (this.N - 1) - Math.floor(this.blankIdx / this.N);
        return (rowBlankIdx % 2 === 0) & (inversion % 2 === 0) || 
            (rowBlankIdx % 2 === 1) & (inversion % 2 === 1);
    }
}

PuzzleState.prototype.calculateManhattan = function() {
    let totalCost = 0;
    for (let idx=0; idx<this.config.length; idx++){
        const val = this.config[idx];
        const goalPos = this.goalIndex[val];

        let dy = Math.abs(Math.floor(idx / this.N) - Math.floor(goalPos / this.N));
        let dx = Math.abs(idx % this.N - goalPos % this.N);
        
        totalCost += dy + dx;
    }
    
    return totalCost;
}

PuzzleState.prototype.display = function(){
    let val = "";
    for(let i=0; i<this.N*this.N; i++){
        val += this.config[i].toString();
        
        if (i % this.N === this.N - 1){
            console.log(val);
            val = "";
        } 
    }
}

PuzzleState.prototype.genNewState = function(newBlankIdx, action, cost){
    // swap blank tile with non blank tile
    let newConfig = Array.from(this.config);
    [newConfig[this.blankIdx], newConfig[newBlankIdx]] = [newConfig[newBlankIdx],       
        newConfig[this.blankIdx]] 

    return new PuzzleState(newConfig, this.goalIndex, this, action, cost);
}

PuzzleState.prototype.moveUp = function(){
    const newBlankIdx = this.blankIdx - this.N;
    if (newBlankIdx >= 0){
        return  this.genNewState(newBlankIdx, ACTIONS.UP, this.cost + 1);
    }
}

PuzzleState.prototype.moveDown = function(){
    const newBlankIdx = this.blankIdx + this.N;
    if (newBlankIdx < this.config.length){
        return  this.genNewState(newBlankIdx, ACTIONS.DOWN, this.cost + 1);
    }
}

PuzzleState.prototype.moveLeft = function() {
    const blankRow = Math.floor(this.blankIdx / this.N);
    const newBlankIdx = this.blankIdx - 1;

    if (Math.floor(newBlankIdx / this.N) == blankRow && newBlankIdx >= 0){
        return this.genNewState(newBlankIdx, ACTIONS.LEFT, this.cost + 1);
    }
}

PuzzleState.prototype.moveRight = function () {
    const blankRow = Math.floor(this.blankIdx / this.N);
    const newBlankIdx = this.blankIdx + 1;

    if (Math.floor(newBlankIdx / this.N) == blankRow && newBlankIdx < this.config.length){
        return this.genNewState(newBlankIdx, ACTIONS.RIGHT, this.cost + 1);
    }
}

PuzzleState.prototype.expand = function() {
    // already expanded
    if (this.children.length !== 0){
        return this.children
    } else {
        // ULDR
        let children = [this.moveUp(), this.moveLeft(), this.moveDown(), this.moveRight()];
        children = children.filter((item) => {
            return item !== undefined;
        });
        this.children = children;
        return this.children;
    }
}

PuzzleState.prototype.isGoal = function(){
    for (let i=0; i< this.N * this.N; i++){
        if (i !== this.goalIndex[this.config[i]]){
            return false;
        }
    }
    return true;
}

PuzzleState.prototype.resetState = function() {
    this.parent = null;
    this.action = "Initial";
    this.cost = 0;
}

function MinHeap(comparator){
    this.items = [];
    this.compare = comparator;
    this.size = 0;
}

MinHeap.prototype.peek = function () {
    return this.items[0];
}

MinHeap.prototype.siftUp = function(startIdx, idx){
    let curItem = this.items[idx];
    let parentIdx, parentItem;

    // find the correct index for the new element
    while (idx > startIdx){
        parentIdx = (idx - 1) >> 1; // divide by two to get the parent
        parentItem = this.items[parentIdx];

        // already in correct position if it's larger or equal to its parent
        if (this.compare(curItem, parentItem) >= 0){
            break;
        }
        
        // smaller than parent, swap with parent
        this.items[idx] = parentItem;
        idx = parentIdx; // move index up
    }

    this.items[idx] = curItem; // assign item at the correct idx
}

MinHeap.prototype.push = function(item){
    // move the last index
    this.items.push(item);
    this.size++;
    // fix heap
    this.siftUp(0, this.items.length - 1);
}

MinHeap.prototype.siftDown = function(idx){
    let startIdx = idx, endIdx = this.items.length;
    let curItem = this.items[idx];
    let childIdx = 2 * idx + 1, rightIdx;

    // go find the proper index while fixing the heap
    while (childIdx < endIdx){
        rightIdx = childIdx + 1;
        
        // check if right child is smaller
        if (rightIdx < endIdx && 
            this.compare(this.items[childIdx], this.items[rightIdx]) >= 0){
            childIdx = rightIdx;
        }

        this.items[idx] = this.items[childIdx]; // assign the smaller child to the top
        idx = childIdx; // go down
        childIdx = 2 * idx + 1; // update child idx
    }

    this.items[idx] = curItem;
    this.siftUp(startIdx, idx);
}

MinHeap.prototype.pop = function(){
    // get the last item (to be swapped with the top tree and sift down)
    let lastItem = this.items.pop();
    this.size--;
    
    if (this.items.length !== 0){
        // get the first item
        let item = this.items[0];
        
        // assign the last item to the top of the heap
        this.items[0] = lastItem;
        
        // fix heap
        this.siftDown(0);

        return item;
    }

    return lastItem;
}

function PuzzleSolver(state){
    this.initialState = state;
    // console.log("--Initial display--");
    // this.initialState.display();
}

PuzzleSolver.prototype.aStar = function () {
    let frontier = new MinHeap((a, b) => {
        const {state: aState, depth: aDepth} = a;
        const {state: bState, depth: bDepth} = b;
        
        let res = 0;
        if (aState.totalCost === bState.totalCost){
            if (aState.cost === bState.cost){
                if (aDepth === bDepth) {
                    res = (aState.timestamp < bState.timestamp) ? -1 : 
                        ((aState.timestamp > bState.timestamp) ? 1 : 0);
                } else {
                    res = (aDepth < bDepth) ? -1 : 1;
                }
            } else {
                res = (aState.cost > bState.cost) ? -1 : 1;
            }
        } else {
            res = (aState.totalCost < bState.totalCost) ? -1 : 1;
        }

        return res;
    });
    let explored = new Set();

    frontier.push({
        state: this.initialState,
        depth: 0
    });

    let solution;

    while (frontier.size){
        const { state, depth } = frontier.pop();
        
        if (!explored.has(state.id)){
            explored.add(state.id);

            if (state.isGoal()){
                solution = this.buildSolution(state, depth);
            }

            for (const child of state.expand()){
                if (!explored.has(child.id)){
                    frontier.push({
                        state: child,
                        depth: depth+1
                    })
                }
            }
        }

    }
    
    return solution;
}


PuzzleSolver.prototype.buildSolution = function(state, depth){
    let lastState = state;
    let actions = [];

    while (lastState.parent){
        actions.unshift(lastState.action);
        lastState = lastState.parent;
    }
    
    return {
        lastState: state,
        actions: actions,
        cost: state.cost,
        depth: depth
    };
}

PuzzleSolver.prototype.solve = function(){
    if (this.initialState.isSolvable()){
        const startTime = Date.now();
        const results = this.aStar();
        let duration = Date.now() - startTime;
        console.log(`solved in ${duration/1000} secs`)
        // console.log("--Final display--");
        // if (!!results){
        //     results.lastState.display();
        // }

        return {
            results,
            duration
        }
    } else {
        console.log("puzzle is not solvable");
    }
}

const parseState = (line) => {
    let arr = line.split(",");
    arr = arr.map(x => parseInt(x));

    return arr;
}

function generateNPuzzle(N, goalConfig){
    // const initialConfig = [1, 2, 3, 4, 5, 6, 7, 8, 0]
    let initialConfig = Array(N-1).fill().map((_, i) => i+1);
    initialConfig.push(0);

    if (!goalConfig){
        goalConfig = initialConfig
    }
    const goalIndex = getGoalIndex(goalConfig);
    
    let curState = new PuzzleState(initialConfig, goalIndex, null, "Initial", 0);
    let count = 0;
    
    // third time is a charm
    while (curState.id === initialConfig.join(",") && count < 3){
        const N = Math.floor(Math.random() * Math.floor(100));

        // how many times to move
        for (let i=0; i<N; i++){
            let children = curState.expand();
            // pick a child state at random
            curState = children[Math.floor(Math.random() * children.length)];
        }

        count += 1;
    }
    curState.resetState();
    
    return curState;
}

// mapping the value to the index
const getGoalIndex = (goalConfig) => {
    // gets N and validate input config
    const N = getNFromPuzzle(goalConfig);
    
    const goalIndex = {};
    goalConfig.forEach((val, i) => {
        goalIndex[val] = i;
    })

    return goalIndex
}

const testNPuzzle = () => {
    // let parsedState = parseState("8,6,7,2,5,4,3,0,1");
    // let parsedState = parseState("1,8,2,0,4,3,7,6,5");
    // let parsedState = parseState("1,2,5,3,4,0,6,7,8");
    let parsedState = parseState("1,2,3,0,8,5,4,7,6");
    
    const goalIndex = getGoalIndex([1, 2, 3, 4, 5, 6, 7, 8, 0]);
    const state = new PuzzleState(parsedState, goalIndex, null, "Initial", 0);
    const solver = new PuzzleSolver(state);
    let results = solver.solve();
    console.log(results);
}

const testNPuzzleGen = () => {
    let newPuzzleState = generateNPuzzle(9);
    console.log("--New Puzzle--");
    newPuzzleState.display();
}

// testNPuzzle();

// testNPuzzleGen();