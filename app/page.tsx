import { redirect } from "next/navigation";

// The app's main surface is the opportunity board — send the bare domain
// there so https://<project>.vercel.app doesn't land on a 404.
export default function Home() {
  redirect("/board");
}
