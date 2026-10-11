import {
  LegalContact,
  LegalLayout,
  LegalSection,
} from "@/components/legal/layout";
import { Text } from "@chakra-ui/react";

export default function TermsOfUse() {
  return (
    <LegalLayout title="Terms of Use">
      <LegalSection title="1. Using Mountaineer Housing Hub">
        <Text>
          These terms govern use of Mountaineer Housing Hub, a student project
          maintained by the App State CIS 4850 Project Team. By using the
          service, you agree to these terms. If you do not agree, stop using the
          service. The site provides housing information and student
          experiences; it does not arrange leases or act as a landlord, property
          manager, or rental agent.
        </Text>
      </LegalSection>
      <LegalSection title="2. Accounts and eligibility">
        <Text>
          Browsing public information does not require an account. Sign-in
          requires a verified App State Google account ending in @appstate.edu.
          Use your own account and keep it secure. Do not impersonate another
          person or bypass eligibility checks. Features may be limited, under
          development, or unavailable.
        </Text>
      </LegalSection>
      <LegalSection title="3. Housing information">
        <Text>
          Listings, prices, amenities, availability, maps, and reviews may be
          incomplete, outdated, or inaccurate. Reviews reflect the contributor’s
          experience and opinions. Independently confirm details, lease
          conditions, fees, accessibility, and safety with the property before
          making a housing decision. A listing or link does not imply
          endorsement or a guarantee.
        </Text>
      </LegalSection>
      <LegalSection title="4. Contributions and acceptable use">
        <Text mb={3}>
          When submissions are available, contribute honest, relevant accounts
          of your own experience. Disclose any relationship to a property or
          management company that could affect your review. Only upload content
          you created or have permission to use, and respect the privacy of
          others.
        </Text>
        <Text mb={3}>
          Do not submit threats, harassment, discriminatory content, private
          personal information, impersonation, spam, misleading claims, or
          unlawful material. Do not manipulate ratings, post paid reviews
          without disclosure, upload malware, attempt unauthorized access, or
          disrupt the service.
        </Text>
        <Text>
          We may review, decline, or remove content and restrict accounts for
          misuse. Submission does not guarantee publication. Report concerns
          using the contact below, including the content URL and a description
          of the issue.
        </Text>
      </LegalSection>
      <LegalSection title="5. Ownership and permission to display content">
        <Text>
          You retain ownership of your contributions. By submitting content, you
          grant the project a nonexclusive, royalty-free permission to host,
          store, reproduce, format, and display it as needed to operate and
          moderate the service. This permission does not transfer ownership. You
          may request removal; backup copies and copies made by others may
          remain. Respect copyright and other rights in the site’s text,
          photographs, branding, and third-party materials.
        </Text>
      </LegalSection>
      <LegalSection title="6. Privacy and third-party services">
        <Text>
          Our Privacy Policy explains how we handle account information,
          cookies, and contributions. Google sign-in and external property
          websites are governed by their providers’ own policies and terms. We
          do not control those services or their availability.
        </Text>
      </LegalSection>
      <LegalSection title="7. Availability and responsibility">
        <Text>
          The service is provided as available, without a promise of
          uninterrupted access or complete accuracy. To the extent permitted by
          applicable law, we disclaim implied warranties and are not responsible
          for indirect or consequential losses arising from use of the site,
          reliance on housing information, or dealings with property providers.
          These terms do not exclude rights or liabilities that cannot lawfully
          be excluded.
        </Text>
      </LegalSection>
      <LegalSection title="8. Changes and account restrictions">
        <Text>
          We may update these terms, change features, or discontinue the
          service. We will update the date above and highlight material changes
          on the site. Continued use after changes take effect indicates
          acceptance of the revised terms. We may restrict access for violations
          or security reasons. You can stop using the service and request
          account deletion at any time.
        </Text>
      </LegalSection>
      <LegalSection title="9. Contact">
        <LegalContact />
      </LegalSection>
    </LegalLayout>
  );
}
