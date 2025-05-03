// import { useState } from "react"
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Transaction, SystemProgram, Keypair } from "@solana/web3.js"
function Launchpad() {
    const { publicKey, sendTransaction} = useWallet()
    const {connection} = useConnection()

    const createTokenMint = async()=>{
     try {
           if(!publicKey ) return
           const lamports = await getMinimumBalanceForRentExemptMint(connection);
           const keypair = Keypair.generate()
           const decimals = 9
           const recentBlockHash = await connection.getLatestBlockhash()
           const transaction = new Transaction().add(
               SystemProgram.createAccount({
                   fromPubkey: publicKey,
                   newAccountPubkey: keypair.publicKey,
                   space: MINT_SIZE,
                   lamports,
                   programId: TOKEN_PROGRAM_ID,
               }),
               createInitializeMint2Instruction(keypair.publicKey, decimals, publicKey, null, TOKEN_PROGRAM_ID),
           );
           transaction.recentBlockhash = recentBlockHash.blockhash
           transaction.feePayer = publicKey
           transaction.partialSign(keypair)
           const res = await sendTransaction!(transaction, connection)
           console.log('res', res)
           alert("Mint acc created "+ keypair.publicKey.toBase58())
     } catch (error) {
        console.log("er", error)
     }
    }
    
    // const [tokenName, setTokenName] = useState("")
    // const [tokenSymbol, setTokenSymbol] = useState("")
  return (
    <div>
        <h1>Solana Token Launchpad</h1>
        {/* <input type="text" value={} /> */}
        <button onClick={createTokenMint}>Click to create a token</button>
    </div>
  )
}

export default Launchpad
