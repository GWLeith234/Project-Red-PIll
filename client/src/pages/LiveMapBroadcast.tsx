import LiveVisitorMap from "@/components/admin/LiveVisitorMap";

export default function LiveMapBroadcast() {
  return (
    <div className="w-screen h-screen bg-[#0d0d1a] overflow-hidden" data-testid="page-live-map-broadcast">
      <LiveVisitorMap fullscreen />
    </div>
  );
}
