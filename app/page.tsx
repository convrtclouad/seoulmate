import { redirect } from "next/navigation";

// Root → intro (intro page redirects to /home if user already selected)
export default function RootPage() {
  redirect("/intro");
}
