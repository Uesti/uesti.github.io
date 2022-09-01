async function fetchVersion() {
    const URL = `https://ddragon.leagueoflegends.com/api/versions.json`

    fetch(URL)
    .then(response => {
        response.json()
        .then(request => {
            return request[0]
        })
    })
}

versao = fetchVersion()
champs = []

async function fetchChampion() {
    const URL = `https://ddragon.leagueoflegends.com/cdn/${versao}/data/pt_BR/champion.json`

    fetch(URL)
    .then(response => {
        response.json()
        .then(request => {
            champions = request.data
            
            for (c in champions) {
                champ = champions[c]

                campeao = {
                    nome: champ.name,
                    img: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`,
                }
                champs.push(campeao)
            }
            randomChampion(champs)
        })
    })
}

fetchChampion()