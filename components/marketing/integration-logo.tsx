import Image from "next/image";

export function IntegrationLogo({ src, name, size = "md" }: { src: string; name: string; size?: "sm" | "md" | "lg" }) {
  const imageSize = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={48}
      className={`${imageSize} shrink-0 object-contain grayscale opacity-55 transition duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-focus-within:grayscale-0 group-focus-within:opacity-100`}
      title={name}
    />
  );
}
