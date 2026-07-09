import { CaptureStudio } from "@/components/capture-studio";
import { StudioHeader } from "@/components/studio-header";

export const metadata = { title: "Camera" };

export default function CapturePage() {
  return <><StudioHeader /><CaptureStudio /></>;
}
