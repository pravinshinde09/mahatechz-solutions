import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Accessibility statement" };

// Spec §29.7: target WCAG 2.2 AA and publish a contact for accessibility issues.
export default function AccessibilityPage() {
  return (
    <ProsePage title="Accessibility statement">
      <p>
        We want everyone to be able to learn with Mahatecz Solutions, including people who use screen readers, keyboard navigation, magnification or
        voice control.
      </p>

      <h2>Our target</h2>
      <p>
        We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA on the website and to follow Android accessibility
        guidelines in the app.
      </p>

      <h2>How we check</h2>
      <ul>
        <li>Every release runs automated accessibility checks on the key pages, including course pages, the learning player and checkout.</li>
        <li>Pages are tested on narrow phone screens (360 pixels wide) and with keyboard-only navigation.</li>
        <li>We test with screen readers before major releases.</li>
      </ul>

      <h2>Known limitations</h2>
      <ul>
        <li>Some older course videos do not yet have captions. We are adding them, starting with the most popular courses.</li>
        <li>Some downloadable files (for example, drawings and PDFs from third parties) may not be fully accessible.</li>
      </ul>

      <h2>Tell us about a problem</h2>
      <p>
        If something is hard to use, please <Link href="/contact">contact us</Link> and say which page and what you were trying to do. We aim to
        reply within two business days and can provide course material in another format where possible.
      </p>
    </ProsePage>
  );
}
