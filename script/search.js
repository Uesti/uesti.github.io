const input = document.querySelector('#pesquisa')

function pesquisaPokemon() {
    encontraPokemon()
    input.addEventListener('keyup', () => {
        encontraPokemon()
    })
}

function encontraPokemon() {
    const nome = document.querySelectorAll('.pokemon h2')
    const div = document.querySelectorAll('.pokemon')
    let conteudo = input.value.toLowerCase()

    for (i = 0; i < div.length; i++) {
        if (!nome[i].innerHTML.includes(conteudo)) {
            div[i].style.display = 'none'
        }
        else {
            div[i].style.display = 'inline-block'
        }
    }
}