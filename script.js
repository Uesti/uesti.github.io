async function fetchPokemon() {
    for(i = 1; i <= 151; i++) {
        let url = `https://pokeapi.co/api/v2/pokemon/${i}`
        await fetch(url)
        .then(response => {
            response.json()
            .then(dado => {
                let pokemon = {
                    nome: dado.name,
                    img: dado.sprites.front_default,
                    tipo: []
                }
                for (t of dado.types) {
                    pokemon.tipo.push(t.type.name)
                }
                addPokemon(pokemon.nome, pokemon.img, pokemon.tipo)
            })
        })
    }
}

function addPokemon(nome, img, tipo) {
    let div = document.createElement('div')
    let titulo = document.createElement('h2')
    let sprite = document.createElement('img')
    let info = document.createElement('span')
    let main = document.querySelector('#main')
    
    div.className = `pokemon ${tipo[0]}`
    titulo.textContent = nome
    sprite.src = img
    info.textContent = tipo.join(' and ')
    
    div.appendChild(titulo)
    div.appendChild(sprite)
    div.appendChild(info)

    main.appendChild(div)
}

fetchPokemon()
