ALTER TABLE "OrganizationMember" ADD COLUMN "department" TEXT;

CREATE INDEX "OrganizationMember_organizationId_department_status_idx"
  ON "OrganizationMember"("organizationId", "department", "status");
