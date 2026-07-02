import { notFound } from "next/navigation";
import { AnalyticsWorkspaceView } from "@/components/analytics/analytics-workspace-view";

export default function PreviewAnalyticsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <AnalyticsWorkspaceView
      metrics={{
        contacts: 25,
        incoming: 28,
        outgoing: 59,
        unanswered: 2,
        averageResponseLabel: "6m",
        deliveryRate: 88,
        readRate: 62,
        failed: 3
      }}
    />
  );
}
