import OpenAI from "openai"

export class OpenAIProvider {
    private client: OpenAI

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey })
    }

    async generate(model: string, prompt: string, systemPrompt?: string): Promise<string> {
        // Handle image models differently
        if (model === "dall-e-3") {
            return this.generateImage(prompt)
        }

        const response = await this.client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            max_completion_tokens: 8192,
        })

        return response.choices[0]?.message?.content || ""
    }

    async generateImage(prompt: string): Promise<string> {
        const response = await this.client.images.generate({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url",
        })

        return response.data?.[0]?.url || ""
    }

    async *generateStream(model: string, prompt: string, systemPrompt?: string): AsyncGenerator<string> {
        const stream = await this.client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            stream: true,
            max_completion_tokens: 8192,
        })

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) yield content
        }
    }
}
