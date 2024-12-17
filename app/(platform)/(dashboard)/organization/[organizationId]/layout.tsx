import { startCase } from "lodash";
import { OrgControl } from "./_components/org-control";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { orgSlug } = await auth();
  return {
    title: startCase(orgSlug || "organization"),
  };
}

const OrganizationIdLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <OrgControl />
      {children}
    </>
  );
};

export default OrganizationIdLayout;
