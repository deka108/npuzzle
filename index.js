Vue.component('n-puzzle', {
    template: '#n-puzzle-template',
    props: ["rows", "sqrt-n"]
});

// index, value, blankIndex
Vue.component('n-puzzle-cell', {
    template: '#n-puzzle-cell-template',
    props: ['value', 'idx'],
    computed: {
        classes: function (){
            return {
                "non-empty": this.value !== 0,
                empty: this.value === 0
            }
        }
    },
    methods: {
        move: function() { 
            console.log("val", this.value, this.idx);
            this.$emit("move-puzzle", this.idx);
        }
    }
});

let vm = new Vue({
    el: '#app',
    data: {
        N: 9,
        inputN: 8,
        sqrtN: 3,
        state: null,
        rows: null,
        show: false
    },
    methods: {
        changeN: function(){
            let {sqrtN, N, isValid} = this.getN();
            if (isValid){
                this.N = N;
                this.sqrtN = sqrtN;
                this.genNPuzzle();
            }
        },
        genNPuzzle: function(){
            this.state = generateNPuzzle(this.N);
            this.updateRows();
        },
        updateRows: function(){
            this.rows = [];
            let row = [];
            
            for(let i=0; i < this.state.config.length; i++){
                row.push(this.state.config[i]);
                // insert and reset row
                if (i % this.sqrtN === this.sqrtN - 1){
                    this.rows.push(row);
                    row = [];
                }
            }
        },
        changeState: function(payload){
            // move the cell to empty cell, if there is no adjacent empty don't do anything
            // logic: expand children, new blank index equal to payload
            for(let c of this.state.expand()){
                if (c.blankIdx === payload){
                    this.state = c;
                    this.updateRows();
                    break;
                }
            }

            if (this.state.isGoal()){
                this.show = true;
            }
        },
        getN: function(){
            let N = (Number.parseInt(this.inputN) + 1)
            let sqrtN = Math.floor(Math.sqrt(N));
            return {
                isValid: sqrtN * sqrtN === N,
                N: N,
                sqrtN: N
            }
        },
        solvePuzzle: function(){
            let state = new PuzzleState(this.state.config,
                this.state.goalIndex, null, "Initial", 0);
            state.resetState();
            let solver = new PuzzleSolver(state);
            let solution = solver.solve();
            let actions = solution.results.actions;

            for (let i=0; i< actions.length; i++){
                let action = actions[i];

                switch (action){
                    case "UP":
                        this.state = this.state.moveUp();
                        break;
                    case "DOWN": 
                        this.state = this.state.moveDown();
                        break;
                    case "LEFT":
                        this.state = this.state.moveLeft();
                        break;
                    case "RIGHT":
                        this.state = this.state.moveRight();
                        break;
                } 
                console.log(action);
                setTimeout(() => { this.updateRows()}, i*2000);
            }
        }
    },
    computed: {
        inputClass: function () {
            let {isValid} = this.getN();

            return {
              'invalid': !isValid,
              'textinput': true
            }
        }
    },
    created: function(){
        this.genNPuzzle();
    }
});