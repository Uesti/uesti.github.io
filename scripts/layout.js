posicao = null

function addItens(items) {
    let primeiroItem = true
    let cont = 0
    for (i of items) {
        const img = document.createElement('img')
        img.src = i.img
        img.id = `item${cont}`
        cont++
        if (primeiroItem) {
            document.querySelector("#inicial").appendChild(img)
            primeiroItem = false
            continue
        }
        img.className = 'itens'
        document.querySelector('#build').appendChild(img)
    }
    if (posicao == 4) {
        document.querySelector('#item6').style.opacity = 0
    }
}

function randomChampion(campeoes) {
    const nome = document.querySelector('#campeao h2')
    const splash = document.querySelector('#campeao img')
    
    numeroRandom = random(0, campeoes.length-1)
    champ = campeoes[numeroRandom]

    nome.textContent = champ.nome
    splash.src = champ.img
}

function randomRole() {
    const roles = ['top', 'jg', 'mid', 'adc', 'sup']
    const role = document.querySelector('#posicao img')
    const numeroRandom = random(0, 4)
    posicao = numeroRandom
    role.src = `img/${roles[numeroRandom]}.png`
    
}


document.querySelector('#refresh')
.addEventListener('click', () => {
    const items = document.querySelectorAll('.itens')
    const primeiroItem = document.querySelector('#item0')
    document.querySelector('#inicial').removeChild(primeiroItem)

    items.forEach(i => {
        console.log
        document.querySelector('#build').removeChild(i)
    })
    randomChampion(champs)
    randomItem()
})


//
// função pra aleatoriezar os itens
//
function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function arrumaTela() {
    let build = document.querySelector('#build')
    let champ = document.querySelector('#campeao')
    let itens = document.querySelector('#itens')
    if (window.screen.width <= 765) {
        champ.appendChild(build)
    }
    else {
        itens.appendChild(build)
    }
}
window.addEventListener('orientationchange', arrumaTela);

arrumaTela()