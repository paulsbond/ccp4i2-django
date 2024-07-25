export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav>
        <a href="/">Projects</a>
        <a href="/project">Dashboard</a>
        <a href="/project/programs">Programs</a>
        <a href="/project/jobs">Jobs</a>
      </nav>
      <main>{children}</main>
    </>
  );
}
