import type { Metadata } from "next";
import { getAdminCourse } from "../data";
import { PricingForm } from "./pricing-form";

export const metadata: Metadata = { title: "Pricing & access" };

export default async function PricingPage(props: PageProps<"/admin/courses/[id]/pricing">) {
  const course = await getAdminCourse((await props.params).id);
  return (
    <section className="max-w-2xl rounded-lg border border-border bg-surface p-6 md:p-8">
      <PricingForm course={course} />
    </section>
  );
}
