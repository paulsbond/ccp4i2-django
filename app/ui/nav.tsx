"use client";
import {
  AppBar,
  Button,
  Container,
  Divider,
  Stack,
  Toolbar,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, text }: { href: string; text: string }) {
  const pathname = usePathname();
  const sx = pathname === href ? { bgcolor: "primary.dark" } : {};
  return (
    <Button color="inherit" LinkComponent={Link} href={href} sx={sx}>
      {text}
    </Button>
  );
}

export default function Nav() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar disableGutters>
          <Stack direction="row" spacing={2}>
            <NavLink href="/" text="Projects" />
            <Divider orientation="vertical" variant="middle" flexItem />
            <NavLink href="/project" text="Dashboard" />
            <NavLink href="/project/programs" text="Programs" />
            <NavLink href="/project/jobs" text="Jobs" />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
