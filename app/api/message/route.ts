import { db } from '@/db'
import { openai } from '@/lib/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
// import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { NextRequest } from 'next/server'
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";


// use to format and stream response from openAI 
import { OpenAIStream, StreamingTextResponse } from 'ai'


// a post request to ask question to a pdf file 
export const POST = async (req: NextRequest) => {
  // endpoint for asking a question to a pdf file

  const body = await req.json()
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  const { id: userId } = user!

  if (!userId)
    return new Response('Unauthorized', { status: 401 })

  // get fileid and message from body else through an error powered by ZOd 
  const { fileId, message } = SendMessageValidator.parse(body)

  // now we are sure we have fileid and a message
  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  })

  if (!file)
    return new Response('Not found', { status: 404 })

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId: fileId,
    },
  })


//   ===================== Using the large language ai model (LLM) using semantic query turning words to vectors
// we index an entire PDF and then find parts of PDF in text that are most similar to query  in meaning 
  // 1: vectorize message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })


  const {client: pinecone, pineconeIndex} = await getPineconeClient()

  // const pinecone = await getPineconeClient()
  // const pineconeIndex = pinecone.Index('docinsight')

  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex,
      namespace: file.id,
    }
  )

  const results = await vectorStore.similaritySearch(
    message,
    // number of responses to return 
    4
  )


  // get previous chat messages last 6 messages
  const prevMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 6,
  })


  // format message for open ai  in the way it wants user msg and ai response
  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage ? ('user' as const) : ('assistant' as const),
    content: msg.text,
  }))

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    stream: true,
    messages: [
          {
            role: 'system',
            content:
              'Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format. refer to "context" as "your provided document"',
          },
          {
            role: 'user',
            content: `Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format.  refer to "context" as "your provided document"'. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
            
      \n----------------\n
      
      PREVIOUS CONVERSATION:
      ${formattedPrevMessages.map((message) => {
        if (message.role === 'user')
          return `User: ${message.content}\n`
        return `Assistant: ${message.content}\n`
      })}
      
      \n----------------\n
      
      
      CONTEXT:
      ${results.map((r) => r.pageContent).join('\n\n')}
      
      USER INPUT: ${message}`,
    },
    ],
  })


  // streams in real time back to the client
  const stream = OpenAIStream(response, {

    // listen  for the full response and write to db
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId:fileId,
          userId,
        },
      })
    },
  })

  // return and consume in real-time
  return new StreamingTextResponse(stream)
}
