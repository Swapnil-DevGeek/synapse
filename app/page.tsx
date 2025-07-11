import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login - middleware will handle authenticated users
  redirect("/login");
}
