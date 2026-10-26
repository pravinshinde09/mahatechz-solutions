import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ProsePage title="About Mahatecz Learning">
      <p>
        Mahatecz Learning is the online learning platform of Mahatecz Solutions. Our mission is to make industry-relevant engineering design
        skills — starting with AutoCAD Electrical and Revit — affordable and accessible to Indian students and working engineers.
      </p>
      <h2>How we teach</h2>
      <ul>
        <li>Recorded lectures you can resume on any device.</li>
        <li>Live classes with recordings and notes posted afterwards.</li>
        <li>Practice drawing files labelled with the software version they need.</li>
        <li>Certificates with a unique number and QR code that employers can verify.</li>
      </ul>
      <h2>Who it is for</h2>
      <p>
        Diploma, B.E. and B.Tech electrical students preparing for design roles, and junior electrical and MEP engineers who want focused
        upskilling they can fit around work.
      </p>
    </ProsePage>
  );
}
