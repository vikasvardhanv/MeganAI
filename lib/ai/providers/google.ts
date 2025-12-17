import { GoogleGenerativeAI } from "@google/generative-ai"

export class GoogleProvider {
    private client: GoogleGenerativeAI

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey)
    }

    async generate(model: string, prompt: string): Promise<string> {
        const genModel = this.client.getGenerativeModel({ model })
        const result = await genModel.generateContent(prompt)
        const response = await result.response
        return response.text()
    }

    async *generateStream(model: string, prompt: string): AsyncGenerator<string> {
        const genModel = this.client.getGenerativeModel({ model })
        const result = await genModel.generateContentStream(prompt)

        for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
                yield chunkText
            }
        }
    }
}
