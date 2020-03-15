Vue.component('n-puzzle', {
    template: '#n-puzzle-template',
    props: ["rows", "sqrt-n"]
});

// 
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
            // move the cell to empty cell, if there is no adjacent empty don't do anything
            console.log("val", this.value, this.idx);
            
        }
    }
});

let vm = new Vue({
    el: '#app',
    data: {
        N: 9,
        sqrtN: 3,
        state: null,
        rows: null
    },
    methods: {
        changeN: function(n){
            this.N = n*n;
            this.sqrtN = n;
            this.state = generateNPuzzle(this.N);
        },
        genNPuzzle: function(){
            this.state = generateNPuzzle(this.N);
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
        }
    },
    created: function(){
        this.genNPuzzle();
    }
});