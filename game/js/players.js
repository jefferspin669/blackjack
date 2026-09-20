class Player{

constructor(name){

this.name=name
this.hand=[]
this.bank=1000

}

add(card){

this.hand.push(card)

}

reset(){

this.hand=[]

}

}

function randomName(){

const names=[
"Vinny",
"Tony Chips",
"Lucky Larry",
"Vegas Vic",
"Diamond Dave",
"Rico"
]

return names[Math.floor(Math.random()*names.length)]

}

const player=new Player("You")

const bot1=new Player(randomName())
const bot2=new Player(randomName())

const dealer=new Player("Dealer")