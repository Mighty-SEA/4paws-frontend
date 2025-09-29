import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/owners");
  return <>Coming Soon</>;
}
