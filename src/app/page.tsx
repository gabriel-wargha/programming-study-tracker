import { redirect } from "next/navigation";

// The dashboard layout checks the user and sends signed-out visitors to /login.
export default function HomePage() {
  redirect("/dashboard");
}
