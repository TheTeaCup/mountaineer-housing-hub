export default function StaffSubmissionsPage() {
  return null;
}
export function getServerSideProps() {
  return { redirect: { destination: "/staff/reviews", permanent: false } };
}
