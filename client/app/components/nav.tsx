"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppBar, Button, Container, Divider, Toolbar } from "@mui/material";
import { Project } from "../models";

function NavLink({ href, text }: { href: string; text: string }) {
  const pathname = usePathname();
  const sx = pathname === href ? { bgcolor: "primary.dark" } : {};
  return (
    <Button color="inherit" LinkComponent={Link} href={href} sx={sx}>
      {text}
    </Button>
  );
}

export default function Nav({ project }: { project?: Project }) {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <NavLink href="/" text="Projects" />
          {project ? (
            <>
              <Divider orientation="vertical" variant="middle" flexItem />
              <NavLink href={`/project/${project.id}`} text="Dashboard" />
              <NavLink
                href={`/project/${project.id}/programs`}
                text="Programs"
              />
              <NavLink href={`/project/${project.id}/jobs`} text="Jobs" />
            </>
          ) : null}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
