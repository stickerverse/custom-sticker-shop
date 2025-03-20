import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorMorph } from "@/components/ui/color-morph";

interface GlassCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  glassEffect?: "none" | "light" | "medium" | "heavy";
  colorMorph?: boolean;
  colors?: string[];
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  children?: React.ReactNode;
  [key: string]: any; // To allow for additional HTML attributes
}

export function GlassCard({
  title,
  description,
  footer,
  glassEffect = "medium",
  colorMorph = false,
  colors = ["rgba(59, 130, 246, 0.1)", "rgba(124, 58, 237, 0.1)"],
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  children,
  ...props
}: GlassCardProps) {
  const glassClasses = {
    none: "",
    light: "bg-white/40 backdrop-blur-sm",
    medium: "bg-white/60 backdrop-blur",
    heavy: "bg-white/80 backdrop-blur-md",
  };

  const BaseCard = (
    <Card
      className={cn(
        "border border-gray-200/50 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md",
        glassClasses[glassEffect],
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title && typeof title === "string" ? <CardTitle>{title}</CardTitle> : title}
          {description && typeof description === "string" ? (
            <CardDescription>{description}</CardDescription>
          ) : (
            description
          )}
        </CardHeader>
      )}
      <CardContent className={cn("", contentClassName)}>{children}</CardContent>
      {footer && <CardFooter className={cn("flex justify-end gap-2", footerClassName)}>{footer}</CardFooter>}
    </Card>
  );

  // If colorMorph effect is enabled, wrap the card with ColorMorph
  if (colorMorph) {
    return (
      <ColorMorph colors={colors} borderWidth={1} className="rounded-lg">
        {BaseCard}
      </ColorMorph>
    );
  }

  return BaseCard;
}