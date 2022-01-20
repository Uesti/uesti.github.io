async function fetchPokemon() {
    for(i = 1; i <= 151; i++) {
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
            })
        })
    }
}

function addPokemon(pokemon) {
    let div = document.createElement('div')
    let titulo = document.createElement('h2')
    let sprite = document.createElement('img')
    let info = document.createElement('span')
    let main = document.querySelector('#pokemons')
    
    div.addEventListener('click', () => {
        infoPokemon(pokemon)
    })

    div.className = `pokemon ${pokemon.tipo[0]}`
    titulo.textContent = pokemon.nome
    sprite.src = pokemon.img[0]
    sprite.alt = pokemon.nome
    info.textContent = pokemon.tipo.join(' and ')
    
    div.appendChild(titulo)
    div.appendChild(sprite)
    div.appendChild(info)

    main.appendChild(div)

    if (pokemon.id == 1) {
        infoPokemon(pokemon)
    }
}

fetchPokemon()
