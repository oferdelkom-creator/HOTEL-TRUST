export default function AccessibilityPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Accessibility Statement</h1>
      <p className="text-neutral-500 mb-8 text-sm">Last updated: August 2026</p>

      <div className="space-y-6 text-neutral-600">
        <p>
          Hotel Trust is committed to making this website usable by as many people as possible,
          including people with disabilities. We are actively working toward compliance with the
          Israeli Equal Rights for Persons with Disabilities Regulations (Service Accessibility
          Adjustments), 2013, and with the WCAG 2.1 Level AA guidelines they reference.
        </p>
        <p>
          As a site currently in an early trial phase, full accessibility testing and
          certification has not yet been completed. We are prioritizing this as the platform
          grows, including keyboard navigation, screen-reader compatibility, and color contrast
          across all pages.
        </p>
        <p>
          If you encounter any accessibility barrier while using this site, or need information
          in an alternative format, please contact us at{" "}
          <a href="/contact" className="text-brand-gold underline">
            our contact page
          </a>{" "}
          and we&apos;ll do our best to help directly and prioritize a fix.
        </p>
      </div>
    </div>
  );
}
