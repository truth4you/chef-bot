const { default: axios } = require("axios")
const { ethers } = require("ethers")
const { Telegraf } = require('telegraf')

require('dotenv').config()

const chains = require("./chains.json")
const abiERC20 = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
]
const channel = -1001571309828

const start = () => {
    const bot = new Telegraf('1749367461:AAFfMWTNPuPVltHlZ3VsmN6nf_Vza41a88w')
    console.log(bot)
    bot.launch()
    for(const chain of chains) {
        const provider = new ethers.providers.JsonRpcProvider(chain.url)
        provider.on('block', blockNumber => {
            provider.getBlockWithTransactions(blockNumber).then(block => {
                const txs = block.transactions.filter((tx)=>{
                    return tx.to===null && tx.creates
                })
                txs.map(async tx => {
                    try {
                        const contract = new ethers.Contract(tx.creates, abiERC20, provider)
                        const name = await contract.name()
                        const symbol = await contract.symbol()
                        const text = `
                            <a href="${chain.scan.replace("{address}, tx.creates")}">
                                ${data.result[0].ContractName} on ${chain.name}
                            </a>`
                        bot.sendMessage(channel, text, { parse_mode:'HTML', disable_web_page_preview: true })
                        console.log(chain.name, tx.creates, name, symbol)
                    } catch(ex) {
                        const checkSource = async (count) => {
                            if(count==0) {
                                console.log(chain.name, tx.creates, "Unverified for last 100 minutes")
                                return
                            }
                            try {
                                const { data } = await axios.get(chain.source.replace("{address}", tx.creates))
                                if(data.status==1 && data.message=="OK" && data.result && data.result[0].ContractName)  {
                                    const text = `
                                        <a href="${chain.scan.replace("{address}, tx.creates")}">
                                            ${data.result[0].ContractName} on ${chain.name}
                                        </a>`
                                    bot.sendMessage(channel, text, { parse_mode:'HTML', disable_web_page_preview: true })
                                    console.log(chain.name, tx.creates, data.result[0].ContractName)
                                    return
                                }
                            } catch(ex) {}
                            setTimeout(() => checkSource(count-1), 60000)
                        }
                        checkSource(100)
                        console.log(chain.name, tx.creates)
                        bot.sendMessage(channel, tx.creates, { parse_mode:'HTML', disable_web_page_preview: true })
                    }
                })
            }).catch(err => console.error(err.message))
        })
    }
}

start()