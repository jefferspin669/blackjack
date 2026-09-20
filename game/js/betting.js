let playerBet=0
let bank=2000

function bet(amount){

if(bank>=amount){

playerBet+=amount
bank-=amount

updateBank()

}

}

function updateBank(){

document.getElementById("bankDisplay").innerText=
"Bank: $"+bank

}