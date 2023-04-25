const fetch = require('node-fetch');
const { Wallet, ethers } = require("ethers");
const moment = require('moment');
const fs = require('fs');
const chalk = require('chalk');
const delay = require('delay');

const recipientAddress = '';
const amountInEther = '0.4999';

function createAccountEth() {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicKey = wallet.publicKey;
    return {
        privateKey,
        publicKey,
    };
}

const claimToken = (address, symbol) => new Promise((resolve, reject) => {
    fetch('https://api-faucet.hepton.io/', {
        method: 'POST',
        headers: {
            'Host': 'api-faucet.hepton.io',
            'access-control-allow-origin': '*',
            'accept': '*/*',
            'content-type': 'application/json',
            'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
            'sec-ch-ua-platform': '"Windows"',
            'origin': 'https://faucet.hepton.io',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://faucet.hepton.io/',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7,ms;q=0.6'
        },
        body: JSON.stringify({
            'walletid': address,
            'tokenname': symbol
        })
    })
        .then(res => res.json())
        .then(res => {
            resolve(res)
        })
        .catch(err => reject(err))
});


(async () => {
    while (true) {
        try {
            const walletNew = createAccountEth();
            const wallet = new Wallet(walletNew.privateKey)
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green(`Create wallet : ${wallet.address}`)}`);
            const claim1 = await claimToken(wallet.address, 'HTE')
            if (claim1.userTxHash) {
                console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green(`Success claim : ${claim1.userTxHash}`)}`);

                await delay(3000);
                const provider = new ethers.providers.JsonRpcProvider('https://testnet.hepton.io/')
                const privateKey = walletNew.privateKey
                const signer = new ethers.Wallet(privateKey, provider)
                const transactionObject = {
                    to: recipientAddress,
                    value: ethers.utils.parseEther(amountInEther)
                };

                const tx = await signer.sendTransaction(transactionObject);
                console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green(`Transaction sent : https://testnet.heptonscan.com/tx/${tx.hash}`)}`)
                console.log('')
                fs.appendFileSync('wallet.txt', `\n${walletNew.privateKey}|${wallet.address}`);
            } else {
                console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.red(`Failed claim : ${claim1.ERROR.sqlMessage}`)}`);
            }
        } catch (e) {
            // console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.red(`Failed`)}`);
            console.log(e)
        }
    }
})();
