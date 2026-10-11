import {
  LegalContact,
  LegalLayout,
  LegalSection,
} from "@/components/legal/layout";
import { Text } from "@chakra-ui/react";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <LegalSection title="1. About this policy">
        <Text>
          Mountaineer Housing Hub is a student housing information project
          maintained by the App State CIS 4850 Project Team. This policy
          explains how the site handles personal information when you browse
          listings, sign in, or use available submission features.
        </Text>
      </LegalSection>
      <LegalSection title="2. Information we collect">
        <Text mb={3}>
          When you sign in with Google, we receive your name, email address,
          email verification status, and Google account identifier. We store
          account and session records, authentication tokens when supplied by
          Google, and sign-in timestamps. We do not receive your Google password
          or request access to your Gmail messages. Avatars are generated
          locally from an account identifier or a randomly generated seed. We
          store generated usernames, avatar styles, color palettes, and shuffle
          seeds with your profile; your avatar choices appear with published
          reviews. We do not save Google profile photos for new accounts or send
          account data to an avatar service. Photos stored before this change
          may remain until removed or the account is deleted.
        </Text>
        <Text mb={3}>
          The server processes IP addresses, browser or device information,
          request paths, timestamps, and response status for security, rate
          limiting, and troubleshooting. Our application request logs omit URL
          query values, including OAuth authorization codes.
        </Text>
        <Text>
          When you submit content, we collect your review, rating,
          recommendation, apartment suggestions, and related account
          information. We store your saved apartments privately. Photo uploads
          are not currently available.
        </Text>
      </LegalSection>
      <LegalSection title="3. How we use information">
        <Text>
          We use account information to verify eligibility, authenticate you,
          maintain sessions, and associate contributions with your account. We
          use technical information to operate the site, diagnose errors,
          prevent misuse, and protect accounts. Submitted content may be
          reviewed and used to help visitors compare housing. Authorized staff
          can view registered users’ email addresses, usernames, account roles,
          status, signup dates, and last sign-in dates to administer the
          service.
        </Text>
      </LegalSection>
      <LegalSection title="4. Cookies and browser storage">
        <Text>
          Authentication uses cookies to maintain your session and protect the
          sign-in flow. Your light or dark mode preference is saved in browser
          storage. You can remove cookies and stored preferences in your browser
          settings; blocking authentication cookies may prevent sign-in. The
          current site does not include advertising trackers or third-party
          analytics scripts.
        </Text>
      </LegalSection>
      <LegalSection title="5. Public content and service providers">
        <Text mb={3}>
          Published reviews, ratings, photos, and public usernames can be viewed
          and copied by visitors. Your Google email address and authentication
          tokens are not intended to appear in public reviews. Avoid including
          private addresses, contact details, faces, or other personal
          information in contributions without permission.
        </Text>
        <Text mb={3}>
          Google processes information during sign-in under its own privacy
          policy. Hosting, database, and storage providers process information
          as needed to deliver the service. Map tiles, fonts, and other external
          assets may be requested directly from their providers, which receive
          technical information such as your IP address. Linked property
          websites have their own privacy practices.
        </Text>
        <Text>
          We do not sell personal information or share it for targeted
          advertising. We may disclose information when required by law or when
          reasonably necessary to investigate abuse, protect safety, or secure
          the service.
        </Text>
      </LegalSection>
      <LegalSection title="6. Retention, security, and your choices">
        <Text mb={3}>
          We retain account records while needed to provide the service and
          retain technical records as needed for operation, security, and
          applicable obligations. Authentication sessions are configured to
          expire after seven days. Signing out ends the session; it does not
          delete your account.
        </Text>
        <Text mb={3}>
          You may request access, correction, or deletion of your account
          information or contributions using the contact below. We may need to
          verify your identity and may retain information where required for
          legal or security purposes. Copies in backups or content copied by
          others may remain after removal from the active site.
        </Text>
        <Text>
          We use authentication and access controls to protect information. No
          storage or transmission method can guarantee absolute security. You
          can stop using the site and revoke its access in your Google account
          settings; revoking Google access does not itself delete records held
          by this site.
        </Text>
      </LegalSection>
      <LegalSection title="7. Children and policy updates">
        <Text>
          The site is intended for college housing research and is not directed
          to children under 13. If you believe a child under 13 has provided
          personal information, contact us. We may update this policy as the
          service changes and will update the date above. Material changes will
          be highlighted on the site.
        </Text>
      </LegalSection>
      <LegalSection title="8. Contact">
        <LegalContact />
      </LegalSection>
    </LegalLayout>
  );
}
