const { default: axios } = require("axios")
const { ethers } = require("ethers")
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
// const { Telegraf } = require('telegraf')
const TelegramBot = require('node-telegram-bot-api')

require('dotenv').config()

const chains = require("./chains.json")
const abiERC20 = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
]
const abiMasterChef = [
    "function poolLength() public view returns (uint256)",
]
const channel = -1001302968513

const start = () => {
    const bot = new TelegramBot('5343423592:AAE9Y5GT2-TecPbnJsKe9BI-bipWJ5g6O5A')
    // const bot = new TelegramBot('1749367461:AAFfMWTNPuPVltHlZ3VsmN6nf_Vza41a88w', {
    //     baseApiUrl: "https://192.168.91.52",
    //     request: {
    //         proxy: "http://kgc0617:kyj0830@192.168.91.52",
    //     }
    // })
    // const bot = new Telegraf('1749367461:AAFfMWTNPuPVltHlZ3VsmN6nf_Vza41a88w')
    // console.log(bot)
    // bot.launch()
    for(const chain of chains) {
        const provider = new ethers.providers.JsonRpcProvider(chain.url)
        provider.on('block', blockNumber => {
            provider.getBlockWithTransactions(blockNumber).then(block => {
                const txs = block.transactions.filter((tx)=>{
                    return tx.to===null && tx.creates
                })
                txs.map(async tx => {
                    // try {
                    //     const contract = new ethers.Contract(tx.creates, abiERC20, provider)
                    //     const name = await contract.name()
                    //     const symbol = await contract.symbol()
                    //     const text = [
                    //         `💛<b>New Token deployed on ${chain.name}</b>💛`,
                    //         `\n`,
                    //         `<a href="${chain.scan.replace("{address}", tx.creates)}">`,
                    //             `${name}(${symbol})`,
                    //         `</a>`
                    //     ].join('')
                    //     bot.sendMessage(channel, text, { parse_mode:'HTML', disable_web_page_preview: true })
                    //     console.log(chain.name, tx.creates, name, symbol)
                    // } catch(ex) {
                    const checkSource = async (count) => {
                        if(count==0) {
                            console.log(chain.name, tx.creates, "Unverified for last 100 minutes")
                            return
                        }
                        try {
                            const { data } = await axios.get(chain.source.replace("{address}", tx.creates))
                            if(data.status==1 && data.message=="OK" && data.result && /masterchef/i.test(data.result[0].ContractName))  {
                                const text = [
                                    `💙<b>New Contract deployed</b> on ${chain.name}💙`,
                                    `\n`,
                                    `<a href="${chain.scan.replace("{address}", tx.creates)}">`,
                                        `${data.result[0].ContractName}`,
                                    `</a>`
                                ].join('')
                                bot.sendMessage(channel, text, { parse_mode:'HTML', disable_web_page_preview: true })
                                console.log(chain.name, tx.creates, data.result[0].ContractName)
                                return
                            }
                        } catch(ex) {}
                        setTimeout(() => checkSource(count-1), 60000)
                    }
                    const contract = new ethers.Contract(tx.creates, abiMasterChef, provider)
                    try {
                        await contract.poolLength()
                        checkSource(100)
                        console.log(chain.name, tx.creates, "would be a Masterchef")
                    } catch(ex) {
                        console.log(chain.name, tx.creates, "is not a Masterchef")
                    }
                        // bot.sendMessage(channel, tx.creates, { parse_mode:'HTML', disable_web_page_preview: true })
                //     }
                })
            }).catch(err => console.error(err.message))
        })
    }
}

start()

app.use(cors({
    origin: '*'
}))
app.use(bodyParser.json())
const port = process.argv[2] || 8000
app.listen(port, () => {
    console.log(`Backend is started thru ${port}!`)
})