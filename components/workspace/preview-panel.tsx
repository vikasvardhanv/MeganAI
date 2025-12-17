export function PreviewPanel() {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center text-muted-foreground">
            <div className="max-w-[420px] space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <p className="text-sm">
                    Generated application preview will appear here. Start chatting to build something.
                </p>
            </div>
        </div>
    )
}
