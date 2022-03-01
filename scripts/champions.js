champs = []

async function fetchChampion() {
    const URL = `https://ddragon.leagueoflegends.com/cdn/12.4.1/data/pt_BR/champion.json`

    fetch(URL)
    .then(response => {
        response.json()
        .then(request => {
            champions = request.data
            
            for (c in champions) {
                champ = champions[c]

                campeao = {
                    nome: champ.name,
                    img: `http://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`,
                }
                champs.push(campeao)
            }
            randomChampion(champs)
        })
    })
}
