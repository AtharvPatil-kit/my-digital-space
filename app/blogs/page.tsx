import Link from "next/link";

const blogs = [
  {
    title: "Welcome to my digital space",
    description:
      "Why I decided to build a place to document my ideas, projects and experiences.",
    date: "Coming soon",
  },
  {
    title: "Things I'm learning",
    description:
      "A collection of technologies, concepts and skills I'm currently exploring.",
    date: "Coming soon",
  },
  {
    title: "Building in public",
    description:
      "The process of turning ideas into actual projects and learning from them.",
    date: "Coming soon",
  },
];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-white/40 transition hover:text-white"
        >
          ← Back home
        </Link>

        <div className="mt-20">
          <p className="text-xs uppercase tracking-[0.25em] text-white/30">
            01 / Writing
          </p>

          <h1 className="mt-4 text-6xl font-semibold tracking-[-0.06em]">
            Blogs
          </h1>

          <p className="mt-6 max-w-xl text-white/40">
            Thoughts, experiences, ideas and things I&apos;m learning along the
            way.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <article
              key={blog.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
            >
              <p className="text-xs text-white/25">{blog.date}</p>

              <h2 className="mt-12 text-2xl font-medium tracking-[-0.04em]">
                {blog.title}
              </h2>

              <p className="mt-4 text-sm leading-6 text-white/40">
                {blog.description}
              </p>

              <button className="mt-8 text-sm text-white/60 transition hover:text-white">
                Read more →
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}