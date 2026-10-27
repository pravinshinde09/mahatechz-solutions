import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { CategoryManager, type CategoryNode, type Tag } from "./category-manager";

export const metadata: Metadata = { title: "Categories & tags" };

export default async function CategoriesPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "category.manage")) notFound();
  const [categories, tags] = await Promise.all([authedRequest<CategoryNode[]>("/admin/categories"), authedRequest<Tag[]>("/tags")]);
  return (
    <>
      <PageHeader title="Categories & tags" description="Categories organise the catalogue (two levels). Tags such as software versions add filters across categories." />
      <CategoryManager categories={categories.ok ? categories.data : []} tags={tags.ok ? tags.data : []} />
    </>
  );
}
