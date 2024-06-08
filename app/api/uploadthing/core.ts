
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
    createUploadthing,
    type FileRouter,
} from 'uploadthing/next'

//  Also install - pdf-parse dependency for langchain
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
// import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { getPineconeClient } from '@/lib/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { PLANS } from '@/config/stripe'
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";


const f = createUploadthing()

const middleware = async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) throw new Error('Unauthorized')
// 
    const subscriptionPlan = await getUserSubscriptionPlan()

    return { subscriptionPlan, userId: user.id }

}

const onUploadComplete = async ({
    metadata,
    file,
}: {
    metadata: Awaited<ReturnType<typeof middleware>>
    file: {
        key: string
        name: string
        url: string
    }
}) => {
    const isFileExist = await db.file.findFirst({
        where: {
            key: file.key,
        },
    })

    if (isFileExist) return

    const createdFile = await db.file.create({
        data: {
            key: file.key,
            name: file.name,
            userId: metadata.userId,
            url: `https://utfs.io/f/${file.key}`,
            // url: file.url,
            uploadStatus: 'PROCESSING',
        },
    })


    // right after upload we index the contents of the pdf into vectors using a vector database
    // use superbase or pinecone are options

    try {

        console.log("we are here")
        // grab the uploadfile in memory
        const response = await fetch(`https://utfs.io/f/${file.key}`)
        console.log("we are here again")

        // get pdf as blob 
        const blob = await response.blob()

        // use langchain library to load the file into memory 
        const loader = new PDFLoader(blob)
        // get page content and num of pages 
        const pageLevelDocs = await loader.load()
        const pagesAmt = pageLevelDocs.length

        console.log(pagesAmt)

        const { subscriptionPlan } = metadata
        const isSubscribed = true
        // const { isSubscribed } = subscriptionPlan

        // console.log(subscriptionPlan)
        console.log(isSubscribed)
        

        // const isProExceeded = pagesAmt > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf
        // const isFreeExceeded = pagesAmt > PLANS.find((plan) => plan.name === 'Free')!
        //         .pagesPerPdf


        
        const isProExceeded = false
        const isFreeExceeded  = false


        if (
            (isSubscribed && isProExceeded) ||
            (!isSubscribed && isFreeExceeded)
        ) {
            await db.file.update({
                data: {
                    uploadStatus: 'FAILED',
                },
                where: {
                    id: createdFile.id,
                },
            })
        }

        console.log("we are starting pinecone")
        // vectorize and index entire document
        // const pinecone = await getPineconeClient()
        // const pineconeIndex = pinecone.Index('docinsight')

        const {client: pinecone, pineconeIndex} = await getPineconeClient()

        // console.log(pineconeIndex)

        // use open ai to grab the embeddings
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        })

        

         console.log("we pushing pinecone")
        await PineconeStore.fromDocuments(
            pageLevelDocs,
            embeddings,
            {
                pineconeIndex: pineconeIndex,
                namespace: createdFile.id,
            }
        )
        console.log("We are here pinecone")


        // update db after pinecone file vectorized indexing operation
        await db.file.update({
            data: {
                uploadStatus: 'SUCCESS',
            },
            where: {
                id: createdFile.id,
            },
        })
    } catch (err) {
        console.log(err)
        await db.file.update({
            data: {
                uploadStatus: 'FAILED',
            },
            where: {
                id: createdFile.id,
            },
        })
    }
}

export const ourFileRouter = {
    freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
    proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
