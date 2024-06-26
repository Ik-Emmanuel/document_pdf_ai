
// older version ^1.0.1
// import { PineconeClient } from '@pinecone-database/pinecone'

// export const getPineconeClient = async () => {
//   const client = new PineconeClient()

//   await client.init({
//     apiKey: process.env.PINECONE_API_KEY!,
//     environment: 'us-east1-gcp',
//   })

//   return client
// }



// newer version
import { Pinecone } from '@pinecone-database/pinecone'

export const getPineconeClient = async () => {
  const client = new Pinecone({apiKey: process.env.PINECONE_API_KEY!,})
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  // await client.init({
  //   apiKey: process.env.PINECONE_API_KEY!,
  //   environment: 'us-east1-gcp',
  // })

  return {client, pineconeIndex}
}
