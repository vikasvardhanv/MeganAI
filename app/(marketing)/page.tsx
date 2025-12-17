import { Hero } from "@/components/landing/hero"

export default function IndexPage() {
    return (
        <>
            <Hero />
            <section
                id="features"
                className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
            >
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                        Features
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        This project is an experiment to see how a modern app with features
                        like auth, subscriptions, API routes, and static pages would work
                        in Next.js 14 app dir.
                    </p>
                </div>

                {/* TODO: Add Feature Grid Component */}
            </section>

            <section id="open-source" className="container py-8 md:py-12 lg:py-24">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                        Proudly Open Source
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        MeganAi is open source and powered by open source software. <br />{" "}
                        The code is available on{" "}
                        <a
                            href="https://github.com/vikasvardhanv/MeganAI"
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </section>
        </>
    )
}
