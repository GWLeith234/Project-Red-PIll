import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function LegalPage() {
  const [, params] = useRoute("/legal/:slug");
  const slug = params?.slug;

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ["/api/public/legal", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/legal/${slug}`);
      if (!res.ok) throw new Error("Document not found");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12" data-testid="legal-page-loading">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12 text-center" data-testid="legal-page-not-found">
        <h1 className="text-2xl font-bold text-foreground mb-2">Document Not Found</h1>
        <p className="text-muted-foreground mb-6">This legal document is not currently available.</p>
        <Link href="/home" className="text-primary hover:underline">Return to Home</Link>
      </div>
    );
  }

  const formattedDate = doc.lastPublishedAt
    ? new Date(doc.lastPublishedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <div className="max-w-[720px] mx-auto px-4 py-12" data-testid="legal-page">
      <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="legal-page-title">{doc.title}</h1>
      {formattedDate && (
        <p className="text-sm text-muted-foreground mb-8" data-testid="legal-page-date">
          Last updated: {formattedDate}
        </p>
      )}
      <div
        className="prose prose-invert max-w-none leading-relaxed
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6
          [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
          [&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-3
          [&_p]:text-muted-foreground [&_p]:leading-7 [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-muted-foreground
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-muted-foreground
          [&_li]:mb-1.5
          [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80
          [&_hr]:border-border [&_hr]:my-6"
        dangerouslySetInnerHTML={{ __html: doc.content || "" }}
        data-testid="legal-page-content"
      />
    </div>
  );
}
