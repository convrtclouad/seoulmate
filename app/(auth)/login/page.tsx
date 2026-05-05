import { redirect } from "next/navigation";

// Login is replaced by the intro friend-picker
export default function LoginPage() {
  redirect("/intro");
}
