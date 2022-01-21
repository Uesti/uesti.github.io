const POKEMONS = 151
let num = []

async function fetchPokemon() {
    for(i = 1; i <= POKEMONS; i++) {
        if(!num.includes(i)) {
            num.push(i)
            let url = `https://pokeapi.co/api/v2/pokemon/${i}`
            
            await fetch(url)
            .then(response => {
                response.json()
                .then(dado => {
                    let pokemon = {
                        id: dado.id,
                        nome: dado.name,
                        img: [dado.sprites.front_default, dado.sprites.back_default],
                        tipo: [],
                        habilidades: [],
                        peso: dado.weight,
                        stats: {},
                    }
                    for (t of dado.types) {
                        pokemon.tipo.push(t.type.name)
                    }
                    for (h of dado.abilities) {
                        pokemon.habilidades.push(h.ability.name)
                    }
                    for (s of dado.stats) {
                        switch(s.stat.name) {
                            case 'hp':
                                pokemon.stats.vida = s.base_stat
                                break

                            case 'attack':
                                pokemon.stats.ataque = s.base_stat
                                break
                            
                            case 'defense':
                                pokemon.stats.defesa = s.base_stat
                                break

                            case 'speed':
                                pokemon.stats.velocidade = s.base_stat
                                break
                        } 
                    }
                    addPokemon(pokemon)
                    pesquisaPokemon()
                })
            }) 
        }
    }
}

function addPokemon(pokemon) {
    let div = document.createElement('div')
    let nome = document.createElement('p')
    let sprite = document.createElement('img')
    let id = document.createElement('p')
    let main = document.querySelector('#pokemons')

    let cache = document.createElement('img')
    
    div.addEventListener('click', () => {
        infoPokemon(pokemon)
    })

    div.className = `pokemon ${pokemon.tipo[0]}`
    nome.textContent = pokemon.nome
    sprite.src = pokemon.img[0]
    sprite.alt = pokemon.nome
    id.textContent = `#${pokemon.id}`

    nome.className = 'nome'
    id.className = 'id'
    
    cache.src = pokemon.img[1]
    cache.style.display = 'none'

    div.appendChild(id)
    div.appendChild(sprite)
    div.appendChild(nome)
    div.appendChild(cache)
    
    main.appendChild(div)

    if (pokemon.id == 1) {
        infoPokemon(pokemon)
    }
}

fetchPokemon()
