function infoPokemon(pokemon) {
    const info = document.querySelector('#info')
    const nome = document.querySelector('#info h2')
    const sprite_frente = document.querySelector('#sprite_frente')
    const sprite_tras = document.querySelector('#sprite_tras')
    const habilidades = document.querySelector('#habilidades')
    const tipo = document.querySelector('#tipo')
    const status = document.querySelector('#status')

    info.className = `${pokemon.tipo[0]}`

    nome.textContent = `${pokemon.nome} #${pokemon.id}`

    sprite_frente.src = pokemon.img[0]
    sprite_tras.src = pokemon.img[1]

    sprite_frente.alt = pokemon.nome
    sprite_tras.alt = pokemon.nome

    status.innerHTML = `Vida: ${pokemon.stats.vida}<br>
Ataque: ${pokemon.stats.ataque}<br>
Defesa: ${pokemon.stats.defesa}<br>
Velocidade: ${pokemon.stats.velocidade}<br>
`

    habilidades.textContent = `Habilidades: ${pokemon.habilidades.join(', ')}`
    tipo.textContent = `Tipo: ${pokemon.tipo.join(' and ')}`
}