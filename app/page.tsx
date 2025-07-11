import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard for now
  // In the future, this could be a landing page for unauthenticated users
  redirect("/dashboard");
}
