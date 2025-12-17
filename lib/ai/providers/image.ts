export class ImageProvider {
    constructor(private apiKey: string, private service: string) { }
    async generate(model: string, prompt: string) { return "Image URL" }
}
