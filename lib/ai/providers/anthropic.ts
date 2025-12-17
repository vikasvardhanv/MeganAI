import Anthropic from "@anthropic-ai/sdk"

export class AnthropicProvider {
    private client: Anthropic

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey })
    }

    async generate(model: string, prompt: string, systemPrompt?: string): Promise<string> {
        const response = await this.client.messages.create({
            model,
            max_tokens: 8192,
            system: systemPrompt || "You are a helpful assistant.",
            messages: [{ role: "user", content: prompt }],
        })

        const content = response.content[0]
        if (content.type !== "text") {
            throw new Error("Unexpected response type")
        }
        return content.text
    }

    async *generateStream(model: string, prompt: string, systemPrompt?: string): AsyncGenerator<string> {
        const stream = await this.client.messages.stream({
            model,
            max_tokens: 8192,
            system: systemPrompt || "You are a helpful assistant.",
            messages: [{ role: "user", content: prompt }],
        })

        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                yield event.delta.text
            }
        }
    }
}
