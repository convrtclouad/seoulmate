import { redirect } from "next/navigation";

// Root redirects to /home; actual dashboard is rendered by (dashboard)/page.tsx
export default function RootPage() {
  redirect("/home");
}
