import { permanentRedirect } from "next/navigation";

export default function LegacyClinicProductRedirect() {
  permanentRedirect("/solutions/clinicgpt");
}
