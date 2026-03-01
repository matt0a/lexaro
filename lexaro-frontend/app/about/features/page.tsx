import { redirect } from "next/navigation";

/** Redirect old /about/features path to the new /features route. */
export default function AboutFeaturesRedirect() {
    redirect("/features");
}
