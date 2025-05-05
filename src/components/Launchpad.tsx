import { useState } from "react"
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getMintLen, ExtensionType, TYPE_SIZE, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, createInitializeMetadataPointerInstruction, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata'
function Launchpad() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const createTokenMint = async () => {
    try {
      if (!publicKey) return
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
      alert("Mint acc created " + keypair.publicKey.toBase58())
    } catch (error) {
      console.log("er", error)
    }
  }


  const createTokenMintWithMetadata = async (name:string, symbol:string, metadataURI:string) => {
    if(!name || !symbol || !metadataURI) return
    if (!publicKey) return
    const keyPair = Keypair.generate()
    const metadata = {
      mint: keyPair.publicKey,
      name,
      symbol,
      uri: metadataURI,
      additionalMetadata: []
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer])
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
    const recentBlockHash = await connection.getLatestBlockhash()
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: keyPair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(keyPair.publicKey, publicKey, keyPair.publicKey, TOKEN_2022_PROGRAM_ID),
      createInitializeMint2Instruction(keyPair.publicKey, 9, publicKey, null, TOKEN_2022_PROGRAM_ID),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: keyPair.publicKey,
        metadata: keyPair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: publicKey,
        updateAuthority: publicKey,
      }),
    );
    transaction.recentBlockhash = recentBlockHash.blockhash
    transaction.feePayer = publicKey
    transaction.partialSign(keyPair)
    const res = await sendTransaction(transaction, connection)
    console.log('res', res)
    alert("Mint acc created " + keyPair.publicKey.toBase58())
    const associatedToken = getAssociatedTokenAddressSync(
      keyPair.publicKey,
      publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    );
  
    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        publicKey,
        associatedToken,
        publicKey,
        keyPair.publicKey,
        TOKEN_2022_PROGRAM_ID,
    ),
);

await sendTransaction(transaction2, connection);
console.log('ATA Created',associatedToken.toBase58());
const transaction3 = new Transaction().add(
  createMintToInstruction(keyPair.publicKey, associatedToken,publicKey, LAMPORTS_PER_SOL * 1000000, [], TOKEN_2022_PROGRAM_ID)
);

await sendTransaction(transaction3, connection);
console.log("Minted",1000000,metadata.symbol,"to",associatedToken.toBase58())
}

  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [metadataURI, setMetadataURI] = useState("")
  return (
    <div>
      <h1>Solana Token Launchpad</h1>
    
      <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Token Name" />
      <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="Token Symbol" />
      <input type="text" value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} placeholder="Metadata URI" />
      <button onClick={()=>createTokenMintWithMetadata(tokenName, tokenSymbol, metadataURI)}>Click to create a token</button>
    </div>
  )
}

export default Launchpad
