const itens = []

async function fetchItem(versao) {
    const URL = `https://ddragon.leagueoflegends.com/cdn/${versao}/data/pt_BR/item.json`
    console.log(URL)
    
    await fetch(URL)
    .then(request => {
        request.json()
        .then(response => {
            items = response.data

            for (i in items) {
                console.log(item[i])

                //
                // filtro de itens
                //
                if (!items[i].requiredChampion && !items[i].into && items[i].maps[11] 
                    && !items[i].consumed && items[i].inStore == undefined && items[i].gold.base != 0
                    && items[i].name != 'Lâmina de Obsidiana') {
                    item = {
                        nome: items[i].name,
                        descricao: items[i].description,
                        img: `https://ddragon.leagueoflegends.com/cdn/${versao}/img/item/${items[i].image.full}`,
                        tags: items[i].tags,
                        mitico: null,
                        inicial: null,
                        bota: null,
                        jungle: null,
                        suport: null,
                    }

                    if (item.descricao.includes('rarityMythic')) {
                        console.log('MITICO!' + item[i].name)
                        item.mitico = true
                    } else {
                        item.mitico = false
                    }

                    if (items[i].gold.total <= 500) {
                        item.inicial = true
                    } else {
                        item.inicial = false
                    }

                    if (items[i].tags.includes('Boots')) {         
                        item.bota = true
                    } else {
                        item.bota = false
                    }

                    if (items[i].tags.includes('Jungle')) {
                        item.jungle = true
                    } else {
                        item.jungle = false
                    }

                    if (items[i].tags.includes('GoldPer')) {
                        item.suport = true
                    } else {
                        item.suport = false
                    }

                    itens.push(item)
                }
            }
            randomItem()
        })
    })  
}

function randomItem() {
    let escolhidos = []
    
    randomRole()

    for (let num = 0; num < 7; num++) {
        const numeroRandom = random(0, itens.length-1)
        item = itens[numeroRandom]

        if (num == 0) {
            if (posicao == 1) {
                while (!item.jungle) {
                    item = itens[random(0, itens.length-1)]
                }
            } else {
                while (item.jungle) {
                    item = itens[random(0, itens.length-1)]
                }
            } 
            if (posicao == 4) {
                while (!item.suport) {
                    item = itens[random(0, itens.length-1)]
                }
            } else {
                while (item.suport) {
                    item = itens[random(0, itens.length-1)]
                }
            }
            if (posicao != 1 && posicao != 4) {
                while (!item.inicial || item.suport || item.jungle) {
                    item = itens[random(0, itens.length-1)]
                }
            }
        }

        //
        // seleciona uma bota, um item mitico e um inicial
        //
        if (num == 1) {
            while (!item.bota) {
                item = itens[random(0, itens.length-1)]
            }
        } else {
            while (item.bota) {
                item = itens[random(0, itens.length-1)]
            }
        }

        if (num == 2) {
            while (!item.mitico) {
                item = itens[random(0, itens.length-1)]
            }
        } else {
            while (item.mitico) {
                item = itens[random(0, itens.length-1)]
            }
        }

        if (num > 2) {

            //
            // tira itens repetidos e indesejados
            //
            while (escolhidos.includes(item) || item.mitico || item.bota || item.inicial || item.jungle || item.suport) {
                item = itens[random(0, itens.length)]
            }
        }
        console.log(item)
        escolhidos.push(item)
    }
    console.log(escolhidos)
    addItens(escolhidos)
}